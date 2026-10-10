// Shared v3 components. Props mirror the Figma components (🧩 Components page). Styles live in src/styles/ui.css.
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { pageCss, renderInner } from "../lib/doc/html";
import { buildBlocks, PROFILES, type RenderOptions } from "../lib/doc/layout";
import type { DocData } from "../lib/doc/types";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/* ---------- Icons ---------- */
export function Sparkle({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden>
      <defs>
        <linearGradient id="rk-sparkle" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0046D5" />
          <stop offset=".5" stopColor="#5281E3" />
          <stop offset=".8" stopColor="#C8372D" />
          <stop offset="1" stopColor="#FFD84D" />
        </linearGradient>
      </defs>
      <path d="M9 0C9.6 4.8 13.2 8.4 18 9 13.2 9.6 9.6 13.2 9 18 8.4 13.2 4.8 9.6 0 9 4.8 8.4 8.4 4.8 9 0Z" fill="url(#rk-sparkle)" />
    </svg>
  );
}

export function CheckIcon({ size = 12 }: { size?: number }) {
  return (
    <svg className="check" width={size} height={size} viewBox="0 0 12 12" aria-hidden>
      <path d="M1 6.5 4.5 10 11 2.5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function GearIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" />
    </svg>
  );
}

/** Logo Mark: stamp-red ring with ๛ (Direction 1). */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <circle cx="16" cy="16" r="14.5" fill="none" stroke="var(--color-brand-stamp)" strokeWidth="2" />
      <text x="16" y="21" textAnchor="middle" fontFamily="Trirong, serif" fontWeight="700" fontSize="15" fill="var(--color-brand-stamp)">
        ๛
      </text>
    </svg>
  );
}

/* ---------- Button ---------- */
type BtnVariant = "primary" | "secondary" | "tertiary" | "ghost" | "danger";
export function Button({
  variant = "secondary",
  size,
  full,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: "sm"; full?: boolean }) {
  return <button type="button" className={cx("btn", variant, size, full && "full", className)} {...rest} />;
}

/* ---------- Card ---------- */
export function Card({ title, count, right, children, className }: { title?: ReactNode; count?: ReactNode; right?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <section className={cx("card", className)}>
      {(title || count || right) && (
        <div className="card-head">
          {title && <h3 className="t-h-s">{title}</h3>}
          {right ?? (count != null && <span className="count">{count}</span>)}
        </div>
      )}
      {children}
    </section>
  );
}

/* ---------- Status tag ---------- */
export type Tone = "success" | "warning" | "danger" | "info" | "neutral";
export function StatusTag({ tone, children, dot = true }: { tone: Tone; children: ReactNode; dot?: boolean }) {
  return (
    <span className={cx("tag", tone)}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
}

/* ---------- Stepper (text, drawn check) ---------- */
export function Stepper({ labels, step }: { labels: [string, string, string]; step: 1 | 2 | 3 }) {
  return (
    <nav className="stepper" aria-label="ขั้นตอน">
      {labels.map((l, i) => {
        const n = i + 1;
        const done = n < step;
        return (
          <span key={l} className="row" style={{ gap: 16 }}>
            {i > 0 && <span className="step-sep">›</span>}
            <span className={cx("step", n === step && "on")} aria-current={n === step ? "step" : undefined}>
              {done ? <CheckIcon /> : <span>{n}</span>}
              {l}
            </span>
          </span>
        );
      })}
    </nav>
  );
}

/* ---------- Page header: stepper + title + one status line ---------- */
export function PageHeader({ stepper, title, status }: { stepper?: ReactNode; title: ReactNode; status?: ReactNode }) {
  return (
    <header className="page-head">
      {stepper}
      <div className="title-block">
        <h1 className="t-h-l">{title}</h1>
        {status && <p className="t-body-m muted">{status}</p>}
      </div>
    </header>
  );
}

/* ---------- Inputs ---------- */
export function TextInput({ label, helper, error, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; helper?: string; error?: string }) {
  return (
    <label className="field">
      {label && <span className="field-label">{label}</span>}
      <input className={cx("input", error && "error")} {...rest} />
      {(error || helper) && <span className={cx("helper", error && "error")}>{error ?? helper}</span>}
    </label>
  );
}

export function TextArea({ label, helper, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; helper?: string }) {
  return (
    <label className="field">
      {label && <span className="field-label">{label}</span>}
      <textarea className="textarea" {...rest} />
      {helper && <span className="helper">{helper}</span>}
    </label>
  );
}

/* ---------- FieldRow (Filled / Empty / Skipped) ---------- */
export type FieldStatus = "filled" | "empty" | "skipped";
export function FieldRow({
  label,
  value,
  status,
  hint,
  block,
  onChange,
  onSkip,
  onUnskip,
  autoFocus,
}: {
  label: string;
  value: string;
  status: FieldStatus;
  hint?: string;
  block?: boolean;
  onChange: (v: string) => void;
  onSkip?: () => void;
  onUnskip?: () => void;
  autoFocus?: boolean;
}) {
  return (
    <div className={cx("frow", block && "block")}>
      <span className="frow-label">
        {status === "empty" && <span className="miss" aria-label="ยังขาด" />}
        {label}
      </span>
      {status === "skipped" ? (
        <span className="frow-value skipped">[ระบุ...]</span>
      ) : block ? (
        <textarea className="textarea" rows={3} value={value} placeholder={hint ?? "พิมพ์ หรือกดข้าม"} onChange={(e) => onChange(e.target.value)} autoFocus={autoFocus} style={{ minHeight: 0 }} />
      ) : (
        <input className="input" value={value} placeholder={hint ?? "พิมพ์ หรือกดข้าม"} onChange={(e) => onChange(e.target.value)} autoFocus={autoFocus} />
      )}
      <span className="frow-actions">
        {status === "empty" && onSkip && (
          <Button variant="ghost" size="sm" onClick={onSkip}>
            ข้าม
          </Button>
        )}
        {status === "skipped" && (
          <>
            ข้ามไว้
            {onUnskip && (
              <Button variant="ghost" size="sm" onClick={onUnskip}>
                เลิกข้าม
              </Button>
            )}
          </>
        )}
      </span>
    </div>
  );
}

/* ---------- Toggle ---------- */
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className="toggle" onClick={() => onChange(!checked)} />;
}

