<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BookmarkController;
use App\Http\Controllers\Api\V1\CommentController;
use App\Http\Controllers\Api\V1\CountryController;
use App\Http\Controllers\Api\V1\GenreController;
use App\Http\Controllers\Api\V1\HistoryController;
use App\Http\Controllers\Api\V1\HomeController;
use App\Http\Controllers\Api\V1\MovieController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\ScheduleController;
use App\Http\Controllers\Api\V1\Admin\AdminCommentController;
use App\Http\Controllers\Api\V1\Admin\AdminDashboardController;
use App\Http\Controllers\Api\V1\Admin\AdminEpisodeController;
use App\Http\Controllers\Api\V1\Admin\AdminMovieController;
use App\Http\Controllers\Api\V1\Admin\AdminNotificationController;
use App\Http\Controllers\Api\V1\Admin\AdminReportController;
use App\Http\Controllers\Api\V1\Admin\AdminTaxonomyController;
use App\Http\Controllers\Api\V1\Admin\AdminUserController;
use Illuminate\Support\Facades\Route;

Route::get('/status', function () {
    return response()->json([
        'status' => 'success',
        'message' => 'Backend Laravel kết nối thành công với Next.js Frontend!',
        'timestamp' => now()->toIso8601String(),
        'framework' => 'Laravel '.app()->version(),
    ]);
});

// Authentication Routes
Route::prefix('v1/auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:auth');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:auth');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

// Watch History & Multi-Device Progress Sync Routes (Sanctum Protected)
Route::prefix('v1/history')->middleware('auth:sanctum')->group(function () {
    Route::post('/sync', [HistoryController::class, 'sync']);
    Route::get('/', [HistoryController::class, 'index']);
    Route::get('/movie/{movieId}', [HistoryController::class, 'movieProgress']);
    Route::delete('/{id}', [HistoryController::class, 'destroy'])->whereNumber('id');
    Route::delete('/', [HistoryController::class, 'clear']);
    Route::post('/merge', [HistoryController::class, 'merge']);
});

// Bookmarks & Movie Cabinet Routes (Sanctum Protected)
Route::prefix('v1/bookmarks')->middleware('auth:sanctum')->group(function () {
    Route::post('/toggle', [BookmarkController::class, 'toggle']);
    Route::get('/', [BookmarkController::class, 'index']);
    Route::get('/check/{movieId}', [BookmarkController::class, 'check'])->whereNumber('movieId');
    Route::delete('/{id}', [BookmarkController::class, 'destroy'])->whereNumber('id');
    Route::delete('/', [BookmarkController::class, 'clear']);
    Route::post('/merge', [BookmarkController::class, 'merge']);
});

// Comments Public & Authenticated Routes
Route::prefix('v1')->group(function () {
    Route::get('/movies/{movie}/comments', [CommentController::class, 'index']);
    Route::get('/comments/{id}/replies', [CommentController::class, 'replies'])->whereNumber('id');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/movies/{movie}/comments', [CommentController::class, 'store'])->middleware('throttle:comments');
        Route::put('/comments/{id}', [CommentController::class, 'update'])->whereNumber('id');
        Route::delete('/comments/{id}', [CommentController::class, 'destroy'])->whereNumber('id');
        Route::post('/comments/{id}/like', [CommentController::class, 'toggleLike'])->whereNumber('id')->middleware('throttle:likes');
    });
});

// Notifications (Sanctum Protected)
Route::prefix('v1/notifications')->middleware('auth:sanctum')->group(function () {
    Route::get('/', [NotificationController::class, 'index']);
    Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
    Route::patch('/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/{id}', [NotificationController::class, 'destroy']);
});

Route::middleware('cache.headers:public;max_age=300;etag')->group(function () {
    Route::get('/v1/genres', [GenreController::class, 'index']);
    Route::get('/v1/countries', [CountryController::class, 'index']);
    Route::get('/v1/home', [HomeController::class, 'index']);
    Route::get('/v1/movies/search', [MovieController::class, 'search']);
    Route::get('/v1/movies', [MovieController::class, 'index']);
    Route::get('/v1/movies/{movie}', [MovieController::class, 'show']);
    Route::get('/v1/schedule', [ScheduleController::class, 'index']);
});

