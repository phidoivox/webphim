<?php

namespace App\Enums;

enum MovieType: string
{
    case Single = 'single';
    case Series = 'series';
    case TvShow = 'tv-show';

    public function label(): string
    {
        return match ($this) {
            self::Single => 'Phim Lẻ',
            self::Series => 'Phim Bộ',
            self::TvShow => 'TV Show',
        };
    }
}
