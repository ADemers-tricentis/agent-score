import { useMemo } from "react";
import { marked } from "marked";
import rawMarkdown from "./content/updates.md?raw";

interface Entry {
  title: string;
  bodyHtml: string;
  sortKey: number;
}

function parseEntries(markdown: string): Entry[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const chunks: { title: string; body: string[] }[] = [];

  for (const line of lines) {
    const heading = line.match(/^##\s+(.*)$/);
    if (heading) {
      chunks.push({ title: heading[1].trim(), body: [] });
    } else if (chunks.length > 0) {
      chunks[chunks.length - 1].body.push(line);
    }
  }

  return chunks.map(({ title, body }) => {
    const cleanedTitle = title.replace(/\s*update\s*$/i, "").trim();
    const parsedDate = Date.parse(cleanedTitle);
    return {
      title: cleanedTitle || title,
      bodyHtml: marked.parse(body.join("\n").trim(), { async: false }) as string,
      sortKey: Number.isNaN(parsedDate) ? -Infinity : parsedDate,
    };
  });
}

export default function App() {
  const entries = useMemo(() => {
    const parsed = parseEntries(rawMarkdown);
    return parsed.sort((a, b) => b.sortKey - a.sortKey);
  }, []);

  return (
    <>
      <nav className="topnav">
        <div className="topnav-inner">
          <a className="brand" href="../index.html">
            <span className="logo-mark">A</span>
            AgentScore
          </a>
        </div>
      </nav>

      <header className="hero">
        <div className="hero-inner">
          <div className="eyebrow">Product Updates</div>
          <h1>AgentScore, at a glance.</h1>
          <p className="hero-sub">
            A running record of what shipped, what's rolling out, and what's next -
            updated as the product moves.
          </p>
        </div>
      </header>

      <main className="timeline">
        {entries.length === 0 ? (
          <p className="empty">No updates yet.</p>
        ) : (
          entries.map((entry, i) => (
            <article className="entry" key={`${entry.title}-${i}`}>
              <div className="entry-date">{entry.title}</div>
              <div
                className="entry-body"
                dangerouslySetInnerHTML={{ __html: entry.bodyHtml }}
              />
            </article>
          ))
        )}
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <span>AgentScore</span>
          <span className="footer-copy">
            Questions? <a href="mailto:a.demers@tricentis.com">Andrew Demers</a>
          </span>
        </div>
      </footer>
    </>
  );
}
