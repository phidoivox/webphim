<?php

namespace App\Http\Requests\Api\V1\Bookmark;

use App\Models\Bookmark;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MergeGuestBookmarksRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'max:100'],
            'items.*.movie_id' => ['required', 'integer', 'exists:movies,id'],
            'items.*.type' => ['nullable', 'string', Rule::in([Bookmark::TYPE_FAVORITE, Bookmark::TYPE_WATCHLATER])],
        ];
    }
}
