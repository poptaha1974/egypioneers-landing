# تحقق وسم حالة السجل داخل مسودة n8n

أظهر اختبار Webhook اليدوي مساراً ناجحاً حتى `Respond to Webhook` واستجابة HTTP 200 بالقيمة `delivery: not_configured`. في مخرجات عقدة `Deduplication pending` ظهر الحقل `draftLogStatus` بالقيمة `draft_received_no_send`، إلى جانب `draftStatus: queued_for_review_no_send` و`requiresServerLogCheck: true`.

بقي زر `Publish` ظاهراً. لم تُضف عقدة مزود WhatsApp، أو Trigger دائم، أو Schedule، أو أي خطوة إرسال.
