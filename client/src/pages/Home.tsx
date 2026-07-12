import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, useInView } from "framer-motion";
import {
  Package,
  TrendingUp,
  Users,
  ShieldCheck,
  Truck,
  Target,
  CheckCircle,
  MessageCircle,
  ChevronDown,
  Phone,
  MapPin,
  Award,
  Zap,
  BarChart3,
  Store,
  GraduationCap,
} from "lucide-react";

const WHATSAPP_URL = "https://wa.me/15559022738?text=%D8%A3%D9%86%D8%A7%20%D8%B3%D8%AC%D9%84%D8%AA%20%D9%81%D9%8A%20%D9%86%D9%85%D9%88%D8%B0%D8%AC%20Egy-Pioneers%20%D9%88%D8%B9%D8%A7%D9%8A%D8%B2%20%D8%A3%D8%B9%D8%B1%D9%81%20%D8%A3%D9%86%D8%B3%D8%A8%20%D8%A8%D8%AF%D8%A7%D9%8A%D8%A9%20%D9%84%D9%8A%D8%A7";

// Brand Colors
const ORANGE = "#EA8A1E";
const GOLD = "#D4A853";
const DARK = "#0A0A0A";
const DARK_CARD = "#141414";
const DARK_SECTION = "#0F0F0F";

// Counter animation hook
function useCounter(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref as any, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, end, duration]);

  return { count, ref };
}

