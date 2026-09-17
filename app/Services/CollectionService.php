<?php

namespace App\Services;

use App\Models\Collection;
use App\Models\Movie;
use App\Models\User;
use Illuminate\Support\Str;

class CollectionService
{
    /**
     * Danh sách bộ sưu tập của user (kèm movies_count + phim tóm tắt).
     *
     * @return \Illuminate\Database\Eloquent\Collection<int, Collection>
     */
    public function getUserCollections(User $user)
    {
        return Collection::query()
            ->where('created_by', $user->id)
            ->with(['movies' => fn ($q) => $q->with('genres')->limit(10)])
            ->withCount('movies')
            ->orderByDesc('updated_at')
            ->get();
    }

    /**
     * Tạo bộ sưu tập mới với slug duy nhất.
     */
    public function createCollection(User $user, array $data): Collection
    {
        $slug = $this->uniqueSlug((string) $data['name']);

        return Collection::create([
            'name' => $data['name'],
            'slug' => $slug,
            'description' => $data['description'] ?? null,
            'is_public' => (bool) ($data['is_public'] ?? true),
            'created_by' => $user->id,
        ]);
    }

    /**
     * Cập nhật bộ sưu tập (đổi slug nếu đổi tên).
     */
    public function updateCollection(Collection $collection, array $data): Collection
    {
        if (isset($data['name']) && $data['name'] !== $collection->name) {
            $collection->slug = $this->uniqueSlug($data['name'], $collection->id);
        }

        $collection->fill($data);
        $collection->save();

        return $collection->refresh();
    }

    /**
     * Thêm phim vào bộ sưu tập, tránh trùng lặp.
     */
    public function addMovie(Collection $collection, int $movieId): Collection
    {
        $movie = Movie::findOrFail($movieId);

        $collection->movies()->syncWithoutDetaching([$movie->id]);

        // Tự động lấy poster phim đầu tiên làm ảnh bìa nếu chưa có
        if (! $collection->thumb_url && $movie->poster_url) {
            $collection->thumb_url = $movie->poster_url;
            $collection->save();
        }

        return $collection->load(['movies.genres'])->loadCount('movies');
    }

    /**
     * Gỡ phim khỏi bộ sưu tập.
     */
    public function removeMovie(Collection $collection, int $movieId): int
    {
        return $collection->movies()->detach($movieId);
    }

    protected function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name) ?: 'bo-suu-tap';
        $slug = $base;

        while (
            Collection::where('slug', $slug)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = $base.'-'.Str::lower(Str::random(6));
        }

        return $slug;
    }
}
