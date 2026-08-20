<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Country;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class CountryController extends Controller
{
    /**
     * Lấy danh sách quốc gia.
     */
    public function index(): JsonResponse
    {
        $countries = Cache::tags(['countries'])->remember('countries:list', 3600, function () {
            return Country::query()
                ->orderBy('name')
                ->get()
                ->map(fn (Country $country) => [
                    'id' => $country->id,
                    'name' => $country->name,
                    'slug' => $country->slug,
                ])
                ->values()
                ->all();
        });

        return response()->json([
            'data' => $countries,
        ]);
    }
}
