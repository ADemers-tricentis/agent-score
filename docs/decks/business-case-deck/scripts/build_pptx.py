#!/usr/bin/env python3
"""Builds the editable .pptx from the background-only slide renders
(output/slides-bg/*.png) plus the extracted text layout
(output/text-layout.json): one full-bleed picture per slide, with a
native, position-matched PowerPoint text box for every real text
element on top, so wording stays editable.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LAYOUT = json.loads((ROOT / "output/text-layout.json").read_text())
BG_DIR = ROOT / "output/slides-bg"
OUT_PPTX = ROOT / "output/AgentScore-Business-Case.pptx"

SCALE = 0.5  # 1920x1080 px canvas -> 960x540 pt slide
DEFAULT_BG_BLEND = (0x17, 0x28, 0x4a)  # approx dark navy, for alpha blending


def run(*args):
    result = subprocess.run(["officecli", *args], capture_output=True, text=True)
    if result.returncode != 0:
        print("FAILED:", " ".join(args))
        print(result.stdout)
        print(result.stderr)
        sys.exit(1)
    return result.stdout


def rgb_to_hex(css_color: str) -> str:
    m = re.match(r"rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)", css_color)
    if not m:
        return "#FFFFFF"
    r, g, b = float(m.group(1)), float(m.group(2)), float(m.group(3))
    a = float(m.group(4)) if m.group(4) is not None else 1.0
    if a < 1.0:
        br, bg, bb = DEFAULT_BG_BLEND
        r = r * a + br * (1 - a)
        g = g * a + bg * (1 - a)
        b = b * a + bb * (1 - a)
    return f"#{int(round(r)):02X}{int(round(g)):02X}{int(round(b)):02X}"


def main():
    if OUT_PPTX.exists():
        OUT_PPTX.unlink()
    run("create", str(OUT_PPTX))

    n_slides = len(LAYOUT)
    for i in range(n_slides):
        run("add", str(OUT_PPTX), "/", "--type", "slide")

    for page in LAYOUT:
        n = page["slide"]
        bg_img = BG_DIR / f"slide-{n:02d}.png"
        run(
            "add",
            str(OUT_PPTX),
            f"/slide[{n}]",
            "--type",
            "picture",
            "--prop",
            f"src={bg_img}",
            "--prop",
            "x=0pt",
            "--prop",
            "y=0pt",
            "--prop",
            "width=960pt",
            "--prop",
            "height=540pt",
        )

        for item in page["items"]:
            x = round(item["x"] * SCALE, 2)
            y = round(item["y"] * SCALE, 2)
            w_raw = item["width"] * SCALE
            h_raw = item["height"] * SCALE
            size = round(item["fontSize"] * SCALE, 1)
            bold = "true" if int(item["fontWeight"]) >= 700 else "false"
            italic = "true" if item["fontStyle"] == "italic" else "false"
            color = rgb_to_hex(item["color"])
            text = item["text"]

            # Chrome/Inter renders narrower than the officecli renderer's
            # substituted font. Short/single-line labels get generous width
            # padding (and no wrap) so they don't break into two lines;
            # already-wrapped paragraphs keep their column width (it's
            # already sized to the card) and only get height padding so an
            # extra reflowed line doesn't get clipped.
            is_paragraph = item["height"] / item["fontSize"] > 1.7
            if is_paragraph:
                wrap = "true"
                w = round(w_raw + 6, 2)
                h = round(h_raw * 1.35 + 8, 2)
            elif w_raw < 40:
                wrap = "false"
                w = round(w_raw * 1.5 + 10, 2)
                h = round(h_raw * 1.2 + 2, 2)
            else:
                wrap = "false"
                w = round(w_raw * 1.25 + 10, 2)
                h = round(h_raw * 1.3 + 6, 2)

            run(
                "add",
                str(OUT_PPTX),
                f"/slide[{n}]",
                "--type",
                "shape",
                "--prop",
                f"text={text}",
                "--prop",
                f"x={x}pt",
                "--prop",
                f"y={y}pt",
                "--prop",
                f"width={w}pt",
                "--prop",
                f"height={h}pt",
                "--prop",
                "fill=none",
                "--prop",
                "font=Inter",
                "--prop",
                f"size={size}pt",
                "--prop",
                f"bold={bold}",
                "--prop",
                f"italic={italic}",
                "--prop",
                f"color={color}",
                "--prop",
                "align=left",
                "--prop",
                "valign=top",
                "--prop",
                f"wrap={wrap}",
            )
        print(f"[build_pptx] Slide {n}/{n_slides} done ({len(page['items'])} text boxes)")

    run("close", str(OUT_PPTX))
    print(f"[build_pptx] Wrote {OUT_PPTX}")


if __name__ == "__main__":
    main()
