<?php

use App\Http\Middleware\AttachRequestContext;
use App\Http\Middleware\EnsureUserIsAdmin;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withBroadcasting(
        __DIR__.'/../routes/channels.php',
        ['prefix' => 'api', 'middleware' => ['api', 'auth:sanctum']],
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Trust proxies giới hạn theo env TRUSTED_PROXIES (comma-separated IPs/CIDRs).
        // Bỏ trống = không trust thêm (mặc định Laravel); '*' chỉ khi sau reverse proxy tin cậy.
        $trustedEnv = trim((string) env('TRUSTED_PROXIES', ''));
        if ($trustedEnv !== '') {
            $trusted = $trustedEnv === '*'
                ? '*'
                : array_values(array_filter(array_map('trim', explode(',', $trustedEnv))));
            $middleware->trustProxies(at: $trusted);
        }

        $middleware->alias([
            'admin' => EnsureUserIsAdmin::class,
        ]);

        $middleware->api(append: [
            AttachRequestContext::class,
            'throttle:api',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })->create();
