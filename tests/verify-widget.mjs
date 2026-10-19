// UI fixture checks only: no RMS data, model call or real CV upload.
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const packageRoot = process.env.RMS_PLAYWRIGHT_MODULES
  || 'C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const { chromium } = require(resolve(packageRoot, 'playwright'));
const projectRoot = resolve(import.meta.dirname, '..');
const screenshotDirectory = resolve(projectRoot, '.impeccable/review');
await mkdir(screenshotDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true, ...(process.env.RMS_BROWSER_PATH ? { executablePath: process.env.RMS_BROWSER_PATH } : {}) });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.emulateMedia({ reducedMotion: 'reduce' });
const assetFailures = [];
page.on('pageerror', (error) => assetFailures.push(error.message));
await page.route('**/*', async (route) => {
  const url = new URL(route.request().url());
  if (url.pathname === '/webhook/rms-preview-unavailable/chat') {
    await route.abort('connectionrefused');
    return;
  }
  if (url.origin !== 'http://127.0.0.1:18768') {
    await route.abort();
    return;
  }
  const path = resolve(projectRoot, '.' + decodeURIComponent(url.pathname));
  if (!path.startsWith(projectRoot + sep)) {
    await route.fulfill({ status: 403, body: '' });
    return;
  }
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript' };
  try {
    await route.fulfill({ status: 200, contentType: types[extname(path)] || 'application/octet-stream', body: await readFile(path) });
  } catch {
    assetFailures.push('Missing asset: ' + url.pathname);
    await route.fulfill({ status: 404, body: '' });
  }
});

const results = [];
try {
  await page.goto('http://127.0.0.1:18768/tests/widget-preview.html');
  await page.getByRole('button', { name: 'Open career assistant', exact: true }).waitFor();
  const toggle = page.locator('#rms-recruitment-chat .chat-window-toggle');
  assert.equal(await page.locator('#rms-recruitment-chat').count(), 1);
  await toggle.focus();
  await page.keyboard.press('Enter');
  await page.getByRole('region', { name: 'RMS Career Assistant', exact: true }).waitFor();
  assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
  await page.getByText('You may attach one text-based PDF CV up to 5 MB.', { exact: false }).waitFor();
  const desktopButton = await toggle.boundingBox();
  assert.ok(desktopButton.width <= 56 && desktopButton.height <= 56);
  await page.screenshot({ path: resolve(screenshotDirectory, 'widget-desktop.png'), fullPage: true, animations: 'disabled' });
  results.push({ check: 'Native widget mounts from local pinned assets; keyboard launcher opens; English local-processing notice visible; desktop button <=56px', status: 'Pass' });

  await page.getByPlaceholder('Ask about jobs or requirements…').fill('Which jobs are currently hiring?');
  await page.locator('#rms-recruitment-chat .chat-input-send-button').click();
  await page.getByText('Error: Failed to receive response', { exact: true }).waitFor();
  results.push({ check: 'Unavailable test endpoint displays the native widget error (deliberate connection refusal fixture, not a live workflow)', status: 'Pass' });

  await page.setViewportSize({ width: 390, height: 844 });
  const bounds = await page.locator('#rms-recruitment-chat .chat-window').boundingBox();
  const mobileButton = await toggle.boundingBox();
  assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 390);
  assert.ok(bounds.y >= 0 && bounds.y + bounds.height <= 844);
  assert.ok(mobileButton.width <= 56 && mobileButton.height <= 56);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: resolve(screenshotDirectory, 'widget-mobile.png'), fullPage: true, animations: 'disabled' });
  results.push({ check: '390x844: chat panel fits viewport, launcher <=56px, no document horizontal overflow', status: 'Pass' });
  assert.deepEqual(assetFailures, []);
  results.push({ check: 'All required local bundle modules load without JavaScript page errors', status: 'Pass' });
} catch (error) {
  console.log('UI diagnostics:', await page.locator('#rms-recruitment-chat').innerText());
  console.log('Computed layout:', await page.evaluate(() => [...document.querySelectorAll('#rms-recruitment-chat .chat-window, #rms-recruitment-chat .chat-layout, #rms-recruitment-chat .chat-window-toggle, #rms-recruitment-chat .chat-input-send-button')].map((element) => ({className: element.className, rect: element.getBoundingClientRect().toJSON(), display: getComputedStyle(element).display, padding: getComputedStyle(element).padding, margin: getComputedStyle(element).margin, color: getComputedStyle(element).color, content: element.outerHTML.slice(0, 1000)}))));
  await page.screenshot({ path: resolve(screenshotDirectory, 'widget-failure.png'), fullPage: true });
  throw error;
} finally {
  await browser.close();
  await writeFile(resolve(projectRoot, 'tests/widget-results.json'), JSON.stringify({ scope: 'Staged standalone native widget UI fixture only. RMS rendering, Thymeleaf property evaluation, real n8n/model responses, job retrieval and CV parsing remain Not Verified.', results, assetFailures }, null, 2) + '\n');
}
console.log(JSON.stringify(results, null, 2));
