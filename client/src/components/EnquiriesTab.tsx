/**
 * Enquiries Tab — "Let's chat" contact-form submissions from the homepage.
 */
import { Instagram, Loader2, MessageSquare } from "lucide-react";
import { trpc } from "@/lib/trpc";

const CREAM = "#EAE6D2";
const muted = { color: "rgba(234,230,210,0.72)" };

const GOALS: Record<string, string> = {
  lose_weight: "Lose weight / tone up",
  build_muscle: "Build muscle",
  comp_prep: "Competition prep",
  strength: "Strength / powerlifting",
  general_fitness: "General fitness",
  other: "Other",
};

export default function EnquiriesTab() {
  const { data, isLoading, error } = trpc.leads.list.useQuery();

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" size={28} style={{ color: CREAM }} /></div>;
  if (error) return <p className="text-sm py-10 text-center" style={muted}>Couldn't load enquiries: {error.message}</p>;
  if (!data?.length) {
    return (
      <p className="text-sm py-16 text-center max-w-md mx-auto" style={muted}>
        No enquiries yet. When someone sends the "Let's chat" form on the homepage it lands here, and you get a push notification.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {data.map((lead) => {
        const insta = lead.contactMethod === "instagram";
        const handle = lead.phone.replace(/^@/, "");
        return (
          <li key={lead.id} className="rounded-2xl p-5" style={{ backgroundColor: "rgba(234,230,210,0.07)", border: "1px solid rgba(234,230,210,0.14)", color: CREAM }}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-black text-lg">{lead.name}</p>
                <p className="text-sm" style={muted}>{GOALS[lead.goal] ?? lead.goal}</p>
              </div>
              <p className="text-xs" style={muted}>
                {new Date(lead.createdAt).toLocaleString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Australia/Adelaide" })}
              </p>
            </div>
            {lead.message && <p className="text-sm mt-3 whitespace-pre-wrap">{lead.message}</p>}
            <a
              href={insta ? `https://instagram.com/${handle}` : `sms:${lead.phone}`}
              target={insta ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 text-xs font-bold tracking-[0.12em] uppercase px-4 py-2 rounded-full"
              style={{ backgroundColor: CREAM, color: "#54412F" }}
            >
              {insta ? <Instagram size={13} /> : <MessageSquare size={13} />}
              {insta ? `@${handle}` : lead.phone}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
