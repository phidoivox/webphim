<?php

namespace App\Http\Requests\Api\V1\Bookmark;

use App\Models\Bookmark;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ToggleBookmarkRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'movie_id' => ['required', 'integer', 'exists:movies,id'],
            'type' => ['nullable', 'string', Rule::in([Bookmark::TYPE_FAVORITE, Bookmark::TYPE_WATCHLATER])],
        ];
    }
}
