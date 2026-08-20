const crypto = require('crypto');

const b = $('Normalize CRM Lead Payload').item.json.body || {};
const modelOutput = String($('Claude - Lead Analysis').item.json.choices?.[0]?.message?.content || '');
const rawClassification = ((modelOutput.match(/"classification"\s*:\s*"?(HOT|WARM|COLD)/i) || ['', 'COLD'])[1] || 'COLD').toUpperCase();
const leadScore = Number((modelOutput.match(/"score"\s*:\s*(\d{1,3})/i) || ['', '0'])[1]);
const normalizedScore = Number.isFinite(leadScore) ? Math.min(Math.max(leadScore, 0), 100) : 0;

const messageValue = (b.message && typeof b.message === 'object' ? b.message.body : b.message) || b.customData?.message || b.last_message || '';
const message = String(messageValue).replace(/\s+/g, ' ').trim().slice(0, 600);
const hasDecisionSignal = /(عايز|أريد|عايزه|عايزة)?\s*(أسجل|تسجيل|أحجز|حجز|أدفع|دفع|أشترك|اشتراك)|رابط\s*(الدفع|التسجيل)|\b(السعر|تكلفة|التكلفة|تقسيط|المعاد|الموعد|ابدأ|أبدأ)\b/i.test(message);

// HOT لا يمر إلى Pixel إلا بقرار صريح ودرجة 80+. أي HOT ضعيف يصبح WARM/nurture.
const qualifiesAsHot = rawClassification === 'HOT' && normalizedScore >= 80 && hasDecisionSignal;
const classification = rawClassification === 'COLD' ? 'COLD' : (qualifiesAsHot ? 'HOT' : 'WARM');
if (classification === 'COLD') return [];

const rawPhone = String(b.phone || b.contact_phone || '').replace(/[^0-9+]/g, '');
let p = rawPhone.startsWith('+') ? rawPhone.slice(1) : rawPhone;
if (p.startsWith('0020')) p = p.slice(2);
else if (p.startsWith('01') && p.length === 11) p = '20' + p.slice(1);

const firstName = String(b.contact_name || b.contactName || '').trim().split(' ')[0].toLowerCase();
const contactId = b.contact_id || b.contactId || '';
const rawEmail = String(b.email || '').trim().toLowerCase();
const fbclid = String(b.fbclid || '').trim();
const fbpValue = String(b.fbp || '').trim();
const sha = (v) => crypto.createHash('sha256').update(v).digest('hex');
const eventTime = Math.floor(Date.now() / 1000);
const eventTimeMs = Date.now();

const user_data = { country: [sha('eg')] };
if (p) user_data.ph = [sha(p)];
if (firstName) user_data.fn = [sha(firstName)];
if (contactId) user_data.external_id = [sha(String(contactId))];
if (rawEmail) user_data.em = [sha(rawEmail)];
if (fbclid) user_data.fbc = 'fb.1.' + eventTimeMs + '.' + fbclid;
if (fbpValue) user_data.fbp = fbpValue;

const browserEventId = String(b.event_id || '').trim();
const eventSourceUrl = String(b.event_source_url || '').trim();
const event_id = browserEventId || (contactId ? ('lead_' + classification.toLowerCase() + '_' + contactId) : ('lead_' + classification.toLowerCase() + '_' + eventTime));

return [{
  json: {
    data: [{
      event_name: 'Lead',
      event_time: eventTime,
      event_id,
      action_source: 'website',
      event_source_url: eventSourceUrl || undefined,
      user_data,
      custom_data: {
        content_category: 'qualified_lead',
        content_name: 'Egy Pioneers Webinar Qualified Lead',
        lead_quality: classification.toLowerCase(),
        qualification_stage: classification === 'HOT' ? 'sales_ready' : 'nurture',
        lead_score: normalizedScore,
        raw_model_classification: rawClassification.toLowerCase(),
        decision_signal_present: hasDecisionSignal
      }
    }]
  }
}];
