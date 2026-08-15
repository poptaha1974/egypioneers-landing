export const WEBINAR_MESSAGE_TYPES = ["welcome", "reminder_24h", "reminder_3h"] as const;
export type WebinarMessageType = (typeof WEBINAR_MESSAGE_TYPES)[number];

export const WEBINAR_MESSAGE_TEXT: Record<WebinarMessageType, (firstName: string) => string> = {
  welcome: (firstName) => `أهلاً يا ${firstName}، تم تسجيلك في الجزء المفتوح من ويبنار Egy-Pioneers الأسبوعي يوم الأربعاء من 6 إلى 9 مساءً بتوقيت القاهرة. أول 30 دقيقة مفتوحة، وبعدها تستكمل الورشة لأعضاء نادي تجار العرب. قبل الموعد بساعة هنرسل لك تفاصيل الدخول هنا. لو لم تطلب التسجيل أو لا تريد متابعة الرسائل، اكتب لنا: إلغاء.`,
  reminder_24h: (firstName) => `أهلاً يا ${firstName}، فاضل يوم على ويبنار Egy-Pioneers غداً الأربعاء من 6 إلى 9 مساءً بتوقيت القاهرة. احفظ الموعد، ورابط الدخول هيوصلك هنا قبل البداية بساعة. لو لا تريد متابعة الرسائل، اكتب لنا: إلغاء.`,
  reminder_3h: (firstName) => `مساء الخير يا ${firstName}، فاضل 3 ساعات على ويبنار Egy-Pioneers اليوم الساعة 6 مساءً بتوقيت القاهرة. جهّز مكان هادئ ودفتر ملاحظات، ورابط الدخول هيوصلك هنا قبل الموعد بساعة. لو ظروفك اتغيرت، اكتب لنا: تأجيل أو إلغاء.`,
};

export function canQueueWebinarMessage(input: { whatsappConsent: number; alreadyLogged: boolean }) {
  return input.whatsappConsent === 1 && !input.alreadyLogged;
}
