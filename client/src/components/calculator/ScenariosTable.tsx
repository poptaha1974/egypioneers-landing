import { Card } from "@/components/ui/card";
import {
  formatEgp,
  formatPct,
  type ScenarioRow,
  type Tone,
} from "@/lib/breakeven";

const PROFIT_TONE: Record<Tone, string> = {
  safe: "text-emerald-400",
  tight: "text-amber-400",
  loss: "text-rose-400",
};

type ScenariosTableProps = {
  rows: ScenarioRow[];
  price: number;
};

export function ScenariosTable({ rows, price }: ScenariosTableProps) {
  return (
    <Card className="gap-0 border-border bg-card p-4">
      <h2 className="text-[15px] font-black text-card-foreground">
        لو دفعت كام على الأوردر؟
      </h2>
      <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
        ربح الأوردر الواحد عند سعر بيع <span dir="ltr">{formatEgp(price)}</span>
        .
      </p>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-right">
          <thead>
            <tr className="border-b border-border text-[11px] font-bold text-muted-foreground">
              <th className="py-2 pl-2 font-bold">السيناريو</th>
              <th className="py-2 pl-2 font-bold">تكلفة الإعلان</th>
              <th className="py-2 pl-2 font-bold">ربح الأوردر</th>
              <th className="py-2 pl-2 font-bold">هامش صافي</th>
              <th className="py-2 font-bold">ROAS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr
                key={row.ratio}
                className="border-b border-border/60 last:border-0 text-[13px]"
              >
                <td className="py-2.5 pl-2 font-bold text-card-foreground">
                  {row.label}
                </td>
                <td
                  dir="ltr"
                  className="py-2.5 pl-2 text-right text-card-foreground"
                >
                  {formatEgp(row.cpa)}
                </td>
                <td
                  dir="ltr"
                  className={`py-2.5 pl-2 text-right font-black ${PROFIT_TONE[row.tone]}`}
                >
                  {formatEgp(row.profit)}
                </td>
                <td
                  dir="ltr"
                  className="py-2.5 pl-2 text-right text-muted-foreground"
                >
                  {formatPct(row.netMarginPct)}
                </td>
                <td
                  dir="ltr"
                  className="py-2.5 text-right text-muted-foreground"
                >
                  {row.roas === null ? "—" : row.roas.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
