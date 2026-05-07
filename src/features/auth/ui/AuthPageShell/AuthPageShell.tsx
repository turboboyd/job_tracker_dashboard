import React from "react";

export type AuthPageShellProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

function BrandPanel() {
  return (
    <div
      className="hidden flex-1 flex-col justify-between overflow-hidden p-10 md:flex"
      style={{
        background:
          "linear-gradient(135deg, color-mix(in srgb, rgb(230 94 76) 18%, rgb(var(--background))) 0%, color-mix(in srgb, rgb(59 130 246) 14%, rgb(var(--background))) 100%)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-[7px] bg-foreground text-[14px] font-bold tracking-tighter text-background">
          L
        </div>
        <span className="text-[15px] font-semibold tracking-tight">Loopboard</span>
      </div>

      {/* Product preview card */}
      <div className="flex items-center justify-center py-8">
        <div
          className="w-full max-w-[380px] rounded-2xl border border-border bg-card p-5 shadow-lg"
          style={{ transform: "rotate(-1.5deg)" }}
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-medium uppercase tracking-[0.07em] text-subtle-foreground">Cycle</div>
              <div className="mt-1 text-[14px] font-semibold">Frontend EU</div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600">
              ● Active
            </span>
          </div>

          <div className="mb-4 grid grid-cols-3 gap-2.5">
            {[{ l: "Matches", v: "24" }, { l: "Applied", v: "14" }, { l: "Today", v: "+3" }].map((s) => (
              <div key={s.l} className="rounded-lg border border-border bg-muted/60 p-2">
                <div className="text-[10px] text-subtle-foreground">{s.l}</div>
                <div className="mt-1 text-[18px] font-semibold">{s.v}</div>
              </div>
            ))}
          </div>

          {[
            { c: "Notion", r: "Product Engineer", m: 88 },
            { c: "Stripe", r: "Frontend Engineer", m: 90 },
            { c: "Vercel", r: "DX Engineer", m: 94 },
          ].map((j, i) => (
            <div key={i} className="flex items-center gap-2.5 border-t border-border py-2">
              <div className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-[4px] border border-border bg-muted text-[10px] font-semibold text-muted-foreground">
                {j.c[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[11.5px] font-medium">{j.r}</div>
                <div className="text-[10.5px] text-subtle-foreground">{j.c}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-[3px] w-8 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${j.m}%` }}
                  />
                </div>
                <span className="tabular-nums text-[10px] text-muted-foreground">{j.m}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tagline */}
      <div>
        <p className="max-w-[380px] text-[22px] font-semibold leading-[1.25] tracking-[-0.025em]">
          One cycle — dozens of sources. Apply with intention.
        </p>
        <div className="mt-4 flex gap-5 text-[12px] text-muted-foreground">
          <span>● 2 800+ candidates</span>
          <span>● 14 platforms</span>
          <span>● Free</span>
        </div>
      </div>
    </div>
  );
}

export const AuthPageShell: React.FC<AuthPageShellProps> = ({
  title,
  subtitle,
  children,
  footer,
  className,
}) => {
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Form panel */}
      <div className="flex w-full flex-col overflow-y-auto px-10 py-10 md:w-[min(48%,560px)] md:shrink-0">
        <div className="flex flex-1 flex-col justify-center">
          <div className="mx-auto w-full max-w-[380px]">
            <h1 className="text-[28px] font-semibold tracking-[-0.025em]">{title}</h1>
            {subtitle && (
              <p className="mt-1.5 mb-7 text-[14px] text-muted-foreground">{subtitle}</p>
            )}
            <div className={className}>{children}</div>
            {footer && (
              <div className="mt-8 space-y-2 text-center text-[11px] text-subtle-foreground">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Brand panel */}
      <BrandPanel />
    </div>
  );
};
