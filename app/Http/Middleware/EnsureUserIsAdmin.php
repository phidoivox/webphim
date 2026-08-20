<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! in_array($user->role, ['admin', 'moderator'], true) || ! $user->is_active) {
            return response()->json([
                'status' => 'error',
                'message' => 'Bạn không có quyền truy cập khu vực quản trị hoặc tài khoản đã bị khóa.',
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
