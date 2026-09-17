<?php

namespace App\Http\Resources\Api\V1\Admin;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin User
 */
class AdminUserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var User $user */
        $user = $this->resource;

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role instanceof \BackedEnum ? $user->role->value : $user->role,
            'avatarUrl' => $user->avatar_url,
            'avatar_url' => $user->avatar_url,
            'isActive' => (bool) $user->is_active,
            'is_active' => (bool) $user->is_active,
            'subscriptionType' => $user->subscription_type ?? 'free',
            'subscription_type' => $user->subscription_type ?? 'free',
            'subscriptionExpiresAt' => $user->subscription_expires_at?->toIso8601String() ?? null,
            'subscription_expires_at' => $user->subscription_expires_at?->toIso8601String() ?? null,
            'createdAt' => $user->created_at?->toIso8601String() ?? '',
            'created_at' => $user->created_at?->toIso8601String() ?? '',
            'updatedAt' => $user->updated_at?->toIso8601String() ?? '',
            'updated_at' => $user->updated_at?->toIso8601String() ?? '',
        ];
    }
}
