# نتيجة اختبار Webhook اليدوي لمسودة n8n

## الطلب

شُغّل وضع اختبار Webhook من داخل المسودة غير المنشورة `DRAFT - Egy-Pioneers Webinar Welcome & Reminders`، ثم أُرسل طلب POST واحد إلى رابط الاختبار بالبيانات الوصفية الآمنة التالية: `messageType: welcome` و`whatsappConsent: true` و`draftStatus: queued_for_review_no_send`.

## الاستجابة

أعاد رابط الاختبار HTTP `200` بالاستجابة:

```json
{"queued":true,"messageType":"welcome","delivery":"not_configured"}
```

هذا يثبت أن المسار استقبل بيانات `queued` وتوقف عند رد الاستلام المقصود. لا يوجد مزود WhatsApp في المسودة، ولا Trigger أو Schedule أو Publish، ولذلك لا يمكن أن تكون قد خرجت رسالة WhatsApp في هذا الاختبار.
