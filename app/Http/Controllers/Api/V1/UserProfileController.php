<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Profile\UpdateProfileRequest;
use App\Http\Resources\Api\V1\AuthUserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class UserProfileController extends Controller
{
    /**
     * Thông tin tài khoản + thống kê tủ phim / bộ sưu tập.
     */
    public function show(): JsonResponse
    {
        $user = \App\Models\User::whereKey(request()->user()->id)
            ->withCount(['bookmarks', 'collections'])
            ->firstOrFail();

        return response()->json([
            'status' => 'success',
            'data' => [
                'user' => new AuthUserResource($user),
                'stats' => [
                    'collectionsCount' => (int) $user->collections_count,
                    'bookmarksCount' => (int) $user->bookmarks_count,
                ],
            ],
        ]);
    }

    /**
     * Cập nhật tên / avatar / mật khẩu.
     */
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();

        if (array_key_exists('name', $data)) {
            $user->name = $data['name'];
        }

        if (array_key_exists('avatar_url', $data)) {
            $user->avatar_url = $data['avatar_url'];
        }

        if (! empty($data['password'])) {
            if (! Hash::check($data['current_password'], $user->password)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Mật khẩu hiện tại không đúng.',
                    'errors' => ['current_password' => ['Mật khẩu hiện tại không đúng.']],
                ], 422);
            }

            $user->password = $data['password'];
        }

        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Cập nhật thông tin thành công.',
            'data' => new AuthUserResource($user->refresh()),
        ]);
    }
}
