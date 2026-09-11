// Builds the deck, serves the built app on a fixed local port, drives it
// with Playwright Chromium to the /print route (all 24 slides stacked,
// 1920x1080 each, page-break-after per slide), and exports a PDF to the
// AgentScore research docs folder.
//
// Usage: node scripts/export-pdf.mjs   (wired to `npm run export:pdf`)

import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PORT = 4173;
const OUT_PATH = path.resolve(
  ROOT,
  "../AgentScore-Competitive-Positioning.pdf",
);

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: ROOT, stdio: "inherit", ...opts });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} exited with code ${code}`));
    });
    child.on("error", reject);
  });
}

function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = async () => {
      try {
        const res = await fetch(url);
        if (res.ok || res.status < 500) {
          resolve();
          return;
        }
      } catch {
        // not up yet
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Server at ${url} did not become ready in time`));
        return;
      }
      setTimeout(attempt, 300);
    };
    attempt();
  });
}

async function main() {
  console.log("[export-pdf] Building app...");
  await run("npx", ["vite", "build"]);

  console.log("[export-pdf] Starting preview server...");
  const server = spawn(
    "npx",
    ["vite", "preview", "--port", String(PORT), "--strictPort"],
    { cwd: ROOT, stdio: "inherit" },
  );

  let browser;
  try {
    const baseUrl = `http://localhost:${PORT}`;
    await waitForServer(baseUrl);

    console.log("[export-pdf] Launching Chromium...");
    browser = await chromium.launch();
    const page = await browser.newPage();

    console.log("[export-pdf] Navigating to /print...");
    await page.goto(`${baseUrl}/print`, { waitUntil: "networkidle" });

    // Wait for the Inter font to finish loading and the layout to settle.
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);

    await mkdir(path.dirname(OUT_PATH), { recursive: true });

    console.log(`[export-pdf] Rendering PDF to ${OUT_PATH}...`);
    await page.pdf({
      path: OUT_PATH,
      width: "1920px",
      height: "1080px",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    console.log("[export-pdf] Done.");
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
}

main().catch((err) => {
  console.error("[export-pdf] Failed:", err);
  process.exit(1);
});
