import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { STORE_ONBOARDING_STEPS, STORE_URL } from "@/lib/storeLink";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion, useInView, AnimatePresence } from "framer-motion";
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
  AlertCircle,
  ArrowLeft,
  Mail,
  Smartphone,
  Download,
  FileText,
  Home as HomeIcon,
  X,
  Eye,
  ExternalLink,
  Search,
  ShoppingCart,
  LogIn,
  Sparkles,
} from "lucide-react";

// ======================================================
// DESIGN: Corporate Trust + Egyptian Warmth (Dark Premium)
// COLORS: Black + Orange (#EA8A1E) + Gold (#D4A853)
// FONT: Cairo (Arabic) + Inter (English/Numbers)
// DIRECTION: RTL-first
// PURPOSE: صفحة فرز وتأهيل + إثبات ثقة (مش صفحة تعريف)
// ======================================================

const WEBHOOK_URL = "https://allhomz.app.n8n.cloud/webhook/egy-pioneers-lead";

const WHATSAPP_URL = "https://wa.me/15559022738?text=%D8%A3%D9%86%D8%A7%20%D8%B3%D8%AC%D9%84%D8%AA%20%D9%81%D9%8A%20%D9%86%D9%85%D9%88%D8%B0%D8%AC%20Egy-Pioneers%20%D9%88%D8%B9%D8%A7%D9%8A%D8%B2%20%D8%A3%D8%B9%D8%B1%D9%81%20%D8%A3%D9%86%D8%B3%D8%A8%20%D8%A8%D8%AF%D8%A7%D9%8A%D8%A9%20%D9%84%D9%8A%D8%A7";

