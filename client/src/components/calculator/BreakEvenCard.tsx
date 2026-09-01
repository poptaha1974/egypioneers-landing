import { Card } from "@/components/ui/card";
import { formatEgp, formatPct } from "@/lib/breakeven";

type BreakEvenCardProps = {
  breakEven: number;
  margin: number;
  actualCpa: number | null;
  profit: number | null;
};

export function BreakEvenCard({
  breakEven,
  margin,
  actualCpa,
  profit,
}: BreakEvenCardProps) {
  const healthy = breakEven > 0;

  return (
    <Card className="gap-0 border-primary/30 bg-card p-4">
      <span className="text-[12px] font-bold text-muted-foreground">
        أقصى تكلفة إعلان للأوردر
      </span>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span
          dir="ltr"
          className={`text-[34px] font-black leading-none sm:text-[42px] ${healthy ? "text-primary" : "text-rose-400"}`}
        >
          {formatEgp(breakEven)}
        </span>
        <span className="text-[12px] font-bold text-muted-foreground">
          هامش {formatPct(margin)} من سعر البيع
        </span>
      </div>
      <p className="mt-2 text-[12px] leading-5 text-muted-foreground">
        {healthy
          ? "فوق الرقم ده بتدفع من جيبك على كل أوردر."
          : "تكاليفك أعلى من سعر البيع — مفيش مساحة إعلان أصلاً."}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3">
        <div>
          <span className="text-[11px] font-bold text-muted-foreground">
            تكلفتك الفعلية
          </span>
          <p
            dir="ltr"
            className="mt-0.5 text-right text-[16px] font-black text-card-foreground"
          >
            {actualCpa === null ? "—" : formatEgp(actualCpa)}
          </p>
        </div>
        <div>
          <span className="text-[11px] font-bold text-muted-foreground">
            ربح الأوردر
          </span>
          <p
            dir="ltr"
            className={`mt-0.5 text-right text-[16px] font-black ${
              profit === null
                ? "text-card-foreground"
                : profit > 0
                  ? "text-emerald-400"
                  : "text-rose-400"
            }`}
          >
            {profit === null ? "—" : formatEgp(profit)}
          </p>
        </div>
      </div>
    </Card>
  );
}
