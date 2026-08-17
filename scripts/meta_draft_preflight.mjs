import { writeFile } from "node:fs/promises";

const apiVersion = "v22.0";
const accountId = "act_1337470373886269";
const token = process.env.META_GRAPH_API_ACCESS_TOKEN;

if (!token) throw new Error("META_GRAPH_API_ACCESS_TOKEN is not set");

async function graphGet(path, params = {}) {
  const url = new URL(`https://graph.facebook.com/${apiVersion}${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const payload = await response.json();
  if (!response.ok) throw new Error(`Graph API ${response.status}: ${payload?.error?.message ?? "Unknown error"}`);
  return payload;
}

const [account, pages, creatives, permissions, campaigns] = await Promise.all([
  graphGet(`/${accountId}`, { fields: "id,name,account_status,currency,timezone_name" }),
  graphGet("/me/accounts", { fields: "id,name", limit: "100" }),
  graphGet(`/${accountId}/adcreatives`, { fields: "id,name,object_story_spec", limit: "100" }),
  graphGet("/me/permissions"),
  graphGet(`/${accountId}/campaigns`, { fields: "id,name,objective,status,created_time,buying_type,special_ad_categories", limit: "100" }),
]);

const pageIdsInExistingCreatives = new Set(
  (creatives.data ?? [])
    .map((creative) => creative.object_story_spec?.page_id)
    .filter(Boolean),
);

const sanitized = {
  checkedAt: new Date().toISOString(),
  account: {
    id: account.id,
    name: account.name,
    accountStatus: account.account_status,
    currency: account.currency,
    timezone: account.timezone_name,
  },
  pages: (pages.data ?? []).map(({ id, name }) => ({
    id,
    name,
    usedByExistingCreative: pageIdsInExistingCreatives.has(id),
  })),
  existingCreativePageIds: [...pageIdsInExistingCreatives],
  grantedPermissions: (permissions.data ?? [])
    .filter((permission) => permission.status === "granted")
    .map((permission) => permission.permission),
  webinarCampaignCandidates: (campaigns.data ?? [])
    .filter((campaign) => /webinar|egy|epa/i.test(campaign.name ?? ""))
    .map(({ id, name, objective, status, created_time, buying_type, special_ad_categories }) => ({
      id, name, objective, status, created_time, buying_type, special_ad_categories,
    })),
};

await writeFile("/home/ubuntu/egypioneers-landing/meta_draft_preflight.json", `${JSON.stringify(sanitized, null, 2)}\n`);
console.log(JSON.stringify(sanitized, null, 2));
