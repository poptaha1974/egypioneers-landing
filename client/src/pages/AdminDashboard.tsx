import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Flame,
  ThermometerSun,
  Snowflake,
  Search,
  Download,
  LogOut,
  ArrowRight,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";

// ======================================================
// Admin Dashboard - لوحة تحكم العملاء المحتملين
// THINC Intent Scoring: HOT (≥70) | WARM (40-69) | COLD (<40)
// ======================================================

const ORANGE = "#EA8A1E";
const GOLD = "#D4A853";
const DARK = "#0A0A0A";
const DARK_CARD = "#141414";
const DARK_SECTION = "#0F0F0F";

type StatusFilter = "ALL" | "HOT" | "WARM" | "COLD";

function getStatusColor(status: string) {
  switch (status) {
    case "HOT": return "#EF4444";
    case "WARM": return "#F59E0B";
    case "COLD": return "#3B82F6";
    default: return "#6B7280";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "HOT": return <Flame className="w-4 h-4" />;
    case "WARM": return <ThermometerSun className="w-4 h-4" />;
    case "COLD": return <Snowflake className="w-4 h-4" />;
    default: return null;
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "HOT": return "ساخن";
    case "WARM": return "دافئ";
    case "COLD": return "بارد";
    default: return status;
  }
}

export default function AdminDashboard() {
  const { user, loading: authLoading, logout } = useAuth({ redirectOnUnauthenticated: true });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Admin-only guard on frontend
  if (!authLoading && user && (user as any).role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: DARK }}>
        <Card className="p-10 text-center border max-w-md" style={{ backgroundColor: DARK_CARD, borderColor: "rgba(239,68,68,0.2)" }}>
          <ShieldAlert className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-xl font-bold text-white mb-2">غير مصرح بالدخول</h2>
          <p className="text-white/50 mb-6">الصفحة دي للـ Admin بس. لو محتاج صلاحية، تواصل مع الإدارة.</p>
          <a href="/">
            <Button className="text-black font-bold" style={{ backgroundColor: ORANGE }}>
              <ArrowRight className="w-4 h-4 ml-1" />
              الرجوع للصفحة الرئيسية
            </Button>
          </a>
        </Card>
      </div>
    );
  }

  const { data: leads, isLoading, error: leadsError, refetch } = trpc.leads.list.useQuery(undefined, {
    enabled: !!user,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  // Filter and search logic
  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    let result = [...leads];

    // Filter by status
    if (statusFilter !== "ALL") {
      result = result.filter(l => l.leadStatus === statusFilter);
    }

    // Search by name, phone, email
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        l.email.toLowerCase().includes(q)
      );
    }

    return result;
  }, [leads, statusFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    if (!leads) return { total: 0, hot: 0, warm: 0, cold: 0 };
    return {
      total: leads.length,
      hot: leads.filter(l => l.leadStatus === "HOT").length,
      warm: leads.filter(l => l.leadStatus === "WARM").length,
      cold: leads.filter(l => l.leadStatus === "COLD").length,
    };
  }, [leads]);

  // Export to CSV
  const exportCSV = () => {
    if (!filteredLeads.length) return;

    const headers = ["الاسم", "الموبايل", "الإيميل", "الحالة", "المرحلة", "الجاهزية", "التفضيل", "التحدي", "Intent Score", "التقييم", "تاريخ التسجيل"];
    const rows = filteredLeads.map(l => [
      l.name,
      l.phone,
      l.email,
      l.role || "",
      l.stage || "",
      l.readiness || "",
      l.preference || "",
      l.challenge || "",
      l.intentScore?.toString() || "",
      l.leadStatus,
      l.createdAt ? new Date(l.createdAt).toLocaleDateString("ar-EG") : "",
    ]);

    // BOM for Arabic support in Excel
    const BOM = "\uFEFF";
    const csvContent = BOM + [headers.join(","), ...rows.map(r => r.map(cell => `"${(cell || "").replace(/"/g, '""')}"`).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `leads_${statusFilter.toLowerCase()}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: DARK }}>
        <div className="flex items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin" style={{ color: ORANGE }} />
          <span className="text-white/60 text-lg">جاري التحميل...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen" dir="rtl" style={{ backgroundColor: DARK }}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b" style={{ backgroundColor: `${DARK}ee`, borderColor: `${ORANGE}20` }}>
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img
              src="/manus-storage/egypioneers-logo-real_f8586d54.jpeg"
              alt="Logo"
              className="w-9 h-9 rounded-lg"
            />
            <div>
              <h1 className="font-bold text-white text-sm">لوحة التحكم</h1>
              <p className="text-white/40 text-xs">Egy-Pioneers Academy</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="/">
              <Button variant="outline" size="sm" className="text-white/60 border-white/10 bg-transparent hover:bg-white/5">
                <ArrowRight className="w-4 h-4 ml-1" />
                الصفحة الرئيسية
              </Button>
            </a>
            <Button variant="outline" size="sm" onClick={logout} className="text-white/60 border-white/10 bg-transparent hover:bg-white/5">
              <LogOut className="w-4 h-4 ml-1" />
              خروج
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 border cursor-pointer transition-all hover:-translate-y-0.5" style={{ backgroundColor: DARK_CARD, borderColor: statusFilter === "ALL" ? ORANGE : "rgba(255,255,255,0.05)" }} onClick={() => setStatusFilter("ALL")}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${ORANGE}15` }}>
                <Users className="w-5 h-5" style={{ color: ORANGE }} />
              </div>
              <div>
                <p className="text-2xl font-black text-white">{stats.total}</p>
                <p className="text-white/40 text-xs">إجمالي</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border cursor-pointer transition-all hover:-translate-y-0.5" style={{ backgroundColor: DARK_CARD, borderColor: statusFilter === "HOT" ? "#EF4444" : "rgba(255,255,255,0.05)" }} onClick={() => setStatusFilter("HOT")}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(239,68,68,0.1)" }}>
                <Flame className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-black text-red-400">{stats.hot}</p>
                <p className="text-white/40 text-xs">ساخن HOT</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border cursor-pointer transition-all hover:-translate-y-0.5" style={{ backgroundColor: DARK_CARD, borderColor: statusFilter === "WARM" ? "#F59E0B" : "rgba(255,255,255,0.05)" }} onClick={() => setStatusFilter("WARM")}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(245,158,11,0.1)" }}>
                <ThermometerSun className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-black text-amber-400">{stats.warm}</p>
                <p className="text-white/40 text-xs">دافئ WARM</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border cursor-pointer transition-all hover:-translate-y-0.5" style={{ backgroundColor: DARK_CARD, borderColor: statusFilter === "COLD" ? "#3B82F6" : "rgba(255,255,255,0.05)" }} onClick={() => setStatusFilter("COLD")}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(59,130,246,0.1)" }}>
                <Snowflake className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-black text-blue-400">{stats.cold}</p>
                <p className="text-white/40 text-xs">بارد COLD</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search & Actions Bar */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم أو الموبايل أو الإيميل..."
              className="w-full pr-10 pl-4 py-3 rounded-xl border outline-none text-white text-sm"
              style={{ backgroundColor: DARK_CARD, borderColor: "rgba(255,255,255,0.1)" }}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => refetch()} variant="outline" className="text-white/60 border-white/10 bg-transparent hover:bg-white/5">
              <RefreshCw className="w-4 h-4 ml-1" />
              تحديث
            </Button>
            <Button onClick={exportCSV} disabled={!filteredLeads.length} className="text-black font-bold" style={{ backgroundColor: ORANGE }}>
              <FileSpreadsheet className="w-4 h-4 ml-1" />
              تصدير CSV
            </Button>
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(["ALL", "HOT", "WARM", "COLD"] as StatusFilter[]).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${statusFilter === status ? "text-white" : "text-white/50 hover:text-white/80"}`}
              style={{
                backgroundColor: statusFilter === status
                  ? (status === "ALL" ? ORANGE : getStatusColor(status))
                  : DARK_CARD,
                border: `1px solid ${statusFilter === status ? "transparent" : "rgba(255,255,255,0.08)"}`,
              }}
            >
              {status === "ALL" ? "الكل" : getStatusLabel(status)}
              {status === "ALL" ? ` (${stats.total})` : ` (${status === "HOT" ? stats.hot : status === "WARM" ? stats.warm : stats.cold})`}
            </button>
          ))}
        </div>

        {/* Leads Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-6 h-6 animate-spin" style={{ color: ORANGE }} />
            <span className="text-white/50 mr-3">جاري تحميل البيانات...</span>
          </div>
        ) : leadsError ? (
          <Card className="p-12 text-center border" style={{ backgroundColor: DARK_CARD, borderColor: "rgba(239,68,68,0.2)" }}>
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <p className="text-red-400 text-lg mb-2">حصل مشكلة في تحميل البيانات</p>
            <p className="text-white/40 text-sm mb-4">{leadsError.message}</p>
            <Button onClick={() => refetch()} className="text-black font-bold" style={{ backgroundColor: ORANGE }}>
              <RefreshCw className="w-4 h-4 ml-1" />
              حاول تاني
            </Button>
          </Card>
        ) : filteredLeads.length === 0 ? (
          <Card className="p-12 text-center border" style={{ backgroundColor: DARK_CARD, borderColor: "rgba(255,255,255,0.05)" }}>
            <Users className="w-12 h-12 mx-auto mb-4 text-white/20" />
            <p className="text-white/40 text-lg">
              {searchQuery ? "مفيش نتائج للبحث ده" : "مفيش leads مسجلين لسه"}
            </p>
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: DARK_SECTION }}>
                  <th className="text-right text-white/50 font-medium px-4 py-3">#</th>
                  <th className="text-right text-white/50 font-medium px-4 py-3">الاسم</th>
                  <th className="text-right text-white/50 font-medium px-4 py-3">الموبايل</th>
                  <th className="text-right text-white/50 font-medium px-4 py-3">الإيميل</th>
                  <th className="text-right text-white/50 font-medium px-4 py-3">المرحلة</th>
                  <th className="text-right text-white/50 font-medium px-4 py-3">الجاهزية</th>
                  <th className="text-center text-white/50 font-medium px-4 py-3">Score</th>
                  <th className="text-center text-white/50 font-medium px-4 py-3">التقييم</th>
                  <th className="text-right text-white/50 font-medium px-4 py-3">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead, idx) => (
                  <tr
                    key={lead.id}
                    className="border-t transition-colors hover:bg-white/[0.02]"
                    style={{ borderColor: "rgba(255,255,255,0.05)" }}
                  >
                    <td className="px-4 py-3 text-white/30">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <span className="text-white font-medium">{lead.name}</span>
                      {lead.role && <span className="block text-white/30 text-xs mt-0.5">{lead.role}</span>}
                    </td>
                    <td className="px-4 py-3 text-white/70 font-mono text-xs" dir="ltr">{lead.phone}</td>
                    <td className="px-4 py-3 text-white/70 text-xs" dir="ltr">{lead.email}</td>
                    <td className="px-4 py-3 text-white/60 text-xs">{lead.stage || "—"}</td>
                    <td className="px-4 py-3 text-white/60 text-xs">{lead.readiness || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-white">{lead.intentScore || 0}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        className="gap-1 text-xs font-bold px-2.5 py-1"
                        style={{
                          backgroundColor: `${getStatusColor(lead.leadStatus)}20`,
                          color: getStatusColor(lead.leadStatus),
                          border: `1px solid ${getStatusColor(lead.leadStatus)}40`,
                        }}
                      >
                        {getStatusIcon(lead.leadStatus)}
                        {lead.leadStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs">
                      {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("ar-EG", { day: "numeric", month: "short" }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Results count */}
        {filteredLeads.length > 0 && (
          <p className="text-white/30 text-xs mt-4 text-center">
            عرض {filteredLeads.length} من {stats.total} عميل محتمل
          </p>
        )}
      </main>
    </div>
  );
}