// Brand Colors
const ORANGE = "#EA8A1E";
const GOLD = "#D4A853";
const DARK = "#0A0A0A";
const DARK_CARD = "#141414";
const DARK_SECTION = "#0F0F0F";
const STORE_GUIDE_ICONS = [LogIn, Search, ShoppingCart];

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
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    role: "",
    challenge: "",
    stage: "",
    readiness: "",
    preference: "",
  });
  const [formState, setFormState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showStoreGuide, setShowStoreGuide] = useState(false);

  // Meta Pixel helper
  const fbq = (...args: any[]) => {
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq(...args);
    }
  };

  // ViewContent: fire once on first form interaction
  const hasTrackedViewContent = useRef(false);
  const handleFormInteraction = () => {
    if (!hasTrackedViewContent.current) {
      hasTrackedViewContent.current = true;
      fbq("track", "ViewContent", { content_name: "EgyPioneers Lead Form" });
    }
  };

  // Schedule: fire on WhatsApp click
  const handleWhatsAppClick = () => {
    fbq("track", "Schedule", { content_name: "WhatsApp Contact" });
  };

  const handleStoreClick = () => {
    fbq("trackCustom", "WholesalePlatformClick", {
      content_name: "Egy-Pioneers Wholesale Platform",
      destination: STORE_URL,
    });
  };

  const openStoreGuide = () => {
    fbq("trackCustom", "WholesalePlatformGuideOpen", {
      content_name: "Three Store Onboarding Steps",
    });
    setShowStoreGuide(true);
  };

  // CompleteRegistration: fire when form succeeds
  const hasTrackedComplete = useRef(false);
  useEffect(() => {
    if (formState === "success" && !hasTrackedComplete.current) {
      hasTrackedComplete.current = true;
      fbq("track", "CompleteRegistration", {
        content_name: "EgyPioneers Qualification Complete",
        status: true,
      });
    }
  }, [formState]);

  // Local Storage: حفظ البيانات تلقائياً
  const STORAGE_KEY = "egypioneers_form_data";

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData((prev) => ({ ...prev, ...parsed }));
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (formState !== "success") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }
  }, [formData, formState]);

  // Clear storage on success
  const clearSavedData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // PDF Generation
  const generatePDF = () => {
    const roleLabels: Record<string, string> = { student: "\u0637\u0627\u0644\u0628", employee: "\u0645\u0648\u0638\u0641", business_owner: "\u0635\u0627\u062d\u0628 \u0645\u0634\u0631\u0648\u0639", marketer: "\u0645\u0633\u0648\u0651\u0642", other: "\u0623\u062e\u0631\u0649" };
    const stageLabels: Record<string, string> = { idea: "\u0644\u0633\u0647 \u0641\u0643\u0631\u0629", starting: "\u0628\u062f\u0623\u062a \u0628\u0633 \u0644\u0633\u0647 \u0641\u064a \u0627\u0644\u0623\u0648\u0644", running: "\u0634\u063a\u0651\u0627\u0644 \u0648\u0645\u062d\u062a\u0627\u062c \u0623\u0637\u0648\u0651\u0631" };
    const readinessLabels: Record<string, string> = { now: "\u062c\u0627\u0647\u0632 \u062f\u0644\u0648\u0642\u062a\u064a", month: "\u062e\u0644\u0627\u0644 \u0634\u0647\u0631", exploring: "\u0628\u0633 \u0628\u0633\u0623\u0644" };
    const prefLabels: Record<string, string> = { online: "\u0623\u0648\u0646\u0644\u0627\u064a\u0646", offline: "\u062d\u0636\u0648\u0631 \u0641\u064a \u0627\u0644\u0645\u0642\u0631", both: "\u0645\u0634 \u0641\u0627\u0631\u0642 \u0645\u0639\u0627\u064a\u0627" };

    const content = `
      <html dir="rtl">
      <head><meta charset="utf-8"><title>\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u062a\u0633\u062c\u064a\u0644 - Egy-Pioneers</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; direction: rtl; color: #1a1a1a; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #EA8A1E; padding-bottom: 20px; }
        .header h1 { color: #EA8A1E; margin: 0; font-size: 24px; }
        .header p { color: #666; margin-top: 8px; }
        .field { margin-bottom: 16px; padding: 12px 16px; background: #f9f9f9; border-radius: 8px; border-right: 4px solid #EA8A1E; }
        .field-label { font-weight: bold; color: #333; margin-bottom: 4px; font-size: 14px; }
        .field-value { color: #555; font-size: 16px; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px; }
      </style></head>
      <body>
        <div class="header">
          <h1>Egy-Pioneers Academy</h1>
          <p>\u0646\u0633\u062e\u0629 \u0645\u0646 \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062e\u0627\u0635\u0629 \u0628\u0643</p>
        </div>
        <div class="field"><div class="field-label">\u0627\u0644\u0627\u0633\u0645</div><div class="field-value">${formData.name}</div></div>
        <div class="field"><div class="field-label">\u0631\u0642\u0645 \u0627\u0644\u0645\u0648\u0628\u0627\u064a\u0644</div><div class="field-value">${formData.phone}</div></div>
        <div class="field"><div class="field-label">\u0627\u0644\u0625\u064a\u0645\u064a\u0644</div><div class="field-value">${formData.email}</div></div>
        <div class="field"><div class="field-label">\u0627\u0644\u062d\u0627\u0644\u0629 \u0627\u0644\u062d\u0627\u0644\u064a\u0629</div><div class="field-value">${roleLabels[formData.role] || formData.role}</div></div>
        <div class="field"><div class="field-label">\u0645\u0631\u062d\u0644\u0629 \u0627\u0644\u0645\u0634\u0631\u0648\u0639</div><div class="field-value">${stageLabels[formData.stage] || formData.stage}</div></div>
        <div class="field"><div class="field-label">\u0627\u0644\u062c\u0627\u0647\u0632\u064a\u0629 \u0644\u0644\u0628\u062f\u0621</div><div class="field-value">${readinessLabels[formData.readiness] || formData.readiness}</div></div>
        <div class="field"><div class="field-label">\u062a\u0641\u0636\u064a\u0644 \u0627\u0644\u062a\u0639\u0644\u0645</div><div class="field-value">${prefLabels[formData.preference] || formData.preference}</div></div>
        <div class="field"><div class="field-label">\u0623\u0643\u0628\u0631 \u062a\u062d\u062f\u064a</div><div class="field-value">${formData.challenge}</div></div>
        <div class="footer">
          <p>\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u062a\u0633\u062c\u064a\u0644: ${new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}</p>
          <p>Egy-Pioneers Academy | \u0641\u064a\u0644\u0627 139 - \u0627\u0644\u062a\u062c\u0645\u0639 \u0627\u0644\u0623\u0648\u0644</p>
        </div>
      </body></html>
    `;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      setTimeout(() => { printWindow.print(); }, 500);
    }
  };

  // Real-time validation
  const getFieldError = (field: string): string => {
    switch (field) {
      case "name":
        if (!formData.name.trim()) return "اكتب اسمك علشان نعرف نكلمك";
        if (formData.name.trim().length < 2) return "الاسم لازم يكون حرفين على الأقل";
        return "";
      case "phone":
        if (!formData.phone.trim()) return "اكتب رقم موبايلك علشان نقدر نتواصل معاك";
        if (!/^(\+?20|0)?1[0-9]{9}$/.test(formData.phone.replace(/\s|-/g, ""))) return "رقم الموبايل مش صح — لازم يبدأ ب 01 ويكون 11 رقم";
        return "";
      case "email":
        if (!formData.email.trim()) return "اكتب الإيميل بتاعك";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) return "الإيميل مش صح — تأكد من الصيغة";
        return "";
      case "role":
        if (!formData.role) return "اختار أنت حالياً إيه";
        return "";
      case "stage":
        if (!formData.stage) return "اختار أنت فين دلوقتي في مشروعك";
        return "";
      case "readiness":
        if (!formData.readiness) return "اختار جاهز تبدأ امتى";
        return "";
      case "preference":
        if (!formData.preference) return "اختار تحب تتعلم إزاي";
        return "";
      case "challenge":
        if (!formData.challenge.trim()) return "قولنا أكبر تحدي عندك — ده بيساعدنا نوجّهك صح";
        if (formData.challenge.trim().length < 5) return "اكتب تفاصيل أكتر شوية علشان نفهمك";
        return "";
      default:
        return "";
    }
  };

  const ALL_FIELDS = ["name", "phone", "email", "role", "stage", "readiness", "preference", "challenge"];

  const isFormValid = (): boolean => {
    return ALL_FIELDS.every((f) => !getFieldError(f));
  };

  // Progress bar calculation
  const completedFields = ALL_FIELDS.filter((f) => !getFieldError(f)).length;
  const progressPercent = Math.round((completedFields / ALL_FIELDS.length) * 100);

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const shouldShowError = (field: string): boolean => {
    return (touched[field] || showAllErrors) && !!getFieldError(field);
  };

  const studentsCounter = useCounter(1200);
  const productsCounter = useCounter(350);
  const successCounter = useCounter(89);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Show all errors if form is invalid
    if (!isFormValid()) {
      setShowAllErrors(true);
      return;
    }

    // Show confirmation modal
    setShowConfirmModal(true);
  };

  const submitMutation = trpc.leads.submit.useMutation();

  const confirmAndSubmit = async () => {
    setShowConfirmModal(false);
    setFormState("submitting");

    try {
      // 1. حفظ في الـ Database عبر tRPC
      await submitMutation.mutateAsync({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        role: formData.role || undefined,
        challenge: formData.challenge || undefined,
        stage: formData.stage || undefined,
        readiness: formData.readiness || undefined,
        preference: formData.preference || undefined,
      });

      // 2. إرسال للـ webhook (n8n) بشكل متوازي — لو فشل مش مشكلة
      fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          role: formData.role,
          challenge: formData.challenge,
          stage: formData.stage,
          readiness: formData.readiness,
          preference: formData.preference,
        }),
      }).catch(() => {}); // silent fail for webhook

      setFormState("success");
      clearSavedData();
      // Fire Meta Pixel Lead event
      fbq("track", "Lead", {
        content_name: "EgyPioneers Qualification Form",
        role: formData.role,
        stage: formData.stage,
        readiness: formData.readiness,
      });
      // Auto-reset form after 10 seconds
      setTimeout(() => {
        setFormState("idle");
        setFormData({ name: "", phone: "", email: "", role: "", challenge: "", stage: "", readiness: "", preference: "" });
        setTouched({});
        setShowAllErrors(false);
      }, 10000);
    } catch {
      setFormState("error");
    }
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
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="group hidden sm:inline-flex gap-2 border text-white hover:bg-white/10 transition-[transform,box-shadow,background-color,border-color] duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_22px_rgba(234,138,30,0.28)] active:translate-y-0 active:scale-[0.97]" style={{ borderColor: `${ORANGE}80`, backgroundColor: "transparent" }}>
              <a href={STORE_URL} target="_blank" rel="noopener noreferrer" onClick={handleStoreClick}>
                <Store className="w-4 h-4 transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-3" style={{ color: ORANGE }} />
                منصة المنتجات
              </a>
            </Button>
            <a href="#form-section">
              <Button className="text-black gap-2 font-semibold shadow-lg" style={{ backgroundColor: ORANGE }}>
                <Zap className="w-4 h-4" />
                ابدأ دلوقتي
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section - يجيب على سؤال "أنا هستفيد إيه عملياً؟" */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/manus-storage/egypioneers-banner_6cce498a.png"
            alt="Hero Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to left, rgba(10,10,10,0.95), rgba(10,10,10,0.75), rgba(10,10,10,0.5))" }} />
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
                مسار عملي — مش كورس نظري
              </Badge>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
              className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-6"
            >
              عايز تبدأ مشروعك
              <br />
              بس مش عارف <span style={{ color: ORANGE }}>تبدأ منين؟</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="text-xl text-white/70 mb-8 leading-relaxed"
            >
              هنا بنديك منتج حقيقي + مخزون جاهز + حملة إعلانية عملية + فريق دعم كامل.
              <br />
              <strong className="text-white/90">النتيجة؟ أول بيعة حقيقية خلال 30 يوم.</strong>
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="flex flex-wrap gap-4"
            >
              <a href="#form-section">
                <Button size="lg" className="text-black text-lg px-8 py-6 font-bold shadow-xl" style={{ backgroundColor: ORANGE }}>
                  ابعت بياناتك وخد الخطوة اللي بعديها
                  <ArrowLeft className="w-5 h-5 mr-2" />
                </Button>
              </a>
              <Button asChild size="lg" variant="outline" className="group border-white/30 bg-black/20 text-white hover:bg-white/10 text-base px-6 py-6 font-bold transition-[transform,box-shadow,background-color,border-color] duration-200 hover:-translate-y-1 hover:border-[#D4A853] hover:shadow-[0_0_28px_rgba(212,168,83,0.24)] active:translate-y-0 active:scale-[0.97]">
                <a href={STORE_URL} target="_blank" rel="noopener noreferrer" onClick={handleStoreClick}>
                  <Store className="w-5 h-5 ml-2 transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-3" style={{ color: GOLD }} />
                  شوف منصة المنتجات بالجملة
                  <ExternalLink className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:-translate-x-1" />
                </a>
              </Button>
            </motion.div>
            {/* Micro social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-8 flex items-center gap-3"
            >
              <div className="flex -space-x-2 space-x-reverse">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold" style={{ backgroundColor: DARK_CARD, borderColor: ORANGE, color: ORANGE }}>
                    {["أ","م","ع","ه"][i-1]}
                  </div>
                ))}
              </div>
              <span className="text-white/50 text-sm">+1200 شخص بدأوا رحلتهم معانا</span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Lead Qualification Form - فوق الـ fold بعد أول section قوي */}
      <AnimatedSection className="py-16" id="form-section" style={{ backgroundColor: DARK_CARD }}>
        <div className="container">
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
                خلّينا نشوف أنسب خطوة ليك
              </h2>
              <p className="text-white/50">
                كام سؤال سريع — وهنرد عليك بخطة عملية مخصصة ليك
              </p>
            </div>

            {formState === "idle" || formState === "submitting" || formState === "error" ? (
              <Card className="p-6 md:p-8 shadow-2xl border" style={{ backgroundColor: DARK_SECTION, borderColor: `${ORANGE}25` }}>
                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-white/50">اكتمال البيانات</span>
                    <span className="text-xs font-bold" style={{ color: progressPercent === 100 ? "#10B981" : ORANGE }}>{progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${DARK_CARD}` }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: progressPercent === 100 ? "#10B981" : ORANGE }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                    />
                  </div>
                  <p className="text-xs mt-1.5" style={{ color: progressPercent === 100 ? "#10B981" : "rgba(255,255,255,0.35)" }}>
                    {progressPercent === 100 ? "تمام — ابعت بياناتك دلوقتي!" : `${completedFields} من ${ALL_FIELDS.length} أسئلة مكتملة`}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5" onFocusCapture={handleFormInteraction} onClickCapture={handleFormInteraction}>
                  {/* Name */}
                  <div>
                    <label className="block font-semibold mb-2 text-sm text-white/90">اسمك إيه؟</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      onBlur={() => markTouched("name")}
                      className={`w-full px-4 py-3.5 rounded-xl border outline-none transition-all text-white focus:ring-2 ${shouldShowError("name") ? "border-red-500/70" : ""}`}
                      style={{ backgroundColor: DARK_CARD, borderColor: shouldShowError("name") ? "#EF4444" : "rgba(255,255,255,0.1)", outlineColor: ORANGE }}
                      placeholder="الاسم الأول يكفي"
                    />
                    {shouldShowError("name") && (
                      <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: "#F87171" }}>
                        <AlertCircle className="w-3 h-3" />
                        {getFieldError("name")}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block font-semibold mb-2 text-sm text-white/90">رقم الموبايل</label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        type="tel"
                        dir="ltr"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        onBlur={() => markTouched("phone")}
                        className={`w-full px-4 pl-10 py-3.5 rounded-xl border outline-none transition-all text-white focus:ring-2 ${shouldShowError("phone") ? "border-red-500/70" : ""}`}
                        style={{ backgroundColor: DARK_CARD, borderColor: shouldShowError("phone") ? "#EF4444" : "rgba(255,255,255,0.1)", outlineColor: ORANGE }}
                        placeholder="01xxxxxxxxx"
                      />
                    </div>
                    {shouldShowError("phone") && (
                      <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: "#F87171" }}>
                        <AlertCircle className="w-3 h-3" />
                        {getFieldError("phone")}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block font-semibold mb-2 text-sm text-white/90">الإيميل</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        type="email"
                        dir="ltr"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        onBlur={() => markTouched("email")}
                        className={`w-full px-4 pl-10 py-3.5 rounded-xl border outline-none transition-all text-white focus:ring-2 ${shouldShowError("email") ? "border-red-500/70" : ""}`}
                        style={{ backgroundColor: DARK_CARD, borderColor: shouldShowError("email") ? "#EF4444" : "rgba(255,255,255,0.1)", outlineColor: ORANGE }}
                        placeholder="example@email.com"
                      />
                    </div>
                    {shouldShowError("email") && (
                      <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: "#F87171" }}>
                        <AlertCircle className="w-3 h-3" />
                        {getFieldError("email")}
                      </p>
                    )}
                  </div>

                  {/* Role - أنت حالياً إيه؟ */}
                  <div>
                    <label className="block font-semibold mb-2 text-sm text-white/90">أنت حالياً إيه؟</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        "طالب",
                        "موظف",
                        "صاحب مشروع",
                        "مسوّق",
                        "أخرى",
                      ].map((option) => (
                        <label
                          key={option}
                          className={`flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all text-sm font-medium ${formData.role === option ? "border-opacity-100 text-white" : "text-white/60 hover:text-white/80"}`}
                          style={{
                            borderColor: formData.role === option ? ORANGE : shouldShowError("role") ? "#EF444450" : "rgba(255,255,255,0.1)",
                            backgroundColor: formData.role === option ? `${ORANGE}15` : DARK_CARD,
                          }}
                        >
                          <input
                            type="radio"
                            name="role"
                            value={option}
                            onChange={(e) => { setFormData({ ...formData, role: e.target.value }); markTouched("role"); }}
                            className="sr-only"
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                    {shouldShowError("role") && (
                      <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: "#F87171" }}>
                        <AlertCircle className="w-3 h-3" />
                        {getFieldError("role")}
                      </p>
                    )}
                  </div>

                  {/* Stage - مرحلة المشروع */}
                  <div>
                    <label className="block font-semibold mb-2 text-sm text-white/90">أنت فين دلوقتي في مشروعك؟</label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        "لسه فكرة ومش عارف أبدأ",
                        "بدأت بس لسه في الأول",
                        "شغّال ومحتاج أطوّر",
                      ].map((option) => (
                        <label
                          key={option}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all text-sm font-medium ${formData.stage === option ? "border-opacity-100 text-white" : "text-white/60 hover:text-white/80"}`}
                          style={{
                            borderColor: formData.stage === option ? ORANGE : shouldShowError("stage") ? "#EF444450" : "rgba(255,255,255,0.1)",
                            backgroundColor: formData.stage === option ? `${ORANGE}15` : DARK_CARD,
                          }}
                        >
                          <input
                            type="radio"
                            name="stage"
                            value={option}
                            onChange={(e) => { setFormData({ ...formData, stage: e.target.value }); markTouched("stage"); }}
                            className="sr-only"
                          />
                          <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0" style={{ borderColor: formData.stage === option ? ORANGE : shouldShowError("stage") ? "#EF444450" : "rgba(255,255,255,0.3)" }}>
                            {formData.stage === option && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ORANGE }} />}
                          </div>
                          {option}
                        </label>
                      ))}
                    </div>
                    {shouldShowError("stage") && (
                      <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: "#F87171" }}>
                        <AlertCircle className="w-3 h-3" />
                        {getFieldError("stage")}
                      </p>
                    )}
                  </div>

                  {/* Readiness - الجاهزية للبدء */}
                  <div>
                    <label className="block font-semibold mb-2 text-sm text-white/90">جاهز تبدأ امتى؟</label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        "جاهز أبدأ دلوقتي",
                        "خلال شهر",
                        "بس بسأل وبجمّع معلومات",
                      ].map((option) => (
                        <label
                          key={option}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all text-sm font-medium ${formData.readiness === option ? "border-opacity-100 text-white" : "text-white/60 hover:text-white/80"}`}
                          style={{
                            borderColor: formData.readiness === option ? GOLD : shouldShowError("readiness") ? "#EF444450" : "rgba(255,255,255,0.1)",
                            backgroundColor: formData.readiness === option ? `${GOLD}15` : DARK_CARD,
                          }}
                        >
                          <input
                            type="radio"
                            name="readiness"
                            value={option}
                            onChange={(e) => { setFormData({ ...formData, readiness: e.target.value }); markTouched("readiness"); }}
                            className="sr-only"
                          />
                          <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0" style={{ borderColor: formData.readiness === option ? GOLD : shouldShowError("readiness") ? "#EF444450" : "rgba(255,255,255,0.3)" }}>
                            {formData.readiness === option && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: GOLD }} />}
                          </div>
                          {option}
                        </label>
                      ))}
                    </div>
                    {shouldShowError("readiness") && (
                      <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: "#F87171" }}>
                        <AlertCircle className="w-3 h-3" />
                        {getFieldError("readiness")}
                      </p>
                    )}
                  </div>

                  {/* Preference - Online/Offline */}
                  <div>
                    <label className="block font-semibold mb-2 text-sm text-white/90">تحب تتعلم إزاي؟</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        "أونلاين",
                        "حضور في المقر",
                        "مش فارق معايا",
                      ].map((option) => (
                        <label
                          key={option}
                          className={`flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-all text-xs md:text-sm font-medium text-center ${formData.preference === option ? "border-opacity-100 text-white" : "text-white/60 hover:text-white/80"}`}
                          style={{
                            borderColor: formData.preference === option ? ORANGE : shouldShowError("preference") ? "#EF444450" : "rgba(255,255,255,0.1)",
                            backgroundColor: formData.preference === option ? `${ORANGE}15` : DARK_CARD,
                          }}
                        >
                          <input
                            type="radio"
                            name="preference"
                            value={option}
                            onChange={(e) => { setFormData({ ...formData, preference: e.target.value }); markTouched("preference"); }}
                            className="sr-only"
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                    {shouldShowError("preference") && (
                      <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: "#F87171" }}>
                        <AlertCircle className="w-3 h-3" />
                        {getFieldError("preference")}
                      </p>
                    )}
                  </div>

                  {/* Challenge - أكبر تحدي */}
                  <div>
                    <label className="block font-semibold mb-2 text-sm text-white/90">أكبر تحدي عندك دلوقتي إيه؟</label>
                    <textarea
                      value={formData.challenge}
                      onChange={(e) => setFormData({ ...formData, challenge: e.target.value })}
                      onBlur={() => markTouched("challenge")}
                      className={`w-full px-4 py-3.5 rounded-xl border outline-none transition-all text-white resize-none focus:ring-2 ${shouldShowError("challenge") ? "border-red-500/70" : ""}`}
                      style={{ backgroundColor: DARK_CARD, borderColor: shouldShowError("challenge") ? "#EF4444" : "rgba(255,255,255,0.1)", outlineColor: ORANGE }}
                      placeholder="مثلاً: مش لاقي منتج مناسب / مش عارف أبدأ إزاي / محتاج أفهم التسويق..."
                      rows={3}
                    />
                    {shouldShowError("challenge") && (
                      <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: "#F87171" }}>
                        <AlertCircle className="w-3 h-3" />
                        {getFieldError("challenge")}
                      </p>
                    )}
                  </div>

                  {/* Error State */}
                  {formState === "error" && (
                    <div className="flex items-center gap-2 p-3 rounded-xl text-sm" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#EF4444" }}>
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>حصل مشكلة في الإرسال. جرّب تاني أو كلمنا على واتساب.</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    disabled={formState === "submitting"}
                    className="w-full text-black text-lg py-6 font-bold shadow-xl disabled:opacity-70 relative overflow-hidden transition-all duration-200 active:scale-[0.97]"
                    style={{ backgroundColor: ORANGE }}
                  >
                    {formState === "submitting" ? (
                      <span className="flex items-center justify-center gap-3">
                        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        <span>بنبعت بياناتك... استنى ثواني</span>
                      </span>
                    ) : (
                      <>
                        ابعت بياناتك وخد الخطوة اللي بعديها
                        <ArrowLeft className="w-5 h-5 mr-2" />
                      </>
                    )}
                  </Button>

                  <p className="text-center text-white/30 text-xs">
                    🔒 بياناتك في أمان تام — هنتواصل معاك خلال 24 ساعة
                  </p>
                </form>
              </Card>
            ) : (
              /* Success State - Enhanced with Confetti */
              <Card className="p-8 md:p-10 shadow-2xl border text-center relative overflow-hidden" style={{ backgroundColor: DARK_SECTION, borderColor: `${ORANGE}30` }}>
                {/* Confetti Particles */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: [ORANGE, GOLD, "#10B981", "#3B82F6", "#EF4444", "#8B5CF6"][i % 6],
                        left: `${Math.random() * 100}%`,
                        top: `-5%`,
                      }}
                      initial={{ y: -20, opacity: 1, rotate: 0 }}
                      animate={{
                        y: [0, 400 + Math.random() * 200],
                        x: [0, (Math.random() - 0.5) * 100],
                        opacity: [1, 1, 0],
                        rotate: [0, Math.random() * 720 - 360],
                      }}
                      transition={{
                        duration: 2 + Math.random() * 1.5,
                        delay: Math.random() * 0.8,
                        ease: "easeOut",
                      }}
                    />
                  ))}
                </div>

                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                >
                  {/* Animated checkmark with pulse ring */}
                  <div className="relative w-24 h-24 mx-auto mb-6">
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{ backgroundColor: "#10B98115" }}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: [1, 1.5, 1.5], opacity: [0.5, 0.2, 0] }}
                      transition={{ delay: 0.3, duration: 1.2, ease: "easeOut" }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{ backgroundColor: "#10B98115" }}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: [1, 1.3, 1.3], opacity: [0.5, 0.2, 0] }}
                      transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
                    />
                    <motion.div
                      className="w-24 h-24 rounded-full flex items-center justify-center relative"
                      style={{ backgroundColor: "#10B98120" }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 200, damping: 12 }}
                    >
                      <motion.div
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.4 }}
                      >
                        <CheckCircle className="w-12 h-12" style={{ color: "#10B981" }} />
                      </motion.div>
                    </motion.div>
                  </div>

                  <motion.h3
                    className="text-2xl md:text-3xl font-black text-white mb-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    شكراً ليك {formData.name ? formData.name.split(" ")[0] : ""} 🎉
                  </motion.h3>

                  <motion.p
                    className="text-white/60 text-lg mb-4 leading-relaxed"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    استلمنا بياناتك وبنجهّزلك خطة عملية مخصصة.
                  </motion.p>

                  <motion.div
                    className="p-4 rounded-xl mb-6"
                    style={{ backgroundColor: `${DARK_CARD}` }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <p className="text-white/80 text-sm leading-relaxed">
                      📩 هنتواصل معاك على <span className="font-bold" style={{ color: ORANGE }}>{formData.phone || "واتساب"}</span> خلال 24 ساعة
                      <br />
                      <span className="text-white/50 text-xs">عايز تبدأ فوراً؟ كلمنا دلوقتي على واتساب</span>
                    </p>
                  </motion.div>

                  <motion.div
                    className="flex flex-col sm:flex-row gap-3 justify-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" onClick={handleWhatsAppClick}>
                      <Button size="lg" className="text-white text-lg px-6 py-5 font-bold shadow-xl w-full" style={{ backgroundColor: "#25D366" }}>
                        <MessageCircle className="w-5 h-5 ml-2" />
                        كلمنا على واتساب
                      </Button>
                    </a>
                    <Button
                      size="lg"
                      onClick={generatePDF}
                      className="text-white text-base px-6 py-5 font-bold border w-full sm:w-auto"
                      style={{ backgroundColor: "transparent", borderColor: `${ORANGE}50` }}
                    >
                      <Download className="w-4 h-4 ml-2" />
                      حمّل نسخة PDF
                    </Button>
                  </motion.div>

                  <motion.div
                    className="mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    <button
                      onClick={() => {
                        setFormState("idle");
                        setFormData({ name: "", phone: "", email: "", role: "", challenge: "", stage: "", readiness: "", preference: "" });
                        setTouched({});
                        setShowAllErrors(false);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="text-white/40 hover:text-white/70 text-sm flex items-center gap-1 mx-auto transition-colors"
                    >
                      <HomeIcon className="w-3.5 h-3.5" />
                      العودة للصفحة الرئيسية
                    </button>
                  </motion.div>
                </motion.div>
              </Card>
            )}
          </div>
        </div>
      </AnimatedSection>

      {/* Trust Section - "ليه تثق فينا؟" */}
      <AnimatedSection className="py-16" style={{ backgroundColor: DARK_SECTION }}>
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
              ليه ده مختلف عن أي كورس تاني؟
            </h2>
            <p className="text-white/50 text-lg">
              لأنك مش بتتعلم بس — أنت بتشتغل فعلاً من أول يوم
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: Target, title: "منتج حقيقي تبيعه", desc: "مش هتتعلم نظري وتقعد. هتختار منتج من كتالوج فيه مئات المنتجات وتبدأ تبيعه فعلاً.", color: ORANGE },
              { icon: Truck, title: "مخزون + شحن + معرض", desc: "المنتج بيتخزن عندنا، بيتغلف باحترافية، وبيتشحن لأي حتة في مصر. أنت ركّز على البيع.", color: "#10B981" },
              { icon: Users, title: "دعم مستمر مش بيخلص", desc: "مجتمع تجار + متابعة أسبوعية + فريق دعم. مش هتلاقي نفسك لوحدك أبداً.", color: GOLD },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <Card className="p-6 h-full border hover:-translate-y-1 transition-all duration-300" style={{ backgroundColor: DARK_CARD, borderColor: "rgba(255,255,255,0.05)" }}>
                  <div className="w-12 h-12 mb-4 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${item.color}15` }}>
                    <item.icon className="w-6 h-6" style={{ color: item.color }} />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-white">{item.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Stats Section */}
      <section className="py-10 border-y" style={{ backgroundColor: DARK, borderColor: "rgba(234,138,30,0.1)" }}>
        <div className="container">
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center" ref={studentsCounter.ref as any}>
              <div className="text-3xl md:text-4xl font-black" style={{ color: ORANGE }}>+{studentsCounter.count}</div>
              <div className="text-white/50 mt-1 text-sm md:text-base">بدأوا رحلتهم</div>
            </div>
            <div className="text-center" ref={productsCounter.ref as any}>
              <div className="text-3xl md:text-4xl font-black" style={{ color: GOLD }}>+{productsCounter.count}</div>
              <div className="text-white/50 mt-1 text-sm md:text-base">منتج جاهز</div>
            </div>
            <div className="text-center" ref={successCounter.ref as any}>
              <div className="text-3xl md:text-4xl font-black text-white">{successCounter.count}%</div>
              <div className="text-white/50 mt-1 text-sm md:text-base">باعوا خلال شهر</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - "أنت هنا → الخطوة الجاية → النتيجة" */}
      <AnimatedSection className="py-16" style={{ backgroundColor: DARK_SECTION }}>
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
              رحلتك معانا — من الصفر لأول بيعة
            </h2>
            <p className="text-white/50 text-lg">
              6 خطوات واضحة. كل خطوة بنمشيها معاك.
            </p>
          </div>

          {/* Visual Journey */}
          <div className="relative">
            {/* Connection line */}
            <div className="hidden lg:block absolute top-1/2 right-0 left-0 h-0.5 -translate-y-1/2" style={{ backgroundColor: `${ORANGE}20` }} />
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { step: "01", title: "تختار منتجك", desc: "من كتالوج فيه مئات المنتجات المجربة والمربحة", emoji: "🎯" },
                { step: "02", title: "بنوصلك بالمورد", desc: "تاخد سعر أول يد — أقل سعر ممكن", emoji: "🤝" },
                { step: "03", title: "بنخزنه ونغلفه", desc: "في مخازننا. أنت مش محتاج تشيل هم حاجة", emoji: "📦" },
                { step: "04", title: "بتتعلم تسوّق", desc: "حملة إعلانية حقيقية على منتجك — مش تمارين", emoji: "📢" },
                { step: "05", title: "بتجيب أوردرات", desc: "أوردرات حقيقية من ناس حقيقية", emoji: "🛒" },
                { step: "06", title: "أول ربح فعلي", desc: "فلوس في جيبك من مشروعك أنت", emoji: "💰" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                >
                  <Card className="p-5 relative overflow-hidden hover:shadow-lg transition-all duration-300 border h-full" style={{ backgroundColor: DARK_CARD, borderColor: "rgba(255,255,255,0.05)" }}>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full text-black flex items-center justify-center font-bold text-sm shrink-0" style={{ backgroundColor: ORANGE }}>
                        {item.step}
                      </div>
                      <div>
                        <h3 className="font-bold text-base mb-1 text-white">{item.title} {item.emoji}</h3>
                        <p className="text-white/50 text-sm">{item.desc}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA after journey */}
          <div className="text-center mt-10">
            <a href="#form-section">
              <Button size="lg" className="text-black text-lg px-8 py-5 font-bold shadow-xl" style={{ backgroundColor: ORANGE }}>
                ابدأ رحلتك دلوقتي
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
            </a>
          </div>
        </div>
      </AnimatedSection>

      {/* Exhibition Section */}
      <AnimatedSection className="py-16 border-y" style={{ backgroundColor: DARK_CARD, borderColor: `${ORANGE}15` }}>
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 border" style={{ backgroundColor: `${GOLD}15`, color: GOLD, borderColor: `${GOLD}30` }}>مش كلام — ده واقع</Badge>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
                معرض حقيقي
                <br />
                <span style={{ color: ORANGE }}>تشوف المنتج وتلمسه</span>
              </h2>
              <p className="text-white/60 text-lg leading-relaxed mb-6">
                العميل بيشوف المنتج قدامه. ده بيزود الثقة وبيرفع نسبة المبيعات. مش صور على النت وخلاص.
              </p>
              <div className="space-y-3">
                {["تخزين آمن ومنظم", "تغليف احترافي", "شحن لكل المحافظات", "تتبع لحظي للشحنات"].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 shrink-0" style={{ color: ORANGE }} />
                    <span className="text-white/80 text-sm">{item}</span>
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
              <div className="absolute -bottom-4 -right-4 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg text-sm" style={{ backgroundColor: ORANGE }}>
                +350 منتج متاح
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Merchant Arabian Section */}
      <AnimatedSection className="py-16" style={{ backgroundColor: DARK_SECTION }}>
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center">
              <img
                src="/manus-storage/merchant-arabian-logo_d70260fe.png"
                alt="نادي تجار العرب - Merchant Arabian"
                className="w-56 h-56 object-contain rounded-2xl"
              />
            </div>
            <div>
              <Badge className="mb-4 border" style={{ backgroundColor: `${GOLD}15`, color: GOLD, borderColor: `${GOLD}30` }}>مجتمع حصري</Badge>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                نادي تجار العرب
              </h2>
              <p className="text-white/60 text-lg leading-relaxed mb-5">
                مش هتشتغل لوحدك. هتكون جزء من مجتمع تجار بيتبادلوا خبرات وفرص حقيقية.
              </p>
              <div className="space-y-3">
                {["شبكة علاقات مع تجار ناجحين", "فرص شراكة ومنتجات حصرية", "ويبينارات أسبوعية مع خبراء", "دعم فني وتسويقي مستمر"].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 shrink-0" style={{ color: GOLD }} />
                    <span className="text-white/80 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* "لمين المسار ده؟" Section */}
      <AnimatedSection className="py-16" style={{ backgroundColor: DARK }}>
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
              المسار ده مناسب ليك لو...
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {[
              "عايز تبدأ مشروع بس مش عارف تبدأ منين",
              "جرّبت كورسات قبل كده ومحصلش حاجة",
              "عندك وظيفة وعايز مصدر دخل إضافي",
              "عايز تتعلم التسويق بشكل عملي مش نظري",
              "عندك طاقة ومستعد تشتغل بجد",
              "بتدور على منتج مربح ومضمون",
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="flex items-center gap-3 p-4 rounded-xl border"
                style={{ backgroundColor: DARK_CARD, borderColor: "rgba(255,255,255,0.05)" }}
              >
                <CheckCircle className="w-5 h-5 shrink-0" style={{ color: ORANGE }} />
                <span className="text-white/80 text-sm">{item}</span>
              </motion.div>
            ))}
          </div>
          {/* CTA */}
          <div className="text-center mt-10">
            <a href="#form-section">
              <Button size="lg" className="text-black text-lg px-8 py-5 font-bold shadow-xl" style={{ backgroundColor: ORANGE }}>
                ابعت بياناتك وخلّينا نبدأ
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
            </a>
          </div>
        </div>
      </AnimatedSection>

      {/* Wholesale Platform Section */}
      <AnimatedSection id="wholesale-platform" className="py-16 border-y" style={{ backgroundColor: DARK_CARD, borderColor: `${ORANGE}15` }}>
        <div className="container">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center max-w-6xl mx-auto">
            <div>
              <Badge className="mb-4 border" style={{ backgroundColor: `${GOLD}15`, color: GOLD, borderColor: `${GOLD}35` }}>
                <Store className="w-4 h-4 ml-1" />
                بوابتك العملية للمنتجات
              </Badge>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
                منصة المنتجات بالجملة
                <br />
                <span style={{ color: ORANGE }}>بدل ما الروابط تتوه منك</span>
              </h2>
              <p className="text-white/60 text-lg leading-relaxed mb-7">
                كل المتدربين ليهم مدخل واحد لمنصة Egy-Pioneers: تتصفح المنتجات، تختار المناسب لمشروعك، وتتابع طلباتك من نفس المكان.
              </p>
              <div className="flex flex-wrap gap-3 items-center">
                <Button asChild size="lg" className="group text-black text-lg px-7 py-6 font-bold shadow-xl transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(234,138,30,0.42)] active:translate-y-0 active:scale-[0.97]" style={{ backgroundColor: ORANGE }}>
                  <a href={STORE_URL} target="_blank" rel="noopener noreferrer" onClick={handleStoreClick}>
                    ادخل منصة المنتجات
                    <ExternalLink className="w-5 h-5 mr-2 transition-transform duration-200 group-hover:-translate-x-1" />
                  </a>
                </Button>
                <Button type="button" variant="outline" onClick={openStoreGuide} className="group border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.08] font-bold transition-[transform,box-shadow,background-color,border-color] duration-200 hover:-translate-y-1 hover:border-[#D4A853]/70 hover:shadow-[0_0_24px_rgba(212,168,83,0.2)] active:translate-y-0 active:scale-[0.97]">
                  <Sparkles className="w-4 h-4 ml-1.5 transition-transform duration-200 group-hover:rotate-12 group-hover:scale-110" style={{ color: GOLD }} />
                  شوف أول 3 خطوات
                </Button>
              </div>
              <p className="text-white/35 text-xs mt-3">هتتفتح المنصة في تبويب جديد علشان تفضل الصفحة دي معاك.</p>
            </div>

            <Card className="relative overflow-hidden border p-5 md:p-6" style={{ backgroundColor: DARK_SECTION, borderColor: `${ORANGE}30` }}>
              <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full blur-3xl" style={{ backgroundColor: `${ORANGE}18` }} />
              <div className="relative">
                <div className="flex items-center justify-between mb-6 pb-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${ORANGE}18` }}>
                      <Store className="w-5 h-5" style={{ color: ORANGE }} />
                    </div>
                    <div>
                      <p className="font-bold text-white">منصة Egy-Pioneers</p>
                      <p className="text-white/40 text-xs">منتجات بالجملة للمتدربين</p>
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: "rgba(16,185,129,0.14)", color: "#6EE7B7" }}>متاحة أونلاين</span>
                </div>
                <div className="space-y-3">
                  {[
                    { icon: Search, title: "دور واختار", desc: "تصفح المنتجات والتصنيفات بسهولة." },
                    { icon: Package, title: "اعرف السعر", desc: "شوف تفاصيل المنتج وسعره المناسب للتاجر." },
                    { icon: ShoppingCart, title: "تابع شغلك", desc: "راجع طلباتك ومفضلاتك من حسابك." },
                  ].map((item) => (
                    <div key={item.title} className="flex items-center gap-4 p-3 rounded-xl transition-transform duration-200 hover:-translate-x-1" style={{ backgroundColor: DARK_CARD }}>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${GOLD}14` }}>
                        <item.icon className="w-4 h-4" style={{ color: GOLD }} />
                      </div>
                      <div>
                        <p className="text-white text-sm font-bold">{item.title}</p>
                        <p className="text-white/45 text-xs mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </AnimatedSection>

      {/* FAQ Section */}
      <AnimatedSection className="py-16" style={{ backgroundColor: DARK_SECTION }}>
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
                أسئلة ممكن تكون عندك
              </h2>
            </div>
            <div className="space-y-3">
              {[
                { q: "إيه الفرق بينكم وبين كورسات الدروبشيبنج؟", a: "إحنا مش كورس نظري. بنديك منتج حقيقي، مخزون فعلي، معرض حقيقي، وبنمشي معاك خطوة بخطوة لحد ما تبيع فعلاً. مش بنسيبك بعد الكورس." },
                { q: "محتاج رأس مال كبير؟", a: "لا. المنتجات بأسعار أول يد وبتقدر تبدأ بميزانية محدودة. وبتدفع لما تبيع." },
                { q: "لو مش فاهم حاجة في التسويق؟", a: "عادي. بنبدأ معاك من الصفر وبنعلمك كل حاجة عملياً. وفيه فريق دعم متاح ليك." },
                { q: "المعرض فين؟", a: "1 عمارات مجمع الفردوس - بجوار نادي السكة - أمام موقف السوبر جيت." },
                { q: "إيه الضمان إني هنجح؟", a: "89% من اللي بدأوا معانا حققوا أول بيعة خلال أول شهر. ده لأننا مش بنسيبك — فيه متابعة مستمرة ودعم فني وتسويقي." },
              ].map((item, i) => (
                <div key={i} className="border rounded-xl overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-right transition-colors"
                    style={{ backgroundColor: openFaq === i ? DARK_CARD : "transparent" }}
                  >
                    <span className="font-semibold text-white text-sm md:text-base">{item.q}</span>
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
                      <p className="text-white/60 leading-relaxed text-sm">{item.a}</p>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Final CTA */}
      <AnimatedSection className="py-16" style={{ backgroundColor: DARK }}>
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              الخطوة الجاية عليك
            </h2>
            <p className="text-white/50 text-lg mb-8">
              ابعت بياناتك — وهنرد عليك بخطة عملية مخصصة ليك خلال 24 ساعة.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="#form-section">
                <Button size="lg" className="text-black text-lg px-8 py-6 font-bold shadow-xl" style={{ backgroundColor: ORANGE }}>
                  سجّل بياناتك
                  <ArrowLeft className="w-5 h-5 mr-2" />
                </Button>
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" onClick={handleWhatsAppClick}>
                <Button size="lg" variant="outline" className="text-white hover:bg-white/10 text-lg px-8 py-6 font-bold bg-transparent" style={{ borderColor: "rgba(255,255,255,0.2)" }}>
                  <MessageCircle className="w-5 h-5 ml-2" />
                  أو كلمنا مباشرة
                </Button>
              </a>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Footer */}
      <footer className="py-10 border-t" style={{ backgroundColor: DARK_CARD, borderColor: `${ORANGE}15` }}>
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
                مسار عملي لبناء مشروعك من الصفر لأول بيعة حقيقية.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-white text-sm">تواصل معانا</h4>
              <div className="space-y-3">
                <a href="https://wa.me/15559022738" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-white/60 text-sm hover:text-white transition-colors">
                  <Phone className="w-4 h-4" />
                  <span dir="ltr">+1 555 902 2738</span>
                </a>
                <a href="https://wa.me/201025073479" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-white/60 text-sm hover:text-white transition-colors">
                  <Phone className="w-4 h-4" />
                  <span dir="ltr">+20 10 25073479</span>
                </a>
                <div className="flex items-center gap-3 text-white/60 text-sm">
                  <MessageCircle className="w-4 h-4" />
                  <a href={WHATSAPP_URL} className="hover:text-white transition-colors">واتساب</a>
                </div>
                <div className="flex items-center gap-3 text-white/60 text-sm">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>مقر الأكاديمية : فيلا 139 - التجمع الأول - أمام أسواق عبد العزيز - متفرع من التسعين الجنوبي.

مكان المعرض الدائم: 1 عمارات مجمع الفردوس - بجوار نادي السكة - أمام موقف السوبر جيت.</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-white text-sm">روابط سريعة</h4>
              <div className="space-y-2">
                <a href="#form-section" className="block text-white/60 text-sm hover:text-white transition-colors">سجّل بياناتك</a>
                <a href={STORE_URL} target="_blank" rel="noopener noreferrer" onClick={handleStoreClick} className="block text-white/60 text-sm hover:text-white transition-colors">منصة المنتجات بالجملة</a>
                <a href={WHATSAPP_URL} className="block text-white/60 text-sm hover:text-white transition-colors">تواصل على واتساب</a>
              </div>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-white/30 text-xs" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            © 2026 Egy-Pioneers Academy. جميع الحقوق محفوظة.
          </div>
        </div>
      </footer>

      <Dialog open={showStoreGuide} onOpenChange={setShowStoreGuide}>
        <DialogContent className="max-w-xl border text-white" style={{ backgroundColor: DARK_SECTION, borderColor: `${ORANGE}45` }}>
          <DialogHeader className="text-right pr-1">
            <Badge className="w-fit border" style={{ backgroundColor: `${GOLD}15`, color: GOLD, borderColor: `${GOLD}35` }}>
              <Sparkles className="w-4 h-4 ml-1" />
              خريطة البداية السريعة
            </Badge>
            <DialogTitle className="text-2xl font-black text-white leading-tight">أول 3 خطوات قبل ما تعمل طلبك</DialogTitle>
            <DialogDescription className="text-white/55 leading-relaxed">اعتبرها زي ما تدخل معرض كبير: الأول تسجل اسمك، بعدها تلف وتشوف البضاعة، وفي الآخر تراجع اختيارك قبل ما تدفع.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-1">
            {STORE_ONBOARDING_STEPS.map((step, index) => {
              const StepIcon = STORE_GUIDE_ICONS[index] ?? CheckCircle;

              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
                  className="flex gap-4 rounded-xl border p-4"
                  style={{ backgroundColor: DARK_CARD, borderColor: "rgba(255,255,255,0.08)" }}
                >
                  <div className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-sm font-black" style={{ backgroundColor: `${ORANGE}18`, color: ORANGE }}>
                    {step.number}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <StepIcon className="w-4 h-4" style={{ color: GOLD }} />
                      <h3 className="font-bold text-white">{step.title}</h3>
                    </div>
                    <p className="text-white/55 text-sm leading-relaxed">{step.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <Button asChild size="lg" className="group w-full text-black font-bold transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-1 hover:shadow-[0_0_28px_rgba(234,138,30,0.4)] active:translate-y-0 active:scale-[0.97]" style={{ backgroundColor: ORANGE }}>
            <a href={STORE_URL} target="_blank" rel="noopener noreferrer" onClick={handleStoreClick}>
              افتح المنصة وطبّق الخطوات
              <ExternalLink className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:-translate-x-1" />
            </a>
          </Button>
        </DialogContent>
      </Dialog>

      {/* Sticky WhatsApp Button */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleWhatsAppClick}
        className="fixed bottom-6 left-6 z-50 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform duration-200"
        style={{ backgroundColor: "#25D366" }}
      >
        <MessageCircle className="w-7 h-7" />
      </a>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowConfirmModal(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            {/* Modal Content */}
            <motion.div
              className="relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border p-6 shadow-2xl"
              style={{ backgroundColor: DARK_SECTION, borderColor: `${ORANGE}30` }}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            >
              {/* Close button */}
              <button
                onClick={() => setShowConfirmModal(false)}
                className="absolute top-4 left-4 text-white/40 hover:text-white/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-5">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ backgroundColor: `${ORANGE}15` }}>
                  <Eye className="w-6 h-6" style={{ color: ORANGE }} />
                </div>
                <h3 className="text-xl font-black text-white">راجع بياناتك قبل الإرسال</h3>
                <p className="text-white/50 text-sm mt-1">تأكد إن كل حاجة صح علشان نقدر نتواصل معاك</p>
              </div>

              <div className="space-y-3 mb-6">
                {[
                  { label: "الاسم", value: formData.name },
                  { label: "رقم الموبايل", value: formData.phone },
                  { label: "الإيميل", value: formData.email },
                  { label: "الحالة", value: formData.role === "student" ? "طالب" : formData.role === "employee" ? "موظف" : formData.role === "business_owner" ? "صاحب مشروع" : formData.role === "marketer" ? "مسوّق" : "أخرى" },
                  { label: "مرحلة المشروع", value: formData.stage === "idea" ? "لسه فكرة" : formData.stage === "starting" ? "بدأت بس لسه في الأول" : "شغّال ومحتاج أطوّر" },
                  { label: "الجاهزية", value: formData.readiness === "now" ? "جاهز دلوقتي" : formData.readiness === "month" ? "خلال شهر" : "بس بسأل" },
                  { label: "تفضيل التعلم", value: formData.preference === "online" ? "أونلاين" : formData.preference === "offline" ? "حضور في المقر" : "مش فارق معايا" },
                  { label: "أكبر تحدي", value: formData.challenge },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: DARK_CARD }}>
                    <span className="text-white/50 text-xs shrink-0">{item.label}</span>
                    <span className="text-white text-sm text-left font-medium">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-5 text-white/70 border font-bold"
                  style={{ backgroundColor: "transparent", borderColor: "rgba(255,255,255,0.15)" }}
                >
                  عدّل البيانات
                </Button>
                <Button
                  onClick={confirmAndSubmit}
                  className="flex-1 py-5 text-black font-bold text-lg"
                  style={{ backgroundColor: ORANGE }}
                >
                  تأكيد وإرسال
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
