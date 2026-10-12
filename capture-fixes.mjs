import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';
const WANTED = ['crocodile', 'cheetah', 'leopard', 'rhino'];

const run = async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  page.on('pageerror', (err) => console.error('page error:', err.message));

  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  const nameInput = page.locator('#welcome-name-input');
  if (await nameInput.isVisible().catch(() => false)) {
    await nameInput.fill('Ava');
    await page.getByRole('button', { name: "Let's Start!" }).click();
  }
  await page.waitForSelector('.home-activity-list');

  const captured = new Set();
  let attempts = 0;

  while (captured.size < WANTED.length && attempts < 60) {
    attempts += 1;
    await page.locator('.activity-card', { hasText: 'Listen & Select' }).click();
    await page.waitForSelector('.answer-grid');
    for (let i = 0; i < 10; i += 1) {
      if ((await page.locator('.success-parade').count()) > 0) break;
      const choice = page.locator('.answer-choice').first();
      if ((await choice.count()) === 0) break;
      await choice.click();
      await page.waitForTimeout(900);
    }
    await page.waitForSelector('.success-parade', { timeout: 10000 });
    await page.waitForTimeout(250);

    const animals = page.locator('.celebration-animal');
    const count = await animals.count();
    for (let i = 0; i < count; i += 1) {
      const label = await animals.nth(i).getAttribute('aria-label');
      const match = WANTED.find((w) => label && label.includes(w) && !captured.has(w));
      if (match) {
        await animals.nth(i).screenshot({ path: `species-${match}.png`, animations: 'disabled' });
        captured.add(match);
        console.log(`captured: ${match} (${captured.size}/${WANTED.length})`);
      }
    }

    await page.locator('.success-btn--secondary, .success-btn--primary').first().click();
    await page.waitForSelector('.home-activity-list');
  }
  console.log(`Done. ${captured.size}/${WANTED.length}`);
  await browser.close();
};

run().catch((err) => { console.error(err); process.exit(1); });
