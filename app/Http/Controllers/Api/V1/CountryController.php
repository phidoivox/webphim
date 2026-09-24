<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\CountryResource;
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
        $countries = Cache::tags(['taxonomies', 'countries'])->flexible('countries:list', [1800, 3600], function () {
            $collection = Country::query()
                ->orderBy('name')
                ->get();

            return CountryResource::collection($collection)->resolve();
        });

        return response()->json([
            'status' => 'success',
            'data' => $countries,
        ]);
    }
}
