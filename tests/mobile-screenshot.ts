import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone 14 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Screenshot 1: Hero section (top of page)
  await page.screenshot({ path: 'tests/screenshots/01-hero.png', fullPage: false });
  console.log('Screenshot 1: Hero (top)');

  // Scroll to 1 viewport height
  await page.evaluate(() => window.scrollTo({ top: window.innerHeight, behavior: 'instant' }));
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'tests/screenshots/02-after-hero.png', fullPage: false });
  console.log('Screenshot 2: After hero');

  // Scroll to 2 viewport heights
  await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 2, behavior: 'instant' }));
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'tests/screenshots/03-problem.png', fullPage: false });
  console.log('Screenshot 3: Problem section');

  // Scroll to 3 viewport heights
  await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 3, behavior: 'instant' }));
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'tests/screenshots/04-solution.png', fullPage: false });
  console.log('Screenshot 4: Solution section');

  // Scroll to 4 viewport heights
  await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 4, behavior: 'instant' }));
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'tests/screenshots/05-solution2.png', fullPage: false });
  console.log('Screenshot 5: Solution continued');

  // Scroll to 5 viewport heights
  await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 5, behavior: 'instant' }));
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'tests/screenshots/06-compare.png', fullPage: false });
  console.log('Screenshot 6: Before & After');

  // Scroll to 6 viewport heights
  await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 6, behavior: 'instant' }));
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'tests/screenshots/07-pricing.png', fullPage: false });
  console.log('Screenshot 7: Pricing');

  // Scroll to 7 viewport heights
  await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 7, behavior: 'instant' }));
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'tests/screenshots/08-usecases.png', fullPage: false });
  console.log('Screenshot 8: Use Cases');

  // Scroll to 8 viewport heights
  await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 8, behavior: 'instant' }));
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'tests/screenshots/09-openevent.png', fullPage: false });
  console.log('Screenshot 9: Open Event');

  // Scroll to bottom
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'tests/screenshots/10-cta-footer.png', fullPage: false });
  console.log('Screenshot 10: CTA & Footer');

  // Now check: inspect each AnimatedSection's computed opacity
  const sectionData = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll('div[class*="transition-all"]'));
    return sections.map((el, i) => {
      const style = window.getComputedStyle(el);
      const classNames = el.className;
      return {
        index: i,
        opacity: style.opacity,
        transform: style.transform,
        hasOpacity0: el.classList.contains('opacity-0'),
        hasOpacity100: el.classList.contains('opacity-100'),
        classSnippet: classNames.substring(0, 150),
      };
    });
  });
  console.log('\nAnimatedSection states (after scrolling to bottom):');
  sectionData.forEach((s) => {
    console.log(`[${s.index}] opacity=${s.opacity} opacity-0:${s.hasOpacity0} opacity-100:${s.hasOpacity100}`);
  });

  await browser.close();
  console.log('\nDone! Check tests/screenshots/');
})();
