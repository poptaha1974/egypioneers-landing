# تعديل وسم حالة مسودة n8n

تمت إعادة تسمية الحقل التوثيقي داخل عقدة `Deduplication pending` إلى `draftLogStatus` وضبط قيمته الثابتة على `draft_received_no_send`، مع الاحتفاظ بكل حقول الإدخال. العقدة لا تتصل بقاعدة بيانات أو مزود WhatsApp؛ هي تضع وسم حالة داخل تنفيذ المسودة فقط قبل `Respond to Webhook`.

لم يُضغط Publish، ولم يضف Trigger أو Schedule أو عقدة إرسال.
