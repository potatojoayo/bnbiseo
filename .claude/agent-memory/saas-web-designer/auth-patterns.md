---
name: Auth Page Patterns
description: BnBiseo 인증 페이지(signup, login) 레이아웃 및 컴포넌트 패턴
type: project
---

## Auth Layout (`src/app/(auth)/layout.tsx`)

2-컬럼 레이아웃 채택:
- **왼쪽 브랜드 패널** (`lg:w-[480px] xl:w-[520px]`, `bg-[#1a1a1a]`): 로고, 가치 제안 카피, proof points 3개, footer tagline — `lg:` 이상에서만 표시
- **오른쪽 폼 패널** (`flex-1`, `bg-[#F6F4F0]`): 실제 페이지 content 렌더
- 모바일에서는 폼 패널 내부 상단에 로고 별도 표시

## Auth Form 공통 패턴 (signup + login 동일하게 적용)

- `Field` 컴포넌트로 label + input + error 묶음 추상화 (재사용 가능)
- focus/blur는 onFocus/onBlur 핸들러로 inline style 조작 (CSS-in-JS 없이)
- 글로벌 에러: `role="alert"` + SVG 경고 아이콘 포함 (`#FEE2E2` bg, `#991B1B` text)
- 필드 에러: `aria-invalid`, `aria-describedby` 접근성 속성 포함 + 에러 시 red ring
- SubmitButton: pending 시 spinner(`animate-spin`) + 진행 텍스트 변경
- `<form noValidate>` — 브라우저 기본 validation 비활성화, 서버 액션 validation 사용

## Page Heading 패턴 (signup, login 공통)

- `text-2xl font-bold tracking-tight mb-2`, `var(--font-display)`, `color: #1a1a1a`
- 서브텍스트: `text-sm leading-relaxed`, `color: #8a8a82`, `var(--font-body)`
- `div.mb-8`로 heading 블록 감쌈 — 폼과 여백 분리
- 하단 리다이렉트 링크: `mt-7 text-sm text-center`, `color: #8a8a82`, 링크는 `font-semibold`, `color: #D4421E`

## 디자인 결정 근거

- 브랜드 패널: 인증 흐름에서 서비스 신뢰감과 가치 제안을 동시에 전달. 빈 공간 대신 서비스 USP 배치.
- 버튼 컬러: 기본 `#1a1a1a` (신뢰감) → hover `#D4421E` (에너지). 랜딩 CTA와 동일 패턴.
- 폼 max-width `400px`: 너무 넓으면 읽기 불편, 너무 좁으면 모바일에서 촉박. 인증 폼 표준 너비.
