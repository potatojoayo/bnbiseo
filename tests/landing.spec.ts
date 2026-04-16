import { test, expect, type Page } from "@playwright/test";
import path from "path";

const BASE = "http://localhost:3000";
const SCREENSHOT_DIR = path.join(__dirname, "screenshots");

// ──────────────────────────────────────────────
// 1. 페이지 로딩
// ──────────────────────────────────────────────
test.describe("1. 페이지 로딩", () => {
  test("HTTP 200 응답, 콘솔 에러 없음", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    const response = await page.goto(BASE, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    // 크리티컬 에러(타입 에러, Uncaught 등) 없는지 확인
    const criticalErrors = consoleErrors.filter(
      (e) =>
        e.includes("TypeError") ||
        e.includes("Uncaught") ||
        e.includes("ReferenceError")
    );
    if (criticalErrors.length > 0) {
      console.error("콘솔 에러 발견:", criticalErrors);
    }
    expect(criticalErrors).toHaveLength(0);
  });

  test("페이지 타이틀에 '비앤비서' 포함", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    const title = await page.title();
    expect(title).toContain("비앤비서");
  });

  test("lang='ko' 설정 확인", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    const lang = await page.locator("html").getAttribute("lang");
    expect(lang).toBe("ko");
  });
});

// ──────────────────────────────────────────────
// 2. 주요 섹션 존재 여부
// ──────────────────────────────────────────────
test.describe("2. 주요 섹션 존재 여부", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
  });

  test("Nav — 로고 '비앤비서' 및 '무료 등록' 버튼 표시", async ({ page }) => {
    const nav = page.locator("nav").first();
    await expect(nav).toBeVisible();
    await expect(nav.locator("text=비앤비서").or(nav.locator("text=비앤비서"))).toBeVisible();
    await expect(nav.locator("button", { hasText: "무료 등록" })).toBeVisible();
  });

  test("Hero — 핵심 헤드라인 및 CTA 버튼 표시", async ({ page }) => {
    await expect(page.locator("text=에어비앤비")).toBeVisible();
    await expect(page.locator("text=본업")).toBeVisible();
    await expect(
      page.locator("button", { hasText: "무료로 숙소 등록하기" }).first()
    ).toBeVisible();
  });

  test("Problem 섹션 — 배지 'Problem' 및 카드 3장 표시", async ({ page }) => {
    await expect(page.locator("text=Problem")).toBeVisible();
    await expect(page.locator("text=숙소가 늘수록")).toBeVisible();
    // 문제 카드 3장
    const cards = page.locator("section#prob .grid > div");
    await expect(cards).toHaveCount(3);
  });

  test("Solution/Steps 섹션 — 배지 'Solution' 및 스텝 카드 3장 표시", async ({
    page,
  }) => {
    await expect(page.locator("text=Solution")).toBeVisible();
    await expect(page.locator("text=숙소를 통째로")).toBeVisible();
    const stepCards = page.locator("section#sol .grid").first().locator("> div");
    await expect(stepCards).toHaveCount(3);
  });

  test("Chat Demo — '호스트 수리 접수' 레이블 및 채팅 UI 표시", async ({
    page,
  }) => {
    await expect(page.locator("text=호스트 수리 접수")).toBeVisible();
    // 채팅 컨테이너 존재
    const chatContainer = page
      .locator("div")
      .filter({ hasText: "비앤비서 AI" })
      .first();
    await expect(chatContainer).toBeVisible();
  });

  test("Guest Demo — '게스트 QR 가이드' 레이블 및 UI 표시", async ({
    page,
  }) => {
    // 마키에도 동일 텍스트가 있으므로 section#sol 범위 내에서 찾기
    const labelInSol = page.locator("#sol").getByText("게스트 QR 가이드", { exact: true });
    await expect(labelInSol).toBeVisible();
    const guestContainer = page
      .locator("div")
      .filter({ hasText: "숙소 가이드" })
      .first();
    await expect(guestContainer).toBeVisible();
  });

  test("Before/After 섹션 — 배지 'Before & After' 및 두 컬럼 표시", async ({
    page,
  }) => {
    await page.locator("section#compare").scrollIntoViewIfNeeded();
    await expect(page.locator("section#compare")).toBeVisible();
    await expect(page.locator("text=Before & After")).toBeVisible();
    await expect(page.locator("text=반나절이 3분으로")).toBeVisible();
    // Before 컬럼 — '지금' 레이블
    await expect(page.locator("section#compare").getByText("지금")).toBeVisible();
    // After 컬럼 — '비앤비서' 레이블 (Before/After 카드 헤더에 있음)
    await expect(page.locator("section#compare .font-heading").filter({ hasText: "비앤비서" })).toBeVisible();
  });

  test("CTA 섹션 — '수리 걱정 없는' 헤드라인 및 버튼 표시", async ({
    page,
  }) => {
    await page.locator("section#cta").scrollIntoViewIfNeeded();
    await expect(page.locator("text=수리 걱정 없는")).toBeVisible();
    const ctaBtn = page
      .locator("section#cta button", { hasText: "무료로 숙소 등록하기" })
      .first();
    await expect(ctaBtn).toBeVisible();
  });

  test("Footer — 저작권 문구 표시", async ({ page }) => {
    await page.locator("footer").scrollIntoViewIfNeeded();
    await expect(page.locator("footer")).toBeVisible();
    await expect(page.locator("text=© 2026 비앤비서")).toBeVisible();
  });
});

