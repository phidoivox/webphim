<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ServerLangType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\StoreEpisodeRequest;
use App\Http\Requests\Api\V1\Admin\UpdateEpisodeRequest;
use App\Models\Episode;
use App\Models\EpisodeServer;
use App\Models\Movie;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rules\Enum;

class AdminEpisodeController extends Controller
{
    /**
     * Danh sách tập phim của một bộ phim.
     */
    public function index(int $movieId): JsonResponse
    {
        $movie = Movie::query()->findOrFail($movieId);
        $episodes = Episode::query()
            ->where('movie_id', $movieId)
            ->with('servers')
            ->orderBy('sort_order')
            ->get()
            ->map(fn (Episode $ep) => [
                'id' => $ep->id,
                'movieId' => $ep->movie_id,
                'name' => $ep->name,
                'slug' => $ep->slug,
                'sortOrder' => $ep->sort_order,
                'servers' => $ep->servers->map(fn (EpisodeServer $s) => [
                    'id' => $s->id,
                    'serverName' => $s->server_name,
                    'langType' => $s->lang_type instanceof \BackedEnum ? $s->lang_type->value : $s->lang_type,
                    'linkM3u8' => $s->link_m3u8,
                    'linkEmbed' => $s->link_embed,
                    'sortOrder' => $s->sort_order,
                    'isActive' => (bool) $s->is_active,
                ]),
            ]);

        return response()->json([
            'status' => 'success',
            'data' => [
                'movie' => [
                    'id' => $movie->id,
                    'name' => $movie->name,
                    'slug' => $movie->slug,
                ],
                'episodes' => $episodes,
            ],
        ]);
    }

    /**
     * Thêm tập phim mới cho một bộ phim.
     */
    public function store(StoreEpisodeRequest $request, int $movieId): JsonResponse
    {
        $movie = Movie::query()->findOrFail($movieId);
        $validated = $request->validated();

        $episode = DB::transaction(function () use ($movie, $validated) {
            $servers = $validated['servers'] ?? [];
            unset($validated['servers']);

            $maxSort = (int) Episode::query()->where('movie_id', $movie->id)->max('sort_order');
            $validated['sort_order'] = $validated['sort_order'] ?? ($maxSort + 1);

            $episode = $movie->episodes()->create($validated);

            foreach ($servers as $idx => $sData) {
                $episode->servers()->create([
                    'server_name' => $sData['server_name'],
                    'lang_type' => $sData['lang_type'],
                    'link_m3u8' => $sData['link_m3u8'] ?? null,
                    'link_embed' => $sData['link_embed'] ?? null,
                    'sort_order' => $sData['sort_order'] ?? ($idx + 1),
                    'is_active' => $sData['is_active'] ?? true,
                ]);
            }

            return $episode->load('servers');
        });

        // Tự động gửi thông báo tập mới cho các user đã lưu phim vào tủ phim
        app(\App\Services\NotificationService::class)->notifyNewEpisode($episode);

        return response()->json([
            'status' => 'success',
            'message' => 'Thêm tập phim thành công.',
            'data' => [
                'id' => $episode->id,
                'name' => $episode->name,
                'slug' => $episode->slug,
                'servers' => $episode->servers,
            ],
        ], 201);
    }

    /**
     * Cập nhật thông tin tập phim và các server video.
     */
    public function update(UpdateEpisodeRequest $request, int $id): JsonResponse
    {
        $episode = Episode::query()->findOrFail($id);
        $validated = $request->validated();

        DB::transaction(function () use ($episode, $validated) {
            $servers = $validated['servers'] ?? null;
            unset($validated['servers']);

            $episode->update($validated);

            if ($servers !== null) {
                // Xóa và tạo lại hoặc sync danh sách servers
                $episode->servers()->delete();
                foreach ($servers as $idx => $sData) {
                    $episode->servers()->create([
                        'server_name' => $sData['server_name'],
                        'lang_type' => $sData['lang_type'],
                        'link_m3u8' => $sData['link_m3u8'] ?? null,
                        'link_embed' => $sData['link_embed'] ?? null,
                        'sort_order' => $sData['sort_order'] ?? ($idx + 1),
                        'is_active' => $sData['is_active'] ?? true,
                    ]);
                }
            }
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Cập nhật tập phim thành công.',
            'data' => $episode->fresh(['servers']),
        ]);
    }

    /**
     * Xóa một tập phim.
     */
    public function destroy(int $id): JsonResponse
    {
        $episode = Episode::query()->findOrFail($id);
        $episode->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Đã xóa tập phim thành công.',
        ]);
    }

    /**
     * Thêm máy chủ phát lẻ vào tập phim.
     */
    public function storeServer(Request $request, int $episodeId): JsonResponse
    {
        $episode = Episode::query()->findOrFail($episodeId);
        $validated = $request->validate([
            'server_name' => ['required', 'string', 'max:255'],
            'lang_type' => ['required', new Enum(ServerLangType::class)],
            'link_m3u8' => ['nullable', 'string', 'max:1000'],
            'link_embed' => ['nullable', 'string', 'max:1000'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $server = $episode->servers()->create($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Thêm máy chủ phát thành công.',
            'data' => $server,
        ], 201);
    }

    /**
     * Xóa máy chủ phát.
     */
    public function destroyServer(int $serverId): JsonResponse
    {
        $server = EpisodeServer::query()->findOrFail($serverId);
        $server->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Đã xóa máy chủ phát thành công.',
        ]);
    }
}
