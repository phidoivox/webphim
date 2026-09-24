<?php

namespace App\Http\Requests\Api\V1\History;

use Illuminate\Foundation\Http\FormRequest;

class HistorySyncRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'movie_id' => ['required', 'integer', 'exists:movies,id'],
            'episode_id' => ['nullable', 'integer', 'exists:episodes,id'],
            'server_id' => ['nullable', 'integer', 'exists:episode_servers,id'],
            'progress_seconds' => ['required', 'integer', 'min:0'],
            'duration_seconds' => ['nullable', 'integer', 'min:1'],
        ];
    }

    public function messages(): array
    {
        return [
            'movie_id.required' => 'Mã phim không được để trống.',
            'movie_id.exists' => 'Phim không tồn tại trên hệ thống.',
            'episode_id.exists' => 'Tập phim không tồn tại trên hệ thống.',
            'progress_seconds.required' => 'Tiến độ xem không được để trống.',
            'progress_seconds.min' => 'Tiến độ xem không hợp lệ.',
        ];
    }
}
