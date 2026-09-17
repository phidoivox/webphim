<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdminBulkActionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:movies,id'],
            'action' => [
                'required',
                'string',
                Rule::in([
                    'is_active_on',
                    'is_active_off',
                    'is_featured_on',
                    'is_featured_off',
                    'is_cinema_on',
                    'is_cinema_off',
                    'activate',
                    'deactivate',
                    'feature',
                    'unfeature',
                    'cinema',
                    'uncinema',
                    'delete',
                ]),
            ],
        ];
    }
}
