def sales_note:
  "={{ (() => { const b = $('Normalize CRM Lead Payload').item.json.body || {}; const raw = (b.message && typeof b.message === 'object' ? b.message.body : b.message) || b.customData?.message || ''; const t = String(raw).trim(); const shown = t ? t.substring(0,120) : 'لم يكتب رسالة - تفاعل مع الإعلان فقط'; const e = b.engagement_summary || {}; const count = Number(e.interactionCount || 0); const behavior = count > 0 ? ' | السلوك المرصود: أقسام=' + (Array.isArray(e.sectionsViewed) ? e.sectionsViewed.join(',') : '—') + '؛ أسئلة=' + (Array.isArray(e.faqsOpened) ? e.faqsOpened.join(',') : '—') + '؛ فيديو=' + (e.videoCompleted ? 'مكتمل' : e.videoStarted ? 'بدأ' : 'لا') + '؛ نوايا=' + (Array.isArray(e.decisionTouches) ? e.decisionTouches.join(',') : '—') + '؛ عدد=' + count : ''; return 'الرسالة: ' + shown + ' | التحليل: ' + String($json.choices[0].message.content).replace(/[\\n\\r]/g,' ').substring(0,180) + behavior; })() }}";

.nodes |= map(
  if .name == "Add to HOT Leads Sheet" or .name == "Add WARM/COLD to Sheet" then
    .parameters.columns.value["ملاحظات المبيعات"] = sales_note
  else . end
)
