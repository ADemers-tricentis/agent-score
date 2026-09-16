// Screenshot script for AgentScore onboarding walkthrough
// Run with: node scripts/take-screenshots.mjs
import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'fs';

const BASE = 'http://localhost:5176';
const OUT = '/tmp/agentscore-screenshots';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

const ss = (name) => {
  console.log(`  screenshot: ${name}`);
  return page.screenshot({ path: `${OUT}/${name}`, fullPage: false });
};

const scrollTo = (y) => page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y);
const scrollToText = (text) => page.evaluate((text) => {
  const els = [...document.querySelectorAll('h5, h6, p, div')];
  const el = els.find(e => e.textContent?.trim().startsWith(text));
  el?.scrollIntoView({ behavior: 'instant', block: 'start' });
}, text);

async function wait(ms) {
  await page.waitForTimeout(ms);
}

// ── PATH A ───────────────────────────────────────────────────────────────────
console.log('\n=== PATH A ===');

await page.goto(BASE);
await page.waitForSelector('text=Fleet');
await scrollTo(0);
await ss('01-fleet.png');

// Entry choice
await page.click('button:has-text("Add Agent")');
await page.waitForSelector('text=How would you like to add');
await ss('02-entry-choice.png');

// Path A - click Evaluate new agent
await page.click('text=Evaluate new agent');
await page.waitForSelector('text=Your API key is ready');
await scrollTo(0);
await ss('03-new-agent-api-key-top.png');
await scrollTo(600);
await wait(200);
await ss('04-new-agent-code-snippets.png');

// Proceed to waiting step
await scrollTo(0);
await page.click('button:has-text("configured my exporter")');
await page.waitForSelector('text=Waiting for your first trace');
await ss('05-waiting-initial.png');

// Wait for pipeline to animate (3s delay + 1.4s/stage)
await wait(4500);
await ss('06-waiting-pipeline.png');

// Wait for complete
await page.waitForSelector('text=Agent ready', { timeout: 20000 });
await ss('07-waiting-complete.png');

// Continue to Configure & Launch
await page.click('button:has-text("Continue")');
await page.waitForSelector('text=Ready to launch');
await scrollTo(0);
await ss('08-configure-launch-agent-card.png');

// Scroll to Evals section
await scrollToText('Evals');
await wait(300);
await ss('09-evals-section.png');

// Open "describe agent" fallback
await page.click('text=Evals don\'t look right');
await wait(400);
await ss('10-evals-describe-open.png');
// Close it again
await page.click('text=Evals don\'t look right');
await wait(300);

// Scroll to Scoring Profile section
await scrollToText('Scoring Profile');
await wait(400);
await ss('11-profile-section.png');

// Expand one eval entry (click the first expand icon in the profile section)
const expandBtns = await page.$$('button[aria-label*="expand"], .MuiIconButton-root');
// Find expand buttons in the profile area - click the first one after scrolling
await page.evaluate(() => {
  const allBtns = [...document.querySelectorAll('.MuiIconButton-root')];
  const inProfile = allBtns.filter(b => {
    const rect = b.getBoundingClientRect();
    return rect.top > 200 && rect.top < 800;
  });
  if (inProfile.length > 0) inProfile[0].click();
});
await wait(400);
await ss('12-profile-eval-expanded.png');

// Scroll to verdict bands
await scrollToText('Verdict bands');
await wait(300);
await ss('13-verdict-bands.png');

// Scroll to LLM Judge section
await scrollToText('LLM Judge');
await wait(300);
await ss('14-judge-section.png');

// Scroll to Test Cases section
await scrollToText('Test Cases');
await wait(300);
await ss('15-test-cases-section.png');

// Expand one test case scenario
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('.MuiIconButton-root')];
  const visible = btns.filter(b => {
    const rect = b.getBoundingClientRect();
    return rect.top > 100 && rect.top < 800;
  });
  if (visible.length > 0) visible[0].click();
});
await wait(400);

// Scroll to Trace Sampling
await scrollToText('Trace sampling');
await wait(300);
await ss('16-trace-sampling.png');

// Launch
await scrollTo(999999);
await wait(300);
await page.click('button:has-text("Start monitoring")');
await wait(1500);
await scrollTo(0);
await ss('17-launching.png');

// Wait for agent detail page
await page.waitForSelector('text=Run #1', { timeout: 20000 });
await ss('18-agent-detail-path-a.png');

// ── PATH B ───────────────────────────────────────────────────────────────────
console.log('\n=== PATH B ===');

await page.goto(BASE);
await page.waitForSelector('text=Fleet');
await page.click('button:has-text("Add Agent")');
await page.waitForSelector('text=How would you like to add');

// Path B - click Use existing traces
await page.click('text=Use existing traces');
await page.waitForSelector('text=Where are your traces');
await scrollTo(0);
await ss('19-connect-source-picker.png');

// Select Langfuse (already selected by default) and fill credentials
await page.fill('input[placeholder="sk-lf-…"]', 'sk-lf-demo-secret-key-12345');
await page.fill('input[placeholder="pk-lf-…"]', 'pk-lf-demo-public-key-12345');
await wait(200);
await ss('20-connect-langfuse-filled.png');

// Connect
await page.click('button:has-text("Connect & discover")');
await wait(1800);
await ss('21-connecting-loading.png');

// Wait for agents list
await page.waitForSelector('text=agents found', { timeout: 15000 });
await ss('22-agents-discovered.png');

// Select first agent
await page.click('text=payment-processor-agent');
await wait(1200);
await ss('23-agent-analyzing.png');

// Wait for inferred agent card
await page.waitForSelector('text=Inferred agent details', { timeout: 15000 });
await ss('24-agent-inferred.png');

// Select profile choice and continue
await page.click('text=Generate a custom profile');
await wait(300);
await page.click('button:has-text("Continue")');
await page.waitForSelector('text=Suggested profile', { timeout: 10000 });
await scrollTo(0);
await ss('25-profile-step-b.png');

// Wait for generation to finish
await page.waitForSelector('text=evals enabled', { timeout: 20000 });
await wait(500);
await ss('26-profile-generated-b.png');

// Advance to Judge
await page.click('button:has-text("Next")');
await page.waitForSelector('text=Select judge', { timeout: 10000 });
await scrollTo(0);
await ss('27-judge-step-b.png');

// Advance to Test Cases
await page.click('button:has-text("Next")');
await page.waitForSelector('text=Hard Cases', { timeout: 10000 });
await scrollTo(0);
await ss('28-test-cases-b.png');

// Toggle a test case on
await page.evaluate(() => {
  const switches = [...document.querySelectorAll('.MuiSwitch-input')];
  if (switches.length > 0 && !switches[0].checked) switches[0].click();
});
await wait(300);

// Advance to Review & Launch
await page.click('button:has-text("Next")');
await page.waitForSelector('text=Start monitoring', { timeout: 10000 });
await scrollTo(0);
await ss('29-review-launch-b.png');

// Launch
await page.click('button:has-text("Start monitoring")');
await wait(1500);
await scrollTo(0);
await ss('30-launching-b.png');

// Wait for agent detail
await page.waitForSelector('text=Run #1', { timeout: 20000 });
await ss('31-agent-detail-b.png');

await browser.close();
console.log('\nDone! Screenshots saved to /tmp/agentscore-screenshots/');
