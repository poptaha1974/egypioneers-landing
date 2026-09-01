import { Card } from "@/components/ui/card";
import { formatEgp, type Verdict, type VerdictTone } from "@/lib/breakeven";

const TONE_STYLES: Record<
  VerdictTone,
  { card: string; title: string; badge: string; label: string }
> = {
  safe: {
    card: "border-emerald-500/35 bg-emerald-500/10",
    title: "text-emerald-400",
    badge: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
    label: "وسّع",
  },
  tight: {
    card: "border-amber-500/35 bg-amber-500/10",
    title: "text-amber-400",
    badge: "border-amber-500/40 bg-amber-500/15 text-amber-300",
    label: "خد بالك",
  },
  loss: {
    card: "border-rose-500/35 bg-rose-500/10",
    title: "text-rose-400",
    badge: "border-rose-500/40 bg-rose-500/15 text-rose-300",
    label: "وقّف",
  },
  blocked: {
    card: "border-rose-500/35 bg-rose-500/10",
    title: "text-rose-400",
    badge: "border-rose-500/40 bg-rose-500/15 text-rose-300",
    label: "مشكلة في التسعير",
  },
  idle: {
    card: "border-border bg-card",
    title: "text-card-foreground",
    badge: "border-border bg-muted/50 text-muted-foreground",
    label: "في انتظار رقمك",
  },
};

type VerdictCardProps = {
  verdict: Verdict;
  breakEven: number;
};

export function VerdictCard({ verdict, breakEven }: VerdictCardProps) {
  const tone = TONE_STYLES[verdict.tone];

  return (
    <Card className={`gap-0 p-4 ${tone.card}`}>
      <span
        className={`inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${tone.badge}`}
      >
        {tone.label}
      </span>
      <h2 className={`mt-2 text-[19px] font-black leading-tight ${tone.title}`}>
        {verdict.title}
      </h2>
      <p className="mt-1.5 text-[13px] leading-6 text-muted-foreground">
        {verdict.detail}
      </p>
      <p className="mt-2 text-[13px] font-bold leading-6 text-card-foreground">
        {verdict.action}
      </p>
      <p className="mt-3 border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
        حد التعادل الحالي: <span dir="ltr">{formatEgp(breakEven)}</span>{" "}
        للأوردر.
      </p>
    </Card>
  );
}
