import { useState, type ReactNode } from "react";

export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="eyebrow">{children}</div>;
}

export function Dek({ children }: { children: ReactNode }) {
  return <p className="dek">{children}</p>;
}

export function Callout({
  kind = "note",
  title,
  children,
}: {
  kind?: "note" | "tip" | "warn";
  title: string;
  children: ReactNode;
}) {
  return (
    <div className={`callout ${kind}`}>
      <div className="callout-title">{title}</div>
      {children}
    </div>
  );
}

export function CardGrid({ children }: { children: ReactNode }) {
  return <div className="card-grid">{children}</div>;
}

export function Card({
  href,
  title,
  children,
}: {
  href: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <a className="card" href={href}>
      <div className="card-title">{title}</div>
      <div className="card-body">{children}</div>
    </a>
  );
}

export function StepList({ children }: { children: ReactNode }) {
  return <ol className="step-list">{children}</ol>;
}

export function Step({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <li>
      <h4>{title}</h4>
      <p>{children}</p>
    </li>
  );
}

export function Badge({
  kind,
  children,
}: {
  kind: "ship" | "review" | "block" | "neutral";
  children: ReactNode;
}) {
  return <span className={`badge ${kind}`}>{children}</span>;
}

export function Screenshot({
  src,
  alt,
  caption,
  width,
  height,
}: {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}) {
  return (
    <div className="diagram-frame screenshot-frame">
      <img src={src} alt={alt} className="screenshot-img" width={width} height={height} />
      {caption && <div className="diagram-caption">{caption}</div>}
    </div>
  );
}

export function CodeBlock({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="code-block">
      <button
        type="button"
        className="code-block-copy"
        onClick={handleCopy}
        aria-label={copied ? "Copied" : "Copy code to clipboard"}
        title={copied ? "Copied" : "Copy"}
      >
        {copied ? (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M3 8.5L6 11.5L13 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <rect x="5.5" y="5.5" width="8" height="8" rx="1.3" stroke="currentColor" strokeWidth="1.4" />
            <path d="M3.5 10V3.8C3.5 3.36 3.86 3 4.3 3H10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        )}
      </button>
      <pre>
        <code>{children}</code>
      </pre>
    </div>
  );
}

export function DiagramFrame({
  caption,
  children,
}: {
  caption?: string;
  children: ReactNode;
}) {
  return (
    <div className="diagram-frame">
      {children}
      {caption && <div className="diagram-caption">{caption}</div>}
    </div>
  );
}