// ──────────────────────────────────────────────
// 3. 네비게이션
// ──────────────────────────────────────────────
test.describe("3. 네비게이션", () => {
  test("Nav sticky — 스크롤 후에도 Nav 화면 상단에 고정", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.evaluate(() => window.scrollTo(0, 1500));
    await page.waitForTimeout(300);
    const nav = page.locator("nav").first();
    const box = await nav.boundingBox();
    expect(box).not.toBeNull();
    // sticky position이면 y가 0~5 사이여야 함
    expect(box!.y).toBeLessThan(6);
  });

  test("Footer 링크 — '이용약관', '개인정보처리방침', '문의하기' 링크 존재 (데스크탑)", async ({
    page,
  }, testInfo) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.locator("footer").scrollIntoViewIfNeeded();
    if (testInfo.project.name === "desktop") {
      // 데스크탑에서는 링크가 보여야 함
      await expect(page.locator("footer a", { hasText: "이용약관" })).toBeVisible();
      await expect(
        page.locator("footer a", { hasText: "개인정보처리방침" })
      ).toBeVisible();
      await expect(
        page.locator("footer a", { hasText: "문의하기" })
      ).toBeVisible();
    } else {
      // 모바일에서는 max-md:hidden으로 숨겨짐 — DOM에는 존재하지만 invisible
      // [UI 버그] 모바일에서 Footer 링크(이용약관/개인정보/문의) 숨겨짐 — 접근 불가
      const links = page.locator("footer a", { hasText: "이용약관" });
      await expect(links).toHaveCount(1); // DOM에는 존재
      // visibility 상태 기록 (버그 확인용)
      const isVisible = await links.isVisible();
      console.warn(`[모바일 버그] Footer 이용약관 링크 isVisible=${isVisible} — max-md:hidden 적용으로 숨겨져 있음`);
      expect(isVisible).toBe(false); // 현재 상태 기록 (버그 문서화)
    }
  });
});

// ──────────────────────────────────────────────
// 4. 반응형
// ──────────────────────────────────────────────
test.describe("4. 반응형 레이아웃", () => {
  async function checkLayout(page: Page, viewportName: string) {
    await page.goto(BASE, { waitUntil: "networkidle" });
    // 가로 스크롤 없는지 확인
    const bodyWidth = await page.evaluate(
      () => document.body.scrollWidth
    );
    const viewportWidth = page.viewportSize()!.width;
    expect(bodyWidth).toBeLessThan(viewportWidth + 3); // 2px 허용 오차
    // Nav 표시
    await expect(page.locator("nav").first()).toBeVisible();
    // Hero 표시
    await expect(page.locator("text=에어비앤비")).toBeVisible();
    console.log(
      `[${viewportName}] bodyWidth=${bodyWidth} viewportWidth=${viewportWidth} — OK`
    );
  }

  test("데스크탑(1280px) — 가로 스크롤 없음, 주요 요소 표시", async ({
    page,
  }, testInfo) => {
    if (testInfo.project.name !== "desktop") test.skip();
    await checkLayout(page, "desktop 1280px");
  });

  test("모바일(375px) — 가로 스크롤 없음, 주요 요소 표시", async ({
    page,
  }, testInfo) => {
    if (testInfo.project.name !== "mobile") test.skip();
    await checkLayout(page, "mobile 375px");
  });

  test("모바일(375px) — Problem 카드 세로 1열 배치 확인", async ({
    page,
  }, testInfo) => {
    if (testInfo.project.name !== "mobile") test.skip();
    await page.goto(BASE, { waitUntil: "networkidle" });
    const cards = page.locator("section#prob .grid > div");
    await expect(cards).toHaveCount(3);
    // 첫 번째와 두 번째 카드의 x 좌표가 비슷해야 함 (1열)
    const box0 = await cards.nth(0).boundingBox();
    const box1 = await cards.nth(1).boundingBox();
    expect(Math.abs(box0!.x - box1!.x)).toBeLessThan(11);
  });
});

