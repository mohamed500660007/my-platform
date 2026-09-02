/* shot.mjs — لقطات للمراجعة البصرية.  node shot.mjs [عرض] [قسم] */
import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
import path from 'path';

const width = Number(process.argv[2] || 1440);
const target = process.argv[3] || 'app';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height: 900 } });
await page.goto(pathToFileURL(path.resolve('index.html')).href, { waitUntil: 'networkidle' });

await page.evaluate(async () => {
  await new Promise((res) => {
    let y = 0;
    const step = () => {
      y += window.innerHeight * 0.8;
      window.scrollTo(0, y);
      if (y < document.body.scrollHeight) setTimeout(step, 80); else setTimeout(res, 500);
    };
    step();
  });
});

const el = await page.$(target === 'full' ? 'body' : `#${target}`);
await page.waitForTimeout(1400);
await el.scrollIntoViewIfNeeded();
await page.waitForTimeout(1200);
await el.screenshot({ path: `_shot-${target}-${width}.png` });
console.log(`saved _shot-${target}-${width}.png`);
await browser.close();
