import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type EntryFieldKey =
  | "ordersPlaced"
  | "ordersConfirmed"
  | "ordersDelivered"
  | "ordersReturned"
  | "collectedRevenueMinor"
  | "productCostMinor"
  | "adSpendMinor"
  | "shippingMinor"
  | "collectionFeesMinor"
  | "returnCostMinor"
  | "variableOpsMinor"
  | "leadsCount"
  | "sessionsCount";

type FieldSpec = { key: EntryFieldKey; label: string; unit: "count" | "egp" };

const FIELDS: FieldSpec[] = [
  { key: "ordersPlaced", label: "أوردرات واردة", unit: "count" },
  { key: "ordersConfirmed", label: "أوردرات مؤكدة", unit: "count" },
  { key: "ordersDelivered", label: "أوردرات مسلَّمة", unit: "count" },
  { key: "ordersReturned", label: "أوردرات مرتجعة", unit: "count" },
  { key: "collectedRevenueMinor", label: "إيراد محصَّل", unit: "egp" },
  { key: "productCostMinor", label: "تكلفة المنتج", unit: "egp" },
  { key: "adSpendMinor", label: "مصروف الإعلان", unit: "egp" },
  { key: "shippingMinor", label: "الشحن", unit: "egp" },
  { key: "collectionFeesMinor", label: "رسوم التحصيل", unit: "egp" },
  { key: "returnCostMinor", label: "تكلفة المرتجع", unit: "egp" },
  { key: "variableOpsMinor", label: "تشغيل متغير", unit: "egp" },
  { key: "leadsCount", label: "ليدز", unit: "count" },
  { key: "sessionsCount", label: "جلسات", unit: "count" },
];

export type DailyValues = Partial<Record<EntryFieldKey, number | null>>;

type DailyEntryFormProps = {
  entryDate: string;
  onEntryDateChange: (date: string) => void;
  initialValues: DailyValues;
  initialNotes: string;
  onSubmit: (payload: { values: DailyValues; notes: string | null }) => void;
  saving: boolean;
  savedAt: string | null;
};

const toText = (
  value: number | null | undefined,
  unit: FieldSpec["unit"]
): string => {
  if (value === null || value === undefined) return "";
  return unit === "egp" ? String(value / 100) : String(value);
};

/**
 * الحقل المتساب فاضي بيتخزن «غير متجمّع» مش صفر.
 * لو اليوم فعلاً بصفر، اكتب 0 بنفسك — الفرق ده بيغيّر كل حساب بعد كده.
 */
export function DailyEntryForm({
  entryDate,
  onEntryDateChange,
  initialValues,
  initialNotes,
  onSubmit,
  saving,
  savedAt,
}: DailyEntryFormProps) {
  const [text, setText] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState(initialNotes);

  useEffect(() => {
    setText(
      Object.fromEntries(
        FIELDS.map(field => [
          field.key,
          toText(initialValues[field.key], field.unit),
        ])
      )
    );
    setNotes(initialNotes);
  }, [entryDate, initialValues, initialNotes]);

  const handleSubmit = () => {
    const values: DailyValues = {};
    for (const field of FIELDS) {
      const raw = (text[field.key] ?? "").trim();
      if (raw === "") {
        values[field.key] = null;
        continue;
      }
      const parsed = Number(raw);
      if (!Number.isFinite(parsed) || parsed < 0) {
        values[field.key] = null;
        continue;
      }
      values[field.key] =
        field.unit === "egp" ? Math.round(parsed * 100) : Math.round(parsed);
    }
    onSubmit({ values, notes: notes.trim() === "" ? null : notes.trim() });
  };

  const missingCount = FIELDS.filter(
    field => (text[field.key] ?? "").trim() === ""
  ).length;

  return (
    <Card className="gap-0 border-border bg-card p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-black text-card-foreground">
            إدخال اليوم
          </h2>
          <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
            الحقل اللي هتسيبه فاضي هيتسجل «غير متجمّع» — ولو اليوم فعلاً صفر،
            اكتب 0.
          </p>
        </div>
        <div>
          <Label
            htmlFor="entry-date"
            className="text-[12px] font-bold text-card-foreground"
          >
            التاريخ
          </Label>
          <Input
            id="entry-date"
            type="date"
            dir="ltr"
            className="mt-1 w-[170px] text-left"
            value={entryDate}
            onChange={event => onEntryDateChange(event.target.value)}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {FIELDS.map(field => (
          <div key={field.key}>
            <Label
              htmlFor={`entry-${field.key}`}
              className="text-[12px] font-bold text-card-foreground"
            >
              {field.label}
              {field.unit === "egp" ? (
                <span className="font-normal text-muted-foreground">
                  {" "}
                  (ج.م)
                </span>
              ) : null}
            </Label>
            <Input
              id={`entry-${field.key}`}
              type="number"
              inputMode="decimal"
              min={0}
              dir="ltr"
              placeholder="غير متجمّع"
              className="mt-1 text-left"
              value={text[field.key] ?? ""}
              onChange={event =>
                setText(current => ({
                  ...current,
                  [field.key]: event.target.value,
                }))
              }
            />
          </div>
        ))}
      </div>

      <div className="mt-3">
        <Label
          htmlFor="entry-notes"
          className="text-[12px] font-bold text-card-foreground"
        >
          ملاحظات اليوم
        </Label>
        <Textarea
          id="entry-notes"
          className="mt-1 min-h-[64px]"
          placeholder="حصل إيه النهارده؟ عطل شحن، تغيير سعر، حملة جديدة…"
          value={notes}
          onChange={event => setNotes(event.target.value)}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-[11px] text-muted-foreground">
          {missingCount === 0
            ? "كل الحقول متسجلة"
            : `${missingCount} حقل هيتسجل «غير متجمّع»`}
          {savedAt ? ` · آخر حفظ ${savedAt}` : ""}
        </span>
        <Button onClick={handleSubmit} disabled={saving} className="font-bold">
          {saving ? "بيحفظ…" : "احفظ اليوم"}
        </Button>
      </div>
    </Card>
  );
}
