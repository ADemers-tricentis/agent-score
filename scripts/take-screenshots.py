#!/usr/bin/env python3
"""Screenshot script for AgentScore onboarding walkthrough. Run: python3 scripts/take-screenshots.py"""
import os, time
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

BASE = "http://localhost:5176"
OUT = "/tmp/agentscore-screenshots"
os.makedirs(OUT, exist_ok=True)

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width": 1440, "height": 900})
        page = ctx.new_page()

        def ss(name):
            path = f"{OUT}/{name}"
            print(f"  {name}")
            page.screenshot(path=path)

        def scroll_to(y):
            page.evaluate(f"window.scrollTo({{top: {y}, behavior: 'instant'}})")
            time.sleep(0.2)

        def scroll_to_text(text):
            page.evaluate(f"""
                const els = [...document.querySelectorAll('h5,h6,p,span,div')];
                const el = els.find(e => e.textContent?.trim().startsWith({repr(text)}));
                if (el) el.scrollIntoView({{behavior:'instant', block:'start'}});
            """)
            time.sleep(0.3)

        def click_expand_in_viewport():
            """Click first visible expand icon button."""
            page.evaluate("""
                const btns = [...document.querySelectorAll('.MuiIconButton-root')];
                const vis = btns.filter(b => {
                    const r = b.getBoundingClientRect();
                    return r.top > 50 && r.top < 850 && r.width > 0;
                });
                if (vis.length) vis[0].click();
            """)
            time.sleep(0.4)

        # ── PATH A ────────────────────────────────────────────────────────────
        print("\n=== PATH A ===")

        page.goto(BASE)
        page.wait_for_selector("text=Fleet", timeout=10000)
        scroll_to(0)
        ss("01-fleet.png")

        # Entry choice
        page.click("button:has-text('Add Agent')")
        page.wait_for_selector("text=How would you like to add")
        ss("02-entry-choice.png")

        # Path A - step 1
        page.click("text=Evaluate new agent")
        page.wait_for_selector("text=Your API key is ready")
        scroll_to(0)
        ss("03-new-agent-api-key-top.png")
        scroll_to(550)
        time.sleep(0.2)
        ss("04-new-agent-code-snippets.png")

        # Step 2 - waiting
        scroll_to(0)
        page.click("button:has-text('configured my exporter')")
        page.wait_for_selector("text=Waiting for your first trace")
        time.sleep(0.3)
        ss("05-waiting-initial.png")

        # Capture mid-pipeline (fires after ~3s initial delay + some stages)
        time.sleep(5)
        ss("06-waiting-pipeline.png")

        # Wait for complete
        page.wait_for_selector("text=Agent ready", timeout=20000)
        time.sleep(0.3)
        ss("07-waiting-complete.png")

        # Step 3 - Configure & Launch
        page.click("button:has-text('Continue')")
        page.wait_for_selector("text=Ready to launch")
        scroll_to(0)
        time.sleep(0.4)
        ss("08-configure-launch-agent-card.png")

        # Evals section
        scroll_to_text("Evals")
        ss("09-evals-section.png")

        # Describe fallback
        page.click("text=Evals don't look right")
        time.sleep(0.5)
        ss("10-evals-describe-open.png")
        page.click("text=Hide")
        time.sleep(0.3)

        # Scoring Profile section
        scroll_to_text("Scoring Profile")
        time.sleep(0.4)
        ss("11-profile-section.png")

        # Expand one eval entry
        click_expand_in_viewport()
        ss("12-profile-eval-expanded.png")

        # Verdict bands
        scroll_to_text("Verdict bands")
        ss("13-verdict-bands.png")

        # LLM Judge
        scroll_to_text("LLM Judge")
        time.sleep(0.3)
        ss("14-judge-section.png")

        # Test cases
        scroll_to_text("Test Cases")
        time.sleep(0.3)
        ss("15-test-cases-section.png")

        # Expand one test case
        click_expand_in_viewport()
        time.sleep(0.3)

        # Trace sampling
        scroll_to_text("Trace sampling")
        time.sleep(0.3)
        ss("16-trace-sampling.png")

        # Launch
        scroll_to(999999)
        time.sleep(0.3)
        page.click("button:has-text('Start monitoring')")
        time.sleep(1800 / 1000)
        scroll_to(0)
        ss("17-launching.png")
        page.wait_for_selector("text=Run #1", timeout=25000)
        time.sleep(0.5)
        ss("18-agent-detail-path-a.png")

        # ── PATH B ────────────────────────────────────────────────────────────
        print("\n=== PATH B ===")

        page.goto(BASE)
        page.wait_for_selector("text=Fleet")
        page.click("button:has-text('Add Agent')")
        page.wait_for_selector("text=How would you like to add")

        # Use existing traces
        page.click("text=Use existing traces")
        page.wait_for_selector("text=Where are your traces")
        scroll_to(0)
        ss("19-connect-source-picker.png")

        # Fill Langfuse credentials (Langfuse is default selected)
        page.fill("input[placeholder='sk-lf-…']", "sk-lf-demo-secret-key-12345")
        page.fill("input[placeholder='pk-lf-…']", "pk-lf-demo-public-key-12345")
        time.sleep(0.3)
        ss("20-connect-langfuse-filled.png")

        # Connect
        page.click("button:has-text('Connect & discover')")
        time.sleep(1800 / 1000)
        ss("21-connecting-loading.png")

        page.wait_for_selector("text=agents found", timeout=15000)
        time.sleep(0.3)
        ss("22-agents-discovered.png")

        # Select agent - triggers inline analysis
        page.click("text=payment-processor-agent")
        time.sleep(1200 / 1000)
        ss("23-agent-analyzing.png")

        page.wait_for_selector("text=Inferred agent details", timeout=15000)
        time.sleep(0.3)
        ss("24-agent-inferred.png")

        # Choose generate custom and continue
        page.click("text=Generate a custom profile")
        time.sleep(0.3)
        page.click("button:has-text('Continue')")
        page.wait_for_selector("text=Suggested profile", timeout=10000)
        scroll_to(0)
        ss("25-profile-step-b.png")

        # Wait for generation
        page.wait_for_selector("text=evals enabled", timeout=20000)
        time.sleep(0.5)
        ss("26-profile-generated-b.png")

        # Judge step
        page.click("button:has-text('Next')")
        page.wait_for_selector("text=Select judge", timeout=10000)
        scroll_to(0)
        ss("27-judge-step-b.png")

        # Test cases step
        page.click("button:has-text('Next')")
        page.wait_for_selector("text=Hard Cases", timeout=10000)
        scroll_to(0)
        ss("28-test-cases-b.png")

        # Enable at least one test case (they start unconfirmed)
        page.evaluate("""
            const switches = [...document.querySelectorAll('.MuiSwitch-input')];
            if (switches.length > 0) {
                const ev = new MouseEvent('click', {bubbles:true});
                switches[0].dispatchEvent(ev);
            }
        """)
        time.sleep(0.3)

        # Review & Launch
        page.click("button:has-text('Next')")
        page.wait_for_selector("text=Start monitoring", timeout=10000)
        scroll_to(0)
        time.sleep(0.5)
        ss("29-review-launch-b.png")

        # Launch
        page.click("button:has-text('Start monitoring')")
        time.sleep(1800 / 1000)
        scroll_to(0)
        ss("30-launching-b.png")

        page.wait_for_selector("text=Run #1", timeout=25000)
        time.sleep(0.5)
        ss("31-agent-detail-b.png")

        browser.close()
        print(f"\nDone! Screenshots saved to {OUT}/")

if __name__ == "__main__":
    run()
