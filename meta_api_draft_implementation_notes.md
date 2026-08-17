# ملاحظات تنفيذ Draft عبر Meta Graph API

## القواعد الرسمية المثبتة

توضح وثائق Meta أن إنشاء Campaign يتم عبر `POST /act_<AD_ACCOUNT_ID>/campaigns` مع `name` و`objective` و`status`، وأن ضبط `status=PAUSED` يبقي الحملة غير نشطة لحين اكتمال الإعداد. كما أن إنشاء Ad Set يتم عبر `POST /act_<AD_ACCOUNT_ID>/adsets` ويربط `campaign_id` مع الاستهداف و`daily_budget`، بينما ينشأ الإعلان المصور بتحميل صورة وإعادة استخدام `image_hash` داخل `object_story_spec`. [1] [2] [3]

> لا يكفي أن يكون الرمز صالحاً لهوية المستخدم فقط؛ أنشأت Meta صراحةً أن الوصول إلى الحساب والأجسام المُروَّجة يتطلب الصلاحيات المناسبة. لذلك نجحنا في اختبار `ads_read` على `act_1337470373886269` قبل التفكير في أي POST إنشائي. [4]

## ثوابت التنفيذ لهذه المسودة

| البند | القيمة |
|---|---|
| حساب الإعلانات | `act_1337470373886269` — Insta ad acc |
| العملة / المنطقة الزمنية | EGP / Africa/Cairo |
| صفحة الهوية | `852717114597902` — Egy - Pioneers Academy |
| Pixel | `1604627917208516` — academy pixel |
| Campaign status | `PAUSED` |
| Ad Set status | `PAUSED` |
| Ad status | `PAUSED` |
| الوجهة | `https://webinar.popehab.com/` |
| الأصول | C01 الخريطة وC02 التوريد، بنسبة 4:5 |

## المراجع

[1]: https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad-campaign "Meta — Create an ad campaign".
[2]: https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad-set "Meta — Create an ad set".
[3]: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-image "Meta — Ad Image".
[4]: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-promoted-object "Meta — Ad Set Promoted Object".
