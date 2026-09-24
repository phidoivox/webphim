<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar_url',
        'role',
        'subscription_type',
        'subscription_expires_at',
        'is_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'subscription_expires_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function ratings(): HasMany
    {
        return $this->hasMany(Rating::class);
    }

    public function bookmarks(): HasMany
    {
        return $this->hasMany(Bookmark::class);
    }

    public function watchHistories(): HasMany
    {
        return $this->hasMany(WatchHistory::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function collections(): HasMany
    {
        return $this->hasMany(Collection::class, 'created_by');
    }

    /**
     * Kiểm tra người dùng có quyền quản trị (Admin hoặc Moderator) và đang hoạt động.
     */
    public function isAdmin(): bool
    {
        return in_array($this->role, ['admin', 'moderator'], true) && (bool) $this->is_active;
    }

    /**
     * Kiểm tra người dùng có quyền quản trị cấp cao nhất (Super Admin).
     */
    public function isSuperAdmin(): bool
    {
        return $this->role === 'admin' && (bool) $this->is_active;
    }

    /**
     * Kiểm tra người dùng là kiểm duyệt viên (Moderator).
     */
    public function isModerator(): bool
    {
        return $this->role === 'moderator' && (bool) $this->is_active;
    }
}
