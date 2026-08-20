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
}
