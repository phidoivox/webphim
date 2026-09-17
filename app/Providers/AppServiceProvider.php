<?php

namespace App\Providers;

use App\Models\Episode;
use App\Models\EpisodeServer;
use App\Models\Movie;
use App\Observers\EpisodeObserver;
use App\Observers\MovieObserver;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Đăng ký Observer quản lý cache invalidation tự động
        Movie::observe(MovieObserver::class);
        Episode::observe(EpisodeObserver::class);
        EpisodeServer::observe(EpisodeObserver::class);

        // Kích hoạt Strict Mode cho Eloquent để phát hiện N+1 Query & unfillable attributes khi Dev/Test
        Model::shouldBeStrict(! $this->app->isProduction());

        // Cấu hình quy tắc mật khẩu chuẩn
        Password::defaults(function () {
            $rule = Password::min(6);

            return $this->app->isProduction()
                ? $rule->letters()->numbers()->uncompromised()
                : $rule;
        });

        // Cấu hình Rate Limiter cho API routes chung
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(120)->by($request->user()?->id ?: $request->ip());
        });

        // Cấu hình Rate Limiter cho Auth routes chống brute-force (key theo IP — email rotate không bypass)
        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute(10)->by($request->ip());
        });

        // Cấu hình Rate Limiter cho bình luận chống spam
        RateLimiter::for('comments', function (Request $request) {
            return Limit::perMinute(15)->by($request->user()?->id ?: $request->ip());
        });

        // Cấu hình Rate Limiter cho lượt thích bình luận
        RateLimiter::for('likes', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        // Macro đóng gói response phân trang chuẩn REST
        Response::macro('paginated', function ($paginator, ?string $resourceClass = null, array $extraMeta = []) {
            $data = $resourceClass ? $resourceClass::collection($paginator->items()) : $paginator->items();
            $meta = array_merge([
                'currentPage' => $paginator->currentPage(),
                'lastPage' => $paginator->lastPage(),
                'perPage' => $paginator->perPage(),
                'total' => $paginator->total(),
                'hasMore' => $paginator->hasMorePages(),
            ], $extraMeta);

            return response()->json([
                'status' => 'success',
                'data' => $data,
                'meta' => $meta,
            ]);
        });
    }
}
