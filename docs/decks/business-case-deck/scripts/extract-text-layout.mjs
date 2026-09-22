// Extracts, per slide, the bounding box + computed style + text content of
// every `.sl-text` element from the live-rendered /print route. Used to
// place matching native PowerPoint text boxes over the background-only
// artwork (see export-png.mjs's ?bg=1 pass).
// Usage: node scripts/extract-text-layout.mjs > output/text-layout.json

import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PORT = 4174;
const OUT_PATH = path.resolve(ROOT, "output/text-layout.json");

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

async function main() {
  console.log("[extract] Building app...");
  await run("npx", ["vite", "build"]);

  console.log("[extract] Starting preview server...");
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
    await page.goto(`${baseUrl}/print`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);

    const data = await page.evaluate(() => {
      const pages = Array.from(document.querySelectorAll(".print-page"));
      return pages.map((pg, idx) => {
        const pageRect = pg.getBoundingClientRect();
        const nodes = Array.from(pg.querySelectorAll(".sl-text"));
        const items = nodes
          .filter((el) => el.textContent && el.textContent.trim().length > 0)
          // Skip container .sl-text elements whose direct text is fully
          // carried by a nested .sl-text descendant (avoid double-placing).
          .filter((el) => !el.querySelector(".sl-text"))
          .map((el) => {
            const r = el.getBoundingClientRect();
            const cs = getComputedStyle(el);
            return {
              text: el.textContent.replace(/\s+/g, " ").trim(),
              x: r.left - pageRect.left,
              y: r.top - pageRect.top,
              width: r.width,
              height: r.height,
              fontSize: parseFloat(cs.fontSize),
              fontWeight: cs.fontWeight,
              fontStyle: cs.fontStyle,
              color: cs.color,
              textAlign: cs.textAlign,
              tag: el.tagName,
            };
          });
        return { slide: idx + 1, items };
      });
    });

    await mkdir(path.dirname(OUT_PATH), { recursive: true });
    await writeFile(OUT_PATH, JSON.stringify(data, null, 2));
    console.log(`[extract] Wrote ${OUT_PATH}`);
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
}

main().catch((err) => {
  console.error("[extract] Failed:", err);
  process.exit(1);
});
