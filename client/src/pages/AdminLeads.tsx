/**
 * Admin Leads Dashboard — Calculator submissions with pipeline management + SMS Jobs queue
 * Protected: only accessible to admin users
 */
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Loader2, RefreshCw, Phone, Mail, Bell, BellOff, Calendar } from "lucide-react";
import { toast } from "sonner";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import ReferralsTab from "@/components/ReferralsTab";

const LOGO_CREAM =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663408040383/TeiTyUgvfabHNSBnznn263/LFFNEWLOGOCREAM_59ca0122.png";

const goalLabels: Record<string, string> = {
  extremeCut: "Extreme Cut",
  moderateCut: "Moderate Cut",
  maintain: "Maintain",
  leanBulk: "Lean Bulk",
};

const goalColors: Record<string, { bg: string; text: string }> = {
  extremeCut: { bg: "#fde8e8", text: "#b91c1c" },
  moderateCut: { bg: "#fef3e2", text: "#c2410c" },
  maintain:    { bg: "#e0f2fe", text: "#0369a1" },
  leanBulk:    { bg: "#dcfce7", text: "#15803d" },
};

const statusConfig = {
  new:           { label: "New",           bg: "#ede9fe", text: "#6d28d9" },
  contacted:     { label: "Contacted",     bg: "#fef9c3", text: "#92400e" },
  converted:     { label: "Converted ✓",  bg: "#dcfce7", text: "#15803d" },
  not_interested:{ label: "Not Interested",bg: "#f3f4f6", text: "#6b7280" },
} as const;

type LeadStatus = keyof typeof statusConfig;

function getSmsStatus(lead: { sms1SentAt: Date | null; sms2SentAt: Date | null; sms3SentAt: Date | null }) {
  if (lead.sms3SentAt) return { label: "3/3 sent", bg: "#dcfce7", text: "#15803d" };
  if (lead.sms2SentAt) return { label: "2/3 sent", bg: "#fef9c3", text: "#92400e" };
  if (lead.sms1SentAt) return { label: "1/3 sent", bg: "#dbeafe", text: "#1d4ed8" };
  return { label: "Pending", bg: "#f3f4f6", text: "#6b7280" };
}

function exportToCSV(leads: any[]) {
  const headers = ["Name", "Email", "Phone", "Goal", "Status", "Calories", "Protein", "Carbs", "Fats", "Age", "Weight (kg)", "Height (cm)", "SMS Status", "Notes", "Date"];
  const rows = leads.map((l) => [
    l.name, l.email, l.phone,
    goalLabels[l.goal] ?? l.goal,
    statusConfig[l.leadStatus as LeadStatus]?.label ?? l.leadStatus,
    l.tdee, l.protein, l.carbs, l.fats, l.age, l.weight, l.height,
    getSmsStatus(l).label,
    (l.notes ?? "").replace(/"/g, '""'),
    new Date(l.createdAt).toLocaleString("en-AU"),
  ]);
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lff-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function Badge({ bg, text, children }: { bg: string; text: string; children: React.ReactNode }) {
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: bg, color: text }}>
      {children}
    </span>
  );
}

