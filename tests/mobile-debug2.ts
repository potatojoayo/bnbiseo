import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  });
  const page = await context.newPage();

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // Use instant scroll to avoid smooth-scroll artifacts
  await page.evaluate(() => window.scrollTo({ top: 1200, behavior: 'instant' }));
  await page.waitForTimeout(500);

  const states1 = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll('div[class*="duration-[900ms]"]'));
    return sections.map((el, i) => {
      const rect = el.getBoundingClientRect();
      return {
        i,
        hidden: el.className.includes('opacity-0'),
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        computedOpacity: window.getComputedStyle(el).opacity,
      };
    });
  });
  console.log('After instant scroll to 1200px:');
  states1.forEach((s) => console.log(`  [${s.i}] hidden=${s.hidden} top=${s.top} opacity=${s.computedOpacity}`));

  await page.screenshot({ path: 'tests/screenshots/instant-1200.png', fullPage: false });

  // Scroll to 500 — problem section should be well in view
  await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'instant' }));
  await page.waitForTimeout(500);

  const states2 = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll('div[class*="duration-[900ms]"]'));
    return sections.map((el, i) => ({
      i,
      hidden: el.className.includes('opacity-0'),
      top: Math.round(el.getBoundingClientRect().top),
      computedOpacity: window.getComputedStyle(el).opacity,
    }));
  });
  console.log('\nAfter instant scroll to 500px:');
  states2.forEach((s) => console.log(`  [${s.i}] hidden=${s.hidden} top=${s.top} opacity=${s.computedOpacity}`));
  await page.screenshot({ path: 'tests/screenshots/instant-500.png', fullPage: false });

  // Check: does the problem section (index 0) reveal at scroll 500?
  // At scroll=500, problem section top should be 557-500=57px (within viewport)
  // Does solution section (index 1) top = 1465-500=965px — within rootMargin 844+200=1044? Yes!
  // So [1] SHOULD have triggered

  // Scroll to 1000
  await page.evaluate(() => window.scrollTo({ top: 1000, behavior: 'instant' }));
  await page.waitForTimeout(500);
  const states3 = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll('div[class*="duration-[900ms]"]'));
    return sections.map((el, i) => ({
      i,
      hidden: el.className.includes('opacity-0'),
      top: Math.round(el.getBoundingClientRect().top),
    }));
  });
  console.log('\nAfter instant scroll to 1000px:');
  states3.forEach((s) => console.log(`  [${s.i}] hidden=${s.hidden} top=${s.top}`));
  await page.screenshot({ path: 'tests/screenshots/instant-1000.png', fullPage: false });

  await browser.close();
  console.log('\nDone.');
})();
