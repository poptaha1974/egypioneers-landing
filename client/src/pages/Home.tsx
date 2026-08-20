import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { captureMetaLeadAttribution } from "@/lib/campaignDelivery";
import { getCampaignWhatsAppUrl, getPostSubmitWhatsAppUrl, WHATSAPP_URL } from "@/lib/leadHandoff";
import { FUNNELFAST_PIXEL_EVENTS, getCampaignRegistrationErrors, isEgyptianWhatsAppFormatValid, normalizeEgyptianWhatsApp } from "@/lib/campaignRegistration";
import { getStoreProgressState, STORE_ONBOARDING_STEPS, STORE_TRACKING_EVENTS, STORE_URL } from "@/lib/storeLink";
import { LeadSuccessHandoff } from "@/components/LeadSuccessHandoff";
import { PostSubmitWhatsAppAction } from "@/components/PostSubmitWhatsAppAction";
import { WebinarCountdown } from "@/components/WebinarCountdown";
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
  AlertCircle,
  ArrowLeft,
  Mail,
  Smartphone,
  Download,
  FileText,
  Home as HomeIcon,
  ExternalLink,
  Search,
  ShoppingCart,
  LogIn,
  Sparkles,
  Clock3,
} from "lucide-react";

// ======================================================
// DESIGN: Corporate Trust + Egyptian Warmth (Dark Premium)
// COLORS: Black + Orange (#EA8A1E) + Gold (#D4A853)
// FONT: Cairo (Arabic) + Inter (English/Numbers)
// DIRECTION: RTL-first
// PURPOSE: صفحة فرز وتأهيل + إثبات ثقة (مش صفحة تعريف)
// ======================================================

