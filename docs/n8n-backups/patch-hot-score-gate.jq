.nodes |= map(
  if .name == "Is HOT Lead?" then
    .parameters.conditions = {
      "options": {
        "caseSensitive": true,
        "leftValue": "",
        "typeValidation": "loose",
        "version": 2
      },
      "conditions": [
        {
          "id": "hot-score-and-decision-gate",
          "leftValue": "={{ (() => { const raw = String($json.choices?.[0]?.message?.content || ''); const cls = ((raw.match(/\\\"classification\\\"\\s*:\\s*\\\"?(HOT|WARM|COLD)/i) || ['', 'COLD'])[1] || 'COLD').toUpperCase(); const score = Number((raw.match(/\\\"score\\\"\\s*:\\s*(\\d{1,3})/i) || ['', '0'])[1]); const b = $('Normalize CRM Lead Payload').item.json.body || {}; const messageValue = (b.message && typeof b.message === 'object' ? b.message.body : b.message) || b.customData?.message || b.last_message || ''; const message = String(messageValue).replace(/\\s+/g, ' ').trim().slice(0, 600); const hasDecisionSignal = /(عايز|أريد|عايزه|عايزة)?\\s*(أسجل|تسجيل|أحجز|حجز|أدفع|دفع|أشترك|اشتراك)|رابط\\s*(الدفع|التسجيل)|\\b(السعر|تكلفة|التكلفة|تقسيط|المعاد|الموعد|ابدأ|أبدأ)\\b/i.test(message); return cls === 'HOT' && Number.isFinite(score) && score >= 80 && hasDecisionSignal ? 'HOT_GATE_PASS' : 'HOT_GATE_FAIL'; })() }}",
          "operator": {
            "operation": "equals",
            "type": "string"
          },
          "rightValue": "HOT_GATE_PASS"
        }
      ],
      "combinator": "and"
    }
  else . end
)
