import { readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";

const apiVersion = "v26.0";
const accountId = "act_1337470373886269";
const pageId = "852717114597902";
const pixelId = "1604627917208516";
const token = process.env.META_GRAPH_API_ACCESS_TOKEN;

if (process.env.META_DRAFT_EXECUTE !== "1") {
  throw new Error("Set META_DRAFT_EXECUTE=1 to create the approved PAUSED draft.");
}
if (!token) throw new Error("META_GRAPH_API_ACCESS_TOKEN is not set.");

const campaignName = "EPA | Webinar | Website Leads | C01-vs-C02 | W1 | Draft";
const adSetName = "EPA | Prospecting | Cairo-Giza | M25-44 | Website Lead | W1";
const baseLandingUrl = "https://webinar.popehab.com/";
const commonTargeting = {
  age_min: 25,
  age_max: 44,
  genders: [1],
  geo_locations: {
    regions: [
      { key: "1001", name: "Cairo Governorate", country: "EG" },
      { key: "998", name: "Giza Governorate", country: "EG" },
    ],
    location_types: ["home", "recent"],
  },
  publisher_platforms: ["facebook"],
  facebook_positions: ["feed", "video_feeds"],
  flexible_spec: [
    {
      interests: [
        { id: "6002986251568", name: "Course (education)" },
        { id: "6003127206524", name: "Digital marketing (marketing)" },
        { id: "6003279598823", name: "Marketing (business and finance)" },
      ],
    },
  ],
};

const ads = [
  {
    key: "c01",
    file: "/home/ubuntu/webdev-static-assets/egy_pioneers_webinar_c01_map.png",
    campaignAdName: "EPA | C01 | Map | Static 4x5 | W1",
    creativeName: "EPA | C01 | Map | Creative | W1",
    primaryText: "لما البداية تبقى من معلومة متفرقة أو منتج واحد، القرار ساعات بيبقى عشوائي.\n\nفي أول 30 دقيقة من ويبنار Egy-Pioneers يوم الأربعاء، هتشوف طريقة تبص بيها للمنتج والعميل والتشغيل كخريطة واحدة قبل ما تاخد خطوتك.\n\nسجّل دلوقتي، وبعد التسجيل هتفتح معاك رسالة واتساب للتنسيق.",
    headline: "ابدأ بخريطة واضحة للمشروع",
    description: "أول 30 دقيقة من ويبنار الأربعاء",
    url: `${baseLandingUrl}?utm_source=facebook&utm_medium=paid_social&utm_campaign=epa_webinar_w1&utm_content=c01_map&utm_term=prospecting_cairo_giza_m25_44`,
  },
  {
    key: "c02",
    file: "/home/ubuntu/webdev-static-assets/egy_pioneers_webinar_c02_supply.png",
    campaignAdName: "EPA | C02 | Supply | Static 4x5 | W1",
    creativeName: "EPA | C02 | Supply | Creative | W1",
    primaryText: "قبل أول طلب، القرار مش بيبدأ من المنتج بس. بيبدأ من الأسئلة والمقارنة والحسبة اللي بتوضح الصورة.\n\nفي أول 30 دقيقة من ويبنار Egy-Pioneers يوم الأربعاء، هتشوف طريقة تفكير عملية تراجع بيها قرار التوريد قبل أي خطوة.\n\nسجّل دلوقتي، وبعد التسجيل هتفتح معاك رسالة واتساب للتنسيق.",
    headline: "قبل أول طلب… اسأل صح",
    description: "30 دقيقة تفكير عملي قبل القرار",
    url: `${baseLandingUrl}?utm_source=facebook&utm_medium=paid_social&utm_campaign=epa_webinar_w1&utm_content=c02_supply&utm_term=prospecting_cairo_giza_m25_44`,
  },
];

async function graphPost(path, values) {
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null) form.append(key, typeof value === "string" ? value : JSON.stringify(value));
  }
  const response = await fetch(`https://graph.facebook.com/${apiVersion}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const payload = await response.json();
  if (!response.ok) {
    const error = payload?.error ?? {};
    throw new Error(
      `Graph API ${response.status} at ${path}: ${error.message ?? "Unknown error"} `
      + `(code=${error.code ?? "n/a"}, subcode=${error.error_subcode ?? "n/a"}, type=${error.type ?? "n/a"})`,
    );
  }
  return payload;
}

async function uploadImage(filePath) {
  const bytes = await readFile(filePath);
  const response = await graphPost(`/${accountId}/adimages`, {
    name: basename(filePath),
    bytes: bytes.toString("base64"),
  });
  const image = response.images?.[basename(filePath)];
  if (!image?.hash) throw new Error(`Image hash was missing for ${basename(filePath)}.`);
  return image.hash;
}

const result = {
  createdAt: new Date().toISOString(),
  destination: baseLandingUrl,
  status: "PAUSED",
  campaign: null,
  adSet: null,
  ads: [],
};

try {
  const campaign = await graphPost(`/${accountId}/campaigns`, {
    name: campaignName,
    objective: "OUTCOME_LEADS",
    buying_type: "AUCTION",
    special_ad_categories: [],
    status: "PAUSED",
  });
  result.campaign = { id: campaign.id, name: campaignName };

  const adSet = await graphPost(`/${accountId}/adsets`, {
    name: adSetName,
    campaign_id: campaign.id,
    daily_budget: "60000",
    billing_event: "IMPRESSIONS",
    optimization_goal: "OFFSITE_CONVERSIONS",
    bid_strategy: "LOWEST_COST_WITHOUT_CAP",
    promoted_object: { pixel_id: pixelId, custom_event_type: "LEAD" },
    targeting: commonTargeting,
    status: "PAUSED",
  });
  result.adSet = { id: adSet.id, name: adSetName, dailyBudgetMinor: 60000 };

  for (const spec of ads) {
    const imageHash = await uploadImage(spec.file);
    const creative = await graphPost(`/${accountId}/adcreatives`, {
      name: spec.creativeName,
      object_story_spec: {
        page_id: pageId,
        link_data: {
          image_hash: imageHash,
          link: spec.url,
          message: spec.primaryText,
          name: spec.headline,
          description: spec.description,
          call_to_action: { type: "SIGN_UP", value: { link: spec.url } },
        },
      },
    });
    const ad = await graphPost(`/${accountId}/ads`, {
      name: spec.campaignAdName,
      adset_id: adSet.id,
      creative: { creative_id: creative.id },
      status: "PAUSED",
    });
    result.ads.push({ key: spec.key, imageHash, creativeId: creative.id, adId: ad.id, name: spec.campaignAdName, url: spec.url });
  }

  result.outcome = "success";
} catch (error) {
  result.outcome = "partial_or_failed";
  result.error = error instanceof Error ? error.message : String(error);
}

await writeFile("/home/ubuntu/egypioneers-landing/meta_webinar_draft_result.json", `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));

if (result.outcome !== "success") process.exitCode = 1;
