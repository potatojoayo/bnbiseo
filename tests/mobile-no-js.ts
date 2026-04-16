import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });

  // Test 1: With JavaScript disabled (simulates initial paint before hydration)
  const contextNoJS = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    javaScriptEnabled: false,
  });
  const pageNoJS = await contextNoJS.newPage();
  await pageNoJS.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await pageNoJS.waitForTimeout(500);
  await pageNoJS.screenshot({ path: 'tests/screenshots/no-js-hero.png', fullPage: false });

  // Scroll down
  await pageNoJS.evaluate(() => window.scrollTo({ top: 900, behavior: 'instant' }));
  await pageNoJS.waitForTimeout(300);
  await pageNoJS.screenshot({ path: 'tests/screenshots/no-js-scroll.png', fullPage: false });

  console.log('No-JS screenshots taken');

  // Check what sections look like without JS
  const noJSSections = await pageNoJS.evaluate(() => {
    const sections = Array.from(document.querySelectorAll('section, div[id]'));
    return sections.map((el) => ({
      tag: el.tagName,
      id: el.id,
      text: el.textContent?.substring(0, 50),
      computedOpacity: window.getComputedStyle(el).opacity,
    }));
  });
  console.log('\nSections without JS:');
  noJSSections.slice(0, 10).forEach((s) => console.log(`  ${s.tag}#${s.id}: opacity=${s.computedOpacity} "${s.text?.trim().substring(0, 40)}"`));

  await contextNoJS.close();

  // Test 2: With JS but very slow (simulate what the user might be seeing)
  // Check if there is a timing issue on first paint
  const contextSlow = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  });

  // Intercept JS to add artificial delay
  const pageSlow = await contextSlow.newPage();

  // Take screenshot at 100ms (before hydration completes on slow device)
  const loadPromise = pageSlow.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await pageSlow.waitForTimeout(100);
  await pageSlow.screenshot({ path: 'tests/screenshots/early-100ms.png', fullPage: false });
  await pageSlow.waitForTimeout(400);
  await pageSlow.screenshot({ path: 'tests/screenshots/early-500ms.png', fullPage: false });
  await loadPromise;
  await pageSlow.waitForTimeout(200);
  await pageSlow.screenshot({ path: 'tests/screenshots/after-load.png', fullPage: false });

  // Scroll to problem section
  await pageSlow.evaluate(() => window.scrollTo({ top: 700, behavior: 'instant' }));
  await pageSlow.waitForTimeout(1000);
  await pageSlow.screenshot({ path: 'tests/screenshots/scroll-700.png', fullPage: false });

  await contextSlow.close();
  await browser.close();
  console.log('\nDone');
})();
