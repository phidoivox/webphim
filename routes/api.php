<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/status', function () {
    return response()->json([
        'status' => 'success',
        'message' => 'Backend Laravel kết nối thành công với Next.js Frontend!',
        'timestamp' => now()->toIso8601String(),
        'framework' => 'Laravel ' . app()->version(),
    ]);
});