// Admin Management Routes (Sanctum + Admin Guard)
Route::prefix('v1/admin')->middleware(['auth:sanctum', 'admin'])->group(function () {
    // Dashboard Stats
    Route::get('/dashboard/stats', [AdminDashboardController::class, 'stats']);

    // Movies Management
    Route::get('/movies', [AdminMovieController::class, 'index']);
    Route::post('/movies', [AdminMovieController::class, 'store']);
    Route::post('/movies/bulk', [AdminMovieController::class, 'bulk']);
    Route::get('/movies/{id}', [AdminMovieController::class, 'show'])->whereNumber('id');
    Route::put('/movies/{id}', [AdminMovieController::class, 'update'])->whereNumber('id');
    Route::delete('/movies/{id}', [AdminMovieController::class, 'destroy'])->whereNumber('id');
    Route::patch('/movies/{id}/toggle', [AdminMovieController::class, 'toggle'])->whereNumber('id');

    // Comments Management
    Route::get('/comments', [AdminCommentController::class, 'index']);
    Route::patch('/comments/{id}/status', [AdminCommentController::class, 'updateStatus'])->whereNumber('id');
    Route::patch('/comments/{id}/pin', [AdminCommentController::class, 'togglePin'])->whereNumber('id');
    Route::delete('/comments/{id}', [AdminCommentController::class, 'destroy'])->whereNumber('id');
    Route::post('/comments/bulk', [AdminCommentController::class, 'bulk']);

    // Notifications Broadcast
    Route::post('/notifications/broadcast', [AdminNotificationController::class, 'broadcast']);

    // Episodes & Servers Management
    Route::get('/movies/{movieId}/episodes', [AdminEpisodeController::class, 'index'])->whereNumber('movieId');
    Route::post('/movies/{movieId}/episodes', [AdminEpisodeController::class, 'store'])->whereNumber('movieId');
    Route::put('/episodes/{id}', [AdminEpisodeController::class, 'update'])->whereNumber('id');
    Route::delete('/episodes/{id}', [AdminEpisodeController::class, 'destroy'])->whereNumber('id');
    Route::post('/episodes/{episodeId}/servers', [AdminEpisodeController::class, 'storeServer'])->whereNumber('episodeId');
    Route::delete('/servers/{serverId}', [AdminEpisodeController::class, 'destroyServer'])->whereNumber('serverId');

    // Taxonomies Management
    Route::get('/genres', [AdminTaxonomyController::class, 'genres']);
    Route::post('/genres', [AdminTaxonomyController::class, 'storeGenre']);
    Route::put('/genres/{id}', [AdminTaxonomyController::class, 'updateGenre'])->whereNumber('id');
    Route::delete('/genres/{id}', [AdminTaxonomyController::class, 'destroyGenre'])->whereNumber('id');

    Route::get('/countries', [AdminTaxonomyController::class, 'countries']);
    Route::post('/countries', [AdminTaxonomyController::class, 'storeCountry']);
    Route::put('/countries/{id}', [AdminTaxonomyController::class, 'updateCountry'])->whereNumber('id');
    Route::delete('/countries/{id}', [AdminTaxonomyController::class, 'destroyCountry'])->whereNumber('id');

    Route::get('/people', [AdminTaxonomyController::class, 'people']);
    Route::post('/people', [AdminTaxonomyController::class, 'storePerson']);

    // Users Management
    Route::get('/users', [AdminUserController::class, 'index']);
    Route::put('/users/{id}', [AdminUserController::class, 'update'])->whereNumber('id');
    Route::delete('/users/{id}', [AdminUserController::class, 'destroy'])->whereNumber('id');

    // Reports Management
    Route::get('/reports', [AdminReportController::class, 'index']);
    Route::put('/reports/{id}', [AdminReportController::class, 'update'])->whereNumber('id');
    Route::delete('/reports/{id}', [AdminReportController::class, 'destroy'])->whereNumber('id');
});


