# خطة ربط صفحة الويبنار بنطاق دائم قبل إطلاق الحملة

## القرار التنفيذي

لن ننقل ملفات الصفحة إلى FunnelFast، ولن نستبدل الصفحة الحالية في `popehab.com/home-page-page`. سنربط **النطاق الفرعي الدائم**:

> `https://webinar.popehab.com`

بنفس مشروع Manus المنشور. بهذه الطريقة يظل نطاق FunnelFast الحالي ومساراته كما هي، بينما تحصل صفحة الويبنار على عنوان مملوك للعلامة التجارية. أي تحديث لاحق نحفظه في المشروع سيظهر على النطاق الجديد؛ لا توجد نسختان من الكود أو قاعدتا بيانات.

## نتيجة الفحص الحالي

| العنصر | الحالة |
|---|---|
| `https://popehab.com/home-page-page` | يعمل حالياً ويُخدم عبر Cloudflare؛ لا نغيره. |
| `webinar.popehab.com` | لا يحل إلى عنوان حالياً؛ مناسب للربط كنطاق فرعي منفصل. |
| صفحة Manus | منشورة وتعمل على نطاقي Manus الحاليين. |
| مواضع الرابط داخل الكود | توجد روابط Open Graph وSchema فقط داخل `client/index.html`؛ تُحدث بعد نجاح SSL، لا قبله. |

## لماذا لا نستخدم `popehab.com/home-page-page`؟

سجل DNS يستطيع توجيه **نطاق أو نطاق فرعي**، لكنه لا يوجّه مساراً داخلياً مثل `/home-page-page` إلى استضافة أخرى. استخدام المسار القديم سيعني إما إبقاء صفحة FunnelFast القديمة أو بناء Proxy معقد يضيف نقطة فشل. النطاق الفرعي `webinar.popehab.com` يعزل الرحلة ويحافظ على FunnelFast كما هو.

## التوقيت الصحيح

يتم الربط **بعد اعتماد مسودة الحملة وقبل إنشاء الإعلانات النهائية داخل Ads Manager**. لا نضع رابط Manus الحالي في Draft النهائي ثم نغيّره بعد النشر؛ تغيير الرابط بعد بدء التعلّم قد يعقّد المراجعة والقياس. التسلسل الصحيح:

1. ربط النطاق في Manus.
2. إضافة سجلات DNS الدقيقة التي يعرضها Manus.
3. انتظار حالة `Connected/Verified` وإصدار HTTPS تلقائياً. Manus يدعم النطاقات المخصصة ويوفر سجل A أو CNAME المطلوب وشهادة SSL تلقائية. [1] [2]
4. اختبار الصفحة والنموذج والـPixel وواتساب على النطاق الجديد.
5. تحديث Open Graph وSchema والرابط الأساسي داخل مستند الحملة.
6. إنشاء Ads Manager Draft باستخدام `https://webinar.popehab.com` فقط.

## خطوات الربط

| الخطوة | مكان التنفيذ | الإجراء | معيار النجاح |
|---|---|---|---|
| 1 | Manus → Settings → Domains | اختيار Connect existing domain وإدخال `webinar.popehab.com` | ظهور سجلات DNS المطلوبة من Manus. |
| 2 | لوحة DNS التي تدير `popehab.com` | إضافة **السجل الذي يعرضه Manus حرفياً**؛ غالباً CNAME، وقد يطلب A/TXT للتحقق | السجل محفوظ من دون تعديل `@` أو `www` أو MX أو صفحة FunnelFast. |
| 3 | Manus Domains | الضغط على Verify/Connect بعد انتشار DNS | حالة النطاق تصبح Connected. |
| 4 | HTTPS | فتح `https://webinar.popehab.com` | شهادة SSL صحيحة وصفحة 200 بلا تحذير. |
| 5 | اختبار تقني | المتصفح + Meta Test Events | `PageView` و`ViewContent` و`Lead` و`CompleteRegistration` من Pixel الأكاديمية فقط. |
| 6 | اختبار رحلة العميل | تسجيل داخلي واحد واضح | DB → n8n الأكاديمية → شاشة النجاح → واتساب، بلا رسالة جماهيرية أو تفعيل Workflow التذكير. |
| 7 | المشروع | تحديث `og:url` وSchema إلى النطاق الجديد ثم حفظ نسخة | معاينات المشاركة والرابط الأساسي يستخدمان الدومين الدائم. |
| 8 | Ads Manager | إنشاء Draft الويبنار | كل إعلان وUTM يستخدم `webinar.popehab.com`، ولا يظهر رابط Manus في الإعلانات. |

## محظورات أثناء الربط

- لا نغير سجلات الجذر `@` أو `www`؛ لأن ذلك قد يعطل FunnelFast أو البريد.
- لا نحذف أي سجل MX أو TXT أو CNAME قائم.
- لا نضع قيمة DNS بالحدس؛ نستخدم القيمة التي ينشئها Manus للمشروع وقت الربط.
- لا نثبت رابط الإعلان قبل نجاح HTTPS واختبار التسجيل من النطاق الجديد.
- لا نعيد ضبط Pixel أو CAPI أو Tokens بسبب تغيير الدومين؛ المطلوب اختبار المصدر فقط.
- لا نفعّل Workflow رسائل الويبنار الجماهيرية ضمن عملية الدومين.

## خطة الرجوع الآمن

إذا لم يتم التحقق أو إصدار SSL، لا يتأثر المشروع ولا FunnelFast: نبقي الإعلان غير منشور ونستخدم نطاق Manus الحالي للاختبار الداخلي فقط. ولا نحذف أي DNS قائم حتى نعرف سبب الفشل. إذا لزم إلغاء المحاولة، نحذف سجل `webinar` الجديد وحده من لوحة DNS، ويظل `popehab.com` ومساره القديم يعملان.

## المراجع

[1]: https://manus.im/docs/website-builder/custom-domains "Manus — Custom Domains: Professionalize Your Brand".
[2]: https://manus.im/docs/website-builder/publishing "Manus — Publishing and Automatic SSL/HTTPS".
[3]: https://help.manus.im/en/articles/11711203-how-can-i-connect-the-website-created-by-manus-to-my-custom-domain "Manus Help Center — Connect an existing domain".
