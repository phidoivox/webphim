<?php

namespace App\Enums;

enum ServerLangType: string
{
    case Vietsub = 'vietsub';
    case ThuyetMinh = 'thuyet-minh';
    case ThuyetMinhAlt = 'thuyetminh';
    case LongTieng = 'long-tieng';
    case LongTiengAlt = 'longtieng';
    case Engsub = 'engsub';
    case Raw = 'raw';

    public function label(): string
    {
        return match ($this) {
            self::Vietsub => 'Vietsub',
            self::ThuyetMinh, self::ThuyetMinhAlt => 'Thuyết minh',
            self::LongTieng, self::LongTiengAlt => 'Lồng tiếng',
            self::Engsub => 'Engsub',
            self::Raw => 'Raw',
        };
    }

    public static function fromString(?string $value): self
    {
        if (empty($value)) {
            return self::Vietsub;
        }

        $val = trim($value);
        $direct = self::tryFrom($val);
        if ($direct !== null) {
            return $direct;
        }

        $normalized = mb_strtolower($val);
        if (str_contains($normalized, 'thuyet-minh') || str_contains($normalized, 'thuyết minh') || str_contains($normalized, 'thuyet minh') || str_contains($normalized, 'thuyetminh')) {
            return self::ThuyetMinh;
        }
        if (str_contains($normalized, 'long-tieng') || str_contains($normalized, 'lồng tiếng') || str_contains($normalized, 'long tieng') || str_contains($normalized, 'longtieng')) {
            return self::LongTieng;
        }
        if (str_contains($normalized, 'engsub') || preg_match('/(^|[^a-z0-9])eng([^a-z0-9]|$)/u', $normalized)) {
            return self::Engsub;
        }
        if ($normalized === 'raw') {
            return self::Raw;
        }

        return self::Vietsub;
    }
}
