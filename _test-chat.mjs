import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

// Collect console messages
const consoleLogs = [];
page.on('console', msg => {
  consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
});

// Collect failed requests
const failedRequests = [];
page.on('requestfailed', request => {
  failedRequests.push({
    url: request.url(),
    failure: request.failure()?.errorText || 'unknown',
    method: request.method()
  });
});

// Collect network responses to workers.dev
const networkCalls = [];
page.on('response', response => {
  if (response.url().includes('workers.dev')) {
    networkCalls.push({
      url: response.url(),
      status: response.status(),
      ok: response.ok()
    });
  }
});

console.log('Opening page...');
await page.goto('https://andy-zokelink.github.io/tools-briefing/', {
  waitUntil: 'networkidle',
  timeout: 30000
});

await page.waitForSelector('#chatBtn', { timeout: 10000 });
console.log('Chat button found');

await page.click('#chatBtn');
await page.waitForTimeout(500);

const panelVisible = await page.evaluate(() => {
  const panel = document.getElementById('chatPanel');
  return panel?.classList.contains('open');
});
console.log('Chat panel open:', panelVisible);

const input = await page.$('#chatInput');
if (input) {
  await input.fill('hello');
  console.log('Typed: hello');

  await page.click('#sendBtn');
  console.log('Clicked send');

  await page.waitForTimeout(10000);

  const messages = await page.evaluate(() => {
    const container = document.getElementById('chatMessages');
    const msgs = container.querySelectorAll('.ai-chat-msg');
    return Array.from(msgs).map(m => ({
      class: m.className,
      text: m.textContent.substring(0, 300)
    }));
  });
  console.log('Messages:', JSON.stringify(messages, null, 2));
}

console.log('\n--- Console ---');
consoleLogs.forEach(l => console.log(l));

console.log('\n--- Failed ---');
if (failedRequests.length === 0) console.log('None');
else failedRequests.forEach(r => console.log(JSON.stringify(r)));

console.log('\n--- Worker ---');
if (networkCalls.length === 0) console.log('No calls to workers.dev');
else networkCalls.forEach(c => console.log(JSON.stringify(c)));

await page.screenshot({ path: '/Users/andy/tools-briefing/_chat-test.png', fullPage: false });
console.log('\nScreenshot saved');

await browser.close();
