<?php

namespace App\Http\Requests\Api\V1\History;

use Illuminate\Foundation\Http\FormRequest;

class MergeGuestHistoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'max:50'],
            'items.*.movie_id' => ['required', 'integer', 'exists:movies,id'],
            'items.*.episode_id' => ['nullable', 'integer', 'exists:episodes,id'],
            'items.*.server_id' => ['nullable', 'integer'],
            'items.*.progress_seconds' => ['required', 'integer', 'min:0'],
            'items.*.duration_seconds' => ['nullable', 'integer', 'min:1'],
            'items.*.watched_at' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'items.required' => 'Danh sách lịch sử xem không được để trống.',
            'items.array' => 'Định dạng danh sách lịch sử không hợp lệ.',
        ];
    }
}
