import { SLIDES } from "../data/slideRegistry";
import { SLIDE_W, SLIDE_H } from "../theme/theme";

// Renders all 24 slides stacked in document order, each exactly
// 1920x1080, for the Playwright PDF export script to screenshot/print.
// Not meant to be viewed interactively - navigate here directly at /print.
export const PrintView: React.FC = () => (
  <div id="print-root">
    <style>{`
      @page { size: ${SLIDE_W}px ${SLIDE_H}px; margin: 0; }
      html, body { margin: 0; padding: 0; }
      #print-root {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .print-page {
        width: ${SLIDE_W}px;
        height: ${SLIDE_H}px;
        overflow: hidden;
        page-break-after: always;
        break-after: page;
      }
      .print-page:last-child {
        page-break-after: auto;
        break-after: auto;
      }
    `}</style>
    {SLIDES.map((SlideComponent, i) => (
      <div className="print-page" key={i}>
        <SlideComponent />
      </div>
    ))}
  </div>
);
