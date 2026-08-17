# مانع إنشاء Draft عبر Meta Graph API

## الحالة

لم يُنشأ أي Campaign أو Ad Set أو Creative أو Ad في حساب الإعلانات. سجل نتيجة الإنشاء أعاد `campaign: null` و`adSet: null` و`ads: []` في كل المحاولات؛ لذا لا يوجد إنفاق أو كائن جزئي يحتاج حذفاً.

## ما ثبت نجاحه

| الفحص | النتيجة |
|---|---|
| رمز الوصول | يعرّف هوية Meta بنجاح. |
| `ads_read` على `act_1337470373886269` | نجح في اختبار Vitest المقروء. |
| الصلاحيات الظاهرة للرمز | تشمل `ads_management` و`ads_read` و`pages_manage_ads` و`pages_show_list` و`pages_read_engagement`. |
| حساب الإعلانات | Active، اسمه `Insta ad acc`، عملته EGP ومنطقته الزمنية Africa/Cairo. |
| صفحة الهوية | `852717114597902` — Egy - Pioneers Academy. |

## مانع Meta

رفضت Meta طلب `POST /act_1337470373886269/campaigns` قبل إنشاء الحملة، بالنتيجة:

> `Invalid parameter (code=100, subcode=4834011, type=OAuthException)`

تمت المحاولة بصيغة Campaign موقوفة فقط، مع `OUTCOME_LEADS` و`AUCTION` وحالة `PAUSED`. تمت مطابقة صيغة `special_ad_categories` مع حملة حساب مرجعية (`[]`) وتجربة إصدار API الحالي؛ بقي الرفض نفسه. لذلك لا نكرر إنشاء نفس الكائن.

## الاستنتاج التشغيلي

الرمز يقرأ الحساب، لكن طبقة إنشاء Campaign من Graph API مرفوضة من Meta/App context رغم ظهور scopes. هذا غالباً قيد على الـApp الذي أصدر الرمز أو ضرورة موافقة/إتاحة كتابة Marketing API من إعداد Business/App، وليس عيباً في Pixel أو الدومين أو الكريتفات.

## المسار الآمن التالي

يُنشأ Draft من واجهة Ads Manager بحساب الدكتور الذي اجتاز تحقق Meta، باستخدام المذكرة `webinar_final_launch_draft.md`. لا نحتاج لإعادة اختبار الدومين أو Pixel؛ بوابة القياس مكتملة. بعد إنشاء Draft عبر الواجهة نقرأ العناصر بالرمز الحالي وندققها قبل أي Publish.
