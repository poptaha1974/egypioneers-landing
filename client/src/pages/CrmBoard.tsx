import { useEffect, useState } from "react";
import { MessageCircle, Phone, Mail, Users, StickyNote } from "lucide-react";

import { PageShell } from "@/components/panel/PageShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  CRM_STAGE_LABELS_AR,
  CRM_STATUS_LABELS_AR,
  type CrmStage,
} from "@shared/crm/labels";

const TITLE = "CRM | رحلة العميل وحالته";

const STAGES = Object.keys(CRM_STAGE_LABELS_AR) as CrmStage[];

const CHANNELS = [
  { key: "whatsapp", label: "واتساب", icon: MessageCircle },
  { key: "call", label: "مكالمة", icon: Phone },
  { key: "email", label: "إيميل", icon: Mail },
  { key: "meeting", label: "مقابلة", icon: Users },
  { key: "note", label: "ملاحظة", icon: StickyNote },
] as const;

export default function CrmBoard() {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();

  const [stageFilter, setStageFilter] = useState<CrmStage | "">("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [channel, setChannel] =
    useState<(typeof CHANNELS)[number]["key"]>("whatsapp");
  const [summary, setSummary] = useState("");
  const [stageAfter, setStageAfter] = useState<CrmStage | "">("");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  useEffect(() => {
    document.title = TITLE;
  }, []);

  const isAdmin = user?.role === "admin";

  const records = trpc.crm.list.useQuery(
    stageFilter === "" ? undefined : { stage: stageFilter },
    {
      enabled: isAdmin,
    }
  );
  const interactions = trpc.crm.interactions.useQuery(
    { crmRecordId: selectedId ?? 0 },
    { enabled: isAdmin && selectedId !== null }
  );

  const createRecord = trpc.crm.create.useMutation({
    onSuccess: () => {
      setNewName("");
      setNewPhone("");
      void utils.crm.list.invalidate();
    },
  });

  const logInteraction = trpc.crm.logInteraction.useMutation({
    onSuccess: () => {
      setSummary("");
      setStageAfter("");
      void utils.crm.list.invalidate();
      void utils.crm.interactions.invalidate();
    },
  });

  if (loading) {
    return (
      <PageShell badge="CRM" title="بنحمّل…" subtitle="ثانية واحدة.">
        <div className="h-40" />
      </PageShell>
    );
  }

  if (!isAdmin) {
    return (
      <PageShell
        badge="CRM"
        title="الصفحة دي لفريق خدمة العملاء"
        subtitle="محتاج صلاحية إدارة عشان تشوف سجلات العملاء."
      >
        <div className="h-20" />
      </PageShell>
    );
  }

  const selected =
    records.data?.find(record => record.id === selectedId) ?? null;

  return (
    <PageShell
      badge="خدمة العملاء"
      title="رحلة كل عميل — مكتوبة مش محفوظة في الدماغ"
      subtitle="سجّل كل تواصل وحالة، والقمع بيتحدّث لوحده والشيت المجمع بيتزامن."
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button
          variant={stageFilter === "" ? "default" : "secondary"}
          className="h-8 font-bold"
          onClick={() => setStageFilter("")}
        >
          الكل
        </Button>
        {STAGES.map(stage => (
          <Button
            key={stage}
            variant={stageFilter === stage ? "default" : "secondary"}
            className="h-8 font-bold"
            onClick={() => setStageFilter(stage)}
          >
            {CRM_STAGE_LABELS_AR[stage]}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_380px]">
        <Card className="gap-0 border-border bg-card p-4">
          <h2 className="text-[15px] font-black text-card-foreground">
            السجلات
          </h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-right text-[12px]">
              <thead>
                <tr className="border-b border-border text-[11px] font-bold text-muted-foreground">
                  <th className="py-2 pl-3 font-bold">الاسم</th>
                  <th className="py-2 pl-3 font-bold">الموبايل</th>
                  <th className="py-2 pl-3 font-bold">المرحلة</th>
                  <th className="py-2 pl-3 font-bold">الحالة</th>
                  <th className="py-2 pl-3 font-bold">تفاعلات</th>
                  <th className="py-2 font-bold" />
                </tr>
              </thead>
              <tbody>
                {(records.data ?? []).length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-6 text-center text-muted-foreground"
                    >
                      مفيش سجلات في المرحلة دي
                    </td>
                  </tr>
                ) : (
                  records.data?.map(record => (
                    <tr
                      key={record.id}
                      className={`border-b border-border/60 last:border-0 ${record.id === selectedId ? "bg-primary/5" : ""}`}
                    >
                      <td className="py-2 pl-3 font-bold text-card-foreground">
                        {record.displayName}
                      </td>
                      <td
                        dir="ltr"
                        className="py-2 pl-3 text-right text-muted-foreground"
                      >
                        {record.phone ?? "—"}
                      </td>
                      <td className="py-2 pl-3 text-muted-foreground">
                        {CRM_STAGE_LABELS_AR[record.stage as CrmStage]}
                      </td>
                      <td className="py-2 pl-3 text-muted-foreground">
                        {
                          CRM_STATUS_LABELS_AR[
                            record.status as keyof typeof CRM_STATUS_LABELS_AR
                          ]
                        }
                      </td>
                      <td
                        dir="ltr"
                        className="py-2 pl-3 text-right text-muted-foreground"
                      >
                        {record.interactionsCount}
                      </td>
                      <td className="py-2">
                        <Button
                          variant="ghost"
                          className="h-7 text-[11px] font-bold"
                          onClick={() => setSelectedId(record.id)}
                        >
                          افتح
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="gap-0 border-border bg-card p-4">
            <h2 className="text-[15px] font-black text-card-foreground">
              سجل جديد
            </h2>
            <div className="mt-3 space-y-2">
              <div>
                <Label
                  htmlFor="crm-name"
                  className="text-[12px] font-bold text-card-foreground"
                >
                  الاسم
                </Label>
                <Input
                  id="crm-name"
                  className="mt-1"
                  value={newName}
                  onChange={event => setNewName(event.target.value)}
                />
              </div>
              <div>
                <Label
                  htmlFor="crm-phone"
                  className="text-[12px] font-bold text-card-foreground"
                >
                  الموبايل
                </Label>
                <Input
                  id="crm-phone"
                  dir="ltr"
                  className="mt-1 text-left"
                  value={newPhone}
                  onChange={event => setNewPhone(event.target.value)}
                />
              </div>
              <Button
                className="w-full font-bold"
                disabled={newName.trim().length < 2 || createRecord.isPending}
                onClick={() =>
                  createRecord.mutate({
                    displayName: newName.trim(),
                    phone: newPhone.trim() || null,
                  })
                }
              >
                {createRecord.isPending ? "بيضيف…" : "أضف"}
              </Button>
            </div>
          </Card>

          {selected ? (
            <Card className="gap-0 border-border bg-card p-4">
              <h2 className="text-[15px] font-black text-card-foreground">
                {selected.displayName}
              </h2>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {CRM_STAGE_LABELS_AR[selected.stage as CrmStage]} ·{" "}
                {
                  CRM_STATUS_LABELS_AR[
                    selected.status as keyof typeof CRM_STATUS_LABELS_AR
                  ]
                }
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {CHANNELS.map(option => {
                  const Icon = option.icon;
                  return (
                    <Button
                      key={option.key}
                      variant={channel === option.key ? "default" : "secondary"}
                      className="h-8 text-[11px] font-bold"
                      onClick={() => setChannel(option.key)}
                    >
                      <Icon className="ml-1 h-3.5 w-3.5" />
                      {option.label}
                    </Button>
                  );
                })}
              </div>

              <Textarea
                className="mt-3 min-h-[70px]"
                placeholder="حصل إيه في التواصل ده؟"
                value={summary}
                onChange={event => setSummary(event.target.value)}
              />

              <div className="mt-2">
                <Label
                  htmlFor="crm-stage-after"
                  className="text-[12px] font-bold text-card-foreground"
                >
                  المرحلة بعد التواصل (اختياري)
                </Label>
                <select
                  id="crm-stage-after"
                  className="mt-1 h-9 w-full rounded-md border border-border bg-input px-2 text-[13px] text-card-foreground"
                  value={stageAfter}
                  onChange={event =>
                    setStageAfter(event.target.value as CrmStage | "")
                  }
                >
                  <option value="">من غير تغيير</option>
                  {STAGES.map(stage => (
                    <option key={stage} value={stage}>
                      {CRM_STAGE_LABELS_AR[stage]}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                className="mt-3 w-full font-bold"
                disabled={
                  summary.trim().length === 0 || logInteraction.isPending
                }
                onClick={() =>
                  logInteraction.mutate({
                    crmRecordId: selected.id,
                    channel,
                    summary: summary.trim(),
                    ...(stageAfter === "" ? {} : { stageAfter }),
                  })
                }
              >
                {logInteraction.isPending ? "بيسجل…" : "سجّل التواصل"}
              </Button>

              <ul className="mt-4 space-y-2 border-t border-border pt-3">
                {(interactions.data ?? []).map(item => (
                  <li
                    key={item.id}
                    className="rounded-lg border border-border bg-muted/20 p-2"
                  >
                    <div className="flex items-baseline justify-between gap-2 text-[11px] text-muted-foreground">
                      <span className="font-bold text-card-foreground">
                        {CHANNELS.find(option => option.key === item.channel)
                          ?.label ?? item.channel}
                      </span>
                      <span dir="ltr">
                        {new Date(item.occurredAt).toLocaleString("en-GB")}
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] leading-5 text-card-foreground">
                      {item.summary}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      </div>
    </PageShell>
  );
}
