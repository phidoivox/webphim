import { ImageResponse } from 'next/og';

export const alt = 'WebPhim - Xem Phim Chuẩn HD & 4K Miễn Phí';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#090d16',
          backgroundImage:
            'radial-gradient(circle at 25% 25%, rgba(229, 9, 20, 0.25) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.2) 0%, transparent 50%)',
          position: 'relative',
          padding: '48px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top bar with logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#e50914',
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '36px',
              padding: '8px 20px',
              borderRadius: '12px',
              letterSpacing: '1px',
              boxShadow: '0 8px 24px rgba(229, 9, 20, 0.4)',
            }}
          >
            WEBPHIM
          </div>
          <div
            style={{
              color: '#94a3b8',
              fontSize: '24px',
              fontWeight: 500,
            }}
          >
            • Streaming Platform
          </div>
        </div>

        {/* Main headline */}
        <div
          style={{
            fontSize: '56px',
            fontWeight: 800,
            color: '#ffffff',
            textAlign: 'center',
            lineHeight: 1.2,
            maxWidth: '1000px',
            marginBottom: '20px',
            textShadow: '0 4px 20px rgba(0,0,0,0.6)',
          }}
        >
          Xem Phim Online Chất Lượng Cao
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '26px',
            color: '#cbd5e1',
            textAlign: 'center',
            maxWidth: '800px',
            marginBottom: '40px',
          }}
        >
          Hàng ngàn bộ phim bom tấn, phim bộ, anime vietsub & thuyết minh cập nhật liên tục 24/7
        </div>

        {/* Feature badges */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
          }}
        >
          {['4K Ultra HD', 'Vietsub Siêu Nhanh', 'Không Quảng Cáo Lạ', 'Hoàn Toàn Miễn Phí'].map(
            (badge) => (
              <div
                key={badge}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '9999px',
                  padding: '10px 24px',
                  color: '#f8fafc',
                  fontSize: '20px',
                  fontWeight: 600,
                }}
              >
                {badge}
              </div>
            )
          )}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
