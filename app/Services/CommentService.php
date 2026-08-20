<?php

namespace App\Services;

use App\Events\NotificationSentEvent;
use App\Models\Comment;
use App\Models\Movie;
use App\Models\User;
use App\Notifications\CommentLikeNotification;
use App\Notifications\CommentReplyNotification;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class CommentService
{
    /**
     * Lấy danh sách bình luận gốc của một phim có phân trang và câu trả lời lồng nhau.
     *
     * @param array<string, mixed> $filters
     */
    public function getMovieComments(int $movieId, array $filters = [], ?User $currentUser = null): LengthAwarePaginator
    {
        $perPage = min(max((int) ($filters['per_page'] ?? 15), 1), 50);
        $sort = (string) ($filters['sort'] ?? 'latest');

        $query = Comment::query()
            ->forMovie($movieId)
            ->root()
            ->active()
            ->with(['user:id,name,role,avatar_url']);

        // Eager load danh sách câu trả lời con (kèm thông tin user và like của user hiện tại)
        $query->with(['replies' => function ($rq) use ($currentUser) {
            $rq->active()
                ->with(['user:id,name,role,avatar_url'])
                ->orderBy('created_at', 'asc');

            if ($currentUser) {
                $rq->withExists(['likedUsers as is_liked' => function ($lq) use ($currentUser) {
                    $lq->where('users.id', $currentUser->id);
                }]);
            }
        }]);

        if ($currentUser) {
            $query->withExists(['likedUsers as is_liked' => function ($lq) use ($currentUser) {
                $lq->where('users.id', $currentUser->id);
            }]);
        }

        // Luôn ưu tiên bình luận được Admin ghim lên đầu
        $query->orderByDesc('is_pinned');

        if ($sort === 'popular' || $sort === 'likes') {
            $query->orderByDesc('likes_count')->orderByDesc('created_at');
        } else {
            $query->orderByDesc('created_at');
        }

        return $query->paginate($perPage);
    }

    /**
     * Lấy danh sách các câu trả lời cho một bình luận.
     *
     * @param array<string, mixed> $filters
     */
    public function getCommentReplies(int $commentId, array $filters = [], ?User $currentUser = null): LengthAwarePaginator
    {
        $perPage = min(max((int) ($filters['per_page'] ?? 10), 1), 50);

        $query = Comment::query()
            ->where('parent_id', $commentId)
            ->active()
            ->with(['user:id,name,role,avatar_url'])
            ->orderBy('created_at', 'asc');

        if ($currentUser) {
            $query->withExists(['likedUsers as is_liked' => function ($lq) use ($currentUser) {
                $lq->where('users.id', $currentUser->id);
            }]);
        }

        return $query->paginate($perPage);
    }

    /**
     * Tạo mới một bình luận hoặc câu trả lời.
     *
     * @param array{content: string, is_spoiler?: bool, parent_id?: int|null} $data
     *
     * @throws ValidationException|ModelNotFoundException
     */
    public function storeComment(User $user, int $movieId, array $data): Comment
    {
        $movie = Movie::query()->findOrFail($movieId);

        $parentId = ! empty($data['parent_id']) ? (int) $data['parent_id'] : null;

        if ($parentId) {
            $parent = Comment::query()->where('movie_id', $movie->id)->find($parentId);
            if (! $parent) {
                throw ValidationException::withMessages([
                    'parent_id' => 'Bình luận phản hồi không hợp lệ hoặc không thuộc phim này.',
                ]);
            }

            // Nếu bình luận cha đã là reply, gắn vào bình luận gốc để tránh lồng quá sâu
            if ($parent->parent_id) {
                $parentId = $parent->parent_id;
            }
        }

        // Kiểm tra spam: Người dùng vừa gửi cùng nội dung trong 20 giây qua
        $recentDuplicate = Comment::query()
            ->where('user_id', $user->id)
            ->where('content', $data['content'])
            ->where('created_at', '>=', now()->subSeconds(20))
            ->exists();

        if ($recentDuplicate) {
            throw ValidationException::withMessages([
                'content' => 'Bạn vừa đăng bình luận tương tự. Vui lòng đợi trong giây lát.',
            ]);
        }

        return DB::transaction(function () use ($user, $movie, $parentId, $data) {
            $comment = Comment::create([
                'user_id' => $user->id,
                'movie_id' => $movie->id,
                'parent_id' => $parentId,
                'content' => $data['content'],
                'is_spoiler' => (bool) ($data['is_spoiler'] ?? false),
                'status' => Comment::STATUS_ACTIVE,
                'likes_count' => 0,
                'replies_count' => 0,
            ]);

            if ($parentId) {
                Comment::where('id', $parentId)->increment('replies_count');

                // Gửi thông báo cho tác giả bình luận cha (nếu không phải tự reply chính mình)
                $parent = Comment::with('user')->find($parentId);
                if ($parent && $parent->user && $parent->user_id !== $user->id && $parent->user->is_active) {
                    $parent->user->notify(new CommentReplyNotification($user, $parent, $comment, $movie));

                    try {
                        $unread = $parent->user->unreadNotifications()->count();
                        $latest = $parent->user->notifications()->latest()->first();
                        if ($latest) {
                            broadcast(new NotificationSentEvent($parent->user->id, NotificationService::formatNotification($latest), $unread));
                        }
                    } catch (\Throwable $e) {
                        Log::error('Broadcast reply error: '.$e->getMessage());
                    }
                }
            }

            $comment->load('user:id,name,role,avatar_url');
            $comment->is_liked = false;

            return $comment;
        });
    }

    /**
     * Cập nhật nội dung hoặc trạng thái spoiler của bình luận.
     *
     * @param array{content?: string, is_spoiler?: bool} $data
     */
    public function updateComment(User $user, int $commentId, array $data): Comment
    {
        $comment = Comment::query()->with('user:id,name,role,avatar_url')->findOrFail($commentId);

        $updateData = [];
        if (isset($data['content'])) {
            $updateData['content'] = $data['content'];
        }
        if (isset($data['is_spoiler'])) {
            $updateData['is_spoiler'] = (bool) $data['is_spoiler'];
        }

        $comment->update($updateData);

        return $comment;
    }

    /**
     * Xóa bình luận (soft delete) và cập nhật lại số lượng replies của bình luận cha nếu có.
     */
    public function deleteComment(User $user, int $commentId): bool
    {
        $comment = Comment::query()->findOrFail($commentId);

        return DB::transaction(function () use ($comment) {
            $parentId = $comment->parent_id;

            $deleted = $comment->delete();

            if ($deleted && $parentId) {
                Comment::where('id', $parentId)
                    ->where('replies_count', '>', 0)
                    ->decrement('replies_count');
            }

            return (bool) $deleted;
        });
    }

    /**
     * Thích hoặc Bỏ thích bình luận (Toggle Like).
     *
     * @return array{isLiked: bool, likesCount: int}
     */
    public function toggleLike(User $user, int $commentId): array
    {
        $comment = Comment::query()->with(['user', 'movie'])->findOrFail($commentId);

        return DB::transaction(function () use ($user, $comment) {
            $isLiked = $comment->likedUsers()->where('users.id', $user->id)->exists();

            if ($isLiked) {
                $comment->likedUsers()->detach($user->id);
                $comment->decrement('likes_count');
                $newLikedStatus = false;
            } else {
                $comment->likedUsers()->attach($user->id, ['created_at' => now()]);
                $comment->increment('likes_count');
                $newLikedStatus = true;

                // Gửi thông báo cho tác giả bình luận khi có lượt thích mới (nếu không phải tự like chính mình)
                if ($comment->user && $comment->user_id !== $user->id && $comment->user->is_active && $comment->movie) {
                    $comment->user->notify(new CommentLikeNotification($user, $comment, $comment->movie));

                    try {
                        $unread = $comment->user->unreadNotifications()->count();
                        $latest = $comment->user->notifications()->latest()->first();
                        if ($latest) {
                            broadcast(new NotificationSentEvent($comment->user->id, NotificationService::formatNotification($latest), $unread));
                        }
                    } catch (\Throwable $e) {
                        Log::error('Broadcast like error: '.$e->getMessage());
                    }
                }
            }

            $currentLikesCount = (int) $comment->fresh()->likes_count;

            return [
                'isLiked' => $newLikedStatus,
                'likesCount' => max(0, $currentLikesCount),
            ];
        });
    }

    /**
     * Lấy danh sách bình luận phục vụ trang quản trị (Admin).
     *
     * @param array<string, mixed> $filters
     */
    public function adminGetComments(array $filters = []): LengthAwarePaginator
    {
        $perPage = min(max((int) ($filters['per_page'] ?? 20), 1), 100);

        $query = Comment::query()
            ->with([
                'user:id,name,email,role,avatar_url',
                'movie:id,name,slug,poster_url',
            ]);

        if (! empty($filters['status'])) {
            $query->where('status', (string) $filters['status']);
        }

        if (! empty($filters['movie_id'])) {
            $query->where('movie_id', (int) $filters['movie_id']);
        }

        if (! empty($filters['user_id'])) {
            $query->where('user_id', (int) $filters['user_id']);
        }

        if (isset($filters['is_pinned']) && $filters['is_pinned'] !== '') {
            $query->where('is_pinned', filter_var($filters['is_pinned'], FILTER_VALIDATE_BOOLEAN));
        }

        if (isset($filters['is_spoiler']) && $filters['is_spoiler'] !== '') {
            $query->where('is_spoiler', filter_var($filters['is_spoiler'], FILTER_VALIDATE_BOOLEAN));
        }

        if (! empty($filters['q'])) {
            $keyword = trim((string) $filters['q']);
            $escaped = str_replace(['%', '_'], ['\\%', '\\_'], $keyword);
            $query->where(function ($q) use ($escaped) {
                $q->where('content', 'like', "%{$escaped}%")
                    ->orWhereHas('user', fn ($uq) => $uq->where('name', 'like', "%{$escaped}%")->orWhere('email', 'like', "%{$escaped}%"))
                    ->orWhereHas('movie', fn ($mq) => $mq->where('name', 'like', "%{$escaped}%"));
            });
        }

        return $query->orderByDesc('created_at')->paginate($perPage);
    }

    /**
     * Cập nhật trạng thái kiểm duyệt bình luận (Admin).
     */
    public function adminUpdateStatus(int $commentId, string $status): Comment
    {
        $comment = Comment::query()->with(['user:id,name,email,role,avatar_url', 'movie:id,name,slug,poster_url'])->findOrFail($commentId);

        $validStatuses = [Comment::STATUS_ACTIVE, Comment::STATUS_HIDDEN, Comment::STATUS_SPAM];
        if (! in_array($status, $validStatuses, true)) {
            throw ValidationException::withMessages([
                'status' => 'Trạng thái không hợp lệ. Cho phép: active, hidden, spam.',
            ]);
        }

        $comment->update(['status' => $status]);

        return $comment;
    }

    /**
     * Ghim hoặc bỏ ghim bình luận (Admin).
     */
    public function adminTogglePin(int $commentId): Comment
    {
        $comment = Comment::query()->with(['user:id,name,email,role,avatar_url', 'movie:id,name,slug,poster_url'])->findOrFail($commentId);

        $comment->update([
            'is_pinned' => ! $comment->is_pinned,
        ]);

        return $comment;
    }

    /**
     * Xóa vĩnh viễn hoặc soft delete bình luận từ Admin.
     */
    public function adminDeleteComment(int $commentId, bool $force = false): bool
    {
        $comment = Comment::withTrashed()->findOrFail($commentId);

        return DB::transaction(function () use ($comment, $force) {
            $parentId = $comment->parent_id;

            if ($force) {
                $deleted = $comment->forceDelete();
            } else {
                $deleted = $comment->delete();
            }

            if ($deleted && $parentId) {
                Comment::where('id', $parentId)
                    ->where('replies_count', '>', 0)
                    ->decrement('replies_count');
            }

            return (bool) $deleted;
        });
    }

    /**
     * Thao tác hàng loạt trên bình luận (Admin).
     *
     * @param array<int> $ids
     */
    public function adminBulkAction(string $action, array $ids): int
    {
        if (empty($ids)) {
            return 0;
        }

        return match ($action) {
            'activate' => Comment::whereIn('id', $ids)->update(['status' => Comment::STATUS_ACTIVE]),
            'hide' => Comment::whereIn('id', $ids)->update(['status' => Comment::STATUS_HIDDEN]),
            'spam' => Comment::whereIn('id', $ids)->update(['status' => Comment::STATUS_SPAM]),
            'delete' => Comment::whereIn('id', $ids)->delete(),
            default => throw ValidationException::withMessages([
                'action' => 'Hành động hàng loạt không hợp lệ.',
            ]),
        };
    }
}