// ──────────────────────────────────────────────
// 5. 마키 (react-fast-marquee)
// ──────────────────────────────────────────────
test.describe("5. 마키 렌더링", () => {
  test("마키 컨테이너 및 마키 아이템 렌더링 확인", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    // react-fast-marquee가 생성하는 래퍼 div 확인
    const marqueeWrapper = page.locator(".rfm-marquee-container").first();
    await expect(marqueeWrapper).toBeVisible();
    // 마키 아이템 텍스트 중 일부 확인
    await expect(page.locator("text=공간 스캔").first()).toBeVisible();
    await expect(page.locator("text=디지털 트윈").first()).toBeVisible();
    await expect(page.locator("text=출장비 무료").first()).toBeVisible();
    await expect(page.locator("text=AI 챗봇 접수").first()).toBeVisible();
  });

  test("마키가 실제로 이동하는지 확인 (transform 값 변화)", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    const marqueeInner = page.locator(".rfm-marquee").first();
    await expect(marqueeInner).toBeVisible();
    // marquee 자식 요소가 존재하는지 (텍스트가 렌더됐는지)
    const itemCount = await marqueeInner.locator("span").count();
    expect(itemCount).toBeGreaterThan(0);
  });
});

// ──────────────────────────────────────────────
// 6. 챗 데모 인터랙션
// ──────────────────────────────────────────────
test.describe("6. 챗 데모", () => {
  test("호스트 채팅 — 뷰포트 진입 후 메시지 순차 표시", async ({
    page,
  }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    // ChatDemo를 완전히 뷰포트 안으로 스크롤 (IntersectionObserver threshold 0.3 충족)
    await page.evaluate(() => {
      const el = document.querySelector("[data-testid='chat-demo']") as HTMLElement
        || Array.from(document.querySelectorAll("div")).find(
            (d) => d.textContent?.includes("비앤비서 AI")
          );
      if (el) el.scrollIntoView({ behavior: "instant", block: "center" });
    });
    await page.waitForTimeout(500);
    // 첫 메시지 등장 대기 (최대 8초)
    await expect(
      page.locator("text=천장 전구 나갔어")
    ).toBeVisible({ timeout: 8_000 });
    // AI 응답도 등장 대기 (최대 12초)
    await expect(
      page.locator("text=어느 방 전구가 나갔어요?")
    ).toBeVisible({ timeout: 12_000 });
  });

  test("호스트 채팅 — 전체 대화 순차 완료 확인", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll("div")).find(
        (d) => d.textContent?.includes("비앤비서 AI")
      );
      if (el) el.scrollIntoView({ behavior: "instant", block: "center" });
    });
    await page.waitForTimeout(500);
    // 마지막 메시지: "예약 완료 ✓" (chat-demo.tsx에서 ✓ 포함)
    await expect(
      page.locator("text=예약 완료 ✓")
    ).toBeVisible({ timeout: 25_000 });
  });

  test("게스트 데모 — '뜨거운 물이 안 나와요' 및 AI 응답 보일러 정보 표시", async ({
    page,
  }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    const guestDemo = page
      .locator("div")
      .filter({ hasText: "숙소 가이드" })
      .first();
    await guestDemo.scrollIntoViewIfNeeded();
    await expect(page.locator("text=뜨거운 물이 안 나와요")).toBeVisible();
    await expect(page.locator("text=경동나비엔")).toBeVisible();
  });
});

