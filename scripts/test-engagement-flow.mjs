import { randomUUID } from "node:crypto";

const baseUrl = process.env.ENGAGEMENT_TEST_BASE_URL || "http://127.0.0.1:3000";
const sessionId = randomUUID();
const marker = `TEST_ENGAGEMENT_${Date.now()}`;

async function call(path, payload) {
  const response = await fetch(`${baseUrl}/api/trpc/${path}?batch=1`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ 0: { json: payload } }),
  });
  if (!response.ok) throw new Error(`${path} failed: ${response.status}`);
  return response.json();
}

const events = [
  ["section_viewed", "open_webinar_content"],
  ["faq_opened", "faq_5", "التسجيل مجاني؟"],
  ["video_started", "pilot_video"],
  ["video_completed", "pilot_video"],
  ["cta_clicked", "Final CTA", "احجز مكانك في أول 30 دقيقة مجاناً"],
  ["form_started", "registration_form"],
];

for (const [eventName, target, detail] of events) {
  await call("engagement.track", { sessionId, eventName, target, detail });
}

const submission = await call("leads.submit", {
  name: marker,
  phone: "01025073479",
  email: `${marker.toLowerCase()}@example.com`,
  whatsappConsent: false,
  eventId: `lead_${Date.now()}_${randomUUID().replace(/-/g, "")}`,
  eventSourceUrl: "https://webinar.popehab.com/?engagement_test=1",
  visitorSessionId: sessionId,
});

console.log(JSON.stringify({ marker, sessionId, submission }, null, 2));
