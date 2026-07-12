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
function AnimatedSection({ children, className = "", delay = 0, id }: { children: React.ReactNode; className?: string; delay?: number; id?: string }) {
  return (
    <motion.section
      id={id}
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
    // Track form submission with pixel
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
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-border/50 transition-all duration-300">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img
              src="/manus-storage/egypioneers-logo_86bbc342.png"
              alt="Egy-Pioneers Logo"
              className="w-10 h-10 object-contain"
            />
            <span className="font-bold text-lg text-[#1B365D]">Egy-Pioneers</span>
          </div>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
            <Button className="bg-[#25D366] hover:bg-[#20BD5A] text-white gap-2 font-semibold shadow-lg shadow-green-200/50">
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
            src="/manus-storage/hero-egypioneers_4f1e0bd1.png"
            alt="Hero Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-[#1B365D]/95 via-[#1B365D]/80 to-[#1B365D]/60" />
        </div>
        <div className="container relative z-10 py-20">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            >
              <Badge className="bg-[#D4A853]/20 text-[#D4A853] border-[#D4A853]/30 mb-6 text-sm px-4 py-1.5">
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
              <span className="text-[#10B981]">ده مشروعك الحقيقي</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="text-xl text-white/80 mb-8 leading-relaxed"
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
                <Button size="lg" className="bg-[#10B981] hover:bg-[#059669] text-white text-lg px-8 py-6 font-bold shadow-xl shadow-green-500/20">
                  سجّل بياناتك دلوقتي
                  <ChevronDown className="w-5 h-5 mr-2 animate-bounce" />
                </Button>
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 text-lg px-8 py-6 font-bold bg-transparent">
                  <MessageCircle className="w-5 h-5 ml-2" />
                  كلمنا على واتساب
                </Button>
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b">
        <div className="container">
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center" ref={studentsCounter.ref as any}>
              <div className="text-3xl md:text-4xl font-black text-[#1B365D]">+{studentsCounter.count}</div>
              <div className="text-muted-foreground mt-1 text-sm md:text-base">طالب مشترك</div>
            </div>
            <div className="text-center" ref={productsCounter.ref as any}>
              <div className="text-3xl md:text-4xl font-black text-[#10B981]">+{productsCounter.count}</div>
              <div className="text-muted-foreground mt-1 text-sm md:text-base">منتج متاح</div>
            </div>
            <div className="text-center" ref={successCounter.ref as any}>
              <div className="text-3xl md:text-4xl font-black text-[#D4A853]">{successCounter.count}%</div>
              <div className="text-muted-foreground mt-1 text-sm md:text-base">نسبة النجاح</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <AnimatedSection className="py-20 bg-[#FAFAF8]">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-[#1B365D] mb-4">
              ليه الكورسات النظرية مش كفاية؟
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
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
                <Card className="p-6 text-center hover:shadow-lg transition-shadow duration-300 border-red-100 bg-red-50/50">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                    <item.icon className="w-7 h-7 text-red-500" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Solution Section */}
      <AnimatedSection className="py-20 bg-white">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20 mb-4">الحل الحقيقي</Badge>
            <h2 className="text-3xl md:text-4xl font-black text-[#1B365D] mb-4">
              إحنا بنديك مشروع كامل، مش مجرد كورس
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              أكاديمية Egy-Pioneers بتوفرلك كل حاجة محتاجها عشان تبدأ مشروعك الحقيقي
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Package, title: "الطالب بيختار المنتج", desc: "أنت اللي بتختار المنتج اللي عايز تبيعه من كتالوج فيه مئات المنتجات", bg: "#DBEAFE", iconColor: "#2563EB" },
              { icon: Store, title: "تواصل مباشر مع المورد", desc: "بنوصلك بالمورد مباشرة وبتاخد سعر أول يد - أقل سعر ممكن", bg: "#D1FAE5", iconColor: "#059669" },
              { icon: ShieldCheck, title: "اعتماد المنتج", desc: "فريقنا بيراجع المنتج ويتأكد إنه مناسب للسوق المصري", bg: "#FEF3C7", iconColor: "#D97706" },
              { icon: Truck, title: "مخزون حقيقي ومعرض", desc: "المنتج بيتخزن في مخازننا وبيتعرض في معرضنا الفعلي", bg: "#EDE9FE", iconColor: "#7C3AED" },
              { icon: BarChart3, title: "حملة إعلانية عملية", desc: "بتتعلم تعمل حملة حقيقية على منتجك وتبيع فعلاً", bg: "#FFE4E6", iconColor: "#E11D48" },
              { icon: GraduationCap, title: "نادي تجار العرب", desc: "مجتمع حصري من التجار بيتبادلوا الخبرات والفرص", bg: "#CCFBF1", iconColor: "#0D9488" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
              >
                <Card className="p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full">
                  <div className="w-12 h-12 mb-4 rounded-xl flex items-center justify-center" style={{ backgroundColor: item.bg }}>
                    <item.icon className="w-6 h-6" style={{ color: item.iconColor }} />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Exhibition Section */}
      <AnimatedSection className="py-20 bg-[#1B365D]">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-[#D4A853]/20 text-[#D4A853] border-[#D4A853]/30 mb-4">المعرض الحقيقي</Badge>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
                مش كلام على ورق...
                <br />
                <span className="text-[#10B981]">ده معرض حقيقي</span>
              </h2>
              <p className="text-white/70 text-lg leading-relaxed mb-8">
                المنتجات بتتعرض في معرض فعلي. العميل يقدر يشوف المنتج ويلمسه قبل ما يشتري. ده بيزود الثقة وبيرفع نسبة المبيعات.
              </p>
              <div className="space-y-4">
                {["تخزين آمن ومنظم", "تغليف احترافي", "شحن سريع لكل المحافظات", "متابعة الطلبات أونلاين"].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-[#10B981] shrink-0" />
                    <span className="text-white/90">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <img
                src="/manus-storage/exhibition-products_2c64d4cd.png"
                alt="معرض المنتجات"
                className="rounded-2xl shadow-2xl w-full"
              />
              <div className="absolute -bottom-4 -right-4 bg-[#10B981] text-white px-6 py-3 rounded-xl font-bold shadow-lg">
                +350 منتج متاح
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Journey Steps */}
      <AnimatedSection className="py-20 bg-[#FAFAF8]">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-[#1B365D] mb-4">
              رحلتك من الصفر لأول بيعة
            </h2>
            <p className="text-lg text-muted-foreground">
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
                <Card className="p-6 relative overflow-hidden hover:shadow-lg transition-all duration-300 group">
                  <div className="absolute top-4 left-4 text-6xl font-black text-[#1B365D]/5 group-hover:text-[#1B365D]/10 transition-colors">
                    {item.step}
                  </div>
                  <div className="relative z-10">
                    <div className="w-10 h-10 rounded-full bg-[#1B365D] text-white flex items-center justify-center font-bold text-sm mb-4">
                      {item.step}
                    </div>
                    <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">{item.desc}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Shipping Section */}
      <AnimatedSection className="py-20 bg-white">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <img
                src="/manus-storage/shipping-warehouse_aa33bd41.png"
                alt="التخزين والشحن"
                className="rounded-2xl shadow-xl w-full"
              />
            </div>
            <div className="order-1 md:order-2">
              <Badge className="bg-blue-100 text-blue-700 border-blue-200 mb-4">البنية التحتية</Badge>
              <h2 className="text-3xl md:text-4xl font-black text-[#1B365D] mb-6">
                تخزين وتغليف وشحن
                <br />
                <span className="text-[#10B981]">كل حاجة جاهزة</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                مش محتاج تشيل هم اللوجستيات. إحنا بنخزن المنتج، بنغلفه باحترافية، وبنشحنه لأي مكان في مصر.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "محافظة", value: "27" },
                  { label: "وقت التوصيل", value: "2-4 أيام" },
                  { label: "نسبة التوصيل", value: "97%" },
                  { label: "تتبع الشحنات", value: "لحظي" },
                ].map((item, i) => (
                  <div key={i} className="bg-[#FAFAF8] rounded-xl p-4 text-center">
                    <div className="font-black text-xl text-[#1B365D]">{item.value}</div>
                    <div className="text-sm text-muted-foreground">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Form Section */}
      <AnimatedSection className="py-20 bg-gradient-to-b from-[#FAFAF8] to-white" id="form-section">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <Badge className="bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20 mb-4">
                <Zap className="w-4 h-4 ml-1" />
                سجّل في 30 ثانية
              </Badge>
              <h2 className="text-3xl md:text-4xl font-black text-[#1B365D] mb-4">
                سجّل بياناتك وابدأ رحلتك
              </h2>
              <p className="text-muted-foreground text-lg">
                هنتواصل معاك على واتساب ونحدد أنسب بداية ليك
              </p>
            </div>

            {!formSubmitted ? (
              <Card className="p-8 shadow-xl border-0 bg-white">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name */}
                  <div>
                    <label className="block font-semibold mb-2 text-sm">الاسم</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-[#FAFAF8] focus:ring-2 focus:ring-[#1B365D]/20 focus:border-[#1B365D] outline-none transition-all"
                      placeholder="اكتب اسمك هنا"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block font-semibold mb-2 text-sm">رقم الموبايل (اللي عليه واتساب)</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-[#FAFAF8] focus:ring-2 focus:ring-[#1B365D]/20 focus:border-[#1B365D] outline-none transition-all"
                      placeholder="01xxxxxxxxx"
                      dir="ltr"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block font-semibold mb-2 text-sm">حضرتك أقرب لأنهي حالة؟</label>
                    <div className="space-y-2">
                      {[
                        "لسه هبدأ من الصفر",
                        "جرّبت قبل كده وخسرت",
                        "عندي خبرة في الإعلانات ومحتاج منتج",
                        "عندي منتج أو مشروع قائم",
                        "جاهز أعرف تفاصيل الحجز",
                      ].map((option) => (
                        <label key={option} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-[#1B365D]/30 hover:bg-[#1B365D]/5 cursor-pointer transition-all">
                          <input
                            type="radio"
                            name="status"
                            value={option}
                            required
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-4 h-4 accent-[#1B365D]"
                          />
                          <span className="text-sm">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Goal */}
                  <div>
                    <label className="block font-semibold mb-2 text-sm">هدفك الأساسي إيه؟</label>
                    <div className="space-y-2">
                      {[
                        "أبدأ مشروع جنب شغلي",
                        "أبني مصدر دخل أساسي",
                        "أطوّر مشروع قائم",
                        "أتعلم مهارة أشتغل بيها",
                        "أبني براند خاص بيا",
                      ].map((option) => (
                        <label key={option} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-[#1B365D]/30 hover:bg-[#1B365D]/5 cursor-pointer transition-all">
                          <input
                            type="radio"
                            name="goal"
                            value={option}
                            required
                            onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                            className="w-4 h-4 accent-[#1B365D]"
                          />
                          <span className="text-sm">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Timing */}
                  <div>
                    <label className="block font-semibold mb-2 text-sm">ناوي تبدأ إمتى؟</label>
                    <div className="space-y-2">
                      {[
                        "فوراً",
                        "خلال الشهر الحالي",
                        "خلال 1-3 شهور",
                        "بجمع معلومات حاليًا",
                      ].map((option) => (
                        <label key={option} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-[#1B365D]/30 hover:bg-[#1B365D]/5 cursor-pointer transition-all">
                          <input
                            type="radio"
                            name="timing"
                            value={option}
                            required
                            onChange={(e) => setFormData({ ...formData, timing: e.target.value })}
                            className="w-4 h-4 accent-[#1B365D]"
                          />
                          <span className="text-sm">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Consent */}
                  <div className="bg-[#FAFAF8] rounded-xl p-4 border border-border">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" required className="w-4 h-4 mt-1 accent-[#1B365D]" />
                      <span className="text-xs text-muted-foreground leading-relaxed">
                        أوافق إن أكاديمية Egy-Pioneers تتواصل معايا عبر واتساب بخصوص الويبينار والدبلومة، وأقدر أطلب إيقاف الرسائل في أي وقت.
                      </span>
                    </label>
                  </div>

                  <Button type="submit" size="lg" className="w-full bg-[#10B981] hover:bg-[#059669] text-white text-lg py-6 font-bold shadow-xl shadow-green-200/50">
                    سجّل بياناتك
                    <CheckCircle className="w-5 h-5 mr-2" />
                  </Button>
                </form>
              </Card>
            ) : (
              /* Thank You Screen */
              <Card className="p-10 shadow-xl border-0 bg-white text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#10B981]/10 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-[#10B981]" />
                </div>
                <h3 className="text-2xl font-black text-[#1B365D] mb-4">
                  تم تسجيل بياناتك بنجاح ✅
                </h3>
                <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                  الخطوة الجاية إننا نفهم وضعك ونرشح لك أنسب بداية، بدل ما نبعتلك كلام عام.
                  <br />
                  اضغط على الزر وابعت كلمة "تاجر" على واتساب عشان نبدأ فوراً 👇
                </p>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-[#25D366] hover:bg-[#20BD5A] text-white text-xl px-10 py-7 font-bold shadow-xl shadow-green-200/50 animate-pulse-green">
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
      <AnimatedSection className="py-20 bg-white">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black text-[#1B365D] mb-4">
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
                <div key={i} className="border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-right hover:bg-[#FAFAF8] transition-colors"
                  >
                    <span className="font-semibold text-[#1B365D]">{item.q}</span>
                    <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-200 shrink-0 mr-4 ${openFaq === i ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="px-5 pb-5"
                    >
                      <p className="text-muted-foreground leading-relaxed">{item.a}</p>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Footer */}
      <footer className="py-12 bg-[#1B365D] text-white">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="/manus-storage/egypioneers-logo_86bbc342.png"
                  alt="Logo"
                  className="w-10 h-10 object-contain brightness-200"
                />
                <span className="font-bold text-lg">Egy-Pioneers Academy</span>
              </div>
              <p className="text-white/60 text-sm leading-relaxed">
                أكاديمية عملية لبناء مشاريع التجارة الإلكترونية من الصفر لأول بيعة حقيقية.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">تواصل معانا</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-white/70 text-sm">
                  <Phone className="w-4 h-4" />
                  <span dir="ltr">+20 103 730 3001</span>
                </div>
                <div className="flex items-center gap-3 text-white/70 text-sm">
                  <MessageCircle className="w-4 h-4" />
                  <a href={WHATSAPP_URL} className="hover:text-white transition-colors">واتساب</a>
                </div>
                <div className="flex items-center gap-3 text-white/70 text-sm">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>فيلا 139 - التجمع الأول - خلف شارع التسعين الجنوبي</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4">روابط سريعة</h4>
              <div className="space-y-2">
                <a href="#form-section" className="block text-white/70 text-sm hover:text-white transition-colors">سجّل بياناتك</a>
                <a href={WHATSAPP_URL} className="block text-white/70 text-sm hover:text-white transition-colors">تواصل على واتساب</a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-white/40 text-sm">
            © 2026 Egy-Pioneers Academy. جميع الحقوق محفوظة.
          </div>
        </div>
      </footer>

      {/* Sticky WhatsApp Button */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-2xl shadow-green-500/30 hover:scale-110 transition-transform duration-200 animate-pulse-green"
      >
        <MessageCircle className="w-7 h-7" />
      </a>
    </div>
  );
}
