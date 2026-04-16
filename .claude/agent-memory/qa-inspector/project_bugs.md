---
name: 발견된 UI 버그
description: BnBiseo 랜딩페이지 QA 검수에서 발견된 버그 및 UX 이슈 목록 (2026-04-13 업데이트)
type: project
---

## 버그 #1 — 모바일에서 Footer 링크 접근 불가 [심각도: 낮음]

- **위치:** `src/app/components/landing-page.tsx` footer > div.flex.gap-5
- **현상:** `max-md:hidden` 클래스로 모바일(375px)에서 이용약관, 개인정보처리방침, 문의하기 링크가 완전히 숨겨짐
- **재현:** 모바일 뷰포트(375px)에서 footer 확인
- **기대 동작:** 모바일에서도 법적 고지 링크(이용약관, 개인정보처리방침)에 접근 가능해야 함
- **실제 동작:** 링크 DOM에는 존재하지만 invisible (isVisible=false)
- **수정 제안:** max-md:hidden 제거 후 flex-col 레이아웃으로 전환, 또는 모바일 전용 간소화 레이아웃 추가

**Why:** 이용약관/개인정보처리방침은 법적 의무 고지 항목으로 모든 환경에서 접근 가능해야 함
**How to apply:** 다음 Footer 수정 시 max-md:hidden 클래스 제거 및 모바일 레이아웃 추가 제안

## 버그 #2 — 모바일에서 모든 섹션이 비어보이는 현상 [심각도: 높음]

- **위치:** `src/app/components/animated-section.tsx`
- **현상:** 모바일(실기기)에서 Hero 섹션만 보이고 하위 모든 섹션(Problem, Solution 등)이 완전히 빈 흰 화면으로 보임
- **재현:** 실제 모바일 기기에서 localhost:3000 접속 또는 느린 JS 환경
- **근본 원인:** `AnimatedSection`은 서버에서 `opacity-0 translate-y-8` 상태로 렌더링됨. 클라이언트 React 하이드레이션이 완료되어야만 `IntersectionObserver`가 붙고 `opacity-100`으로 전환됨. 느린 모바일 기기에서 하이드레이션이 지연되면 페이지가 수 초간 (또는 더 길게) 빈 상태로 보임
- **확인 방법:** JS 비활성화 상태로 localhost:3000 접속 시 모든 AnimatedSection 섹션이 완전히 비어있음 (스크린샷 확인: `tests/screenshots/no-js-scroll.png`)
- **타임라인:** 100ms 시점에 Hero도 일부 비어있음, 500ms 시점에 정상화됨
- **수정 방향:**
  1. `AnimatedSection`의 initial state를 `visible: true`로 변경하고 `useEffect` 내에서만 scroll-reveal 로직 적용 (SSR-safe)
  2. 또는 SSR 시 `opacity-100`으로 렌더링하되, 첫 mount 시 `opacity-0`으로 설정 후 IntersectionObserver로 다시 reveal (flash of unstyled content 발생 가능)
  3. 권장: `initial state = visible` (no animation on first render above fold), scroll reveal은 below-fold 요소에만 적용

## 버그 #3 — Hero 섹션 텍스트 CSS 애니메이션 초기 상태 문제 [심각도: 중간]

- **위치:** `src/app/components/landing-page.tsx` Hero h1 spans
- **현상:** `animate-fade-in-d1/d2/d3` 클래스 (CSS animation with `both` fill mode + 0.3~0.7s delay)로 인해 Hero 텍스트도 초기 300~700ms 동안 invisible
- **CSS:** `animation-fill-mode: both` → 애니메이션 시작 전 `opacity: 0` 상태 유지
- **재현:** 페이지 로드 직후 100ms 스크린샷 (`tests/screenshots/early-100ms.png`)
- **수정 제안:** 애니메이션 delay를 0으로 줄이거나, `animation-fill-mode: forwards` (backwards 제거)로 변경하여 초기 상태는 즉시 표시

## 미확인 UX 개선 사항

1. CTA 버튼 클릭 시 동작 없음 (현재 onClick 없음, 향후 폼/모달 연결 필요)
2. Nav의 '무료 등록' 버튼 클릭 시 동작 없음
3. Footer 링크들이 모두 `href="#"` — 실제 페이지 미연결
4. ChatDemo 재생 완료 후 반복 재생 없음 (한 번만 재생)
5. `PropertyCardDemo`, `CleaningRequestDemo`, `ChecklistDemo` — `threshold: 0.3`으로 30% 이상 뷰포트 진입 필요. 모바일에서 카드 높이 420px 고정이라 진입 조건 충족이 늦을 수 있음