/* ---------- Segmented ---------- */
export function Segmented<T extends string>({ options, value, onChange, label }: { options: { value: T; label: ReactNode }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={o.value === value} className={cx(o.value === value && "on")} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- OptionRow ---------- */
export function OptionRow({ title, hint, selected, onSelect }: { title: ReactNode; hint?: ReactNode; selected: boolean; onSelect: () => void }) {
  return (
    <button type="button" role="radio" aria-checked={selected} className={cx("opt", selected && "on")} onClick={onSelect}>
      <span className="radio" />
      <span>
        <span className="opt-title" style={{ display: "block" }}>
          {title}
        </span>
        {hint && <span className="opt-hint">{hint}</span>}
      </span>
    </button>
  );
}

/* ---------- Tabs ---------- */
export function Tabs<T extends string>({ items, value, onChange }: { items: { value: T; label: ReactNode }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="tabs" role="tablist">
      {items.map((t) => (
        <button key={t.value} type="button" role="tab" aria-selected={t.value === value} className={cx("tab", t.value === value && "on")} onClick={() => onChange(t.value)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Banner (retro chrome; tone only on the tiny tag) ---------- */
const BANNER_CHIP: Record<string, string> = { info: "INFO", warning: "WARN", success: "DONE", danger: "ERR" };
export function Banner({ tone, children, onClose }: { tone: "info" | "warning" | "success" | "danger"; children: ReactNode; onClose?: () => void }) {
  return (
    <div className="banner" role={tone === "danger" ? "alert" : "status"}>
      <span className="chip">{BANNER_CHIP[tone]}</span>
      <span className="msg">{children}</span>
      {onClose && (
        <button className="x" onClick={onClose} aria-label="ปิด">
          ×
        </button>
      )}
    </div>
  );
}

/* ---------- Pop-up (retro window) ---------- */
export function Popup({ title, children, actions, onClose }: { title: string; children: ReactNode; actions?: ReactNode; onClose?: () => void }) {
  return (
    <div className="scrim" role="dialog" aria-modal aria-label={title}>
      <div className="window">
        <div className="window-title">
          <span>{title}</span>
          {onClose && (
            <button className="win-btn" style={{ padding: "0 6px", fontSize: 12 }} onClick={onClose} aria-label="ปิด">
              ×
            </button>
          )}
        </div>
        <div className="window-body">
          {children}
          {actions && <div className="window-actions">{actions}</div>}
        </div>
      </div>
    </div>
  );
}

export function Progress({ value }: { value: number }) {
  return (
    <div className="progress" role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  );
}

/* ---------- Drawer ---------- */
export function Drawer({ open, onClose, children, label }: { open: boolean; onClose: () => void; children: ReactNode; label: string }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="drawer-scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal aria-label={label}>
        {children}
      </aside>
    </>
  );
}

/* ---------- Paper: the A4 preview on the beige desk ---------- */
const A4_PX = 21 * 37.795;
const markMissing = (html: string) => html.replace(/\[ระบุ[^\]<]*\]/g, (m) => `<span class="missing">${m}</span>`);

export function Paper({ doc, options, width = 520, caption }: { doc: DocData; options?: Partial<RenderOptions>; width?: number; caption?: ReactNode }) {
  const frame = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(width);
  useEffect(() => {
    const el = frame.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(Math.min(width, el.clientWidth)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);
  const opts: RenderOptions = useMemo(() => ({ profile: PROFILES.common, thaiDigits: false, garudaImage: null, showSlotHint: true, ...options }), [options]);
  const html = useMemo(() => markMissing(renderInner(buildBlocks(doc, opts), opts, true)), [doc, opts]);
  const m = opts.profile.marginsCm;
  const scale = w / A4_PX;
  return (
    <div className="desk">
      <style>{pageCss(opts)}</style>
      <div ref={frame} className="paper-frame" style={{ width: w, height: A4_PX * 1.4142 * scale }}>
        <div className="paper-scale" style={{ width: A4_PX, transform: `scale(${scale})` }}>
          <div className="rk-page" style={{ padding: `${m.top}cm ${m.right}cm ${m.bottom}cm ${m.left}cm`, minHeight: A4_PX * 1.4142 }} dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
      {caption && <p className="desk-caption">{caption}</p>}
    </div>
  );
}
