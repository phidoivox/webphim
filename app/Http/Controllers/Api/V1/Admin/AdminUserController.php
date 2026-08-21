<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

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

        return response()->json([
            'status' => 'success',
            'data' => $paginator->items(),
            'meta' => [
                'currentPage' => $paginator->currentPage(),
                'lastPage' => $paginator->lastPage(),
                'perPage' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    /**
     * Cập nhật quyền hạn hoặc trạng thái người dùng.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::query()->findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($id)],
            'role' => ['sometimes', 'required', 'string', 'in:admin,moderator,user'],
            'is_active' => ['sometimes', 'required', 'boolean'],
            'password' => ['nullable', 'string', 'min:6'],
        ]);

        if (! empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Cập nhật tài khoản thành công.',
            'data' => $user->fresh(),
        ]);
    }

    /**
     * Xóa tài khoản người dùng.
     */
    public function destroy(int $id): JsonResponse
    {
        $user = User::query()->findOrFail($id);

        // Không cho phép tự xóa chính mình
        if (request()->user()?->id === $user->id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Không thể xóa tài khoản của chính bạn đang đăng nhập.',
            ], 422);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Đã xóa tài khoản thành công.',
        ]);
    }
}
