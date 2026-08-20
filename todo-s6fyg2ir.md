# Project TODO

- [x] مراجعة مسار تسجيل الويبنار الحالي وتحديد نقطة إنشاء payload.
- [x] التقاط fbclid من رابط الصفحة وfbp من Cookie وإرسالهما مع التسجيل.
- [x] تمرير عنوان صفحة الويب إلى CAPI لتثبيت مصدر الحدث.
- [x] توليد event_id ثابت في المتصفح وتمريره إلى n8n لتوحيد Browser Pixel وCAPI.
- [x] تحديث اختبارات Vitest لمسار التسجيل ومعرّفات Meta.
- [x] اختبار TypeScript واختبارات Vitest لمعّرّفات Meta ومسار التسليم.
- [x] تنفيذ تسجيل اختبار حي بمعرّف event_id وfbp والتحقق من payload داخل n8n.
- [x] التحقق من قبول Meta CAPI للـpayload بعد تصحيح صيغة fbc وfbp في اختبار مباشر.
- [x] تنفيذ تسجيل حي من واجهة الإنتاج مع fbclid محفوظ فعلياً والتحقق من وصوله إلى n8n.
- [x] تأكيد أن اختبار واجهة الإنتاج مع fbclid يقبله Meta CAPI بـ events_received: 1.
- [x] إعداد Prompt تسليم كامل لـComputer (Perplexity).
- [x] حفظ Checkpoint منشور بعد تحقق الإصلاحات.
