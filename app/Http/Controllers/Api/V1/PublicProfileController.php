<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\CollectionSummaryResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class PublicProfileController extends Controller
{
    /**
     * Hồ sơ công khai của user + các bộ sưu tập công khai.
     */
    public function show(int $id): JsonResponse
    {
        $user = User::where('id', $id)->where('is_active', true)->firstOrFail();

        $collections = $user->collections()
            ->public()
            ->with(['movies' => fn ($q) => $q->with('genres')->limit(6)])
            ->withCount('movies')
            ->orderByDesc('updated_at')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'avatarUrl' => $user->avatar_url,
                    'subscriptionType' => $user->subscription_type ?? 'free',
                    'createdAt' => $user->created_at?->toIso8601String(),
                    'collectionsCount' => $collections->count(),
                ],
                'collections' => CollectionSummaryResource::collection($collections),
            ],
        ]);
    }
}
