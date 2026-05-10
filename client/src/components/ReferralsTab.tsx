/**
 * Referrals Tab — admin view for managing referral codes and tracking usage.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Plus, Copy, ToggleLeft, ToggleRight, Trash2, ChevronDown, ChevronUp, Link2, Gift } from "lucide-react";

const BASE_URL = typeof window !== "undefined" ? window.location.origin : "https://www.loverfighterfitness.com";

function CodeCard({ code }: { code: any }) {
  const utils = trpc.useUtils();
  const [expanded, setExpanded] = useState(false);

  const { data: referredLeads, isLoading: leadsLoading } = trpc.referral.getLeadsForCode.useQuery(
    { code: code.code },
    { enabled: expanded }
  );

  const toggle = trpc.referral.toggleCode.useMutation({
    onSuccess: () => utils.referral.getCodes.invalidate(),
    onError: () => toast.error("Failed to update code"),
  });

  const deleteCode = trpc.referral.deleteCode.useMutation({
    onSuccess: () => {
      utils.referral.getCodes.invalidate();
      toast.success("Code deleted");
    },
    onError: () => toast.error("Failed to delete code"),
  });

  const referralUrl = `${BASE_URL}/ref/${code.code}`;
  const isActive = code.active === "yes";

  const copyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    toast.success("Referral link copied!");
  };

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: "rgba(0,0,0,0.2)", border: "1px solid rgba(234,230,210,0.15)" }}
    >
      {/* Header row */}
      <div className="p-4 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-black text-base tracking-wider" style={{ color: "#EAE6D2", fontFamily: "'Bebas Neue', sans-serif" }}>
              {code.code}
            </span>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: isActive ? "rgba(21,128,61,0.25)" : "rgba(107,114,128,0.2)",
                color: isActive ? "#86efac" : "#9ca3af",
              }}
            >
              {isActive ? "Active" : "Inactive"}
            </span>
            {code.usageCount > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(234,230,210,0.15)", color: "#EAE6D2" }}>
                {code.usageCount} {code.usageCount === 1 ? "lead" : "leads"}
              </span>
            )}
          </div>
          <div className="text-sm font-semibold mt-0.5" style={{ color: "rgba(234,230,210,0.7)" }}>
            {code.referrerName}
          </div>
          {code.notes && (
            <div className="text-xs mt-1 italic" style={{ color: "rgba(234,230,210,0.4)" }}>{code.notes}</div>
          )}
          {/* Referral URL */}
          <div
            className="mt-2 flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1.5 cursor-pointer transition-opacity hover:opacity-80"
            style={{ backgroundColor: "rgba(0,0,0,0.2)", color: "rgba(234,230,210,0.5)", fontFamily: "monospace" }}
            onClick={copyLink}
          >
            <Link2 size={10} />
            <span className="truncate">{referralUrl}</span>
            <Copy size={10} className="flex-shrink-0 ml-auto" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => toggle.mutate({ id: code.id, active: !isActive })}
            className="p-1.5 rounded-lg transition-opacity hover:opacity-80"
            style={{ color: isActive ? "#86efac" : "#9ca3af" }}
            title={isActive ? "Deactivate" : "Activate"}
          >
            {isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
          </button>
          <button
            onClick={copyLink}
            className="p-1.5 rounded-lg transition-opacity hover:opacity-80"
            style={{ color: "rgba(234,230,210,0.5)" }}
            title="Copy referral link"
          >
            <Copy size={15} />
          </button>
          {code.usageCount === 0 && (
            <button
              onClick={() => {
                if (confirm(`Delete code ${code.code}?`)) deleteCode.mutate({ id: code.id });
              }}
              className="p-1.5 rounded-lg transition-opacity hover:opacity-80"
              style={{ color: "rgba(185,28,28,0.7)" }}
              title="Delete code"
            >
              <Trash2 size={15} />
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg transition-opacity hover:opacity-80"
            style={{ color: "rgba(234,230,210,0.4)" }}
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Expanded: referred leads */}
      {expanded && (
        <div style={{ borderTop: "1px solid rgba(234,230,210,0.1)" }}>
          {leadsLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 size={18} className="animate-spin" style={{ color: "rgba(234,230,210,0.4)" }} />
            </div>
          ) : !referredLeads?.length ? (
            <div className="px-4 py-5 text-center text-sm" style={{ color: "rgba(234,230,210,0.35)" }}>
              No leads from this code yet
            </div>
          ) : (
            <div className="px-4 py-3 space-y-2">
              <div className="text-xs font-black uppercase tracking-wider mb-2" style={{ color: "rgba(234,230,210,0.4)" }}>
                Referred Leads
              </div>
              {referredLeads.map((lead) => (
                <div key={lead.id} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <div>
                      <span className="font-bold" style={{ color: "#EAE6D2" }}>{lead.name}</span>
                      <span className="text-xs ml-2" style={{ color: "rgba(234,230,210,0.4)" }}>
                        {new Date(lead.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: lead.leadStatus === "converted" ? "rgba(21,128,61,0.25)" : "rgba(234,230,210,0.1)",
                        color: lead.leadStatus === "converted" ? "#86efac" : "rgba(234,230,210,0.5)",
                      }}
                    >
                      {lead.leadStatus}
                    </span>
                  </div>
                  {/* Referrer reward reminder when lead converts */}
                  {lead.leadStatus === "converted" && (
                    <div
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold"
                      style={{ backgroundColor: "rgba(234,180,0,0.15)", color: "#fbbf24", border: "1px solid rgba(234,180,0,0.25)" }}
                    >
                      <Gift size={12} />
                      <span>Reward {code.referrerName} with 2 weeks free — apply manually in Square/HubFit</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReferralsTab() {
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [creating, setCreating] = useState(false);

  const { data: codes, isLoading } = trpc.referral.getCodes.useQuery();

  const createCode = trpc.referral.createCode.useMutation({
    onSuccess: () => {
      setCreating(false);
      setShowForm(false);
      setNewCode("");
      setNewName("");
      setNewNotes("");
      utils.referral.getCodes.invalidate();
      toast.success("Referral code created!");
    },
    onError: (err) => {
      setCreating(false);
      toast.error(err.message || "Failed to create code");
    },
  });

  const handleCreate = () => {
    const code = newCode.trim().toUpperCase().replace(/\s+/g, "_");
    if (!code || !newName.trim()) {
      toast.error("Code and referrer name are required");
      return;
    }
    if (!/^[A-Z0-9_-]+$/.test(code)) {
      toast.error("Code can only contain letters, numbers, hyphens, and underscores");
      return;
    }
    setCreating(true);
    createCode.mutate({ code, referrerName: newName.trim(), notes: newNotes.trim() || undefined });
  };

  const totalLeads = codes?.reduce((sum, c) => sum + c.usageCount, 0) ?? 0;
  const activeCodes = codes?.filter((c) => c.active === "yes").length ?? 0;

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total Codes", value: codes?.length ?? 0, accent: false },
          { label: "Active", value: activeCodes, accent: true },
          { label: "Referred Leads", value: totalLeads, accent: false },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl px-4 py-3"
            style={{
              backgroundColor: stat.accent ? "#EAE6D2" : "rgba(0,0,0,0.25)",
              color: stat.accent ? "#54412F" : "#EAE6D2",
              border: stat.accent ? "none" : "1px solid rgba(234,230,210,0.15)",
            }}
          >
            <div className="text-2xl font-black">{stat.value}</div>
            <div className="text-xs font-bold opacity-60">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Create new code */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-3 mb-4 text-sm font-bold border-2 border-dashed transition-all"
          style={{ borderColor: "rgba(234,230,210,0.2)", color: "rgba(234,230,210,0.5)" }}
        >
          <Plus size={16} />
          Create New Referral Code
        </button>
      ) : (
        <div className="rounded-xl p-4 mb-4 space-y-3" style={{ backgroundColor: "rgba(234,230,210,0.08)", border: "1px solid rgba(234,230,210,0.2)" }}>
          <div className="text-sm font-black" style={{ color: "#EAE6D2" }}>New Referral Code</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold mb-1 block" style={{ color: "rgba(234,230,210,0.5)" }}>Code *</label>
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="e.g. RUBY2024"
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none border font-mono"
                style={{ borderColor: "rgba(234,230,210,0.2)", backgroundColor: "rgba(0,0,0,0.2)", color: "#EAE6D2" }}
              />
            </div>
            <div>
              <label className="text-xs font-bold mb-1 block" style={{ color: "rgba(234,230,210,0.5)" }}>Referrer Name *</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Ruby"
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none border"
                style={{ borderColor: "rgba(234,230,210,0.2)", backgroundColor: "rgba(0,0,0,0.2)", color: "#EAE6D2" }}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold mb-1 block" style={{ color: "rgba(234,230,210,0.5)" }}>Notes (optional)</label>
            <input
              type="text"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="e.g. Comp prep client, referred Jan 2024"
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none border"
              style={{ borderColor: "rgba(234,230,210,0.2)", backgroundColor: "rgba(0,0,0,0.2)", color: "#EAE6D2" }}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setShowForm(false); setNewCode(""); setNewName(""); setNewNotes(""); }}
              className="text-xs font-bold px-3 py-1.5 rounded-lg"
              style={{ color: "rgba(234,230,210,0.4)" }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-lg"
              style={{ backgroundColor: "#EAE6D2", color: "#54412F" }}
            >
              {creating && <Loader2 size={12} className="animate-spin" />}
              Create Code
            </button>
          </div>
        </div>
      )}

      {/* Code list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin" size={24} style={{ color: "#EAE6D2" }} />
        </div>
      ) : !codes?.length ? (
        <div className="text-center py-16 rounded-2xl" style={{ backgroundColor: "rgba(234,230,210,0.05)" }}>
          <p className="text-3xl mb-3">🔗</p>
          <p className="text-lg font-black mb-1" style={{ color: "#EAE6D2" }}>No referral codes yet</p>
          <p className="text-sm" style={{ color: "rgba(234,230,210,0.4)" }}>
            Create a code for each client who refers people to you.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {codes.map((code) => <CodeCard key={code.id} code={code} />)}
        </div>
      )}
    </div>
  );
}
