<?php

namespace App\Providers;

use App\Models\Movie;
use App\Observers\MovieObserver;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
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

        // Cấu hình Rate Limiter cho Auth routes chống brute-force
        RateLimiter::for('auth', function (Request $request) {
            $email = (string) $request->input('email', '');

            return Limit::perMinute(10)->by($email.$request->ip());
        });

        // Cấu hình Rate Limiter cho bình luận chống spam
        RateLimiter::for('comments', function (Request $request) {
            return Limit::perMinute(15)->by($request->user()?->id ?: $request->ip());
        });

        // Cấu hình Rate Limiter cho lượt thích bình luận
        RateLimiter::for('likes', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });
    }
}