// Section wrapper with fade-in animation
function AnimatedSection({ children, className = "", delay = 0, id, style }: { children: React.ReactNode; className?: string; delay?: number; id?: string; style?: React.CSSProperties }) {
  return (
    <motion.section
      id={id}
      style={style}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay, ease: [0.23, 1, 0.32, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

export default function Home() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    status: "",
    goal: "",
    timing: "",
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const studentsCounter = useCounter(1200);
  const productsCounter = useCounter(350);
  const successCounter = useCounter(89);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "Lead", {
        content_name: "EgyPioneers Qualification Form",
        status: formData.status,
        goal: formData.goal,
        timing: formData.timing,
      });
    }
    setFormSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden" style={{ backgroundColor: DARK }}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b transition-all duration-300" style={{ backgroundColor: `${DARK}ee`, borderColor: "rgba(234,138,30,0.1)" }}>
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img
              src="/manus-storage/egypioneers-logo-real_f8586d54.jpeg"
              alt="Egy-Pioneers Logo"
              className="w-10 h-10 object-contain rounded-lg"
            />
            <span className="font-bold text-lg text-white">Egy-Pioneers</span>
          </div>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
            <Button className="text-white gap-2 font-semibold shadow-lg" style={{ backgroundColor: "#25D366" }}>
              <MessageCircle className="w-4 h-4" />
              تواصل معانا
            </Button>
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/manus-storage/egypioneers-banner_6cce498a.png"
            alt="Hero Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to left, rgba(10,10,10,0.95), rgba(10,10,10,0.7), rgba(10,10,10,0.4))" }} />
        </div>
        <div className="container relative z-10 py-20">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            >
              <Badge className="mb-6 text-sm px-4 py-1.5 border" style={{ backgroundColor: `${ORANGE}20`, color: ORANGE, borderColor: `${ORANGE}40` }}>
                <Award className="w-4 h-4 ml-1" />
                دبلومة عملية معتمدة
              </Badge>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
              className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-6"
            >
              مش كورس نظري...
              <br />
              <span style={{ color: ORANGE }}>ده مشروعك الحقيقي</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="text-xl text-white/70 mb-8 leading-relaxed"
            >
              من أول اختيار المنتج لحد أول عملية بيع حقيقية. معرض فعلي، مخزون جاهز، وفريق دعم كامل.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="flex flex-wrap gap-4"
            >
              <a href="#form-section">
                <Button size="lg" className="text-black text-lg px-8 py-6 font-bold shadow-xl" style={{ backgroundColor: ORANGE }}>
                  سجّل بياناتك دلوقتي
                  <ChevronDown className="w-5 h-5 mr-2 animate-bounce" />
                </Button>
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="text-white hover:bg-white/10 text-lg px-8 py-6 font-bold bg-transparent" style={{ borderColor: "rgba(255,255,255,0.3)" }}>
                  <MessageCircle className="w-5 h-5 ml-2" />
                  كلمنا على واتساب
                </Button>
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-b" style={{ backgroundColor: DARK_CARD, borderColor: "rgba(234,138,30,0.1)" }}>
        <div className="container">
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center" ref={studentsCounter.ref as any}>
              <div className="text-3xl md:text-4xl font-black" style={{ color: ORANGE }}>+{studentsCounter.count}</div>
              <div className="text-white/50 mt-1 text-sm md:text-base">طالب مشترك</div>
            </div>
            <div className="text-center" ref={productsCounter.ref as any}>
              <div className="text-3xl md:text-4xl font-black" style={{ color: GOLD }}>+{productsCounter.count}</div>
              <div className="text-white/50 mt-1 text-sm md:text-base">منتج متاح</div>
            </div>
            <div className="text-center" ref={successCounter.ref as any}>
              <div className="text-3xl md:text-4xl font-black text-white">{successCounter.count}%</div>
              <div className="text-white/50 mt-1 text-sm md:text-base">نسبة النجاح</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <AnimatedSection className="py-20" style={{ backgroundColor: DARK_SECTION }}>
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              ليه الكورسات النظرية مش كفاية؟
            </h2>
            <p className="text-lg text-white/50 leading-relaxed">
              معظم الكورسات بتعلمك نظريات وبتسيبك لوحدك. النتيجة؟ ناس كتير بتخسر فلوسها وبتيأس.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Target, title: "مفيش منتج حقيقي", desc: "بتتعلم إزاي تبيع بس مفيش حاجة تبيعها فعلاً" },
              { icon: Truck, title: "مفيش مخزون", desc: "لو لقيت منتج، مين هيخزنه ومين هيشحنه؟" },
              { icon: Users, title: "مفيش دعم مستمر", desc: "الكورس بيخلص وبتلاقي نفسك لوحدك" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <Card className="p-6 text-center hover:shadow-lg transition-shadow duration-300 border" style={{ backgroundColor: "#1A1010", borderColor: "rgba(220,50,50,0.2)" }}>
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(220,50,50,0.1)" }}>
                    <item.icon className="w-7 h-7" style={{ color: "#EF4444" }} />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-white">{item.title}</h3>
                  <p className="text-white/50">{item.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Solution Section */}
      <AnimatedSection className="py-20" style={{ backgroundColor: DARK }}>
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="mb-4 border" style={{ backgroundColor: `${ORANGE}15`, color: ORANGE, borderColor: `${ORANGE}30` }}>الحل الحقيقي</Badge>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              إحنا بنديك مشروع كامل، مش مجرد كورس
            </h2>
            <p className="text-lg text-white/50 leading-relaxed">
              أكاديمية Egy-Pioneers بتوفرلك كل حاجة محتاجها عشان تبدأ مشروعك الحقيقي
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Package, title: "الطالب بيختار المنتج", desc: "أنت اللي بتختار المنتج اللي عايز تبيعه من كتالوج فيه مئات المنتجات", bg: `${ORANGE}15`, iconColor: ORANGE },
              { icon: Store, title: "تواصل مباشر مع المورد", desc: "بنوصلك بالمورد مباشرة وبتاخد سعر أول يد - أقل سعر ممكن", bg: `${GOLD}15`, iconColor: GOLD },
              { icon: ShieldCheck, title: "اعتماد المنتج", desc: "فريقنا بيراجع المنتج ويتأكد إنه مناسب للسوق المصري", bg: "rgba(16,185,129,0.1)", iconColor: "#10B981" },
              { icon: Truck, title: "مخزون حقيقي ومعرض", desc: "المنتج بيتخزن في مخازننا وبيتعرض في معرضنا الفعلي", bg: "rgba(139,92,246,0.1)", iconColor: "#8B5CF6" },
              { icon: BarChart3, title: "حملة إعلانية عملية", desc: "بتتعلم تعمل حملة حقيقية على منتجك وتبيع فعلاً", bg: "rgba(236,72,153,0.1)", iconColor: "#EC4899" },
              { icon: GraduationCap, title: "نادي تجار العرب", desc: "مجتمع حصري من التجار بيتبادلوا الخبرات والفرص", bg: `${GOLD}15`, iconColor: GOLD },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
              >
                <Card className="p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full border" style={{ backgroundColor: DARK_CARD, borderColor: "rgba(255,255,255,0.05)" }}>
                  <div className="w-12 h-12 mb-4 rounded-xl flex items-center justify-center" style={{ backgroundColor: item.bg }}>
                    <item.icon className="w-6 h-6" style={{ color: item.iconColor }} />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-white">{item.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Exhibition Section */}
      <AnimatedSection className="py-20 border-y" style={{ backgroundColor: DARK_CARD, borderColor: `${ORANGE}15` }}>
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 border" style={{ backgroundColor: `${GOLD}15`, color: GOLD, borderColor: `${GOLD}30` }}>المعرض الحقيقي</Badge>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
                مش كلام على ورق...
                <br />
                <span style={{ color: ORANGE }}>ده معرض حقيقي</span>
              </h2>
              <p className="text-white/60 text-lg leading-relaxed mb-8">
                المنتجات بتتعرض في معرض فعلي. العميل يقدر يشوف المنتج ويلمسه قبل ما يشتري. ده بيزود الثقة وبيرفع نسبة المبيعات.
              </p>
              <div className="space-y-4">
                {["تخزين آمن ومنظم", "تغليف احترافي", "شحن سريع لكل المحافظات", "متابعة الطلبات أونلاين"].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 shrink-0" style={{ color: ORANGE }} />
                    <span className="text-white/80">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <img
                src="/manus-storage/exhibition-products_2c64d4cd.png"
                alt="معرض المنتجات"
                className="rounded-2xl shadow-2xl w-full border" style={{ borderColor: `${ORANGE}20` }}
              />
              <div className="absolute -bottom-4 -right-4 text-white px-6 py-3 rounded-xl font-bold shadow-lg" style={{ backgroundColor: ORANGE }}>
                +350 منتج متاح
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Merchant Arabian Section */}
      <AnimatedSection className="py-20" style={{ backgroundColor: DARK_SECTION }}>
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center">
              <img
                src="/manus-storage/merchant-arabian-logo_d70260fe.png"
                alt="نادي تجار العرب - Merchant Arabian"
                className="w-64 h-64 object-contain animate-glow rounded-2xl"
              />
            </div>
            <div>
              <Badge className="mb-4 border" style={{ backgroundColor: `${GOLD}15`, color: GOLD, borderColor: `${GOLD}30` }}>مجتمع حصري</Badge>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
                نادي تجار العرب
                <br />
                <span style={{ color: GOLD }}>Merchant Arabian</span>
              </h2>
              <p className="text-white/60 text-lg leading-relaxed mb-6">
                مجتمع حصري من التجار والمسوقين بيتبادلوا الخبرات والفرص. عضوية مجانية لطلاب الأكاديمية.
              </p>
              <div className="space-y-3">
                {["شبكة علاقات مع تجار ناجحين", "فرص شراكة ومنتجات حصرية", "ويبينارات أسبوعية مع خبراء", "دعم فني وتسويقي مستمر"].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 shrink-0" style={{ color: GOLD }} />
                    <span className="text-white/80">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Journey Steps */}
      <AnimatedSection className="py-20" style={{ backgroundColor: DARK }}>
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              رحلتك من الصفر لأول بيعة
            </h2>
            <p className="text-lg text-white/50">
              6 خطوات واضحة ومحددة - كل خطوة بنمشيها معاك
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { step: "01", title: "اختيار المنتج", desc: "بتختار من كتالوج فيه مئات المنتجات المجربة" },
              { step: "02", title: "التواصل مع المورد", desc: "بنوصلك بالمورد مباشرة وبتاخد أفضل سعر" },
              { step: "03", title: "اعتماد المنتج", desc: "فريقنا بيتأكد إن المنتج مناسب ومربح" },
              { step: "04", title: "التخزين والتغليف", desc: "المنتج بيتخزن عندنا ويتغلف باحترافية" },
              { step: "05", title: "الحملة الإعلانية", desc: "بتتعلم تعمل حملة حقيقية وتجيب أوردرات" },
              { step: "06", title: "أول بيعة حقيقية", desc: "بتحقق أول ربح فعلي من مشروعك" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
              >
                <Card className="p-6 relative overflow-hidden hover:shadow-lg transition-all duration-300 group border" style={{ backgroundColor: DARK_CARD, borderColor: "rgba(255,255,255,0.05)" }}>
                  <div className="absolute top-4 left-4 text-6xl font-black transition-colors" style={{ color: `${ORANGE}08` }}>
                    {item.step}
                  </div>
                  <div className="relative z-10">
                    <div className="w-10 h-10 rounded-full text-black flex items-center justify-center font-bold text-sm mb-4" style={{ backgroundColor: ORANGE }}>
                      {item.step}
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-white">{item.title}</h3>
                    <p className="text-white/50 text-sm">{item.desc}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Shipping Section */}
      <AnimatedSection className="py-20 border-y" style={{ backgroundColor: DARK_CARD, borderColor: `${ORANGE}15` }}>
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <img
                src="/manus-storage/shipping-warehouse_aa33bd41.png"
                alt="التخزين والشحن"
                className="rounded-2xl shadow-xl w-full border" style={{ borderColor: `${ORANGE}20` }}
              />
            </div>
            <div className="order-1 md:order-2">
              <Badge className="mb-4 border" style={{ backgroundColor: `${ORANGE}15`, color: ORANGE, borderColor: `${ORANGE}30` }}>البنية التحتية</Badge>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
                تخزين وتغليف وشحن
                <br />
                <span style={{ color: ORANGE }}>كل حاجة جاهزة</span>
              </h2>
              <p className="text-white/60 text-lg leading-relaxed mb-6">
                مش محتاج تشيل هم اللوجستيات. إحنا بنخزن المنتج، بنغلفه باحترافية، وبنشحنه لأي مكان في مصر.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "محافظة", value: "27" },
                  { label: "وقت التوصيل", value: "2-4 أيام" },
                  { label: "نسبة التوصيل", value: "97%" },
                  { label: "تتبع الشحنات", value: "لحظي" },
                ].map((item, i) => (
                  <div key={i} className="rounded-xl p-4 text-center border" style={{ backgroundColor: DARK_SECTION, borderColor: "rgba(255,255,255,0.05)" }}>
                    <div className="font-black text-xl" style={{ color: ORANGE }}>{item.value}</div>
                    <div className="text-sm text-white/50">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Form Section */}
      <AnimatedSection className="py-20" id="form-section" style={{ backgroundColor: DARK_SECTION }}>
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <Badge className="mb-4 border" style={{ backgroundColor: `${ORANGE}15`, color: ORANGE, borderColor: `${ORANGE}30` }}>
                <Zap className="w-4 h-4 ml-1" />
                سجّل في 30 ثانية
              </Badge>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                سجّل بياناتك وابدأ رحلتك
              </h2>
              <p className="text-white/50 text-lg">
                هنتواصل معاك على واتساب ونحدد أنسب بداية ليك
              </p>
            </div>

            {!formSubmitted ? (
              <Card className="p-8 shadow-xl border" style={{ backgroundColor: DARK_CARD, borderColor: `${ORANGE}20` }}>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name */}
                  <div>
                    <label className="block font-semibold mb-2 text-sm text-white">الاسم</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border outline-none transition-all text-white"
                      style={{ backgroundColor: DARK_SECTION, borderColor: "rgba(255,255,255,0.1)" }}
                      placeholder="اكتب اسمك هنا"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block font-semibold mb-2 text-sm text-white">رقم الموبايل (اللي عليه واتساب)</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border outline-none transition-all text-white"
                      style={{ backgroundColor: DARK_SECTION, borderColor: "rgba(255,255,255,0.1)" }}
                      placeholder="01xxxxxxxxx"
                      dir="ltr"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block font-semibold mb-2 text-sm text-white">حضرتك أقرب لأنهي حالة؟</label>
                    <div className="space-y-2">
                      {[
                        "لسه هبدأ من الصفر",
                        "جرّبت قبل كده وخسرت",
                        "عندي خبرة في الإعلانات ومحتاج منتج",
                        "عندي منتج أو مشروع قائم",
                        "جاهز أعرف تفاصيل الحجز",
                      ].map((option) => (
                        <label key={option} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:border-opacity-50" style={{ borderColor: "rgba(255,255,255,0.1)", backgroundColor: DARK_SECTION }}>
                          <input
                            type="radio"
                            name="status"
                            value={option}
                            required
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-4 h-4"
                            style={{ accentColor: ORANGE }}
                          />
                          <span className="text-sm text-white/80">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Goal */}
                  <div>
                    <label className="block font-semibold mb-2 text-sm text-white">هدفك الأساسي إيه؟</label>
                    <div className="space-y-2">
                      {[
                        "أبدأ مشروع جنب شغلي",
                        "أبني مصدر دخل أساسي",
                        "أطوّر مشروع قائم",
                        "أتعلم مهارة أشتغل بيها",
                        "أبني براند خاص بيا",
                      ].map((option) => (
                        <label key={option} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:border-opacity-50" style={{ borderColor: "rgba(255,255,255,0.1)", backgroundColor: DARK_SECTION }}>
                          <input
                            type="radio"
                            name="goal"
                            value={option}
                            required
                            onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                            className="w-4 h-4"
                            style={{ accentColor: ORANGE }}
                          />
                          <span className="text-sm text-white/80">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Timing */}
                  <div>
                    <label className="block font-semibold mb-2 text-sm text-white">ناوي تبدأ إمتى؟</label>
                    <div className="space-y-2">
                      {[
                        "فوراً",
                        "خلال الشهر الحالي",
                        "خلال 1-3 شهور",
                        "بجمع معلومات حاليًا",
                      ].map((option) => (
                        <label key={option} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:border-opacity-50" style={{ borderColor: "rgba(255,255,255,0.1)", backgroundColor: DARK_SECTION }}>
                          <input
                            type="radio"
                            name="timing"
                            value={option}
                            required
                            onChange={(e) => setFormData({ ...formData, timing: e.target.value })}
                            className="w-4 h-4"
                            style={{ accentColor: ORANGE }}
                          />
                          <span className="text-sm text-white/80">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Consent */}
                  <div className="rounded-xl p-4 border" style={{ backgroundColor: DARK_SECTION, borderColor: "rgba(255,255,255,0.05)" }}>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" required className="w-4 h-4 mt-1" style={{ accentColor: ORANGE }} />
                      <span className="text-xs text-white/50 leading-relaxed">
                        أوافق إن أكاديمية Egy-Pioneers تتواصل معايا عبر واتساب بخصوص الويبينار والدبلومة، وأقدر أطلب إيقاف الرسائل في أي وقت.
                      </span>
                    </label>
                  </div>

                  <Button type="submit" size="lg" className="w-full text-black text-lg py-6 font-bold shadow-xl animate-pulse-orange" style={{ backgroundColor: ORANGE }}>
                    سجّل بياناتك
                    <CheckCircle className="w-5 h-5 mr-2" />
                  </Button>
                </form>
              </Card>
            ) : (
              /* Thank You Screen */
              <Card className="p-10 shadow-xl border text-center" style={{ backgroundColor: DARK_CARD, borderColor: `${ORANGE}30` }}>
                <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${ORANGE}15` }}>
                  <CheckCircle className="w-10 h-10" style={{ color: ORANGE }} />
                </div>
                <h3 className="text-2xl font-black text-white mb-4">
                  تم تسجيل بياناتك بنجاح
                </h3>
                <p className="text-white/60 text-lg mb-8 leading-relaxed">
                  الخطوة الجاية إننا نفهم وضعك ونرشح لك أنسب بداية، بدل ما نبعتلك كلام عام.
                  <br />
                  اضغط على الزر وابعت كلمة "تاجر" على واتساب عشان نبدأ فوراً
                </p>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="text-white text-xl px-10 py-7 font-bold shadow-xl animate-pulse-orange" style={{ backgroundColor: "#25D366" }}>
                    <MessageCircle className="w-6 h-6 ml-3" />
                    ابدأ التقييم على واتساب
                  </Button>
                </a>
              </Card>
            )}
          </div>
        </div>
      </AnimatedSection>

      {/* FAQ Section */}
      <AnimatedSection className="py-20" style={{ backgroundColor: DARK }}>
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                أسئلة شائعة
              </h2>
            </div>
            <div className="space-y-3">
              {[
                { q: "إيه الفرق بينكم وبين كورسات الدروبشيبنج؟", a: "إحنا مش كورس نظري. إحنا بنديك منتج حقيقي، مخزون فعلي، معرض حقيقي، وبنمشي معاك خطوة بخطوة لحد ما تبيع فعلاً. الدروبشيبنج بيسيبك لوحدك بعد الكورس." },
                { q: "محتاج رأس مال كبير عشان أبدأ؟", a: "لا. المنتجات متاحة بأسعار أول يد وبتقدر تبدأ بميزانية محدودة. وكمان فيه خيارات تمويل وتقسيط." },
                { q: "لو مش فاهم حاجة في التسويق؟", a: "عادي جداً. الدبلومة بتبدأ معاك من الصفر وبتعلمك كل حاجة عملياً مش نظرياً. وفيه فريق دعم متاح ليك." },
                { q: "المعرض فين؟", a: "فيلا 139 - التجمع الأول - خلف شارع التسعين الجنوبي - أمام مول عبد العزيز ماركتس. تقدر تزورنا وتشوف المنتجات بنفسك." },
                { q: "إيه الضمان إني هنجح؟", a: "89% من طلابنا حققوا أول بيعة خلال أول شهر. ده لأننا مش بنسيبك لوحدك - فيه متابعة مستمرة ودعم فني وتسويقي." },
              ].map((item, i) => (
                <div key={i} className="border rounded-xl overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-right transition-colors"
                    style={{ backgroundColor: openFaq === i ? DARK_CARD : "transparent" }}
                  >
                    <span className="font-semibold text-white">{item.q}</span>
                    <ChevronDown className={`w-5 h-5 text-white/40 transition-transform duration-200 shrink-0 mr-4 ${openFaq === i ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="px-5 pb-5"
                      style={{ backgroundColor: DARK_CARD }}
                    >
                      <p className="text-white/60 leading-relaxed">{item.a}</p>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Footer */}
      <footer className="py-12 border-t" style={{ backgroundColor: DARK_CARD, borderColor: `${ORANGE}15` }}>
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="/manus-storage/egypioneers-logo-real_f8586d54.jpeg"
                  alt="Logo"
                  className="w-10 h-10 object-contain rounded-lg"
                />
                <span className="font-bold text-lg text-white">Egy-Pioneers Academy</span>
              </div>
              <p className="text-white/40 text-sm leading-relaxed">
                أكاديمية عملية لبناء مشاريع التجارة الإلكترونية من الصفر لأول بيعة حقيقية.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-white">تواصل معانا</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-white/60 text-sm">
                  <Phone className="w-4 h-4" />
                  <span dir="ltr">+20 103 730 3001</span>
                </div>
                <div className="flex items-center gap-3 text-white/60 text-sm">
                  <MessageCircle className="w-4 h-4" />
                  <a href={WHATSAPP_URL} className="hover:text-white transition-colors">واتساب</a>
                </div>
                <div className="flex items-center gap-3 text-white/60 text-sm">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>فيلا 139 - التجمع الأول - خلف شارع التسعين الجنوبي</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-white">روابط سريعة</h4>
              <div className="space-y-2">
                <a href="#form-section" className="block text-white/60 text-sm hover:text-white transition-colors">سجّل بياناتك</a>
                <a href={WHATSAPP_URL} className="block text-white/60 text-sm hover:text-white transition-colors">تواصل على واتساب</a>
              </div>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-white/30 text-sm" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            © 2026 Egy-Pioneers Academy. جميع الحقوق محفوظة.
          </div>
        </div>
      </footer>

      {/* Sticky WhatsApp Button */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-50 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform duration-200 animate-pulse-orange"
        style={{ backgroundColor: "#25D366" }}
      >
        <MessageCircle className="w-7 h-7" />
      </a>
    </div>
  );
}
