<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\UpdateAdminUserRequest;
use App\Http\Resources\Api\V1\Admin\AdminUserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminUserController extends Controller
{
    /**
     * Danh sách người dùng hệ thống.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::query();

        if ($request->filled('q')) {
            $keyword = trim((string) $request->input('q'));
            $escaped = str_replace(['%', '_'], ['\\%', '\\_'], $keyword);
            $query->where(function ($q) use ($escaped) {
                $q->where('name', 'like', "%{$escaped}%")
                    ->orWhere('email', 'like', "%{$escaped}%");
            });
        }

        if ($request->filled('role')) {
            $query->where('role', $request->input('role'));
        }

        if ($request->has('is_active') && $request->input('is_active') !== '') {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        $perPage = min(max($request->integer('per_page', 20), 1), 100);
        $paginator = $query->orderByDesc('created_at')->paginate($perPage);

        return response()->paginated($paginator, AdminUserResource::class);
    }

    /**
     * Cập nhật quyền hạn hoặc trạng thái người dùng.
     */
    public function update(UpdateAdminUserRequest $request, int $id): JsonResponse
    {
        $currentUser = $request->user();
        $targetUser = User::query()->findOrFail($id);

        // 1. Phân quyền: Moderator không thể chỉnh sửa tài khoản Admin khác
        if ($currentUser?->role !== 'admin' && $targetUser->role === 'admin') {
            abort(403, 'Bạn không có quyền chỉnh sửa tài khoản Quản trị viên cấp cao.');
        }

        $validated = $request->validated();

        // 2. Chỉ có Admin mới được thay đổi vai trò (role) của tài khoản
        if (isset($validated['role']) && $currentUser?->role !== 'admin') {
            abort(403, 'Chỉ Quản trị viên cấp cao mới có quyền thay đổi vai trò người dùng.');
        }

        // 3. Chỉ Admin mới được reset password hoặc khóa/mở tài khoản người khác
        if ($currentUser?->role !== 'admin'
            && (isset($validated['password']) || isset($validated['is_active']))
            && $currentUser?->id !== $targetUser->id
        ) {
            abort(403, 'Chỉ Quản trị viên cấp cao mới có quyền đặt lại mật khẩu hoặc khóa tài khoản.');
        }

        if (! empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $targetUser->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Cập nhật tài khoản thành công.',
            'data' => new AdminUserResource($targetUser->fresh()),
        ]);
    }

    /**
     * Xóa tài khoản người dùng.
     */
    public function destroy(int $id): JsonResponse
    {
        $currentUser = request()->user();
        $targetUser = User::query()->findOrFail($id);

        // Phân quyền: Chỉ Super Admin mới có quyền xóa tài khoản
        if ($currentUser?->role !== 'admin') {
            abort(403, 'Chỉ Quản trị viên cấp cao mới có quyền xóa tài khoản người dùng.');
        }

        // Không cho phép tự xóa chính mình
        if ($currentUser?->id === $targetUser->id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Không thể xóa tài khoản của chính bạn đang đăng nhập.',
            ], 422);
        }

        $targetUser->tokens()->delete();
        $targetUser->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Đã xóa tài khoản thành công.',
        ]);
    }
}
