<?php

namespace App\Services;

use App\Events\NotificationSentEvent;
use App\Http\Resources\Api\V1\CommentResource;
use App\Models\Comment;
use App\Models\Movie;
use App\Models\User;
use App\Notifications\CommentLikeNotification;
use App\Notifications\CommentReplyNotification;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class CommentService
{
    /**
     * Lấy danh sách bình luận gốc của một phim có phân trang và câu trả lời lồng nhau.
     *
     * @param  array<string, mixed>  $filters
     */
    public function getMovieComments(int $movieId, array $filters = [], ?User $currentUser = null): LengthAwarePaginator
    {
        $perPage = min(max((int) ($filters['per_page'] ?? 15), 1), 50);
        $sort = (string) ($filters['sort'] ?? 'latest');
        $page = isset($filters['page']) ? (int) $filters['page'] : null;

        $query = Comment::query()
            ->forMovie($movieId)
            ->root()
            ->active()
            ->with(['user:id,name,role,avatar_url']);

        // Eager load tối đa 3 replies mới nhất mỗi root — trang full qua endpoint replies riêng
        $query->with(['replies' => function ($rq) use ($currentUser) {
            $rq->active()
                ->with(['user:id,name,role,avatar_url'])
                ->orderBy('created_at', 'asc')
                ->limit(3);

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

        return $query->paginate($perPage, ['*'], 'page', $page);
    }

    /**
     * Lấy danh sách bình luận phim cho khách (không đăng nhập) có cache SWR Redis.
     *
     * @param  array<string, mixed>  $filters
     * @return array{data: array<int, mixed>, meta: array<string, mixed>}
     */
    public function getMovieCommentsPayload(int $movieId, array $filters = []): array
    {
        ksort($filters);
        $page = (int) ($filters['page'] ?? 1);
        $perPage = min(max((int) ($filters['per_page'] ?? 15), 1), 50);
        $sort = (string) ($filters['sort'] ?? 'latest');
        $cacheKey = "comments:movie:{$movieId}:page:{$page}:per_page:{$perPage}:sort:{$sort}";

        return Cache::tags(['comments', "movie:{$movieId}:comments"])->flexible($cacheKey, [120, 300], function () use ($movieId, $filters) {
            $paginator = $this->getMovieComments($movieId, $filters, null);

            return [
                'data' => CommentResource::collection($paginator->items())->resolve(),
                'meta' => [
                    'currentPage' => $paginator->currentPage(),
                    'lastPage' => $paginator->lastPage(),
                    'perPage' => $paginator->perPage(),
                    'total' => $paginator->total(),
                    'hasMore' => $paginator->hasMorePages(),
                ],
            ];
        });
    }

    /**
     * Lấy danh sách bình luận phim cho người dùng đã đăng nhập dựa trên cached base + overlay batch like.
     *
     * @param  array<string, mixed>  $filters
     * @return array{data: array<int, mixed>, meta: array<string, mixed>}
     */
    public function getMovieCommentsForUser(int $movieId, array $filters, User $user): array
    {
        $base = $this->getMovieCommentsPayload($movieId, $filters);
        $ids = collect($base['data'])->pluck('id')->all();
        $liked = empty($ids) ? [] : DB::table('comment_likes')
            ->where('user_id', $user->id)
            ->whereIn('comment_id', $ids)
            ->pluck('comment_id')
            ->all();
        $likedSet = array_flip($liked);

        foreach ($base['data'] as &$row) {
            $row['isLiked'] = isset($likedSet[$row['id']]);
        }

        return $base;
    }

    /**
     * Xóa cache bình luận của một bộ phim.
     */
    public function clearMovieCommentsCache(int $movieId): void
    {
        Cache::tags(["movie:{$movieId}:comments"])->flush();
    }

    /**
     * Lấy danh sách các câu trả lời cho một bình luận.
     *
     * @param  array<string, mixed>  $filters
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
     * @param  array{content: string, is_spoiler?: bool, parent_id?: int|null}  $data
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
                    $parentUser = $parent->user;
                    defer(function () use ($parentUser, $user, $parent, $comment, $movie) {
                        $parentUser->notify(new CommentReplyNotification($user, $parent, $comment, $movie));

                        try {
                            $unread = $parentUser->unreadNotifications()->count();
                            $latest = $parentUser->notifications()->latest()->first();
                            if ($latest) {
                                broadcast(new NotificationSentEvent($parentUser->id, NotificationService::formatNotification($latest), $unread));
                            }
                        } catch (\Throwable $e) {
                            Log::error('Broadcast reply error: '.$e->getMessage());
                        }
                    })->always();
                }
            }

            $comment->load('user:id,name,role,avatar_url');
            $comment->is_liked = false;

            $this->clearMovieCommentsCache($movie->id);

            return $comment;
        });
    }

    /**
     * Cập nhật nội dung hoặc trạng thái spoiler của bình luận.
     *
     * @param  array{content?: string, is_spoiler?: bool}  $data
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
        $this->clearMovieCommentsCache($comment->movie_id);

        return $comment;
    }

    /**
     * Xóa bình luận (soft delete) và cập nhật lại số lượng replies của bình luận cha nếu có.
     */
    public function deleteComment(User $user, int $commentId): bool
    {
        $comment = Comment::query()->findOrFail($commentId);
        $movieId = $comment->movie_id;

        return DB::transaction(function () use ($comment, $movieId) {
            $parentId = $comment->parent_id;

            $deleted = $comment->delete();

            if ($deleted && $parentId) {
                Comment::where('id', $parentId)
                    ->where('replies_count', '>', 0)
                    ->decrement('replies_count');
            }

            $this->clearMovieCommentsCache($movieId);

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
        $movieId = $comment->movie_id;

        return DB::transaction(function () use ($user, $comment, $movieId) {
            $toggled = $comment->likedUsers()->toggle([$user->id => ['created_at' => now()]]);
            $isLiked = count($toggled['attached']) > 0;

            if ($isLiked) {
                $comment->increment('likes_count');
            } else {
                Comment::whereKey($comment->id)->where('likes_count', '>', 0)->decrement('likes_count');
            }
            $likesCount = (int) $comment->fresh()->likes_count;
            $this->clearMovieCommentsCache($movieId);

            // Gửi thông báo cho tác giả bình luận khi có lượt thích mới (nếu không phải tự like chính mình)
            if ($isLiked && $comment->user && $comment->user_id !== $user->id && $comment->user->is_active && $comment->movie) {
                $commentUser = $comment->user;
                $commentMovie = $comment->movie;
                defer(function () use ($commentUser, $user, $comment, $commentMovie) {
                    $commentUser->notify(new CommentLikeNotification($user, $comment, $commentMovie));

                    try {
                        $unread = $commentUser->unreadNotifications()->count();
                        $latest = $commentUser->notifications()->latest()->first();
                        if ($latest) {
                            broadcast(new NotificationSentEvent($commentUser->id, NotificationService::formatNotification($latest), $unread));
                        }
                    } catch (\Throwable $e) {
                        Log::error('Broadcast like error: '.$e->getMessage());
                    }
                })->always();
            }

            return [
                'isLiked' => $isLiked,
                'likesCount' => $likesCount,
            ];
        });
    }

    /**
     * Lấy danh sách bình luận phục vụ trang quản trị (Admin).
     *
     * @param  array<string, mixed>  $filters
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
        $this->clearMovieCommentsCache($comment->movie_id);

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
        $this->clearMovieCommentsCache($comment->movie_id);

        return $comment;
    }

    /**
     * Xóa vĩnh viễn hoặc soft delete bình luận từ Admin.
     */
    public function adminDeleteComment(int $commentId, bool $force = false): bool
    {
        $comment = Comment::withTrashed()->findOrFail($commentId);
        $movieId = $comment->movie_id;

        return DB::transaction(function () use ($comment, $movieId, $force) {
            $parentId = $comment->parent_id;
            $wasTrashed = $comment->trashed();

            if ($force) {
                $deleted = $comment->forceDelete();
            } else {
                $deleted = $comment->delete();
            }

            // Chỉ giảm replies_count nếu comment chưa từng bị xóa mềm trước đó
            if ($deleted && $parentId && ! $wasTrashed) {
                Comment::where('id', $parentId)
                    ->where('replies_count', '>', 0)
                    ->decrement('replies_count');
            }

            $this->clearMovieCommentsCache($movieId);

            return (bool) $deleted;
        });
    }

    /**
     * Thao tác hàng loạt trên bình luận (Admin).
     *
     * @param  array<int>  $ids
     */
    public function adminBulkAction(string $action, array $ids): int
    {
        if (empty($ids)) {
            return 0;
        }

        $movieIds = Comment::withTrashed()->whereIn('id', $ids)->pluck('movie_id')->unique()->all();

        $result = DB::transaction(function () use ($action, $ids) {
            return match ($action) {
                'activate' => Comment::whereIn('id', $ids)->update(['status' => Comment::STATUS_ACTIVE]),
                'hide' => Comment::whereIn('id', $ids)->update(['status' => Comment::STATUS_HIDDEN]),
                'spam' => Comment::whereIn('id', $ids)->update(['status' => Comment::STATUS_SPAM]),
                'delete' => $this->bulkDeleteComments($ids),
                default => throw ValidationException::withMessages([
                    'action' => 'Hành động hàng loạt không hợp lệ.',
                ]),
            };
        });

        foreach ($movieIds as $mId) {
            $this->clearMovieCommentsCache($mId);
        }

        return $result;
    }

    protected function bulkDeleteComments(array $ids): int
    {
        $comments = Comment::whereIn('id', $ids)->get();
        $count = 0;

        foreach ($comments as $comment) {
            $parentId = $comment->parent_id;
            $wasTrashed = $comment->trashed();

            if ($comment->delete()) {
                if ($parentId && ! $wasTrashed) {
                    Comment::where('id', $parentId)
                        ->where('replies_count', '>', 0)
                        ->decrement('replies_count');
                }
                $count++;
            }
        }

        return $count;
    }
}
