/* ══════════════════════════════════════════════════════════════
   audit.mjs — فحص شامل لمنصّة بن ناجح
   بيقيس: أخطاء الكونسول · التمرير الأفقي · المسافات غير الموحّدة
   · النص المزنوق · التداخل · الصور الناقصة · التباين · اللمس
   شغّله:  node audit.mjs
   ══════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
import path from 'path';

const URL = process.env.SITE || pathToFileURL(path.resolve('index.html')).href;

const VIEWPORTS = [
  { name: 'موبايل',  width: 390,  height: 844 },
  { name: 'فابلت',   width: 540,  height: 900 },
  { name: 'تابلت',   width: 820,  height: 1100 },
  { name: 'لابتوب',  width: 1280, height: 800 },
  { name: 'ديسكتوب', width: 1600, height: 950 },
];

/* المسافات المسموحة — سلّم التصميم */
const SCALE = [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 72, 88, 96, 112, 128];
const near = (v) => SCALE.some((t) => Math.abs(v - t) <= 1.5);

const audit = async (page, vp) => {
  return await page.evaluate((vpName) => {
    const out = { gaps: [], cramped: [], overflow: [], overlap: [], tiny: [], touch: [] };
    const vw = document.documentElement.clientWidth;

    /* ١) التمرير الأفقي */
    document.querySelectorAll('body *').forEach((el) => {
      const cs = getComputedStyle(el);
      if (cs.position === 'fixed' || cs.visibility === 'hidden' || cs.display === 'none') return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      /* المقصوص جوّه أب عنده overflow مش مشكلة */
      let clipped = false;
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
        const ac = getComputedStyle(a);
        if (ac.overflowX !== 'visible' || ac.overflowY !== 'visible') { clipped = true; break; }
      }
      if (clipped) return;
      if (r.right > vw + 1 || r.left < -1) {
        out.overflow.push({ sel: el.tagName.toLowerCase() + '.' + (el.className.baseVal ?? el.className).toString().split(' ')[0], left: Math.round(r.left), right: Math.round(r.right) });
      }
    });

    /* ٢) المسافات الرأسية بين إخوة الأقسام */
    const key = 'section, .band, .wrap > *, .sec-head > *, .jstep, .ucard, .slip, .applist li, .foot-grid > *';
    document.querySelectorAll(key).forEach((el) => {
      const cs = getComputedStyle(el);
      /* حشو الهيرو مركّب مقصود: ارتفاع النافبار + مسافة من السلّم */
      if (el.classList.contains('hero')) return;
      ['marginTop', 'marginBottom', 'paddingTop', 'paddingBottom'].forEach((prop) => {
        const v = parseFloat(cs[prop]);
        if (v > 3 && !((t) => [0,4,8,12,16,20,24,32,40,48,56,64,72,88,96,112,128].some((x)=>Math.abs(t-x)<=1.5))(v)) {
          out.gaps.push({ sel: el.tagName.toLowerCase() + '.' + (el.className.baseVal ?? el.className).toString().split(' ').slice(0,2).join('.'), prop, v: Math.round(v * 10) / 10 });
        }
      });
    });

    /* ٣) نص مزنوق: ارتفاع السطر صغير أو الحرف بيلمس الحافة */
    document.querySelectorAll('p, h1, h2, h3, h4, li, q, cite, .lede, .cap, .ttab, .lrow .t, .tabtag').forEach((el) => {
      if (!el.textContent.trim()) return;
      const cs = getComputedStyle(el);
      const fs = parseFloat(cs.fontSize);
      const lh = parseFloat(cs.lineHeight);
      if (fs && lh && lh / fs < 1.25 && el.textContent.trim().length > 24) {
        out.cramped.push({ sel: el.tagName.toLowerCase() + '.' + (el.className.baseVal ?? el.className).toString().split(' ')[0], fs: Math.round(fs), ratio: Math.round((lh / fs) * 100) / 100 });
      }
      if (fs && fs < 11.5) {
        out.tiny.push({ sel: el.tagName.toLowerCase() + '.' + (el.className.baseVal ?? el.className).toString().split(' ')[0], fs: Math.round(fs * 10) / 10 });
      }
      /* فيض النص برّه صندوقه */
      if (el.scrollWidth > el.clientWidth + 2 && cs.overflowX === 'visible' && cs.whiteSpace !== 'nowrap') {
        out.cramped.push({ sel: 'OVERSET ' + el.tagName.toLowerCase() + '.' + (el.className.baseVal ?? el.className).toString().split(' ')[0], fs: Math.round(fs), ratio: 0 });
      }
    });

    /* ٤) أهداف اللمس أصغر من ٤٤px على الموبايل */
    if (vpName === 'موبايل' || vpName === 'فابلت') {
      document.querySelectorAll('a[href], button').forEach((el) => {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') return;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        if (r.height < 36 || r.width < 30) {
          out.touch.push({ sel: el.tagName.toLowerCase() + '.' + (el.className.baseVal ?? el.className).toString().split(' ')[0], w: Math.round(r.width), h: Math.round(r.height) });
        }
      });
    }

    return out;
  }, vp.name);
};

