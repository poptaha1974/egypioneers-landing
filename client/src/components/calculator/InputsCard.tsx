import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatEgp, type CalcInputs } from "@/lib/breakeven";

const FIELDS: Array<{ key: keyof CalcInputs; label: string; hint: string }> = [
  {
    key: "price",
    label: "سعر البيع",
    hint: "السعر اللي العميل بيدفعه للأوردر",
  },
  { key: "productCost", label: "تكلفة المنتج", hint: "سعر الشراء أو التصنيع" },
  { key: "shipping", label: "الشحن", hint: "متوسط تكلفة التوصيل والمرتجع" },
  { key: "operating", label: "التشغيل", hint: "تأكيد الأوردر، تغليف، عمولات" },
  {
    key: "extra",
    label: "مصاريف زيادة",
    hint: "أي بند تاني بيتحمّل على الأوردر",
  },
];

type InputsCardProps = {
  values: CalcInputs;
  onChange: (key: keyof CalcInputs, value: number) => void;
  actualCpa: string;
  onActualCpaChange: (raw: string) => void;
  total: number;
};

export function InputsCard({
  values,
  onChange,
  actualCpa,
  onActualCpaChange,
  total,
}: InputsCardProps) {
  return (
    <Card className="gap-0 border-border bg-card p-4">
      <h2 className="text-[15px] font-black text-card-foreground">
        أرقام الأوردر
      </h2>
      <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
        كل الأرقام للأوردر الواحد بالجنيه المصري.
      </p>

      <div className="mt-4 space-y-3">
        {FIELDS.map(field => (
          <div key={field.key}>
            <Label
              htmlFor={`field-${field.key}`}
              className="text-[13px] font-bold text-card-foreground"
            >
              {field.label}
            </Label>
            <Input
              id={`field-${field.key}`}
              type="number"
              inputMode="decimal"
              min={0}
              dir="ltr"
              className="mt-1.5 text-left"
              value={Number.isFinite(values[field.key]) ? values[field.key] : 0}
              onFocus={event => event.currentTarget.select()}
              onChange={event => {
                const parsed = Number(event.target.value);
                onChange(field.key, Number.isFinite(parsed) ? parsed : 0);
              }}
            />
            <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
              {field.hint}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
        <span className="text-[12px] font-bold text-muted-foreground">
          إجمالي التكاليف
        </span>
        <span dir="ltr" className="text-[15px] font-black text-card-foreground">
          {formatEgp(total)}
        </span>
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <Label
          htmlFor="field-actual-cpa"
          className="text-[13px] font-bold text-card-foreground"
        >
          تكلفة الإعلان الفعلية للأوردر{" "}
          <span className="font-normal text-muted-foreground">(اختياري)</span>
        </Label>
        <Input
          id="field-actual-cpa"
          type="number"
          inputMode="decimal"
          min={0}
          dir="ltr"
          placeholder="مثال: 120"
          className="mt-1.5 text-left"
          value={actualCpa}
          onChange={event => onActualCpaChange(event.target.value)}
        />
        <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
          خدها من مدير الإعلانات: المصروف ÷ عدد الأوردرات.
        </p>
      </div>
    </Card>
  );
}
