---
name: Design Tokens & Visual Language
description: BnBiseo 프로젝트의 색상, 타이포그래피, 스페이싱, 컴포넌트 스타일 기준
type: project
---

## 색상 팔레트

| 역할 | 값 | 용도 |
|---|---|---|
| 배경 | `#F6F4F0` | body 배경, 우측 폼 패널 배경 |
| 기본 텍스트 | `#1a1a1a` | 제목, 강조, 다크 버튼 배경 |
| 포인트 레드 | `#D4421E` | CTA hover, 에러, 링크, 뱃지 |
| 서브텍스트 1 | `#8a8a82` | 본문 설명, placeholder 설명 |
| 서브텍스트 2 | `#6b6b63` | footer, 하위 정보 |
| 보더 | `#d5d2cc` | 인풋 기본 보더, 구분선 |
| 인풋 배경 | `#FDFCFA` | 폼 필드 배경 |
| 다크 패널 | `#1a1a1a` | 브랜드 사이드 패널 배경 |
| 다크 패널 텍스트 | `#d5d2cc` | 다크 배경 위 본문 |
| 다크 패널 서브 | `#8a8a82` | 다크 배경 위 설명 |
| 에러 배경 | `#FEE2E2` | 글로벌 에러 메시지 배경 |
| 에러 텍스트 | `#991B1B` | 에러 메시지 텍스트 |

## 타이포그래피

- **헤딩**: `font-family: var(--font-display)` / Tailwind: `font-heading` (SB Aggro)
- **본문**: `font-family: var(--font-body)` / Tailwind: `font-text` (Paperlogy)
- 섹션 제목: `text-[clamp(28px,4vw,44px)] font-medium leading-tight tracking-tight`
- 페이지 제목: `text-2xl font-bold tracking-tight` (font-display)
- 설명: `text-sm leading-relaxed` (font-body, color: #8a8a82)

## 버튼 스타일

- **Primary (다크)**: `bg-[#1a1a1a] text-white rounded-xl py-3.5` hover → `bg-[#D4421E]`
- **Primary (랜딩 CTA)**: `bg-[#1a1a1a] text-[#F6F4F0] rounded-full px-9 py-4` hover → `bg-[#D4421E]`
- 전환: `transition-all duration-200`
- disabled: `opacity-60 cursor-not-allowed`

## 인풋 필드 스타일

- border-radius: `rounded-xl`
- 기본 보더: `#d5d2cc`
- focus 보더: `#1a1a1a`
- focus ring: `0 0 0 3px rgba(26,26,26,0.08)`
- 에러 보더: `#D4421E`
- 에러 ring: `0 0 0 3px rgba(212,66,30,0.12)`
- 배경: `#FDFCFA`
- padding: `px-4 py-3`

## 스페이싱 & 레이아웃

- 섹션 max-width: `max-w-5xl mx-auto px-12 max-md:px-6`
- 폼 max-width: `max-w-[400px]`
- 카드 간격: `gap-4` (폼 필드), `gap-1.5` (label-input)

## Auth 레이아웃

- 2-컬럼: 왼쪽 브랜드 패널(dark, 480px~520px) + 오른쪽 폼 패널(#F6F4F0)
- 모바일: 폼 패널만 단일 컬럼, 상단에 로고 표시
- 브랜드 패널 내부: 로고 → 가치 제안 → proof points → footer tagline (justify-between)
