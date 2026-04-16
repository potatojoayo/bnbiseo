---
name: 랜딩페이지 구조
description: BnBiseo 랜딩페이지의 섹션 구성, 컴포넌트 분리, CSS 변수, 폰트 적용 방식
type: project
---

## 라우트 및 컴포넌트

- `src/app/page.tsx` → `LandingPage` 컴포넌트 렌더링
- `src/app/components/landing-page.tsx` — 메인 랜딩 컴포넌트 (use client)
- `src/app/components/chat-demo.tsx` — 호스트 수리 접수 챗 데모 (IntersectionObserver로 뷰포트 진입 시 애니메이션 시작, threshold 0.3)
- `src/app/components/guest-demo.tsx` — 게스트 QR 가이드 정적 UI

## 섹션 구조 및 ID

- `nav` — sticky top-0 z-50, 로고 '비앤비서' + '무료 등록' 버튼
- `section` (Hero) — id 없음, 첫 번째 section
- marquee div — react-fast-marquee, .rfm-marquee-container, .rfm-marquee
- `section#prob` — Problem 섹션, 카드 3장
- `section#sol` — Solution 섹션, 스텝 카드 3장 + 챗 데모 그리드
- `section#compare` — Before/After 비교표
- `section#cta` — CTA 섹션
- `footer` — 저작권 + 링크(이용약관, 개인정보처리방침, 문의하기)

## 폰트 시스템

- `--font-display` CSS 변수 = SB Aggro (layout.tsx localFont, `src/public/fonts/SBAggroOTF-*.otf`)
- `--font-body` CSS 변수 = Paperlogy (layout.tsx localFont, `src/public/fonts/Paperlogy-*.ttf`)
- Tailwind v4: `.font-heading` → `font-family: var(--font-heading)` → `var(--font-display)`
- Tailwind v4: `.font-text` → `font-family: var(--font-text)` → `var(--font-body)`
- body 요소는 Tailwind base에서 ui-sans-serif (시스템 폰트) 적용, `.font-text` 클래스 요소에서 Paperlogy 확인해야 함

## ChatDemo 동작 방식

- IntersectionObserver threshold 0.3으로 뷰포트 30% 진입 시 started=true
- 메시지 6개 순차 표시: step 0→1 (600ms delay 후 typing, 1600ms 후 메시지), step 1+ (800ms delay, 2400ms 후)
- 전체 대화 완료까지 약 15~18초 소요
- 마지막 메시지 텍스트: "4/4(금) 오전 10~12시 예약 완료 ✓\nSI-L60R1 호환 전구를 가지고 방문합니다."

**Why:** 테스트 작성 시 IntersectionObserver가 headless 브라우저에서 scrollIntoView로 충분히 트리거되는지 확인 필요
**How to apply:** ChatDemo 테스트 시 scrollIntoView({ block: "center" }) 사용, 충분한 timeout 확보 (전체: 25s)
