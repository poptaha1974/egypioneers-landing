/** تسميات عربية لمراحل وحالات الـCRM — مشتركة بين الواجهة والباك إند. */

export const CRM_STAGE_LABELS_AR = {
  new: "جديد",
  contacted: "اتواصلنا",
  qualified: "مؤهَّل",
  enrolled: "اشترك",
  onboarding: "تهيئة",
  active: "نشط",
  at_risk: "معرّض للفقد",
  recovered: "اتسترد",
  churned: "فُقد",
} as const;

export const CRM_STATUS_LABELS_AR = {
  open: "مفتوح",
  waiting: "منتظر رد",
  closed_won: "مقفول ناجح",
  closed_lost: "مقفول خاسر",
} as const;

export type CrmStage = keyof typeof CRM_STAGE_LABELS_AR;
export type CrmStatus = keyof typeof CRM_STATUS_LABELS_AR;
