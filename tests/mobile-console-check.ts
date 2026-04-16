import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });

  // Simulate a slower device with JS errors visible
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  });
  const page = await context.newPage();

  const jsErrors: string[] = [];
  const consoleMessages: string[] = [];

  page.on('console', (msg) => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', (err) => {
    jsErrors.push(err.message);
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  console.log('=== JS Errors ===');
  if (jsErrors.length === 0) console.log('None');
  jsErrors.forEach((e) => console.log(e));

  console.log('\n=== Console Messages ===');
  consoleMessages.slice(0, 20).forEach((m) => console.log(m));

  // Check the actual HTML rendered server-side
  // Get the initial HTML that Next.js sent (before hydration)
  const serverHTML = await page.evaluate(() => {
    // Check if AnimatedSection wrappers have opacity-0 in their class at this point
    const sections = Array.from(document.querySelectorAll('div[class*="duration-[900ms]"]'));
    return sections.map((el, i) => ({
      index: i,
      classAttr: el.className.substring(0, 200),
      computedOpacity: window.getComputedStyle(el).opacity,
    }));
  });

  console.log('\n=== AnimatedSection states (after networkidle + 2s) ===');
  serverHTML.forEach((s) => {
    const visible = !s.classAttr.includes('opacity-0');
    console.log(`[${s.index}] visible=${visible} computedOpacity=${s.computedOpacity}`);
  });

  // Simulate scroll slowly like a real user
  console.log('\n=== Simulating gradual scroll ===');
  const totalHeight = await page.evaluate(() => document.body.scrollHeight);
  console.log(`Total page height: ${totalHeight}px`);

  // Scroll in 844px increments (one viewport at a time) with 1s pause
  for (let scrollY = 0; scrollY <= totalHeight; scrollY += 844) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'smooth' }), scrollY);
    await page.waitForTimeout(1200);

    const states = await page.evaluate(() => {
      const sections = Array.from(document.querySelectorAll('div[class*="duration-[900ms]"]'));
      return sections.map((el) => el.className.includes('opacity-0') ? 'hidden' : 'visible');
    });
    const hiddenCount = states.filter((s) => s === 'hidden').length;
    console.log(`  scroll=${scrollY}px — hidden sections: ${hiddenCount}/${states.length}`);

    if (hiddenCount > 0) {
      const filename = `tests/screenshots/scroll-${scrollY}.png`;
      await page.screenshot({ path: filename, fullPage: false });
    }
  }

  await browser.close();
  console.log('\nDone.');
})();
