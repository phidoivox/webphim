import { ImageResponse } from 'next/og';
import { getMovieDetail } from '@/lib/api';

export const alt = 'WebPhim - Xem Phim Online';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function Image({ params }: Props) {
  const { slug } = await params;

  let movie;
  try {
    movie = await getMovieDetail(slug);
  } catch {
    movie = {
      name: 'WebPhim Streaming',
      originName: 'Xem phim chuẩn HD & 4K miễn phí',
      posterUrl: '',
      thumbUrl: '',
      year: 2026,
      quality: '4K HD',
      ratingAvg: 9.0,
      genres: ['Hành Động', 'Phiêu Lưu'],
      lang: 'Vietsub',
    };
  }

  const posterSrc = movie.posterUrl || movie.thumbUrl || '';
  const genres = Array.isArray(movie.genres) ? movie.genres.slice(0, 4) : [];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#090d16',
          backgroundImage:
            'radial-gradient(circle at 80% 20%, rgba(229, 9, 20, 0.3) 0%, transparent 60%), radial-gradient(circle at 20% 80%, rgba(37, 99, 235, 0.25) 0%, transparent 60%)',
          padding: '48px 56px',
          fontFamily: 'sans-serif',
          position: 'relative',
          gap: '44px',
        }}
      >
        {/* Left: Poster */}
        {posterSrc ? (
          <img
            src={posterSrc}
            alt={movie.name}
            style={{
              width: '320px',
              height: '480px',
              borderRadius: '20px',
              objectFit: 'cover',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)',
              border: '2px solid rgba(255, 255, 255, 0.12)',
            }}
          />
        ) : (
          <div
            style={{
              width: '320px',
              height: '480px',
              borderRadius: '20px',
              backgroundColor: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              fontSize: '28px',
              fontWeight: 700,
            }}
          >
            WEBPHIM
          </div>
        )}

        {/* Right: Info */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {/* Header row: Logo & Quality */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                backgroundColor: '#e50914',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '20px',
                padding: '6px 14px',
                borderRadius: '8px',
                letterSpacing: '0.5px',
              }}
            >
              WEBPHIM
            </div>
            {movie.quality && (
              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#fca5a5',
                  fontWeight: 700,
                  fontSize: '18px',
                  padding: '6px 14px',
                  borderRadius: '8px',
                }}
              >
                {movie.quality}
              </div>
            )}
            {movie.year && (
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#e2e8f0',
                  fontWeight: 600,
                  fontSize: '18px',
                  padding: '6px 14px',
                  borderRadius: '8px',
                }}
              >
                {movie.year}
              </div>
            )}
            {movie.ratingAvg > 0 && (
              <div
                style={{
                  backgroundColor: 'rgba(234, 179, 8, 0.2)',
                  border: '1px solid rgba(234, 179, 8, 0.4)',
                  color: '#fde047',
                  fontWeight: 700,
                  fontSize: '18px',
                  padding: '6px 14px',
                  borderRadius: '8px',
                }}
              >
                ★ {Number(movie.ratingAvg).toFixed(1)}
              </div>
            )}
          </div>

          {/* Movie Title */}
          <div
            style={{
              fontSize: '44px',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.15,
              marginBottom: '10px',
              textShadow: '0 2px 10px rgba(0,0,0,0.5)',
            }}
          >
            {movie.name}
          </div>

          {/* Origin Name */}
          {movie.originName && (
            <div
              style={{
                fontSize: '24px',
                color: '#94a3b8',
                marginBottom: '24px',
              }}
            >
              {movie.originName}
            </div>
          )}

          {/* Genres */}
          {genres.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '28px',
                flexWrap: 'wrap',
              }}
            >
              {genres.map((g) => (
                <div
                  key={typeof g === 'string' ? g : (g as { name: string }).name}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#cbd5e1',
                    fontSize: '16px',
                    fontWeight: 600,
                    padding: '6px 16px',
                    borderRadius: '9999px',
                  }}
                >
                  {typeof g === 'string' ? g : (g as { name: string }).name}
                </div>
              ))}
            </div>
          )}

          {/* Tagline */}
          <div
            style={{
              fontSize: '20px',
              color: '#e2e8f0',
              fontWeight: 500,
            }}
          >
            Xem phim chất lượng cao Vietsub & Thuyết minh miễn phí
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
