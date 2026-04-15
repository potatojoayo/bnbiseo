import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const alt = '비앤비서 — 에어비앤비 전문 청소·시설관리 서비스'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OgImage() {
  const fontData = await readFile(
    join(process.cwd(), 'public/fonts/SBAggroOTF-Medium.otf')
  )
  const fontDataBold = await readFile(
    join(process.cwd(), 'public/fonts/SBAggroOTF-Bold.otf')
  )
  const bodyFontData = await readFile(
    join(process.cwd(), 'public/fonts/Paperlogy-4Regular.ttf')
  )
  const bodyFontDataBold = await readFile(
    join(process.cwd(), 'public/fonts/Paperlogy-7Bold.ttf')
  )
  const bodyFontDataSemiBold = await readFile(
    join(process.cwd(), 'public/fonts/Paperlogy-6SemiBold.ttf')
  )

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          backgroundColor: '#0F0F14',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background subtle dot grid via repeating gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(circle at 20% 50%, rgba(255,56,92,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,56,92,0.05) 0%, transparent 40%)',
            display: 'flex',
          }}
        />

        {/* ── LEFT CONTENT PANEL ── */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '64px 56px 64px 72px',
            position: 'relative',
          }}
        >
          {/* Urgency badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 36,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#FF385C',
                padding: '8px 18px',
                borderRadius: 100,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 100,
                  backgroundColor: '#FFFFFF',
                  marginRight: 10,
                  display: 'flex',
                }}
              />
              <span
                style={{
                  fontFamily: 'Paperlogy',
                  fontWeight: 700,
                  fontSize: 18,
                  color: '#FFFFFF',
                  letterSpacing: '0.02em',
                  display: 'flex',
                }}
              >
                에어비앤비 호스트 필수
              </span>
            </div>
          </div>

          {/* Main catchphrase */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginBottom: 32,
            }}
          >
            <span
              style={{
                fontFamily: 'SBAggro',
                fontWeight: 500,
                fontSize: 52,
                color: '#FFFFFF',
                lineHeight: 1.25,
                display: 'flex',
              }}
            >
              체크인 3시간 전,
            </span>
            <span
              style={{
                fontFamily: 'SBAggro',
                fontWeight: 700,
                fontSize: 58,
                color: '#FF385C',
                lineHeight: 1.2,
                display: 'flex',
              }}
            >
              이모님이 안 와요
            </span>
          </div>

          {/* Sub copy */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginBottom: 48,
            }}
          >
            <span
              style={{
                fontFamily: 'Paperlogy',
                fontWeight: 400,
                fontSize: 22,
                color: 'rgba(255,255,255,0.65)',
                lineHeight: 1.6,
                display: 'flex',
              }}
            >
              급하게 사람 찾지 마세요.
            </span>
            <span
              style={{
                fontFamily: 'Paperlogy',
                fontWeight: 600,
                fontSize: 22,
                color: 'rgba(255,255,255,0.85)',
                lineHeight: 1.6,
                display: 'flex',
              }}
            >
              비앤비서가 전문 매니저를 바로 보내드려요.
            </span>
          </div>

          {/* Service pills */}
          <div style={{ display: 'flex', flexDirection: 'row', gap: 12 }}>
            {[
              { icon: '✓', label: '전문 청소' },
              { icon: '✓', label: '15개 항목 점검' },
              { icon: '✓', label: '당일 매칭' },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  padding: '10px 18px',
                  borderRadius: 100,
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontFamily: 'Paperlogy',
                    fontWeight: 700,
                    fontSize: 16,
                    color: '#FF385C',
                    display: 'flex',
                  }}
                >
                  {item.icon}
                </span>
                <span
                  style={{
                    fontFamily: 'Paperlogy',
                    fontWeight: 600,
                    fontSize: 17,
                    color: 'rgba(255,255,255,0.8)',
                    display: 'flex',
                  }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT BRAND PANEL ── */}
        <div
          style={{
            width: 340,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            backgroundColor: '#FF385C',
            padding: '48px 40px',
          }}
        >
          {/* Decorative top arc */}
          <div
            style={{
              position: 'absolute',
              top: -80,
              right: -80,
              width: 280,
              height: 280,
              borderRadius: 140,
              backgroundColor: 'rgba(255,255,255,0.08)',
              display: 'flex',
            }}
          />
          {/* Decorative bottom arc */}
          <div
            style={{
              position: 'absolute',
              bottom: -60,
              left: -60,
              width: 200,
              height: 200,
              borderRadius: 100,
              backgroundColor: 'rgba(255,255,255,0.06)',
              display: 'flex',
            }}
          />

          {/* Logo mark — house icon approximation */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 24,
              backgroundColor: 'rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 28,
            }}
          >
            <div
              style={{
                fontFamily: 'SBAggro',
                fontWeight: 700,
                fontSize: 40,
                color: '#FFFFFF',
                display: 'flex',
                lineHeight: 1,
              }}
            >
              B
            </div>
          </div>

          {/* Brand name */}
          <div
            style={{
              fontFamily: 'SBAggro',
              fontWeight: 700,
              fontSize: 52,
              color: '#FFFFFF',
              letterSpacing: '-0.01em',
              display: 'flex',
              marginBottom: 12,
            }}
          >
            비앤비서
          </div>

          {/* Brand sub */}
          <div
            style={{
              fontFamily: 'Paperlogy',
              fontWeight: 400,
              fontSize: 17,
              color: 'rgba(255,255,255,0.75)',
              display: 'flex',
              textAlign: 'center',
              lineHeight: 1.5,
              marginBottom: 40,
            }}
          >
            청소·시설관리 전문 서비스
          </div>

          {/* Divider */}
          <div
            style={{
              width: 48,
              height: 2,
              backgroundColor: 'rgba(255,255,255,0.3)',
              borderRadius: 2,
              display: 'flex',
              marginBottom: 32,
            }}
          />

          {/* Domain */}
          <div
            style={{
              fontFamily: 'Paperlogy',
              fontWeight: 600,
              fontSize: 18,
              color: 'rgba(255,255,255,0.9)',
              display: 'flex',
              letterSpacing: '0.04em',
            }}
          >
            bnbiseo.com
          </div>

          {/* Star rating mock */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginTop: 36,
              backgroundColor: 'rgba(255,255,255,0.12)',
              borderRadius: 16,
              padding: '16px 24px',
            }}
          >
            <div
              style={{
                fontFamily: 'Paperlogy',
                fontWeight: 700,
                fontSize: 28,
                color: '#FFFFFF',
                display: 'flex',
                lineHeight: 1,
              }}
            >
              4.9 ★
            </div>
            <div
              style={{
                fontFamily: 'Paperlogy',
                fontWeight: 400,
                fontSize: 14,
                color: 'rgba(255,255,255,0.7)',
                display: 'flex',
                marginTop: 6,
              }}
            >
              호스트 평균 만족도
            </div>
          </div>
        </div>

        {/* Bottom separator line on left */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: 860,
            height: 4,
            backgroundImage: 'linear-gradient(to right, #FF385C, transparent)',
            display: 'flex',
          }}
        />
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'SBAggro',
          data: fontData,
          weight: 500,
          style: 'normal',
        },
        {
          name: 'SBAggro',
          data: fontDataBold,
          weight: 700,
          style: 'normal',
        },
        {
          name: 'Paperlogy',
          data: bodyFontData,
          weight: 400,
          style: 'normal',
        },
        {
          name: 'Paperlogy',
          data: bodyFontDataBold,
          weight: 700,
          style: 'normal',
        },
        {
          name: 'Paperlogy',
          data: bodyFontDataSemiBold,
          weight: 600,
          style: 'normal',
        },
      ],
    },
  )
}
