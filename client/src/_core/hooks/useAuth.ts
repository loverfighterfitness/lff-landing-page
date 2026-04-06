import { trpc } from "@/lib/trpc";

/**
 * useAuth — returns the current user from the server context.
 * No login required (single-user site). Always returns admin.
 */
export function useAuth() {
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  return {
    user: meQuery.data ?? null,
    loading: meQuery.isLoading,
    error: meQuery.error ?? null,
    isAuthenticated: Boolean(meQuery.data),
    refresh: () => meQuery.refetch(),
    logout: async () => {},
  };
}
