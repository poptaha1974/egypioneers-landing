const apiVersion = "v22.0";
const accountId = "act_1337470373886269";
const academyPixelId = "1604627917208516";
const token = process.env.META_GRAPH_API_ACCESS_TOKEN;

if (!token) throw new Error("META_GRAPH_API_ACCESS_TOKEN is not set");

const url = new URL(`https://graph.facebook.com/${apiVersion}/${accountId}/adsets`);
url.searchParams.set(
  "fields",
  "id,name,campaign_id,status,daily_budget,billing_event,optimization_goal,bid_strategy,destination_type,conversion_location,promoted_object,targeting",
);
url.searchParams.set("limit", "100");

const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
const payload = await response.json();
if (!response.ok) throw new Error(`Graph API ${response.status}: ${payload?.error?.message ?? "Unknown error"}`);

const matches = (payload.data ?? []).filter(
  (adset) => String(adset.promoted_object?.pixel_id ?? "") === academyPixelId,
);

console.log(JSON.stringify(matches, null, 2));
