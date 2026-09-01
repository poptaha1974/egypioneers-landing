/**
 * تعريف تابات الشيت المجمع (للإدارة فقط — الطالب ما بيشوفهوش).
 *
 * قاعدة ثابتة: القيمة الناقصة بتتكتب خلية فاضية، مش صفر.
 * الصفر رقم، والفاضي اعتراف بإن البيان مش متجمّع (مبدأ THINC رقم 2).
 */

export const SHEET_TABS = {
  students: "الطلاب",
  dailyEntries: "الإدخال اليومي",
  crm: "CRM",
  thinc: "قرارات THINC",
} as const;

export type SheetTabKey = keyof typeof SHEET_TABS;

export const SHEET_HEADERS: Record<SheetTabKey, string[]> = {
  students: [
    "المفتاح",
    "معرف الطالب",
    "الاسم",
    "الموبايل",
    "الإيميل",
    "الدفعة",
    "اسم المتجر",
    "السوق",
    "الحالة",
    "تاريخ الانضمام",
    "آخر تحديث",
  ],
  dailyEntries: [
    "المفتاح",
    "معرف الطالب",
    "اسم الطالب",
    "التاريخ",
    "أوردرات واردة",
    "أوردرات مؤكدة",
    "أوردرات مسلَّمة",
    "أوردرات مرتجعة",
    "إيراد محصَّل",
    "تكلفة المنتج",
    "مصروف الإعلان",
    "الشحن",
    "رسوم التحصيل",
    "تكلفة المرتجع",
    "تشغيل متغير",
    "ليدز",
    "جلسات",
    "ربح المساهمة المسلَّم",
    "المصدر",
    "ملاحظات",
    "آخر تحديث",
  ],
  crm: [
    "المفتاح",
    "معرف السجل",
    "الاسم",
    "الموبايل",
    "المرحلة",
    "الحالة",
    "المسؤول",
    "آخر تواصل",
    "الإجراء القادم",
    "عدد التفاعلات",
    "آخر تحديث",
  ],
  thinc: [
    "المفتاح",
    "معرف التقييم",
    "معرف الطالب",
    "من تاريخ",
    "إلى تاريخ",
    "القرار",
    "جودة البيانات",
    "عدم اليقين",
    "البوابات الساقطة",
    "البوابات غير القابلة للتقييم",
    "أسباب القرار",
    "نسخة النموذج",
    "تاريخ الدليل",
    "حالة المراجعة",
    "أُنشئ في",
  ],
};

/** القيمة الناقصة خلية فاضية — ممنوع تتحول لصفر. */
export const cell = (
  value: number | string | null | undefined
): string | number => (value === null || value === undefined ? "" : value);

/** المبالغ متخزنة بالقرش؛ الشيت بيعرضها بالجنيه عشان تبقى مقروءة للإدارة. */
export const minorToEgp = (
  minor: number | null | undefined
): string | number =>
  minor === null || minor === undefined ? "" : Number((minor / 100).toFixed(2));

export type StudentRow = {
  id: number;
  fullName: string;
  phone: string | null;
  email: string | null;
  cohort: string | null;
  storeName: string | null;
  market: string;
  status: string;
  joinedAt: string;
  updatedAt: string;
};

export const studentRowKey = (studentId: number) => `S-${studentId}`;

export function buildStudentRow(student: StudentRow): Array<string | number> {
  return [
    studentRowKey(student.id),
    student.id,
    student.fullName,
    cell(student.phone),
    cell(student.email),
    cell(student.cohort),
    cell(student.storeName),
    student.market,
    student.status,
    student.joinedAt,
    student.updatedAt,
  ];
}

export type DailyEntryRow = {
  studentId: number;
  studentName: string;
  entryDate: string;
  ordersPlaced: number | null;
  ordersConfirmed: number | null;
  ordersDelivered: number | null;
  ordersReturned: number | null;
  collectedRevenueMinor: number | null;
  productCostMinor: number | null;
  adSpendMinor: number | null;
  shippingMinor: number | null;
  collectionFeesMinor: number | null;
  returnCostMinor: number | null;
  variableOpsMinor: number | null;
  leadsCount: number | null;
  sessionsCount: number | null;
  contributionMarginMinor: number | null;
  source: string;
  notes: string | null;
  updatedAt: string;
};

export const dailyEntryRowKey = (studentId: number, entryDate: string) =>
  `D-${studentId}-${entryDate}`;

export function buildDailyEntryRow(
  entry: DailyEntryRow
): Array<string | number> {
  return [
    dailyEntryRowKey(entry.studentId, entry.entryDate),
    entry.studentId,
    entry.studentName,
    entry.entryDate,
    cell(entry.ordersPlaced),
    cell(entry.ordersConfirmed),
    cell(entry.ordersDelivered),
    cell(entry.ordersReturned),
    minorToEgp(entry.collectedRevenueMinor),
    minorToEgp(entry.productCostMinor),
    minorToEgp(entry.adSpendMinor),
    minorToEgp(entry.shippingMinor),
    minorToEgp(entry.collectionFeesMinor),
    minorToEgp(entry.returnCostMinor),
    minorToEgp(entry.variableOpsMinor),
    cell(entry.leadsCount),
    cell(entry.sessionsCount),
    minorToEgp(entry.contributionMarginMinor),
    entry.source,
    cell(entry.notes),
    entry.updatedAt,
  ];
}

export type CrmRow = {
  id: number;
  displayName: string;
  phone: string | null;
  stage: string;
  status: string;
  ownerName: string | null;
  lastContactAt: string | null;
  nextActionAt: string | null;
  interactionsCount: number;
  updatedAt: string;
};

export const crmRowKey = (recordId: number) => `C-${recordId}`;

export function buildCrmRow(record: CrmRow): Array<string | number> {
  return [
    crmRowKey(record.id),
    record.id,
    record.displayName,
    cell(record.phone),
    record.stage,
    record.status,
    cell(record.ownerName),
    cell(record.lastContactAt),
    cell(record.nextActionAt),
    record.interactionsCount,
    record.updatedAt,
  ];
}

export type ThincRow = {
  id: number;
  studentId: number;
  periodStart: string;
  periodEnd: string;
  decision: string;
  dataQuality: string;
  uncertainty: string;
  failedGates: string[];
  notEvaluableGates: string[];
  decisionReasons: string[];
  modelVersion: string;
  evidenceAsOf: string | null;
  reviewStatus: string;
  generatedAt: string;
};

export const thincRowKey = (evaluationId: number) => `T-${evaluationId}`;

export function buildThincRow(row: ThincRow): Array<string | number> {
  return [
    thincRowKey(row.id),
    row.id,
    row.studentId,
    row.periodStart,
    row.periodEnd,
    row.decision,
    row.dataQuality,
    row.uncertainty,
    row.failedGates.join(" | "),
    row.notEvaluableGates.join(" | "),
    row.decisionReasons.join(" | "),
    row.modelVersion,
    cell(row.evidenceAsOf),
    row.reviewStatus,
    row.generatedAt,
  ];
}
