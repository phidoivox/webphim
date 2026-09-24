<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class AttachRequestContext
{
    /**
     * Gắn request_id (UUID) và user_id vào Laravel Context
     * để mọi Log và Exception đều tự động mang theo ngữ cảnh phiên.
     */
    public function handle(Request $request, Closure $next): Response
    {
        Context::add('request_id', (string) Str::uuid());
        Context::add('client_ip', $request->ip());

        if ($request->user()) {
            Context::add('user_id', $request->user()->id);
        }

        return $next($request);
    }
}
