<?php

namespace App\Http\Resources\Api\V1;

use App\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Comment
 */
class CommentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Comment $comment */
        $comment = $this->resource;

        $isLiked = isset($comment->is_liked)
            ? (bool) $comment->is_liked
            : $comment->isLikedBy($request->user());

        return [
            'id' => $comment->id,
            'movieId' => $comment->movie_id,
            'parentId' => $comment->parent_id,
            'content' => $comment->content,
            'likesCount' => (int) $comment->likes_count,
            'repliesCount' => (int) $comment->replies_count,
            'isPinned' => (bool) $comment->is_pinned,
            'isSpoiler' => (bool) $comment->is_spoiler,
            'status' => $comment->status,
            'isLiked' => $isLiked,
            'author' => [
                'id' => $comment->user_id,
                'name' => $comment->user?->name ?? 'Người dùng ẩn danh',
                'avatarUrl' => $comment->user?->avatar_url,
                'role' => $comment->user?->role ?? 'user',
            ],
            'movie' => $this->whenLoaded('movie', fn () => [
                'id' => $comment->movie->id,
                'name' => $comment->movie->name,
                'slug' => $comment->movie->slug,
                'posterUrl' => $comment->movie->poster_url,
            ]),
            'replies' => CommentResource::collection($this->whenLoaded('replies')),
            'createdAt' => $comment->created_at?->toIso8601String(),
            'updatedAt' => $comment->updated_at?->toIso8601String(),
        ];
    }
}
