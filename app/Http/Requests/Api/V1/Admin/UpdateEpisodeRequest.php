<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Enums\ServerLangType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdateEpisodeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => ['sometimes', 'required', 'string', 'max:255'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'servers' => ['nullable', 'array'],
            'servers.*.server_name' => ['required', 'string', 'max:255'],
            'servers.*.lang_type' => ['required', new Enum(ServerLangType::class)],
            'servers.*.link_m3u8' => ['nullable', 'string', 'max:1000'],
            'servers.*.link_embed' => ['nullable', 'string', 'max:1000'],
            'servers.*.sort_order' => ['nullable', 'integer', 'min:0'],
            'servers.*.is_active' => ['nullable', 'boolean'],
        ];
    }
}
