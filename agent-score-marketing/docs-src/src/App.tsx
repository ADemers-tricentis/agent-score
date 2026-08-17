import { useEffect, useState } from "react";
import { nav, allPages, findPage, pageIndex, DEFAULT_SLUG } from "./nav";
import { pages } from "./content";

function useHashSlug(): string {
  const read = () => {
    const raw = window.location.hash.replace(/^#\/?/, "");
    return findPage(raw) ? raw : DEFAULT_SLUG;
  };
  const [slug, setSlug] = useState(read);
  useEffect(() => {
    const onChange = () => setSlug(read());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return slug;
}

function MenuIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function Sidebar({
  activeSlug,
  open,
  onNavigate,
}: {
  activeSlug: string;
  open: boolean;
  onNavigate: () => void;
}) {
  return (
    <nav className={`sidebar${open ? " open" : ""}`} aria-label="Docs navigation">
      {nav.map((section) => (
        <div className="sidebar-section" key={section.id}>
          <div className="sidebar-section-title">{section.title}</div>
          {section.pages.map((page) => (
            <a
              key={page.slug}
              href={`#/${page.slug}`}
              className={`sidebar-link${page.slug === activeSlug ? " active" : ""}`}
              onClick={onNavigate}
            >
              {page.title}
            </a>
          ))}
        </div>
      ))}
    </nav>
  );
}

function PageFooterNav({ slug }: { slug: string }) {
  const idx = pageIndex(slug);
  const prev = idx > 0 ? allPages[idx - 1] : undefined;
  const next = idx >= 0 && idx < allPages.length - 1 ? allPages[idx + 1] : undefined;
  if (!prev && !next) return null;
  return (
    <div className="page-footer-nav">
      {prev ? (
        <a href={`#/${prev.slug}`}>
          <span className="nav-dir">Previous</span>
          <span className="nav-title">{prev.title}</span>
        </a>
      ) : (
        <span />
      )}
      {next && (
        <a href={`#/${next.slug}`} className="next">
          <span className="nav-dir">Next</span>
          <span className="nav-title">{next.title}</span>
        </a>
      )}
    </div>
  );
}

export default function App() {
  const slug = useHashSlug();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo(0, 0);
  }, [slug]);

  const Page = pages[slug] ?? pages[DEFAULT_SLUG];

  return (
    <div className="shell">
      <header className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            className="menu-toggle"
            aria-label="Toggle navigation"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <MenuIcon />
          </button>
          <a className="topbar-brand" href="#/welcome">
            <span className="topbar-logo">A</span>
            Agent Score
            <span className="topbar-docs-tag">Docs</span>
          </a>
        </div>
        <div className="topbar-links">
          <a className="back-link" href="../">
            Back to agentscore.ai
          </a>
        </div>
      </header>

      <Sidebar activeSlug={slug} open={menuOpen} onNavigate={() => setMenuOpen(false)} />
      <div
        className={`sidebar-scrim${menuOpen ? " open" : ""}`}
        onClick={() => setMenuOpen(false)}
      />

      <div className="content-wrap">
        <main className="content">
          <Page />
          <PageFooterNav slug={slug} />
        </main>
      </div>
    </div>
  );
}
