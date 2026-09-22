// Screenshots each slide individually at 1920x1080 as a PNG - both the
// full render (for QA) and a text-hidden "background only" variant
// (?bg=1) used to build the editable .pptx (background art + native
// text boxes layered on top). Usage: node scripts/export-png.mjs

import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const SLIDE_COUNT = 9;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PORT = 4174;
const OUT_DIR = path.resolve(ROOT, "output/slides");
const OUT_DIR_BG = path.resolve(ROOT, "output/slides-bg");

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: ROOT, stdio: "inherit", ...opts });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
    child.on("error", reject);
  });
}

function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = async () => {
      try {
        const res = await fetch(url);
        if (res.ok || res.status < 500) return resolve();
      } catch {
        // not up yet
      }
      if (Date.now() - start > timeoutMs) return reject(new Error("server timeout"));
      setTimeout(attempt, 300);
    };
    attempt();
  });
}

async function shootAll(page, baseUrl, query, outDir) {
  await mkdir(outDir, { recursive: true });
  await page.goto(`${baseUrl}/print${query}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const pages = await page.$$(".print-page");
  for (let i = 0; i < pages.length; i++) {
    await pages[i].screenshot({ path: path.join(outDir, `slide-${String(i + 1).padStart(2, "0")}.png`) });
  }
  return pages.length;
}

async function main() {
  console.log("[export-png] Building app...");
  await run("npx", ["vite", "build"]);

  console.log("[export-png] Starting preview server...");
  const server = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], {
    cwd: ROOT,
    stdio: "inherit",
  });

  let browser;
  try {
    const baseUrl = `http://localhost:${PORT}`;
    await waitForServer(baseUrl);

    browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

    console.log("[export-png] Full-render pass...");
    const n1 = await shootAll(page, baseUrl, "", OUT_DIR);
    console.log(`[export-png] Wrote ${n1} PNGs to ${OUT_DIR}`);

    console.log("[export-png] Background-only pass (text hidden)...");
    const n2 = await shootAll(page, baseUrl, "?bg=1", OUT_DIR_BG);
    console.log(`[export-png] Wrote ${n2} PNGs to ${OUT_DIR_BG}`);
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
}

main().catch((err) => {
  console.error("[export-png] Failed:", err);
  process.exit(1);
});
