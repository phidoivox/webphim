<?php

use App\Http\Controllers\Api\V1\MovieController;
use Illuminate\Support\Facades\Route;

Route::get('/status', function () {
    return response()->json([
        'status' => 'success',
        'message' => 'Backend Laravel kết nối thành công với Next.js Frontend!',
        'timestamp' => now()->toIso8601String(),
        'framework' => 'Laravel '.app()->version(),
    ]);
});

Route::get('/v1/movies/{movie}', [MovieController::class, 'show']);