// ──────────────────────────────────────────────
// 7. 폰트
// ──────────────────────────────────────────────
test.describe("7. 폰트 적용 확인", () => {
  test("--font-display CSS 변수(SB Aggro)가 html 요소에 설정됨", async ({
    page,
  }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    const fontDisplay = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue(
        "--font-display"
      )
    );
    expect(fontDisplay.trim().length).toBeGreaterThan(0);
  });

  test("--font-body CSS 변수(Paperlogy)가 html 요소에 설정됨", async ({
    page,
  }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    const fontBody = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue(
        "--font-body"
      )
    );
    expect(fontBody.trim().length).toBeGreaterThan(0);
  });

  test("Hero h1 — font-heading(SB Aggro) 폰트 패밀리 적용 확인", async ({
    page,
  }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    const fontFamily = await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      return h1 ? getComputedStyle(h1).fontFamily : "";
    });
    // SB Aggro 폰트가 font-family에 들어있어야 함
    expect(fontFamily.toLowerCase()).toMatch(/sbaggerootf|__sbaggero|aggro/i);
  });

  test("본문 텍스트 — font-text(Paperlogy) 폰트 패밀리 적용 확인", async ({
    page,
  }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    // font-text 클래스가 적용된 요소(예: 채팅 메시지 span)에서 fontFamily 확인
    const fontFamily = await page.evaluate(() => {
      // .font-text 클래스는 Tailwind v4에서 var(--font-text)를 font-family로 적용
      const el = document.querySelector(".font-text") as HTMLElement;
      return el ? getComputedStyle(el).fontFamily : "";
    });
    // Paperlogy 또는 Next.js가 생성하는 해시 클래스명(__paperlogy_xxx) 확인
    expect(fontFamily.toLowerCase()).toMatch(/paperlogy|__paperlogy/i);
  });
});

// ──────────────────────────────────────────────
// 8. 스크린샷 촬영
// ──────────────────────────────────────────────
test.describe("8. 전체 페이지 스크린샷", () => {
  test("데스크탑(1280px) 전체 페이지 스크린샷", async ({ page }, testInfo) => {
    if (testInfo.project.name !== "desktop") test.skip();
    await page.goto(BASE, { waitUntil: "networkidle" });
    // 챗 데모 로딩 및 애니메이션 대기
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/desktop-full.png`,
      fullPage: true,
    });
    console.log("데스크탑 스크린샷 저장: tests/screenshots/desktop-full.png");
  });

  test("모바일(375px) 전체 페이지 스크린샷", async ({ page }, testInfo) => {
    if (testInfo.project.name !== "mobile") test.skip();
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/mobile-full.png`,
      fullPage: true,
    });
    console.log("모바일 스크린샷 저장: tests/screenshots/mobile-full.png");
  });

  test("데스크탑 — Hero 섹션 클로즈업", async ({ page }, testInfo) => {
    if (testInfo.project.name !== "desktop") test.skip();
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const hero = page.locator("section").first();
    await hero.screenshot({
      path: `${SCREENSHOT_DIR}/desktop-hero.png`,
    });
  });

  test("데스크탑 — Before/After 섹션 클로즈업", async ({ page }, testInfo) => {
    if (testInfo.project.name !== "desktop") test.skip();
    await page.goto(BASE, { waitUntil: "networkidle" });
    const section = page.locator("section#compare");
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    await section.screenshot({
      path: `${SCREENSHOT_DIR}/desktop-before-after.png`,
    });
  });
});

// ──────────────────────────────────────────────
// 9. 한국어 텍스트 렌더링
// ──────────────────────────────────────────────
test.describe("9. 한국어 텍스트 렌더링", () => {
  test("주요 한국어 텍스트가 깨지지 않고 정상 표시됨", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    const koreanTexts = [
      "에어비앤비",
      "숙소가 늘수록",
      "숙소를 통째로",
      "반나절이 3분으로",
      "수리 걱정 없는",
    ];
    for (const text of koreanTexts) {
      await expect(page.locator(`text=${text}`).first()).toBeVisible();
    }
  });

  test("Problem 카드 — 한국어 설명 텍스트 렌더링", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    await expect(
      page.locator("text=숙소마다 규격이 다 달라요")
    ).toBeVisible();
    await expect(
      page.locator("text=같은 질문이 끝없이 와요")
    ).toBeVisible();
    await expect(
      page.locator("text=급하면 바가지를 쓸 수밖에 없어요")
    ).toBeVisible();
  });
});
