<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ServerLangType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\StoreEpisodeRequest;
use App\Http\Requests\Api\V1\Admin\UpdateEpisodeRequest;
use App\Http\Resources\Api\V1\Admin\AdminEpisodeResource;
use App\Models\Episode;
use App\Models\EpisodeServer;
use App\Models\Movie;
use App\Services\NotificationService;
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
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'movie' => [
                    'id' => $movie->id,
                    'name' => $movie->name,
                    'slug' => $movie->slug,
                ],
                'episodes' => AdminEpisodeResource::collection($episodes),
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

        // Fan-out tập mới chạy queue (NotifyNewEpisode job), response trả ngay
        app(NotificationService::class)->notifyNewEpisode($episode->fresh('movie'));

        return response()->json([
            'status' => 'success',
            'message' => 'Thêm tập phim thành công.',
            'data' => new AdminEpisodeResource($episode),
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
                $existingServers = $episode->servers()->get()->keyBy('id');
                $keepServerIds = [];

                foreach ($servers as $idx => $sData) {
                    $serverId = isset($sData['id']) ? (int) $sData['id'] : null;
                    $serverPayload = [
                        'server_name' => $sData['server_name'],
                        'lang_type' => $sData['lang_type'],
                        'link_m3u8' => $sData['link_m3u8'] ?? null,
                        'link_embed' => $sData['link_embed'] ?? null,
                        'sort_order' => $sData['sort_order'] ?? ($idx + 1),
                        'is_active' => $sData['is_active'] ?? true,
                    ];

                    if ($serverId && $existingServers->has($serverId)) {
                        $existingServers->get($serverId)->update($serverPayload);
                        $keepServerIds[] = $serverId;
                    } else {
                        $newServer = $episode->servers()->create($serverPayload);
                        $keepServerIds[] = $newServer->id;
                    }
                }

                // Xóa chỉ các server đã bị gỡ bỏ khỏi danh sách
                $episode->servers()->whereNotIn('id', $keepServerIds)->delete();
            }
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Cập nhật tập phim thành công.',
            'data' => new AdminEpisodeResource($episode->fresh(['servers'])),
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
            'data' => [
                'id' => $server->id,
                'serverName' => $server->server_name,
                'langType' => $server->lang_type,
                'linkM3u8' => $server->link_m3u8,
                'linkEmbed' => $server->link_embed,
                'sortOrder' => $server->sort_order,
                'isActive' => (bool) $server->is_active,
            ],
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

    /**
     * Đồng bộ danh sách tập và server phát hàng loạt cho phim (từ PhimAPI hoặc file).
     */
    public function sync(Request $request, int $movieId): JsonResponse
    {
        $movie = Movie::query()->findOrFail($movieId);
        $validated = $request->validate([
            'episodes' => ['required', 'array', 'min:1'],
            'episodes.*.name' => ['required', 'string', 'max:255'],
            'episodes.*.slug' => ['required', 'string', 'max:255'],
            'episodes.*.sort_order' => ['nullable', 'integer'],
            'episodes.*.servers' => ['nullable', 'array'],
            'episodes.*.servers.*.server_name' => ['required', 'string', 'max:255'],
            'episodes.*.servers.*.lang_type' => ['nullable', 'string'],
            'episodes.*.servers.*.link_m3u8' => ['nullable', 'string', 'max:1000'],
            'episodes.*.servers.*.link_embed' => ['nullable', 'string', 'max:1000'],
            'episodes.*.servers.*.sort_order' => ['nullable', 'integer'],
            'episodes.*.servers.*.is_active' => ['nullable', 'boolean'],
            'clear_existing' => ['nullable', 'boolean'],
        ]);

        $createdCount = 0;
        $serverCount = 0;

        DB::transaction(function () use ($movie, $validated, &$createdCount, &$serverCount) {
            if (! empty($validated['clear_existing'])) {
                $movie->episodes()->delete();
            }

            foreach ($validated['episodes'] as $idx => $epData) {
                $epName = trim((string) $epData['name']);
                $epSlug = trim((string) $epData['slug']);
                $sortOrder = isset($epData['sort_order']) ? (int) $epData['sort_order'] : ($idx + 1);

                $episode = $movie->episodes()->updateOrCreate(
                    ['slug' => $epSlug],
                    [
                        'name' => $epName,
                        'sort_order' => $sortOrder,
                    ]
                );
                $createdCount++;

                $servers = $epData['servers'] ?? [];
                if (! empty($servers) && is_array($servers)) {
                    foreach ($servers as $sIdx => $sData) {
                        $serverName = trim((string) ($sData['server_name'] ?? 'VIP'));
                        $langType = ServerLangType::fromString($sData['lang_type'] ?? null);

                        $episode->servers()->updateOrCreate(
                            ['server_name' => $serverName],
                            [
                                'lang_type' => $langType,
                                'link_m3u8' => $sData['link_m3u8'] ?? null,
                                'link_embed' => $sData['link_embed'] ?? null,
                                'sort_order' => isset($sData['sort_order']) ? (int) $sData['sort_order'] : ($sIdx + 1),
                                'is_active' => isset($sData['is_active']) ? (bool) $sData['is_active'] : true,
                            ]
                        );
                        $serverCount++;
                    }
                }
            }

            // Tự động cập nhật số tập hiện tại của phim nếu là phim bộ
            if (($movie->type?->value ?? $movie->type) === 'series') {
                $totalEps = $movie->episodes()->count();
                $movie->updateQuietly([
                    'episode_current' => "Tập {$totalEps}",
                ]);
            }
        });

        $episodes = Episode::query()
            ->where('movie_id', $movieId)
            ->with('servers')
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'status' => 'success',
            'message' => "Đã đồng bộ thành công {$createdCount} tập phim ({$serverCount} server phát).",
            'data' => [
                'count' => $createdCount,
                'servers_count' => $serverCount,
                'episodes' => AdminEpisodeResource::collection($episodes),
            ],
        ]);
    }
}
