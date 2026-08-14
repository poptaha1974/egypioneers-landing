export const STORE_URL = "https://egy-pioneers.swqly.net/home";

export const STORE_ONBOARDING_STEPS = [
  {
    number: "01",
    title: "سجّل دخولك",
    description: "افتح المنصة بحسابك علشان تحفظ اختياراتك وتتابع كل طلباتك من مكان واحد.",
  },
  {
    number: "02",
    title: "دور وقارن",
    description: "اتصفح التصنيفات، راجع التفاصيل وسعر المنتج، وبعدها ضيف اللي مناسبك للمفضلة أو السلة.",
  },
  {
    number: "03",
    title: "راجع واطلب",
    description: "اتأكد من المنتج والكمية قبل الطلب، وبعدها تابع حالته من صفحة الطلبات داخل المنصة.",
  },
] as const;

export function hasThreeStoreOnboardingSteps() {
  return STORE_ONBOARDING_STEPS.length === 3;
}

export function isEgyPioneersStoreUrl(value: string) {
  const url = new URL(value);

  return (
    url.protocol === "https:" &&
    url.hostname === "egy-pioneers.swqly.net" &&
    url.pathname === "/home"
  );
}
