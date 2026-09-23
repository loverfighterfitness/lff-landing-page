/**
 * Admin Gate — password screen in front of /admin and /admin/leads.
 * The password is checked server-side (ADMIN_PASSWORD) on every admin request.
 */
import { useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { ADMIN_LOCKED_EVENT, getAdminKey, setAdminKey } from "@/lib/adminKey";

const LOGO_CREAM =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663408040383/TeiTyUgvfabHNSBnznn263/LFFNEWLOGOCREAM_transparent_a5b72c81.png";

export default function AdminGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(() => !!getAdminKey());
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const login = trpc.system.adminLogin.useMutation();
  const queryClient = useQueryClient();

  useEffect(() => {
    const lock = () => setUnlocked(false);
    window.addEventListener(ADMIN_LOCKED_EVENT, lock);
    return () => window.removeEventListener(ADMIN_LOCKED_EVENT, lock);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setChecking(true);
    setError("");
    try {
      await login.mutateAsync({ password });
      setAdminKey(password);
      queryClient.clear();
      setUnlocked(true);
    } catch (err) {
      const tooMany = err instanceof Error && err.message.startsWith("Too many");
      setError(tooMany ? err.message : "Wrong password. Try again.");
    } finally {
      setChecking(false);
    }
  };

  if (unlocked) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#54412F" }}>
      <form onSubmit={submit} className="w-full max-w-xs flex flex-col items-center gap-4">
        <img src={LOGO_CREAM} alt="LFF" className="h-14 w-auto mb-2" />
        <label htmlFor="admin-password" className="text-xs tracking-[0.25em] uppercase font-semibold" style={{ color: "rgba(234,230,210,0.8)" }}>
          Admin password
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-full px-5 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#EAE6D2]"
          style={{ backgroundColor: "rgba(234,230,210,0.1)", color: "#EAE6D2", border: "1.5px solid rgba(234,230,210,0.35)" }}
        />
        {error && (
          <p role="alert" className="text-sm" style={{ color: "#F2B8A0" }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={checking || !password}
          className="w-full rounded-full py-3 text-xs font-bold tracking-[0.15em] uppercase flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ backgroundColor: "#EAE6D2", color: "#54412F" }}
        >
          {checking && <Loader2 size={14} className="animate-spin" />}
          Unlock
        </button>
      </form>
    </div>
  );
}
