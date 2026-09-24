<?php

namespace App\Enums;

enum MovieStatus: string
{
    case Ongoing = 'ongoing';
    case Completed = 'completed';
    case Trailer = 'trailer';

    public function label(): string
    {
        return match ($this) {
            self::Ongoing => 'Đang chiếu',
            self::Completed => 'Hoàn thành',
            self::Trailer => 'Sắp chiếu',
        };
    }
}
