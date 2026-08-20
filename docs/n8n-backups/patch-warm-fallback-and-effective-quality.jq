def warm_gate_expression:
  "={{ (() => { const raw = String($json.choices?.[0]?.message?.content || ''); const cls = ((raw.match(/\\\"classification\\\"\\s*:\\s*\\\"?(HOT|WARM|COLD)/i) || ['', 'COLD'])[1] || 'COLD').toUpperCase(); return (cls === 'HOT' || cls === 'WARM') ? 'WARM_GATE_PASS' : 'WARM_GATE_FAIL'; })() }}";

.nodes |= map(
  if .name == "Is WARM Lead?" then
    .parameters.conditions = {
      "options": {
        "caseSensitive": true,
        "leftValue": "",
        "typeValidation": "loose",
        "version": 2
      },
      "conditions": [
        {
          "id": "warm-or-hot-fallback-gate",
          "leftValue": warm_gate_expression,
          "operator": {"operation": "equals", "type": "string"},
          "rightValue": "WARM_GATE_PASS"
        }
      ],
      "combinator": "and"
    }
  else . end
)
