<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Enums\MovieQuality;
use App\Enums\MovieStatus;
use App\Enums\MovieType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

class UpdateMovieRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $movieId = $this->route('movie') ?? $this->route('id');

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'origin_name' => ['nullable', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('movies', 'slug')->ignore($movieId)],
            'content' => ['nullable', 'string'],
            'type' => ['sometimes', 'required', new Enum(MovieType::class)],
            'status' => ['sometimes', 'required', new Enum(MovieStatus::class)],
            'quality' => ['sometimes', 'required', new Enum(MovieQuality::class)],
            'lang' => ['nullable', 'string', 'max:100'],
            'thumb_url' => ['nullable', 'string', 'max:500'],
            'poster_url' => ['nullable', 'string', 'max:500'],
            'trailer_url' => ['nullable', 'string', 'max:500'],
            'duration' => ['nullable', 'string', 'max:100'],
            'duration_minutes' => ['nullable', 'integer', 'min:0'],
            'episode_current' => ['nullable', 'string', 'max:100'],
            'episode_total' => ['nullable', 'string', 'max:100'],
            'notify_schedule' => ['nullable', 'string', 'max:255'],
            'schedule_days' => ['nullable', 'array', 'max:7'],
            'schedule_days.*' => ['integer', 'between:0,6'],
            'year' => ['nullable', 'integer', 'min:1900', 'max:2099'],
            'tmdb_rating' => ['nullable', 'numeric', 'min:0', 'max:10'],
            'imdb_rating' => ['nullable', 'numeric', 'min:0', 'max:10'],
            'rating_avg' => ['nullable', 'numeric', 'min:0', 'max:10'],
            'is_featured' => ['nullable', 'boolean'],
            'is_cinema' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
            'genre_ids' => ['nullable', 'array'],
            'genre_ids.*' => ['integer', 'exists:genres,id'],
            'country_ids' => ['nullable', 'array'],
            'country_ids.*' => ['integer', 'exists:countries,id'],
            'tag_ids' => ['nullable', 'array'],
            'tag_ids.*' => ['integer', 'exists:tags,id'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['nullable'],
            'tmdb_id' => ['nullable', 'string', 'max:50'],
            'imdb_id' => ['nullable', 'string', 'max:50'],
            'source_url' => ['nullable', 'string', 'max:1000'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'meta_keywords' => ['nullable', 'string', 'max:500'],
            'actors' => ['nullable', 'array'],
            'actors.*' => ['nullable'],
            'directors' => ['nullable', 'array'],
            'directors.*' => ['nullable'],
            'galleries' => ['nullable', 'array'],
            'galleries.*.media_type' => ['nullable', 'string', 'in:image,video'],
            'galleries.*.type' => ['nullable', 'string', 'max:50'],
            'galleries.*.url' => ['required', 'string', 'max:1000'],
            'galleries.*.thumb_url' => ['nullable', 'string', 'max:1000'],
            'galleries.*.caption' => ['nullable', 'string', 'max:255'],
            'galleries.*.sort_order' => ['nullable', 'integer'],
            'episodes' => ['nullable', 'array'],
            'episodes.*.name' => ['required_with:episodes', 'string', 'max:255'],
            'episodes.*.slug' => ['required_with:episodes', 'string', 'max:255'],
            'episodes.*.sort_order' => ['nullable', 'integer'],
            'episodes.*.servers' => ['nullable', 'array'],
            'episodes.*.servers.*.server_name' => ['required', 'string', 'max:255'],
            'episodes.*.servers.*.lang_type' => ['nullable', 'string'],
            'episodes.*.servers.*.link_m3u8' => ['nullable', 'string', 'max:1000'],
            'episodes.*.servers.*.link_embed' => ['nullable', 'string', 'max:1000'],
            'episodes.*.servers.*.sort_order' => ['nullable', 'integer'],
            'episodes.*.servers.*.is_active' => ['nullable', 'boolean'],
        ];
    }
}
