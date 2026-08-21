<?php

namespace App\Http\Requests\Api\V1\Comment;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateCommentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'content' => ['required', 'string', 'min:2', 'max:2000'],
            'is_spoiler' => ['nullable', 'boolean'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'content.required' => 'Nội dung bình luận không được để trống.',
            'content.min' => 'Nội dung bình luận phải có ít nhất :min ký tự.',
            'content.max' => 'Nội dung bình luận không được vượt quá :max ký tự.',
        ];
    }

    /**
     * Chuẩn hóa dữ liệu đầu vào
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('content')) {
            $cleaned = trim(strip_tags((string) $this->input('content')));
            $this->merge([
                'content' => $cleaned,
            ]);
        }

        if ($this->has('is_spoiler')) {
            $this->merge([
                'is_spoiler' => filter_var($this->input('is_spoiler'), FILTER_VALIDATE_BOOLEAN),
            ]);
        }
    }
}
