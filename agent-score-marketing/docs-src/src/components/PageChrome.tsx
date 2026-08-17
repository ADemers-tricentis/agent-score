import type { ReactNode } from "react";

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
