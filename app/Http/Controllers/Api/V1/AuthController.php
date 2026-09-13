<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Auth\LoginRequest;
use App\Http\Requests\Api\V1\Auth\RegisterRequest;
use App\Http\Resources\Api\V1\AuthUserResource;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function __construct(
        protected AuthService $authService
    ) {}

    /**
     * Đăng ký tài khoản mới.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $result = $this->authService->register($request->validated());

        return response()->json([
            'status' => 'success',
            'message' => 'Đăng ký tài khoản thành công!',
            'data' => [
                'user' => new AuthUserResource($result['user']),
                'token' => $result['token'],
            ],
        ], 201);
    }

    /**
     * Đăng nhập tài khoản.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login(
            (string) $request->input('email'),
            (string) $request->input('password'),
            $request->input('device_name'),
            (bool) $request->boolean('remember_me', true),
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Đăng nhập thành công!',
            'data' => [
                'user' => new AuthUserResource($result['user']),
                'token' => $result['token'],
            ],
        ], 200);
    }

    /**
     * Lấy thông tin tài khoản hiện tại.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => new AuthUserResource($request->user()),
        ], 200);
    }

    /**
     * Đăng xuất và hủy token hiện tại.
     */
    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return response()->json([
            'status' => 'success',
            'message' => 'Đăng xuất thành công.',
        ], 200);
    }

    public function logoutAll(Request $request): JsonResponse
    {
        $user = $request->user();
        $count = $this->authService->logoutAll($user);
        Auth::forgetGuards();

        return response()->json([
            'status' => 'success',
            'message' => 'Đã đăng xuất khỏi tất cả thiết bị.',
            'data' => ['revokedCount' => $count],
        ], 200);
    }
}
