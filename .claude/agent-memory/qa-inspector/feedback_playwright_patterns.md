---
name: Playwright 테스트 패턴
description: BnBiseo 프로젝트에서 확인된 Playwright 주의사항, 올바른 API 사용법, 모바일 에뮬레이션 설정
type: feedback
---

## 규칙 1: toBeLessThanOrEqualTo 사용 금지

Playwright의 `expect()`는 Jest/Vitest matcher가 아님. `toBeLessThanOrEqualTo`는 존재하지 않음.

**Why:** Playwright 1.59.1에서 해당 메서드 없음. 숫자 비교는 일반 JS 또는 `toBeLessThan(n+1)` 사용.
**How to apply:** 숫자 비교는 `expect(val).toBeLessThan(n+1)` 또는 `expect(val < n).toBe(true)` 사용.

## 규칙 2: 중복 텍스트 locator는 strict mode 위반 주의

마키(react-fast-marquee)가 텍스트를 autoFill로 중복 복사함. `text=게스트 QR 가이드`로 찾으면 마키 안 텍스트 + 섹션 레이블이 동시에 걸림.

**Why:** react-fast-marquee autoFill=true이면 DOM에 같은 텍스트가 여러 개 생성됨. strict mode 위반.
**How to apply:** 섹션 내 특정 텍스트는 `page.locator("#sol").getByText("텍스트", { exact: true })` 또는 `.first()` 사용.

## 규칙 3: 모바일 프로젝트는 Chromium으로 에뮬레이션

iPhone 12 디바이스 프리셋은 WebKit 엔진을 사용함. WebKit은 별도 설치(`npx playwright install webkit`) 필요.

**Why:** 프로젝트에 `npx playwright install chromium`만 실행됨. Pixel 5 프리셋 + 커스텀 viewport로 대체.
**How to apply:** playwright.config.ts mobile 프로젝트에서 `...devices["Pixel 5"]` + `viewport: { width: 375, height: 812 }` 조합 사용.

## 규칙 4: IntersectionObserver 기반 애니메이션 테스트

headless 브라우저에서 scrollIntoViewIfNeeded()가 threshold를 충족시키지 못할 수 있음.

**Why:** ChatDemo의 threshold 0.3이 있어 요소가 30% 이상 뷰포트에 들어와야 함. scrollIntoViewIfNeeded가 불충분한 경우가 있음.
**How to apply:** `page.evaluate(() => el.scrollIntoView({ behavior: "instant", block: "center" }))` 후 `waitForTimeout(500)` 사용.

## 규칙 5: @playwright/test 패키지 별도 설치 필요

`npx playwright`만 글로벌로 있어도 프로젝트 내 playwright.config.ts가 `@playwright/test` 로컬 패키지를 참조함.

**Why:** config 파일이 `import { defineConfig } from "@playwright/test"` 방식으로 임포트함.
**How to apply:** 새 프로젝트에서는 항상 `bun add -D @playwright/test && npx playwright install chromium` 실행.
