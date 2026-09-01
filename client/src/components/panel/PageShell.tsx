import type { ReactNode } from "react";

type PageShellProps = {
  badge: string;
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function PageShell({
  badge,
  title,
  subtitle,
  children,
}: PageShellProps) {
  return (
    <div dir="rtl" className="min-h-screen bg-background pb-12 font-display">
      <div className="mx-auto max-w-[1120px] px-4 pt-7 sm:px-6">
        <header className="mb-5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
            {badge}
          </span>
          <h1 className="mt-3 text-[26px] font-black leading-tight tracking-tight text-foreground sm:text-[38px]">
            {title}
          </h1>
          <p className="mt-2 text-[14px] leading-6 text-muted-foreground">
            {subtitle}
          </p>
        </header>
        {children}
      </div>
    </div>
  );
}
