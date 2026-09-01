import { Card } from "@/components/ui/card";
import type { StudentReport } from "@shared/export/report";

/**
 * عرض الجدول — بديل نصي لكل رسمة في الصفحة، ونفس الأرقام اللي بتتصدّر.
 * الخلية الفاضية معناها بيان غير متجمّع.
 */
export function ReportTable({ report }: { report: StudentReport }) {
  return (
    <Card className="gap-0 border-border bg-card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[15px] font-black text-card-foreground">
          جدول الأيام
        </h2>
        <span className="text-[11px] text-muted-foreground">
          الخلية الفاضية = غير متجمّع
        </span>
      </div>

      <div className="mt-3 max-h-[420px] overflow-auto">
        <table className="w-full min-w-[900px] border-collapse text-right text-[12px]">
          <caption className="sr-only">{report.title}</caption>
          <thead className="sticky top-0 bg-card">
            <tr className="border-b border-border text-[11px] font-bold text-muted-foreground">
              {report.columns.map(column => (
                <th
                  key={column}
                  scope="col"
                  className="whitespace-nowrap py-2 pl-3 font-bold"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {report.rows.length === 0 ? (
              <tr>
                <td
                  colSpan={report.columns.length}
                  className="py-6 text-center text-muted-foreground"
                >
                  مفيش أيام مسجّلة في الفترة دي
                </td>
              </tr>
            ) : (
              report.rows.map(row => (
                <tr
                  key={String(row[0])}
                  className="border-b border-border/60 last:border-0"
                >
                  {row.map((value, index) => (
                    <td
                      key={report.columns[index]}
                      dir={index === 0 ? "rtl" : "ltr"}
                      className={`whitespace-nowrap py-2 pl-3 ${index === 0 ? "font-bold text-card-foreground" : "text-right text-muted-foreground"}`}
                    >
                      {value === "" ? "—" : value}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
