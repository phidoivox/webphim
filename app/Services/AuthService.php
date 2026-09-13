<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;

class AuthService
{
    /**
     * Đăng ký tài khoản người dùng mới.
     *
     * @param  array{name: string, email: string, password: string}  $data
     * @return array{user: User, token: string}
     */
    public function register(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $user = User::create([
                'name' => trim($data['name']),
                'email' => strtolower(trim($data['email'])),
                'password' => $data['password'],
                'role' => 'user',
                'subscription_type' => 'free',
                'is_active' => true,
            ]);

            $token = $user->createToken('auth_token', ['*'], now()->addDays(30))->plainTextToken;

            return [
                'user' => $user,
                'token' => $token,
            ];
        });
    }

    /**
     * Xác thực và đăng nhập người dùng.
     *
     * @return array{user: User, token: string}
     *
     * @throws ValidationException
     * @throws HttpException
     */
    public function login(string $email, string $password, ?string $deviceName = null, bool $remember = true): array
    {
        $normalizedEmail = strtolower(trim($email));
        $user = User::where('email', $normalizedEmail)->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email hoặc mật khẩu không chính xác.'],
            ]);
        }

        if (! $user->is_active) {
            abort(403, 'Tài khoản của bạn đã bị khóa hoặc chưa được kích hoạt.');
        }

        $tokenName = $deviceName ? trim($deviceName) : 'auth_token';
        $expiresAt = $remember ? now()->addDays(30) : now()->addHours(24);
        $token = $user->createToken($tokenName, ['*'], $expiresAt)->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
        ];
    }

    /**
     * Đăng xuất và thu hồi token hiện tại.
     */
    public function logout(User $user): void
    {
        $user->currentAccessToken()?->delete();
    }

    public function logoutAll(User $user): int
    {
        return (int) $user->tokens()->delete();
    }
}
