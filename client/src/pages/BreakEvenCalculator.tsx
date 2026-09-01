import { useEffect } from "react";

import { BreakEvenCard } from "@/components/calculator/BreakEvenCard";
import { InputsCard } from "@/components/calculator/InputsCard";
import { ScenariosTable } from "@/components/calculator/ScenariosTable";
import { VerdictCard } from "@/components/calculator/VerdictCard";
import { PageShell } from "@/components/panel/PageShell";
import { getVerdict, profitAt, scenarios } from "@/lib/breakeven";
import { useModel } from "@/lib/useModel";

const TITLE = "حاسبة أقصى تكلفة إعلان للأوردر | حد التعادل";

export default function BreakEvenCalculator() {
  const { model, state, setProduct, setActualCpaRaw } = useModel();
  const actualCpa = model.manualCpa;

  useEffect(() => {
    document.title = TITLE;
  }, []);

  return (
    <PageShell
      badge="شيت الأرقام ⚡️"
      title="متاخدش قرار بالإحساس — خلي الأرقام تتكلم"
      subtitle="اكتب أرقام منتجك، وهنقولك أكبر مبلغ تدفعه إعلانات على الأوردر قبل ما تبدأ تخسر."
    >
      <main className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
        <div className="order-1">
          <InputsCard
            values={state.product}
            onChange={setProduct}
            actualCpa={state.actualCpaRaw}
            onActualCpaChange={setActualCpaRaw}
            total={model.total}
          />
        </div>

        <div className="order-2 space-y-4">
          <BreakEvenCard
            breakEven={model.be}
            margin={model.margin}
            actualCpa={actualCpa}
            profit={
              actualCpa === null ? null : profitAt(state.product, actualCpa)
            }
          />
          <VerdictCard
            verdict={getVerdict(model.margin, actualCpa, model.be)}
            breakEven={model.be}
          />
          <ScenariosTable
            rows={scenarios(state.product)}
            price={state.product.price}
          />
        </div>
      </main>

      <footer className="mt-6 border-t border-border pt-4 text-[12px] leading-6 text-muted-foreground">
        الحسبة: سعر البيع − (تكلفة المنتج + الشحن + التشغيل + المصاريف الزيادة)
        = أقصى تكلفة إعلان للأوردر عند التعادل.
      </footer>
    </PageShell>
  );
}
