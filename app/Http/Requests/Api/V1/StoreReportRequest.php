<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'episode_id' => ['required', 'integer', 'exists:episodes,id'],
            'server_id' => ['nullable', 'integer', 'exists:episode_servers,id'],
            'report_type' => ['required', 'string', 'in:broken_link,no_sound,wrong_episode,lag,sub_error,other'],
            'description' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'episode_id.required' => 'Vui lòng chọn tập phim cần báo lỗi.',
            'episode_id.exists' => 'Tập phim không tồn tại trong hệ thống.',
            'server_id.exists' => 'Máy chủ phát không tồn tại.',
            'report_type.required' => 'Vui lòng chọn loại lỗi gặp phải.',
            'report_type.in' => 'Loại lỗi không hợp lệ.',
            'description.max' => 'Mô tả chi tiết không được vượt quá :max ký tự.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('description')) {
            $cleaned = trim(strip_tags((string) $this->input('description')));
            $this->merge([
                'description' => $cleaned !== '' ? $cleaned : null,
            ]);
        }
    }
}