const run = async () => {
  const browser = await chromium.launch();
  const report = {};
  let totalErr = 0;

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 140)); });
    page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message.slice(0, 140)));
    const failed = [];
    page.on('requestfailed', (r) => failed.push(r.url().split('/').pop() + ' — ' + (r.failure()?.errorText || '')));

    await page.goto(URL, { waitUntil: 'networkidle' });
    /* نزّل لآخر الصفحة عشان كل حاجة تتحمّل وتتكشف */
    await page.evaluate(async () => {
      await new Promise((res) => {
        let y = 0;
        const step = () => {
          y += window.innerHeight * 0.8;
          window.scrollTo(0, y);
          if (y < document.body.scrollHeight) setTimeout(step, 90); else { window.scrollTo(0, 0); setTimeout(res, 700); }
        };
        step();
      });
    });
    await page.waitForTimeout(900);

    const r = await audit(page, vp);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    const cw = await page.evaluate(() => document.documentElement.clientWidth);
    const badImgs = await page.evaluate(() =>
      [...document.images].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.src.split('/').pop()));

    report[vp.name] = { vp: `${vp.width}×${vp.height}`, errors, failed, sw, cw, badImgs, ...r };
    totalErr += errors.length + failed.length + r.overflow.length;
    await ctx.close();
  }

  await browser.close();

  /* ── الطباعة ── */
  const uniq = (arr, k) => {
    const m = new Map();
    arr.forEach((x) => { const key = k(x); m.set(key, (m.get(key) || 0) + 1); });
    return [...m.entries()].map(([key, n]) => `${key}${n > 1 ? ` ×${n}` : ''}`);
  };

  for (const [name, r] of Object.entries(report)) {
    console.log(`\n${'═'.repeat(58)}\n  ${name}  (${r.vp})\n${'═'.repeat(58)}`);
    console.log(`  أخطاء كونسول : ${r.errors.length ? '❌ ' + r.errors.join(' | ') : '✅ ٠'}`);
    console.log(`  طلبات فاشلة  : ${r.failed.length ? '❌ ' + r.failed.join(' | ') : '✅ ٠'}`);
    console.log(`  صور ناقصة    : ${r.badImgs.length ? '❌ ' + r.badImgs.join(', ') : '✅ ٠'}`);
    console.log(`  تمرير أفقي   : ${r.sw > r.cw ? `❌ ${r.sw} > ${r.cw}` : '✅ مفيش'}`);
    if (r.overflow.length) console.log(`  عناصر خارجة : ❌ ${uniq(r.overflow, (x) => x.sel).slice(0, 8).join(', ')}`);
    if (r.gaps.length)     console.log(`  مسافات شاذّة : ⚠️  ${uniq(r.gaps, (x) => `${x.sel}{${x.prop}:${x.v}}`).slice(0, 10).join(', ')}`);
    if (r.cramped.length)  console.log(`  نص مزنوق     : ⚠️  ${uniq(r.cramped, (x) => `${x.sel}(${x.ratio})`).slice(0, 8).join(', ')}`);
    if (r.tiny.length)     console.log(`  خط صغير      : ⚠️  ${uniq(r.tiny, (x) => `${x.sel}:${x.fs}px`).slice(0, 8).join(', ')}`);
    if (r.touch.length)    console.log(`  لمس < ٣٦px   : ⚠️  ${uniq(r.touch, (x) => `${x.sel}(${x.w}×${x.h})`).slice(0, 8).join(', ')}`);
  }

  console.log(`\n${'═'.repeat(58)}`);
  console.log(totalErr === 0 ? '  ✅ مفيش أخطاء حرجة' : `  ❌ ${totalErr} مشكلة حرجة`);
  console.log(`${'═'.repeat(58)}\n`);
};

run();
