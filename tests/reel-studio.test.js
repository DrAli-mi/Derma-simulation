// Smoke test for Reel Studio: records a short reel from index.html and checks the video output.
// Run: node tests/reel-studio.test.js
const { chromium } = require('playwright');
const path = require('path');
const assert = require('assert');

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1400 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  await page.waitForSelector('#stage3d canvas');
  await page.waitForTimeout(1500);

  await page.selectOption('#reelDuration', '6');
  await page.click('#reelRecord');
  await page.waitForSelector('#reelPreview video', { timeout: 20000 });
  await page.waitForSelector('#reelDownload', { state: 'visible' });

  const info = await page.evaluate(async () => {
    const href = document.getElementById('reelDownload').href;
    const blob = await (await fetch(href)).blob();
    return { size: blob.size, type: blob.type };
  });
  assert(info.size > 5000, 'recorded video is too small: ' + info.size);
  assert(/video\//.test(info.type), 'unexpected type ' + info.type);
  await page.screenshot({ path: path.join(__dirname, 'reel-studio.png'), fullPage: true });
  assert.deepStrictEqual(errors, [], 'page errors: ' + errors.join('; '));
  console.log('OK', info);
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
