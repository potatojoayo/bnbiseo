import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  });
  const page = await context.newPage();

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  // Do NOT wait for networkidle — capture the initial render state quickly
  await page.waitForTimeout(300);

  // Screenshot immediately on load (no scroll)
  await page.screenshot({ path: 'tests/screenshots/debug-initial.png', fullPage: false });
  console.log('Initial screenshot taken');

  // Check AnimatedSection initial states
  const initial = await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div'));
    return divs
      .filter((d) => d.className.includes('opacity-0') || d.className.includes('translate-y-8'))
      .map((d) => ({
        classes: d.className.substring(0, 200),
        opacity: window.getComputedStyle(d).opacity,
        display: window.getComputedStyle(d).display,
      }));
  });
  console.log(`\nElements with opacity-0 or translate-y-8 on initial load: ${initial.length}`);
  initial.slice(0, 5).forEach((el, i) => {
    console.log(`[${i}] computed opacity=${el.opacity} classes=${el.classes.substring(0, 100)}`);
  });

  // Now check: does IntersectionObserver trigger with rootMargin '0px 0px 200px 0px' for sections below fold?
  // The Problem section should be in range if rootMargin is 200px below viewport
  const sectionInfo = await page.evaluate(() => {
    // Find all AnimatedSection wrappers (they have the transition-all class pattern)
    const allDivs = Array.from(document.querySelectorAll('div[class*="transition-all duration-[900ms]"]'));
    return allDivs.map((el, i) => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return {
        index: i,
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        height: Math.round(rect.height),
        opacity: style.opacity,
        hasOpacity0: el.className.includes('opacity-0'),
        hasOpacity100: el.className.includes('opacity-100'),
      };
    });
  });

  console.log('\nAnimatedSection positions on initial load (viewport height: 844px):');
  sectionInfo.forEach((s) => {
    const inViewportWithMargin = s.top < (844 + 200); // rootMargin 200px below
    console.log(`[${s.index}] top=${s.top}px bottom=${s.bottom}px h=${s.height}px opacity=${s.opacity} opacity-0:${s.hasOpacity0} opacity-100:${s.hasOpacity100} inRange:${inViewportWithMargin}`);
  });

  // Check if sections that should be visible are still opacity-0 after 2s
  await page.waitForTimeout(2000);
  const afterWait = await page.evaluate(() => {
    const allDivs = Array.from(document.querySelectorAll('div[class*="transition-all duration-[900ms]"]'));
    return allDivs.map((el, i) => ({
      index: i,
      opacity: window.getComputedStyle(el).opacity,
      hasOpacity0: el.className.includes('opacity-0'),
    }));
  });
  console.log('\nAfter 2s (no scroll) — AnimatedSection states:');
  afterWait.forEach((s) => {
    if (s.hasOpacity0) {
      console.log(`[${s.index}] STILL INVISIBLE: opacity=${s.opacity}`);
    }
  });
  console.log(`Still opacity-0: ${afterWait.filter(s => s.hasOpacity0).length}/${afterWait.length}`);

  await page.screenshot({ path: 'tests/screenshots/debug-after-2s.png', fullPage: false });

  await browser.close();
  console.log('\nDone.');
})();