// Brand Colors
const ORANGE = "#EA8A1E";
const GOLD = "#D4A853";
const DARK = "#0A0A0A";
const DARK_CARD = "#141414";
const DARK_SECTION = "#0F0F0F";
const POST_SUBMIT_WHATSAPP_REDIRECT_DELAY_MS = 2000;
const STORE_GUIDE_ICONS = [LogIn, Search, ShoppingCart];
const WEBINAR_CTA_LABEL = "احجز مكانك في أول 30 دقيقة مجاناً";
const WEBINAR_PILOT_VIDEO_SRC = "/manus-storage/egypioneers_webinar_pilot_v4_cairo_bddcd9e7.mp4";
const WEBINAR_PILOT_POSTER_SRC = "/manus-storage/egypioneers_webinar_pilot_poster_cairo_clean_dbfe8aea.jpg";

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
    whatsappConsent: false,
  });
  const [formState, setFormState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [automationDelivered, setAutomationDelivered] = useState<boolean | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [showStoreGuide, setShowStoreGuide] = useState(false);
  const [completedStoreSteps, setCompletedStoreSteps] = useState(0);
  const nameFieldRef = useRef<HTMLInputElement>(null);
  const phoneFieldRef = useRef<HTMLInputElement>(null);
  const emailFieldRef = useRef<HTMLInputElement>(null);

  // Meta Pixel helper
  const fbq = (...args: any[]) => {
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq(...args);
    }
  };

  // أحداث بداية التسجيل: مرة واحدة عند أول تفاعل
  const hasTrackedViewContent = useRef(false);
  const handleFormInteraction = () => {
    if (!hasTrackedViewContent.current) {
      hasTrackedViewContent.current = true;
      fbq("track", FUNNELFAST_PIXEL_EVENTS.viewContent, { content_name: "EgyPioneers Wednesday Webinar Registration" });
      fbq("trackCustom", FUNNELFAST_PIXEL_EVENTS.formOpened, { content_name: "EgyPioneers Wednesday Webinar Registration" });
      fbq("trackCustom", "FormStart", { content_name: "EgyPioneers Wednesday Webinar Registration" });
    }
  };

  const handleCampaignCtaClick = (placement: string | unknown = "Website CTA") => {
    const resolvedPlacement = typeof placement === "string" ? placement : "Website CTA";
    handleFormInteraction();
    fbq("trackCustom", "CTA_Click", { content_name: WEBINAR_CTA_LABEL, placement: resolvedPlacement });
  };

  // Schedule: fire on WhatsApp click
  const handleWhatsAppClick = () => {
    fbq("track", "Schedule", { content_name: "WhatsApp Contact" });
    fbq("track", FUNNELFAST_PIXEL_EVENTS.contact, { content_name: "EgyPioneers WhatsApp Handoff" });
    fbq("trackCustom", FUNNELFAST_PIXEL_EVENTS.whatsappHandoff, { content_name: "EgyPioneers WhatsApp Handoff" });
    fbq("trackCustom", "WhatsAppOpen", { content_name: "EgyPioneers WhatsApp Handoff" });
  };

  const handleStoreClick = () => {
    fbq("trackCustom", STORE_TRACKING_EVENTS.platformOpened, {
      content_name: "Egy-Pioneers Wholesale Platform",
      destination: STORE_URL,
      completed_store_steps: completedStoreSteps,
    });
  };

  const openStoreGuide = () => {
    fbq("trackCustom", STORE_TRACKING_EVENTS.guideOpened, {
      content_name: "Three Store Onboarding Steps",
    });
    setShowStoreGuide(true);
  };

  const markFirstStoreStepComplete = () => {
    setCompletedStoreSteps((current) => Math.max(current, 1));
    fbq("trackCustom", STORE_TRACKING_EVENTS.firstStepCompleted, {
      content_name: "Store login completed",
      completed_store_steps: 1,
      progress_percent: 33,
    });
  };

  const storeProgress = getStoreProgressState(completedStoreSteps);
  const postSubmitWhatsAppUrl = formState === "success"
    ? getCampaignWhatsAppUrl(formData.name.split(" ")[0])
    : getPostSubmitWhatsAppUrl(formState);

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

  useEffect(() => {
    const warnOnExit = (event: BeforeUnloadEvent) => {
      const started = Boolean(formData.name.trim() || formData.phone.trim() || formData.email.trim());
      if (formState === "idle" && started && !isFormValid()) {
        event.preventDefault();
        event.returnValue = "لسه فاضل بيانات بسيطة علشان تكمل تسجيلك.";
      }
    };

    window.addEventListener("beforeunload", warnOnExit);
    return () => window.removeEventListener("beforeunload", warnOnExit);
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
    const campaignErrors = getCampaignRegistrationErrors(formData);

    if (field === "name" || field === "phone" || field === "email") {
      return campaignErrors[field];
    }

    switch (field) {
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

  const ALL_FIELDS = ["name", "phone", "email"];

  const isFormValid = (): boolean => {
    return ALL_FIELDS.every((f) => !getFieldError(f)) && formData.whatsappConsent;
  };

  const phoneHasValue = Boolean(formData.phone.trim());
  const isPhoneFormatValid = isEgyptianWhatsAppFormatValid(formData.phone);

  // Progress bar calculation
  const completedFields = ALL_FIELDS.filter((f) => !getFieldError(f)).length;
  const progressPercent = Math.round((completedFields / ALL_FIELDS.length) * 100);

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const moveToNextField = (field: "name" | "phone") => {
    if (getFieldError(field)) return;
    window.requestAnimationFrame(() => {
      if (field === "name") phoneFieldRef.current?.focus();
      if (field === "phone") emailFieldRef.current?.focus();
    });
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

    void confirmAndSubmit();
  };

  const submitMutation = trpc.leads.submit.useMutation();

  const confirmAndSubmit = async () => {
    setFormState("submitting");
    const normalizedPhone = normalizeEgyptianWhatsApp(formData.phone);

    if (!normalizedPhone) {
      setFormState("idle");
      setTouched((current) => ({ ...current, phone: true }));
      setShowAllErrors(true);
      return;
    }

    try {
      // معرّف واحد مشترك بين Browser Pixel وCAPI لمنع التعداد المزدوج.
      const metaAttribution = captureMetaLeadAttribution();

      // 1. حفظ في الـDatabase وتسليم التسجيل لخدمة الأتمتة من الخادم.
      const submission = await submitMutation.mutateAsync({
        name: formData.name,
        phone: normalizedPhone,
        email: formData.email,
        whatsappConsent: formData.whatsappConsent,
        eventId: metaAttribution.eventId,
        eventSourceUrl: metaAttribution.eventSourceUrl,
        fbclid: metaAttribution.fbclid,
        fbp: metaAttribution.fbp,
      });
      setAutomationDelivered(submission.automationDelivered);
      clearSavedData();
      fbq("track", "CompleteRegistration", {
        content_name: "EgyPioneers Wednesday Webinar Registration",
        status: true,
      });
      // Fire Meta Pixel Lead event
      fbq("track", FUNNELFAST_PIXEL_EVENTS.lead, {
        content_name: "EgyPioneers Wednesday Webinar Registration",
        content_category: "FunnelFast-Compatible Registration",
      }, { eventID: metaAttribution.eventId });
      fbq("track", FUNNELFAST_PIXEL_EVENTS.contact, { content_name: "Campaign WhatsApp Handoff" });
      fbq("trackCustom", FUNNELFAST_PIXEL_EVENTS.whatsappHandoff, { content_name: "Campaign WhatsApp Handoff" });
      setFormState("success");
      if (submission.automationDelivered) {
        window.setTimeout(() => {
          window.location.assign(getCampaignWhatsAppUrl(formData.name.split(" ")[0]));
        }, POST_SUBMIT_WHATSAPP_REDIRECT_DELAY_MS);
      }
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
            <a href="#form-section" onClick={() => handleCampaignCtaClick("Header") }>
              <Button className="text-black gap-2 font-semibold shadow-lg" style={{ backgroundColor: ORANGE }}>
                <Zap className="w-4 h-4" />
                {WEBINAR_CTA_LABEL}
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
                ويبنار أسبوعي كل أربعاء — الأماكن محدودة
              </Badge>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
              className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-6"
            >
              نفسك تبدأ تجارة إلكترونية
              <br />
              بس <span style={{ color: ORANGE }}>تايه وخايف تخسر؟</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="text-xl text-white/70 mb-8 leading-relaxed"
            >
              مش مجرد كلام نظري: هتفهم اختيار المنتج، قراءة العميل، وبناء إعلان عملي خطوة بخطوة.
              <br />
              <strong className="text-white/90">كل أربعاء من 6 لـ9 مساءً — أول 30 دقيقة ويبنار مفتوح، وبعدها الورشة لأعضاء نادي تجار العرب.</strong>
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="flex flex-wrap gap-4"
            >
              <a href="#form-section" onClick={() => handleCampaignCtaClick("Hero") }>
                <Button size="lg" className="text-black text-lg px-8 py-6 font-bold shadow-xl" style={{ backgroundColor: ORANGE }}>
                  {WEBINAR_CTA_LABEL}
                  <ArrowLeft className="w-5 h-5 mr-2" />
                </Button>
              </a>
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
                {WEBINAR_CTA_LABEL}
              </h2>
              <p className="text-white/50">
                اكتب الاسم وواتساب والإيميل — وبعد التسجيل هتفتح لك رسالة جاهزة على واتساب لتكمل التنسيق.
              </p>
            </div>

            <WebinarCountdown />

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
                    <label className="block font-semibold mb-2 text-sm text-white/90">الاسم بالكامل</label>
                    <input
                      type="text"
                      ref={nameFieldRef}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      onBlur={() => { markTouched("name"); moveToNextField("name"); }}
                      className={`w-full px-4 py-3.5 rounded-xl border outline-none transition-all text-white focus:ring-2 ${shouldShowError("name") ? "border-red-500/70" : ""}`}
                      style={{ backgroundColor: DARK_CARD, borderColor: shouldShowError("name") ? "#EF4444" : "rgba(255,255,255,0.1)", outlineColor: ORANGE }}
                      placeholder="اكتب اسمك"
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
                    <label className="block font-semibold mb-2 text-sm text-white/90">رقم الواتساب</label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        type="tel"
                        ref={phoneFieldRef}
                        dir="ltr"
                        value={formData.phone}
                        onChange={(e) => {
                          const nextPhone = e.target.value;
                          setFormData({ ...formData, phone: nextPhone });
                          setTouched((current) => ({ ...current, phone: true }));
                          if (isEgyptianWhatsAppFormatValid(nextPhone)) {
                            window.requestAnimationFrame(() => emailFieldRef.current?.focus());
                          }
                        }}
                        onBlur={() => { markTouched("phone"); moveToNextField("phone"); }}
                        className={`w-full px-4 pl-10 py-3.5 rounded-xl border outline-none transition-all text-white focus:ring-2 ${phoneHasValue && !isPhoneFormatValid ? "border-red-500/70" : phoneHasValue ? "border-emerald-500/70" : ""}`}
                        style={{ backgroundColor: DARK_CARD, borderColor: phoneHasValue && !isPhoneFormatValid ? "#EF4444" : phoneHasValue ? "#10B981" : "rgba(255,255,255,0.1)", outlineColor: ORANGE }}
                        placeholder="01xxxxxxxxx"
                      />
                    </div>
                    {phoneHasValue && !isPhoneFormatValid && (
                      <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: "#F87171" }}>
                        <AlertCircle className="w-3 h-3" />
                        {getFieldError("phone")}
                      </p>
                    )}
                    {phoneHasValue && isPhoneFormatValid && (
                      <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: "#6EE7B7" }}>
                        <CheckCircle className="w-3 h-3" />
                        صيغة رقم واتساب المصري صحيحة — هنفتح المحادثة بعد التسجيل.
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
                        ref={emailFieldRef}
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

                  <div>
                    <label className="flex items-start gap-3 cursor-pointer rounded-xl border p-3.5 transition-colors" style={{ borderColor: formData.whatsappConsent ? `${ORANGE}80` : "rgba(255,255,255,0.12)", backgroundColor: formData.whatsappConsent ? `${ORANGE}10` : DARK_CARD }}>
                      <input
                        type="checkbox"
                        checked={formData.whatsappConsent}
                        onChange={(event) => setFormData({ ...formData, whatsappConsent: event.target.checked })}
                        className="mt-1 h-4 w-4 accent-orange-500"
                      />
                      <span className="text-sm leading-relaxed text-white/80">
                        أوافق إن Egy-Pioneers تبعت لي تفاصيل الويبنار والتذكير بالموعد على واتساب. أقدر أطلب إيقاف الرسائل في أي وقت.
                      </span>
                    </label>
                    {showAllErrors && !formData.whatsappConsent && (
                      <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: "#F87171" }}>
                        <AlertCircle className="w-3 h-3" />
                        اختار موافقتك علشان نقدر نبعت لك تفاصيل الحضور.
                      </p>
                    )}
                  </div>

                  {false && (
                    <>
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

                    </>
                  )}

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
                        سجّل دلوقتي واحجز مكانك
                        <ArrowLeft className="w-5 h-5 mr-2" />
                      </>
                    )}
                  </Button>

                  <p className="text-center text-white/30 text-xs">
                    بياناتك تستخدم لتأكيد التسجيل وفتح رسالة واتساب جاهزة للتنسيق.
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

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                <LeadSuccessHandoff
                  firstName={formData.name.split(" ")[0] || "صاحبنا"}
                  phone={formData.phone}
                  whatsappUrl={postSubmitWhatsAppUrl}
                  onWhatsAppClick={handleWhatsAppClick}
                  automationDelivered={automationDelivered}
                />
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
                        setFormData({ name: "", phone: "", email: "", role: "", challenge: "", stage: "", readiness: "", preference: "", whatsappConsent: false });
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

      {/* Webinar Open Segment - محتوى موثق بديل عن آراء غير متاحة */}
      <AnimatedSection className="py-16" style={{ backgroundColor: DARK_SECTION }}>
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <Badge className="mb-4 border" style={{ backgroundColor: `${ORANGE}15`, color: ORANGE, borderColor: `${ORANGE}35` }}>
              <Clock3 className="w-4 h-4 ml-1" />
              الجزء المفتوح من الويبنار
            </Badge>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
              ماذا ستأخذ من أول 30 دقيقة؟
            </h2>
            <p className="text-white/50 text-lg">
              قبل ما تبدأ الورشة الخاصة بأعضاء نادي تجار العرب، هتخرج بخريطة أولية تخليك تشوف التجارة الإلكترونية بعين تاجر مش متفرج.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: Target, title: "فلتر المنتج قبل ما تدفع", desc: "3 أسئلة عملية تساعدك تفرّق بين فكرة تستحق الاختبار وسلعة ممكن تركن في المخزن.", color: ORANGE },
              { icon: TrendingUp, title: "اقرأ دوافع العميل", desc: "هتفهم كيف تحوّل احتياج العميل لرسالة بيع مباشرة بدل كلام عام لا يحرك قرار الشراء.", color: "#10B981" },
              { icon: BarChart3, title: "اعرف بداية الاختبار", desc: "هتشوف ترتيب أول قرار في المنتج والإعلان عشان تقيس قبل ما تزود أي ميزانية.", color: GOLD },
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

      {/* Pilot preview - تجربة حقيقية بإذن المتدربين */}
      <AnimatedSection id="pilot-preview" className="py-16" style={{ backgroundColor: DARK }}>
        <div className="container">
          <div className="grid lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] gap-10 items-center max-w-5xl mx-auto">
            <div className="order-2 lg:order-1 text-center lg:text-right" style={{ fontFamily: "Cairo, sans-serif" }}>
              <Badge className="mb-4 border" style={{ backgroundColor: `${ORANGE}15`, color: ORANGE, borderColor: `${ORANGE}35` }}>
                تجربة تطبيق حقيقية
              </Badge>
              <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4">
                اسمع التجربة قبل ما تقرر
              </h2>
              <p id="pilot-preview-description" className="text-white/60 text-lg leading-relaxed mb-6">
                دي معاينة قصيرة من تجربة متدرب بموافقته الصريحة. الهدف إنك تشوف شكل التطبيق والمتابعة، من غير ما نبيع لك وعود أو نتائج مضمونة.
              </p>
              <a href="#form-section" onClick={() => handleCampaignCtaClick("Pilot preview") }>
                <Button className="text-black font-bold px-6" style={{ backgroundColor: ORANGE }}>
                  {WEBINAR_CTA_LABEL}
                </Button>
              </a>
            </div>
            <div className="order-1 lg:order-2 mx-auto w-full max-w-[360px] rounded-[2rem] overflow-hidden border shadow-2xl" style={{ borderColor: `${ORANGE}55`, backgroundColor: DARK_CARD }}>
              <video
                src={WEBINAR_PILOT_VIDEO_SRC}
                poster={WEBINAR_PILOT_POSTER_SRC}
                controls
                playsInline
                preload="metadata"
                aria-describedby="pilot-preview-description"
                className="block w-full aspect-[9/16] bg-black"
                onPlay={() => fbq("trackCustom", "VideoPlay", { content_name: "Webinar trainee experience pilot" })}
                onEnded={() => fbq("trackCustom", "VideoComplete", { content_name: "Webinar trainee experience pilot" })}
              >
                متصفحك لا يدعم تشغيل الفيديو.
              </video>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Webinar Facts Section */}
      <section className="py-10 border-y" style={{ backgroundColor: DARK, borderColor: "rgba(234,138,30,0.1)" }}>
        <div className="container">
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black" style={{ color: ORANGE }}>30</div>
              <div className="text-white/50 mt-1 text-sm md:text-base">دقيقة ويبنار مفتوح</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black" style={{ color: GOLD }}>3</div>
              <div className="text-white/50 mt-1 text-sm md:text-base">محاور عملية</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-white">6–9</div>
              <div className="text-white/50 mt-1 text-sm md:text-base">كل أربعاء مساءً</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - "أنت هنا → الخطوة الجاية → النتيجة" */}
      <AnimatedSection className="py-16" style={{ backgroundColor: DARK_SECTION }}>
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
              خريطة المحاضرة — من الفكرة لأول خطوة صح
            </h2>
            <p className="text-white/50 text-lg">
              تطبيق مباشر على أساسيات التجارة الإلكترونية من غير حشو نظري.
            </p>
          </div>

          {/* Visual Journey */}
          <div className="relative">
            {/* Connection line */}
            <div className="hidden lg:block absolute top-1/2 right-0 left-0 h-0.5 -translate-y-1/2" style={{ backgroundColor: `${ORANGE}20` }} />
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { step: "01", title: "عقلية التاجر", desc: "تفرق بين التفكير العشوائي والقرار المبني على بيانات السوق", emoji: "🧠" },
                { step: "02", title: "اختيار المنتج", desc: "تعرف معايير المنتج القابل للبيع قبل ما تدفع في مخزون أو إعلان", emoji: "🎯" },
                { step: "03", title: "فهم العميل", desc: "تحدد دوافع الشراء والاعتراضات اللي لازم رسالتك ترد عليها", emoji: "👥" },
                { step: "04", title: "Marketing Angle", desc: "تحوّل فهمك للعميل إلى زاوية كلام تشد الانتباه وتقربه للقرار", emoji: "💡" },
                { step: "05", title: "Creative يبيع", desc: "تعرف إيه اللي يخلي الإعلان واضح ومقنع من أول ثواني", emoji: "📢" },
                { step: "06", title: "Testing بذكاء", desc: "تقرأ النتيجة وتعرف إمتى تثبّت، تعدّل، أو توقف الفكرة", emoji: "📊" },
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
            <a href="#form-section" onClick={() => handleCampaignCtaClick("Journey") }>
              <Button size="lg" className="text-black text-lg px-8 py-5 font-bold shadow-xl" style={{ backgroundColor: ORANGE }}>
                {WEBINAR_CTA_LABEL}
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
              المحاضرة دي مناسبة ليك لو...
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {[
              "عايز تبدأ مشروع بس مش عارف تبدأ منين",
              "جرّبت محتوى قبل كده ولسه مش عارف تحوّل المعرفة لخطة",
              "عندك وظيفة وعايز مصدر دخل إضافي",
              "عايز تتعلم التسويق بشكل عملي مش نظري",
              "عندك طاقة ومستعد تشتغل بجد",
              "عايز تتعلم معايير اختيار المنتج قبل ما تخاطر بفلوسك",
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
            <a href="#form-section" onClick={() => handleCampaignCtaClick("Audience fit") }>
              <Button size="lg" className="text-black text-lg px-8 py-5 font-bold shadow-xl" style={{ backgroundColor: ORANGE }}>
                {WEBINAR_CTA_LABEL}
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
                خطوتك العملية بعد المحاضرة
              </Badge>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
                بعد ما تفهم الخريطة
                <br />
                <span style={{ color: ORANGE }}>تبدأ تطبّق على منتج مناسب</span>
              </h2>
              <p className="text-white/60 text-lg leading-relaxed mb-7">
                منصة المنتجات هي المرحلة العملية التالية بعد ما تتعلم معايير الاختيار في المحاضرة. سجّل الأول، وبعدها الفريق يساعدك تحدد الخطوة المناسبة ليك.
              </p>
              <div className="flex flex-wrap gap-3 items-center">
                <Button asChild size="lg" className="group text-black text-lg px-7 py-6 font-bold shadow-xl transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(234,138,30,0.42)] active:translate-y-0 active:scale-[0.97]" style={{ backgroundColor: ORANGE }}>
                  <a href="#form-section" onClick={() => handleCampaignCtaClick("Wholesale platform") }>
                    {WEBINAR_CTA_LABEL}
                    <ArrowLeft className="w-5 h-5 mr-2 transition-transform duration-200 group-hover:-translate-x-1" />
                  </a>
                </Button>
                <Button asChild variant="outline" className="group border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.08] font-bold transition-[transform,box-shadow,background-color,border-color] duration-200 hover:-translate-y-1 hover:border-[#D4A853]/70 hover:shadow-[0_0_24px_rgba(212,168,83,0.2)] active:translate-y-0 active:scale-[0.97]">
                  <a href={STORE_URL} target="_blank" rel="noopener noreferrer" onClick={handleStoreClick}>
                    <Sparkles className="w-4 h-4 ml-1.5 transition-transform duration-200 group-hover:rotate-12 group-hover:scale-110" style={{ color: GOLD }} />
                    شوف اللي هتطبقه بعد المحاضرة
                    <ExternalLink className="w-4 h-4 mr-1.5 transition-transform duration-200 group-hover:-translate-x-1" />
                  </a>
                </Button>
              </div>
              <p className="text-white/35 text-xs mt-3">هدفنا الأول: تحجز مكانك وتفهم الخطة، وبعدها تختار مرحلة التطبيق المناسبة.</p>
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
                { q: "المحاضرة دي لمين؟", a: "للي عايز يبدأ في التجارة الإلكترونية، أو بدأ بالفعل ومحتاج يفهم المنتج والعميل والإعلان بشكل منظم." },
                { q: "هتتعلم إيه في المحاضرة؟", a: "عقلية التاجر، معايير اختيار المنتج، فهم العميل، زوايا البيع، والكريتيف والـTesting بصورة تطبيقية." },
                { q: "محتاج خبرة أو رأس مال كبير؟", a: "لا. المحاضرة تبدأ من الأساسيات وتساعدك تفهم القرار قبل ما تخاطر في منتج أو ميزانية إعلان." },
                { q: "إيه اللي يحصل بعد التسجيل؟", a: "بعد التسجيل هتنتقل مباشرة إلى واتساب برسالة جاهزة، وهناك تكمل التنسيق وتحصل على تفاصيل الحضور." },
                { q: "التسجيل مجاني؟", a: "نعم، التسجيل في المحاضرة مجاني والأماكن محدودة حسب التنظيم." },
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
              جاهز تشوف الخريطة العملية بنفسك؟
            </h2>
            <p className="text-white/50 text-lg mb-8">
              التسجيل مجاني. سجّل بياناتك وهتدخل محادثة واتساب مباشرة علشان تكمل الخطوة الجاية.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="#form-section" onClick={() => handleCampaignCtaClick("Final CTA") }>
                <Button size="lg" className="text-black text-lg px-8 py-6 font-bold shadow-xl" style={{ backgroundColor: ORANGE }}>
                  {WEBINAR_CTA_LABEL}
                  <ArrowLeft className="w-5 h-5 mr-2" />
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
                <a href="https://wa.me/15559022738" target="_blank" rel="noopener noreferrer" onClick={handleWhatsAppClick} className="flex items-center gap-3 text-white/60 text-sm hover:text-white transition-colors">
                  <Phone className="w-4 h-4" />
                  <span dir="ltr">+1 555 902 2738</span>
                </a>
                <a href="https://wa.me/201025073479" target="_blank" rel="noopener noreferrer" onClick={handleWhatsAppClick} className="flex items-center gap-3 text-white/60 text-sm hover:text-white transition-colors">
                  <Phone className="w-4 h-4" />
                  <span dir="ltr">+20 10 25073479</span>
                </a>
                <div className="flex items-center gap-3 text-white/60 text-sm">
                  <MessageCircle className="w-4 h-4" />
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" onClick={handleWhatsAppClick} className="hover:text-white transition-colors">واتساب</a>
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
                <a href="#form-section" onClick={handleCampaignCtaClick} className="block text-white/60 text-sm hover:text-white transition-colors">احجز مكانك في المحاضرة</a>
                <a href={STORE_URL} target="_blank" rel="noopener noreferrer" onClick={handleStoreClick} className="block text-white/60 text-sm hover:text-white transition-colors">منصة المنتجات بالجملة</a>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" onClick={handleWhatsAppClick} className="block text-white/60 text-sm hover:text-white transition-colors">تواصل على واتساب</a>
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

          <div className="rounded-xl border p-4" style={{ backgroundColor: `${ORANGE}0d`, borderColor: `${ORANGE}35` }} aria-live="polite">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${ORANGE}20` }}>
                  <Target className="w-4 h-4" style={{ color: ORANGE }} />
                </div>
                <div>
                  <p className="text-white text-sm font-bold">تقدمك في بداية المنصة</p>
                  <p className="text-white/45 text-xs">{storeProgress.completedSteps} من {storeProgress.totalSteps} خطوات مكتملة</p>
                </div>
              </div>
              <Badge className="border" style={{ backgroundColor: storeProgress.isFirstStepComplete ? "rgba(16,185,129,0.16)" : `${GOLD}15`, color: storeProgress.isFirstStepComplete ? "#6EE7B7" : GOLD, borderColor: storeProgress.isFirstStepComplete ? "rgba(16,185,129,0.35)" : `${GOLD}35` }}>
                {storeProgress.isFirstStepComplete ? "برافو — الخطوة الأولى تمت" : "ابدأ من الخطوة الأولى"}
              </Badge>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${storeProgress.progressPercent}%` }}
                transition={{ duration: 0.36, ease: [0.23, 1, 0.32, 1] }}
                style={{ backgroundColor: storeProgress.isFirstStepComplete ? "#10B981" : ORANGE }}
              />
            </div>
            {storeProgress.isFirstStepComplete && storeProgress.nextStep && (
              <p className="text-xs mt-2" style={{ color: "#A7F3D0" }}>الخطوة الجاية: <strong>{storeProgress.nextStep.title}</strong> — خليك ماشي واحدة واحدة.</p>
            )}
          </div>

          <div className="space-y-3 mt-1">
            {STORE_ONBOARDING_STEPS.map((step, index) => {
              const StepIcon = STORE_GUIDE_ICONS[index] ?? CheckCircle;
              const isCompleted = index < storeProgress.completedSteps;

              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
                  className="flex gap-4 rounded-xl border p-4"
                  style={{ backgroundColor: isCompleted ? "rgba(16,185,129,0.08)" : DARK_CARD, borderColor: isCompleted ? "rgba(16,185,129,0.35)" : "rgba(255,255,255,0.08)" }}
                >
                  <div className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-sm font-black" style={{ backgroundColor: isCompleted ? "rgba(16,185,129,0.18)" : `${ORANGE}18`, color: isCompleted ? "#6EE7B7" : ORANGE }}>
                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : step.number}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <StepIcon className="w-4 h-4" style={{ color: GOLD }} />
                      <h3 className="font-bold text-white">{step.title}</h3>
                    </div>
                    <p className="text-white/55 text-sm leading-relaxed">{step.description}</p>
                    {index === 0 && !storeProgress.isFirstStepComplete && (
                      <button type="button" onClick={markFirstStoreStepComplete} className="mt-3 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0" style={{ color: "#6EE7B7", borderColor: "rgba(16,185,129,0.38)", backgroundColor: "rgba(16,185,129,0.10)" }}>
                        سجّلت دخولي — كمّلني للخطوة الجاية
                      </button>
                    )}
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

    </div>
  );
}
