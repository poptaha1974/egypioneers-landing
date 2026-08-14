# سجل تحقق إطلاق إعلان Egy-Pioneers

## نطاق التحقق

هذا السجل يوثق تحققاً داخلياً واحداً من صفحة الويبنار المنشورة `https://egypioneers-836duxqk.manus.space/`، ولا يمثل بيانات عميل أو حملة فعلية.

| مرحلة الرحلة | الدليل المباشر | الحالة |
|---|---|---|
| صفحة التسجيل | إرسال تسجيل باسم واضح `اختبار داخلي - لا متابعة` | ناجح |
| قاعدة البيانات | سجل `leads` بالمعرّف `1`، ورقم `201025073479`، وتاريخ `2026-08-14 22:07:52` | ناجح |
| n8n | التنفيذ `#19784` في Workflow `Egy Pioneers - Lead Qualification & Sales Alert` بحالة `Succeeded` خلال `3.209s` | ناجح |
| واتساب | فتح رسالة جاهزة إلى `+201025073479` من دون إرسال رسالة يدوية | ناجح |
| Meta Test Events | سجل الاختبار النهائي أظهر `Lead` بحالة Deduplicated و`Complete registration` بحالة Processed من متصفح الدومين المنشور | ناجح |

> النتيجة التشغيلية: مسار التسليم الفعلي من الصفحة إلى قاعدة البيانات ثم n8n وواتساب يعمل. كما ثبتت أحداث المتصفح القياسية وظهرت علامة deduplication لحدث Lead؛ لذلك أصبح التحسين على Lead قابلاً للاعتماد من ناحية رحلة القياس الحالية.

## ملاحظة قراءة فقط عن CAPI

يعرض تنفيذ n8n `#19784` في Workflow الأكاديمية عقدة `Meta CAPI - Lead Feedback (HOT+WARM)` الموجهة إلى `https://graph.facebook.com/v18.0/1604627917208516/events`، مع عناصر معالجة ظاهرة في مخطط التنفيذ. وفي المقابل، يعرض History في Events Manager سجلاً يقول إن Dataset لم يعد يستخدم تكامل Conversions API سابقاً. لا يشكل ذلك دليلاً كافياً لتغيير أو إنشاء CAPI؛ المطلوب فقط تأكيد مصدر Event Lead الخادمي من تفاصيل التنفيذ أو Event Manager قبل إطلاق الإعلان.

## تحديث Test Events — دليل أحداث المتصفح

أظهرت لقطة Test Events الخاصة بالـacademy pixel في `15 أغسطس` أحداثاً مستلمة ومُعالجة من المتصفح ضمن جلسة تشمل `egypioneers-836duxqk.manus.space`، وهي: `PageView` و`View content` عند `01:18:57`، ثم `Contact` و`CampaignWhatsAppHandoff` عند `01:19:57`. كما ظهر حدث تلقائي `SubscribedButtonClick`. هذا يثبت عمل Pixel المتصفح وتتبّع تفاعل التسجيل وتحويله إلى واتساب. لا يظهر في الجزء المعروض من الجلسة صف `Lead` خادمي أو حالة deduplication؛ لذلك لا نعد هذا الجزء مكتمل الإثبات بعد.

تزامن أحدث تنفيذ في n8n `#19785` مع وقت `01:19:58` وبحالة `Succeeded` خلال `5.408s`، أي مباشرة بعد أحداث Contact وCampaignWhatsAppHandoff المرصودة. كما أظهر مخطط التنفيذ عقدة `Meta CAPI - Lead Feedback (HOT+WARM)` متجهة إلى Pixel الأكاديمية مع عنصر معالجة ظاهر. يثبت هذا التزامن تسليم التسجيل الحي إلى Workflow، لكنه لا يغني عن فحص `event_source_url` وحالة deduplication من تفاصيل Meta نفسها.

## تفاصيل المصدر من Test Events

تم توسيع تفاصيل صفوف الجلسة داخل Events Manager للـacademy pixel. ظهر `PageView` و`View content` عند `01:18:57` من الرابط `https://egypioneers-836duxqk.manus.space/`، وبـ`Action source: website`. كما ظهر `FunnelFastRegistrationOpened` من الرابط نفسه. وعند `01:19:57` ظهر `Contact` و`CampaignWhatsAppHandoff` من الرابط نفسه مع matching parameters تشمل البريد الإلكتروني وIP والرقم وUser agent. وفصلت الواجهة بوضوح صفين أقدم من `https://popehab.com/` عند `01:18:34`، لذلك لا يوجد خلط بين مصدر صفحة Manus والدومين القديم في هذه العينة.

## التسجيل الثاني بعد مهلة التحويل

نُشرت النسخة `316257d9` التي تؤخر فتح واتساب إلى ثانيتين. تم إرسال تسجيل داخلي ثانٍ بالاسم `اختبار قياس 2 - لا متابعة`، ثم فُتحت صفحة WhatsApp للرقم `201025073479` من دون إرسال رسالة يدوية. بعد ذلك أُعيد ضبط عرض Test Events لبدء جلسة نظيفة؛ لذلك لا يصح نسب هذه الجلسة الجديدة إلى التسجيل الثاني السابق لها. يلزم تسجيل جديد داخل جلسة Test Events المفتوحة إذا كان إثبات `Lead` و`CompleteRegistration` من شاشة Meta مطلوباً حرفياً.

## جلسة Test Events النهائية

بعد بدء جلسة Website جديدة للدومين `egypioneers-836duxqk.manus.space`، أُرسل تسجيل داخلي أخير باسم واضح ثم فتحت الصفحة WhatsApp من دون إرسال رسالة يدوية. عرضت Test Events في الساعة `02:47:57` من الجلسة نفسها الأحداث التالية من **Browser / Manual Setup**: `Lead` بحالة **Deduplicated**، و`Complete registration` بحالة **Processed**، و`Contact` بحالة **Processed**، و`CampaignWhatsAppHandoff` بحالة **Processed**. كما ظهرت أحداث فتح النموذج والـPageView في السياق نفسه. هذا يحسم فجوة القياس التي كانت قائمة قبل إطالة مهلة التحويل، ويثبت أن Pixel الأكاديمية هو الذي يستقبل أحداث صفحة Manus المنشورة لا أصول AllHomz أو egypioneer.

### تحديث حالة Deduplication النهائية

بعد اكتمال معالجة الجلسة، أعادت Test Events تصنيف `Lead` و`Complete registration` و`Contact` و`CampaignWhatsAppHandoff` جميعها بحالة **Deduplicated** من مصدر Browser/Manual Setup عند `02:47:57`. هذا يؤكد أن Meta وجدت أحداثاً مطابقة ومنعت عدّ التحويل مرتين. أما `PageView` الظاهر في الجلسة فهو **Processed** من المتصفح؛ وهذا منطقي لأن Workflow الخادمي الحالي يرسل إشارات Lead بعد التسجيل ولا يرسل مقابلاً خادمياً لـPageView. لذلك لا توجد مشكلة عدّ مزدوج موثقة في أعلى المسار ضمن هذا الاختبار.
