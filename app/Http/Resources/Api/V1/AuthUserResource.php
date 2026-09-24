<?php

namespace App\Http\Resources\Api\V1;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin User
 */
class AuthUserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role ?? 'user',
            'subscriptionType' => $this->subscription_type ?? 'free',
            'subscriptionExpiresAt' => $this->subscription_expires_at?->toIso8601String(),
            'avatarUrl' => $this->avatar_url,
            'isActive' => (bool) ($this->is_active ?? true),
            'createdAt' => $this->created_at?->toIso8601String(),
        ];
    }
}
