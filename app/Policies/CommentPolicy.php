<?php

namespace App\Policies;

use App\Models\Comment;
use App\Models\User;

class CommentPolicy
{
    /**
     * Xác định người dùng có thể cập nhật bình luận hay không.
     */
    public function update(User $user, Comment $comment): bool
    {
        return $user->id === $comment->user_id || $user->role === 'admin';
    }

    /**
     * Xác định người dùng có thể xóa bình luận hay không.
     */
    public function delete(User $user, Comment $comment): bool
    {
        return $user->id === $comment->user_id || $user->role === 'admin';
    }

    /**
     * Xác định người dùng có thể ghim/bỏ ghim bình luận hay không.
     */
    public function pin(User $user, Comment $comment): bool
    {
        return $user->role === 'admin';
    }

    /**
     * Xác định người dùng có thể kiểm duyệt bình luận hay không.
     */
    public function moderate(User $user): bool
    {
        return $user->role === 'admin';
    }
}