function LeadCard({ lead }: { lead: any }) {
  const utils = trpc.useUtils();
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesValue, setNotesValue] = useState(lead.notes ?? "");
  const [saving, setSaving] = useState(false);

  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderDate, setReminderDate] = useState(lead.followUpDate ? new Date(lead.followUpDate).toISOString().slice(0, 10) : "");
  const [reminderNote, setReminderNote] = useState(lead.followUpNote ?? "");
  const [savingReminder, setSavingReminder] = useState(false);

  const updateReminder = trpc.calculator.updateFollowUp.useMutation({
    onSuccess: () => {
      setSavingReminder(false);
      setReminderOpen(false);
      utils.calculator.getLeads.invalidate();
      toast.success("Follow-up reminder saved");
    },
    onError: () => { setSavingReminder(false); toast.error("Failed to save reminder"); },
  });

  const clearReminder = trpc.calculator.updateFollowUp.useMutation({
    onSuccess: () => {
      setReminderDate("");
      setReminderNote("");
      utils.calculator.getLeads.invalidate();
      toast.success("Reminder cleared");
    },
  });

  const isOverdue = lead.followUpDate && new Date(lead.followUpDate) < new Date();

  const updateNotes = trpc.calculator.updateNotes.useMutation({
    onSuccess: () => {
      setSaving(false);
      setNotesOpen(false);
      utils.calculator.getLeads.invalidate();
      toast.success("Notes saved");
    },
    onError: () => { setSaving(false); toast.error("Failed to save notes"); },
  });

  const updateStatus = trpc.calculator.updateStatus.useMutation({
    onSuccess: () => utils.calculator.getLeads.invalidate(),
    onError: () => toast.error("Failed to update status"),
  });

  const smsStatus = getSmsStatus(lead);
  const goalCfg = goalColors[lead.goal] ?? { bg: "#f3f4f6", text: "#6b7280" };

  return (
    <div className="rounded-xl p-4 flex flex-col gap-3" style={{ backgroundColor: "rgba(0,0,0,0.25)", border: "1px solid rgba(234,230,210,0.25)" }}>
      {/* Row 1: Name + contact */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-black text-lg" style={{ color: "#EAE6D2" }}>{lead.name}</div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <a
              href={`mailto:${lead.email}`}
              className="flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ color: "#EAE6D2" }}
              onClick={(e) => e.stopPropagation()}
            >
              <Mail size={13} />
              {lead.email}
            </a>
            <a
              href={`sms:${lead.phone}`}
              className="flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ color: "#EAE6D2" }}
              onClick={(e) => e.stopPropagation()}
            >
              <Phone size={13} />
              {lead.phone}
            </a>
          </div>
          <div className="text-xs font-medium mt-1" style={{ color: "rgba(234,230,210,0.55)" }}>
            {new Date(lead.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
            {lead.referredBy && (
              <span className="ml-2 font-bold" style={{ color: "#d4a96a" }}>· Ref: {lead.referredBy}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge bg={goalCfg.bg} text={goalCfg.text}>{goalLabels[lead.goal] ?? lead.goal}</Badge>
          <Badge bg={smsStatus.bg} text={smsStatus.text}>{smsStatus.label}</Badge>
        </div>
      </div>

      {/* Row 2: Macros */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Calories", value: lead.tdee },
          { label: "Protein", value: `${lead.protein}g` },
          { label: "Carbs", value: `${lead.carbs}g` },
          { label: "Fats", value: `${lead.fats}g` },
        ].map((m) => (
          <div key={m.label} className="rounded-lg px-2 py-2 text-center" style={{ backgroundColor: "rgba(234,230,210,0.08)", border: "1px solid rgba(234,230,210,0.18)" }}>
            <div className="text-sm font-black" style={{ color: "#EAE6D2" }}>{m.value}</div>
            <div className="text-xs font-semibold mt-0.5" style={{ color: "rgba(234,230,210,0.65)" }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Row 3: Pipeline status buttons */}
      <div className="flex flex-wrap items-center gap-1.5">
        {(Object.entries(statusConfig) as [LeadStatus, typeof statusConfig[LeadStatus]][]).map(([key, cfg]) => {
          const isActive = lead.leadStatus === key;
          return (
            <button
              key={key}
              onClick={() => updateStatus.mutate({ id: lead.id, status: key })}
              className="text-xs font-bold px-2.5 py-1 rounded-full border transition-all"
              style={{
                backgroundColor: isActive ? cfg.bg : "transparent",
                color: isActive ? cfg.text : "rgba(234,230,210,0.7)",
                borderColor: isActive ? cfg.text + "60" : "rgba(234,230,210,0.3)",
              }}
            >
              {cfg.label}
            </button>
          );
        })}

        <button
          onClick={() => { setNotesOpen(!notesOpen); setNotesValue(lead.notes ?? ""); }}
          className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full border transition-all"
          style={{
            backgroundColor: notesOpen || lead.notes ? "rgba(234,230,210,0.15)" : "transparent",
            color: notesOpen || lead.notes ? "#EAE6D2" : "rgba(234,230,210,0.6)",
            borderColor: notesOpen || lead.notes ? "rgba(234,230,210,0.4)" : "rgba(234,230,210,0.25)",
          }}
        >
          {lead.notes ? "📝 Notes" : "+ Note"}
        </button>

        <button
          onClick={() => { setReminderOpen(!reminderOpen); }}
          className="text-xs font-bold px-2.5 py-1 rounded-full border transition-all flex items-center gap-1"
          style={{
            backgroundColor: isOverdue ? "rgba(185,28,28,0.3)" : (reminderOpen || lead.followUpDate) ? "rgba(234,230,210,0.15)" : "transparent",
            color: isOverdue ? "#fca5a5" : (reminderOpen || lead.followUpDate) ? "#EAE6D2" : "rgba(234,230,210,0.6)",
            borderColor: isOverdue ? "rgba(185,28,28,0.5)" : (reminderOpen || lead.followUpDate) ? "rgba(234,230,210,0.4)" : "rgba(234,230,210,0.25)",
          }}
        >
          <Bell size={11} />
          {lead.followUpDate
            ? isOverdue
              ? `Overdue: ${new Date(lead.followUpDate).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}`
              : new Date(lead.followUpDate).toLocaleDateString("en-AU", { day: "numeric", month: "short" })
            : "Follow Up"}
        </button>
      </div>

      {/* Follow-up reminder editor */}
      {reminderOpen && (
        <div className="flex flex-col gap-2 pt-2" style={{ borderTop: "1px solid rgba(234,230,210,0.15)" }}>
          <div className="flex items-center gap-2">
            <Calendar size={13} style={{ color: "#EAE6D2" }} />
            <span className="text-sm font-bold" style={{ color: "#EAE6D2" }}>Follow-up Reminder</span>
          </div>
          <input
            type="date"
            value={reminderDate}
            onChange={(e) => setReminderDate(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none border"
            style={{ borderColor: "rgba(234,230,210,0.3)", backgroundColor: "rgba(0,0,0,0.25)", color: "#EAE6D2", colorScheme: "dark" }}
          />
          <input
            type="text"
            value={reminderNote}
            onChange={(e) => setReminderNote(e.target.value)}
            placeholder="Reminder note (e.g. call about comp prep)"
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none border"
            style={{ borderColor: "rgba(234,230,210,0.3)", backgroundColor: "rgba(0,0,0,0.25)", color: "#EAE6D2" }}
          />
          <div className="flex gap-2 justify-end">
            {lead.followUpDate && (
              <button
                onClick={() => clearReminder.mutate({ id: lead.id, followUpDate: null, followUpNote: null })}
                className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                style={{ color: "rgba(234,230,210,0.7)", border: "1px solid rgba(234,230,210,0.2)" }}
              >
                <BellOff size={11} /> Clear
              </button>
            )}
            <button
              onClick={() => setReminderOpen(false)}
              className="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: "rgba(234,230,210,0.7)", border: "1px solid rgba(234,230,210,0.2)" }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setSavingReminder(true);
                updateReminder.mutate({ id: lead.id, followUpDate: reminderDate || null, followUpNote: reminderNote || null });
              }}
              disabled={savingReminder || !reminderDate}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: "#EAE6D2", color: "#54412F", opacity: !reminderDate ? 0.5 : 1 }}
            >
              {savingReminder && <Loader2 size={12} className="animate-spin" />}
              Save
            </button>
          </div>
        </div>
      )}

      {/* Notes editor */}
      {notesOpen && (
        <div className="flex flex-col gap-2 pt-2" style={{ borderTop: "1px solid rgba(234,230,210,0.15)" }}>
          <textarea
            value={notesValue}
            onChange={(e) => setNotesValue(e.target.value)}
            placeholder="Add notes about this lead..."
            rows={3}
            className="w-full rounded-lg px-3 py-2 text-sm resize-none focus:outline-none border"
            style={{ borderColor: "rgba(234,230,210,0.3)", backgroundColor: "rgba(0,0,0,0.25)", color: "#EAE6D2" }}
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setNotesOpen(false)}
              className="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: "rgba(234,230,210,0.7)", border: "1px solid rgba(234,230,210,0.2)" }}
            >
              Cancel
            </button>
            <button
              onClick={() => { setSaving(true); updateNotes.mutate({ id: lead.id, notes: notesValue }); }}
              disabled={saving}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: "#EAE6D2", color: "#54412F" }}
            >
              {saving && <Loader2 size={12} className="animate-spin" />}
              Save
            </button>
          </div>
        </div>
      )}

      {/* Notes preview */}
      {!notesOpen && lead.notes && (
        <p className="text-sm italic pt-2" style={{ borderTop: "1px solid rgba(234,230,210,0.15)", color: "rgba(234,230,210,0.8)" }}>
          "{lead.notes}"
        </p>
      )}
    </div>
  );
}

const smsJobStatusConfig = {
  pending: { label: "Scheduled", bg: "#dbeafe", text: "#1d4ed8" },
  sent:    { label: "Sent ✓",    bg: "#dcfce7", text: "#15803d" },
  failed:  { label: "Failed",    bg: "#fde8e8", text: "#b91c1c" },
} as const;

function SmsJobRow({ job }: { job: any }) {
  const utils = trpc.useUtils();
  const [retrying, setRetrying] = useState(false);

  const retry = trpc.calculator.retrySmsJob.useMutation({
    onSuccess: () => {
      setRetrying(false);
      utils.calculator.getSmsJobs.invalidate();
      toast.success(`SMS #${job.smsNumber} queued to send now`);
    },
    onError: () => { setRetrying(false); toast.error("Retry failed"); },
  });

  const cfg = smsJobStatusConfig[job.status as keyof typeof smsJobStatusConfig] ?? smsJobStatusConfig.pending;
  const isPending = job.status === "pending";
  const isFailed = job.status === "failed";
  const sendAt = new Date(job.sendAt);
  const isOverdue = isPending && sendAt < new Date();

  return (
    <div className="rounded-xl p-4 flex flex-col gap-2" style={{ backgroundColor: "rgba(0,0,0,0.25)", border: "1px solid rgba(234,230,210,0.25)" }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-black text-base" style={{ color: "#EAE6D2" }}>
            SMS #{job.smsNumber} → {job.leadName ?? "Unknown Lead"}
          </div>
          <div className="text-sm font-semibold mt-0.5" style={{ color: "rgba(234,230,210,0.75)" }}>
            {job.phone}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge bg={cfg.bg} text={cfg.text}>{cfg.label}</Badge>
          {isOverdue && <Badge bg="#fef9c3" text="#92400e">Overdue</Badge>}
        </div>
      </div>

      <div className="text-sm rounded-lg px-3 py-2" style={{ backgroundColor: "rgba(0,0,0,0.2)", color: "rgba(234,230,210,0.85)", fontFamily: "monospace" }}>
        {job.message.length > 120 ? job.message.slice(0, 120) + "…" : job.message}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-medium" style={{ color: "rgba(234,230,210,0.7)" }}>
          {isPending
            ? `Scheduled: ${sendAt.toLocaleString("en-AU")}`
            : job.sentAt
            ? `Sent: ${new Date(job.sentAt).toLocaleString("en-AU")}`
            : `Scheduled: ${sendAt.toLocaleString("en-AU")}`}
        </div>
        {isFailed && (
          <button
            onClick={() => { setRetrying(true); retry.mutate({ id: job.id }); }}
            disabled={retrying}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: "#54412F", color: "#EAE6D2" }}
          >
            {retrying ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            Retry
          </button>
        )}
      </div>

      {job.errorMessage && (
        <div className="text-sm rounded-lg px-3 py-2" style={{ backgroundColor: "rgba(185,28,28,0.15)", color: "#fca5a5" }}>
          Error: {job.errorMessage}
        </div>
      )}
    </div>
  );
}

export default function AdminLeads() {
  const [activeTab, setActiveTab] = useState<"leads" | "sms" | "referrals">("leads");
  usePushNotifications();

  const { data: leads, isLoading: leadsLoading } = trpc.calculator.getLeads.useQuery();
  const { data: smsJobsData, isLoading: smsLoading } = trpc.calculator.getSmsJobs.useQuery(undefined, { enabled: activeTab === "sms" });

  if (activeTab === "leads" && leadsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#54412F" }}>
        <Loader2 className="animate-spin" size={32} style={{ color: "#EAE6D2" }} />
      </div>
    );
  }

  const converted = leads?.filter((l) => l.leadStatus === "converted").length ?? 0;
  const contacted = leads?.filter((l) => l.leadStatus === "contacted").length ?? 0;
  const failedJobs = smsJobsData?.filter((j) => j.status === "failed").length ?? 0;
  const pendingJobs = smsJobsData?.filter((j) => j.status === "pending").length ?? 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#54412F" }}>
      {/* Header */}
      <header className="sticky top-0 z-10 shadow-sm" style={{ backgroundColor: "rgba(84,65,47,0.98)", borderBottom: "1px solid rgba(234,230,210,0.2)" }}>
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#EAE6D2" }}>
              <img src={LOGO_CREAM} alt="LFF" className="h-5" />
            </div>
            <div>
              <div className="text-sm font-black" style={{ color: "#EAE6D2" }}>LFF Admin</div>
              <div className="text-xs font-semibold" style={{ color: "rgba(234,230,210,0.7)" }}>{leads?.length ?? 0} leads</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === "leads" && leads && leads.length > 0 && (
              <button
                onClick={() => exportToCSV(leads)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors"
                style={{ borderColor: "rgba(234,230,210,0.35)", color: "rgba(234,230,210,0.85)" }}
              >
                ↓ CSV
              </button>
            )}
            <button
              onClick={() => window.location.href = "/admin"}
              className="text-xs font-bold transition-colors"
              style={{ color: "rgba(234,230,210,0.75)" }}
            >
              Media
            </button>
            <a href="/" className="text-xs font-bold transition-colors" style={{ color: "rgba(234,230,210,0.75)" }}>
              ← Site
            </a>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4 flex gap-1 pb-2">
          {(["leads", "sms", "referrals"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="text-xs font-bold px-4 py-1.5 rounded-lg transition-all capitalize flex items-center gap-1.5"
              style={{
                backgroundColor: activeTab === tab ? "#EAE6D2" : "transparent",
                color: activeTab === tab ? "#54412F" : "rgba(234,230,210,0.75)",
              }}
            >
              {tab === "sms" ? "SMS Queue" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === "sms" && failedJobs > 0 && (
                <span className="text-xs font-black px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "#b91c1c", color: "#fff" }}>
                  {failedJobs}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* LEADS TAB */}
        {activeTab === "leads" && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: "Total Leads", value: leads?.length ?? 0, accent: false },
                { label: "Contacted", value: contacted, accent: false },
                { label: "Converted", value: converted, accent: true },
                { label: "SMS Sent", value: leads?.filter((l) => l.sms1SentAt).length ?? 0, accent: false },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl px-4 py-3"
                  style={{
                    backgroundColor: stat.accent ? "#EAE6D2" : "rgba(0,0,0,0.25)",
                    color: stat.accent ? "#54412F" : "#EAE6D2",
                    border: stat.accent ? "none" : "1px solid rgba(234,230,210,0.2)",
                  }}
                >
                  <div className="text-2xl font-black">{stat.value}</div>
                  <div className="text-xs font-bold mt-0.5" style={{ opacity: 0.75 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {leads && leads.length === 0 && (
              <div className="text-center py-24 rounded-2xl" style={{ backgroundColor: "rgba(234,230,210,0.08)" }}>
                <p className="text-4xl mb-4">📋</p>
                <p className="text-xl font-black mb-2" style={{ color: "#EAE6D2" }}>No leads yet</p>
                <p className="text-sm font-medium" style={{ color: "rgba(234,230,210,0.65)" }}>Leads will appear here once someone submits the calculator.</p>
              </div>
            )}

            {leads && leads.length > 0 && (
              <div className="space-y-3">
                {leads.map((lead) => <LeadCard key={lead.id} lead={lead} />)}
              </div>
            )}
          </>
        )}

        {/* REFERRALS TAB */}
        {activeTab === "referrals" && <ReferralsTab />}

        {/* SMS QUEUE TAB */}
        {activeTab === "sms" && (
          <>
            {/* SMS Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: "Scheduled", value: pendingJobs, accent: false },
                { label: "Sent", value: smsJobsData?.filter((j) => j.status === "sent").length ?? 0, accent: true },
                { label: "Failed", value: failedJobs, accent: false, danger: failedJobs > 0 },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl px-4 py-3"
                  style={{
                    backgroundColor: stat.danger ? "rgba(185,28,28,0.3)" : stat.accent ? "#EAE6D2" : "rgba(0,0,0,0.25)",
                    color: stat.danger ? "#fca5a5" : stat.accent ? "#54412F" : "#EAE6D2",
                    border: stat.danger ? "1px solid rgba(185,28,28,0.4)" : stat.accent ? "none" : "1px solid rgba(234,230,210,0.2)",
                  }}
                >
                  <div className="text-2xl font-black">{stat.value}</div>
                  <div className="text-xs font-bold mt-0.5" style={{ opacity: 0.75 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {smsLoading && (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin" size={24} style={{ color: "#EAE6D2" }} />
              </div>
            )}

            {!smsLoading && smsJobsData && smsJobsData.length === 0 && (
              <div className="text-center py-24 rounded-2xl" style={{ backgroundColor: "rgba(234,230,210,0.08)" }}>
                <p className="text-4xl mb-4">📨</p>
                <p className="text-xl font-black mb-2" style={{ color: "#EAE6D2" }}>No SMS jobs yet</p>
                <p className="text-sm font-medium" style={{ color: "rgba(234,230,210,0.65)" }}>SMS jobs will appear here when leads submit the calculator.</p>
              </div>
            )}

            {!smsLoading && smsJobsData && smsJobsData.length > 0 && (
              <div className="space-y-3">
                {smsJobsData.filter((j) => j.status === "failed").length > 0 && (
                  <>
                    <div className="text-xs font-black uppercase tracking-wider mb-2" style={{ color: "#fca5a5" }}>
                      Failed — needs retry
                    </div>
                    {smsJobsData.filter((j) => j.status === "failed").map((job) => <SmsJobRow key={job.id} job={job} />)}
                    <div className="pt-2" />
                  </>
                )}
                {smsJobsData.filter((j) => j.status === "pending").length > 0 && (
                  <>
                    <div className="text-xs font-black uppercase tracking-wider mb-2" style={{ color: "rgba(234,230,210,0.75)" }}>
                      Scheduled
                    </div>
                    {smsJobsData.filter((j) => j.status === "pending").map((job) => <SmsJobRow key={job.id} job={job} />)}
                    <div className="pt-2" />
                  </>
                )}
                {smsJobsData.filter((j) => j.status === "sent").length > 0 && (
                  <>
                    <div className="text-xs font-black uppercase tracking-wider mb-2" style={{ color: "rgba(234,230,210,0.75)" }}>
                      Sent
                    </div>
                    {smsJobsData.filter((j) => j.status === "sent").map((job) => <SmsJobRow key={job.id} job={job} />)}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
