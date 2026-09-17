<?php

namespace App\Http\Requests\Api\V1\Collection;

use Illuminate\Foundation\Http\FormRequest;

class StoreCollectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],
            'is_public' => ['nullable', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Vui lòng nhập tên bộ sưu tập.',
            'name.max' => 'Tên bộ sưu tập không được vượt quá 100 ký tự.',
            'description.max' => 'Mô tả không được vượt quá 500 ký tự.',
        ];
    }
}
