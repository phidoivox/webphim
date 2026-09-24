<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MovieFilterRequest extends FormRequest
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
            'q' => ['nullable', 'string', 'max:255'],
            'type' => ['nullable', 'string', Rule::in(['single', 'series', 'tv-show', 'tv-shows', 'hoat-hinh', 'anime'])],
            'genre' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'lang' => ['nullable', 'string', 'max:50'],
            'year' => ['nullable', 'integer', 'min:1970', 'max:2030'],
            'sort' => ['nullable', 'string', Rule::in(['latest', 'updated', 'views', 'rating', 'year'])],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ];
    }
}
