<?php

namespace App\Http\Requests\Api\V1\Collection;

use Illuminate\Foundation\Http\FormRequest;

class AddCollectionMovieRequest extends FormRequest
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
            'movie_id' => ['required', 'integer', 'exists:movies,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'movie_id.required' => 'Vui lòng chọn phim để thêm.',
            'movie_id.exists' => 'Bộ phim không tồn tại.',
        ];
    }
}
