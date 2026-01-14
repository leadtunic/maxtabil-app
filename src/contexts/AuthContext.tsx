import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";
import { track, identify, AnalyticsEvents, resetAnalytics } from "@/lib/analytics";
import type {
  Workspace,
  WorkspaceSettings,
  Entitlement,
  ModuleKey,
} from "@/types/supabase";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  // User & Session
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Workspace
  workspace: Workspace | null;
  settings: WorkspaceSettings | null;
  entitlement: Entitlement | null;

  // Actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string,
    name?: string
  ) => Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshWorkspace: () => Promise<void>;

  // Helpers
  hasModule: (moduleKey: ModuleKey) => boolean;
  completedOnboarding: boolean;
  hasLifetimeAccess: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function generateSlug(email: string): string {
  const base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-");
  const suffix = Math.random().toString(36).substring(2, 8);
  return `${base}-${suffix}`;
}

function isRefreshTokenError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeError = error as { message?: string; code?: string };
  const message = (maybeError.message ?? "").toLowerCase();
  const code = (maybeError.code ?? "").toString().toLowerCase();
  return message.includes("refresh_token_not_found") || code.includes("refresh_token_not_found");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initTimeoutMs = 8000;

  const withTimeout = useCallback(async <T,>(promise: Promise<T>, label: string): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`[Auth] Timeout while waiting for ${label}`));
      }, initTimeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }, [initTimeoutMs]);

  const fetchWorkspaceData = useCallback(async (userId: string) => {
    try {
    // Try to find existing workspace (avoid 406 by returning a list)
    const { data: existingWsList, error: wsError } = await supabase
      .from("workspaces")
      .select("*")
      .eq("owner_user_id", userId)
      .limit(1);

    let ws: Workspace | null = existingWsList?.[0] ?? null;

    // If no workspace exists, create one
    if (wsError || !ws) {
      const { data: userData } = await supabase.auth.getUser();
      const email = userData?.user?.email || "user@example.com";
      const displayName = userData?.user?.user_metadata?.name || 
                          userData?.user?.user_metadata?.full_name || 
                          email.split("@")[0];
      
      const { data: newWs, error: createError } = await supabase
        .from("workspaces")
        .insert({
          owner_user_id: userId,
          name: String(displayName),
          slug: generateSlug(email),
        })
        .select()
        .single();

      if (createError || !newWs) {
        console.error("Error creating workspace:", createError);
        setIsLoading(false);
        return;
      }

      const workspaceId = newWs.id;
      ws = newWs;

      // Create default settings
      await supabase.from("workspace_settings").insert({
        workspace_id: workspaceId,
        enabled_modules: {
          financeiro: true,
          financeiro_bpo: true,
          dp: true,
          fiscal_contabil: true,
          legalizacao: true,
          certificado_digital: true,
          admin: true,
        },
        completed_onboarding: false,
      });

      // Create entitlement record
      await supabase.from("entitlements").insert({
        workspace_id: workspaceId,
        lifetime_access: false,
      });
    }

    if (!ws) {
      setIsLoading(false);
      return;
    }

    setWorkspace(ws);

    // Fetch settings
    const { data: settingsList } = await supabase
      .from("workspace_settings")
      .select("*")
      .eq("workspace_id", ws.id)
      .limit(1);

    const settingsData = settingsList?.[0] ?? null;
    if (settingsData) setSettings(settingsData);

    // Fetch entitlement
    const { data: entitlementList } = await supabase
      .from("entitlements")
      .select("*")
      .eq("workspace_id", ws.id)
      .limit(1);

    const entitlementData = entitlementList?.[0] ?? null;
    if (entitlementData) setEntitlement(entitlementData);

    // Identify user in analytics
    identify(userId, {
      email: ws.name,
      workspace_id: ws.id,
      workspace_name: ws.name,
    });
    } catch (error) {
      console.error("[Auth] Error loading workspace data:", error);
    }
  }, []);

  const refreshWorkspace = useCallback(async () => {
    if (!user) return;
    await fetchWorkspaceData(user.id);
  }, [user, fetchWorkspaceData]);

  const isEmailAllowed = useCallback(async (email: string): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.rpc("is_email_allowed", {
      email_input: normalizedEmail,
    });
    if (error) {
      console.error("[Auth] allowlist check failed:", error);
      return false;
    }
    return Boolean(data);
  }, []);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      // If Supabase is not configured, just mark as not loading
      if (!isSupabaseConfigured) {
        console.warn("[Auth] Supabase not configured. Running in demo mode.");
        if (mounted) setIsLoading(false);
        return;
      }

      try {
        const { data: { session: initialSession }, error } = await withTimeout(
          supabase.auth.getSession(),
          "auth session"
        );

        if (!mounted) return;

        if (error) {
          if (isRefreshTokenError(error)) {
            await supabase.auth.signOut({ scope: "local" });
            setSession(null);
            setUser(null);
            setWorkspace(null);
            setSettings(null);
            setEntitlement(null);
          } else {
            console.warn("[Auth] Session error:", error);
          }
        }

        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          await withTimeout(fetchWorkspaceData(initialSession.user.id), "workspace data");
        }
      } catch (error) {
        console.error("[Auth] Error initializing auth:", error);
        if (
          error instanceof Error &&
          error.message.includes("Timeout while waiting for auth session")
        ) {
          void supabase.auth.signOut({ scope: "local" });
          setSession(null);
          setUser(null);
          setWorkspace(null);
          setSettings(null);
          setEntitlement(null);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initAuth();

    // Don't set up subscription if Supabase not configured
    if (!isSupabaseConfigured) {
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) return;
        
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          await fetchWorkspaceData(newSession.user.id);
        } else {
          setWorkspace(null);
          setSettings(null);
          setEntitlement(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchWorkspaceData]);

  const login = useCallback(
    async (email: string, password: string) => {
      const allowed = await isEmailAllowed(email);
      if (!allowed) {
        return { success: false, error: "E-mail não autorizado para acesso." };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        return { success: false, error: error?.message || "Credenciais inválidas" };
      }

      track(AnalyticsEvents.AUTH_LOGIN_SUCCESS, { method: "email" });
      await logAudit("LOGIN_SUCCESS", "auth", data.user.id, { email });

      return { success: true };
    },
    [isEmailAllowed]
  );

  const signUp = useCallback(
    async (email: string, password: string, name?: string) => {
      const allowed = await isEmailAllowed(email);
      if (!allowed) {
        return { success: false, error: "E-mail não autorizado para cadastro." };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name: name || email.split("@")[0] },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        track(AnalyticsEvents.AUTH_SIGNUP_SUCCESS, { method: "email" });
      }

      return { success: true, requiresEmailConfirmation: !data.session };
    },
    [isEmailAllowed]
  );

  const loginWithGoogle = useCallback(async () => {
    const redirectUrl = `${window.location.origin}/app`;
    
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
      },
    });
  }, []);

  const logout = useCallback(async () => {
    track(AnalyticsEvents.AUTH_LOGOUT);
    resetAnalytics();
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch (error) {
      console.error("[Auth] Error during logout:", error);
    }
    setSession(null);
    setUser(null);
    setWorkspace(null);
    setSettings(null);
    setEntitlement(null);
  }, []);

  const hasModule = useCallback(
    (moduleKey: ModuleKey): boolean => {
      if (!settings?.enabled_modules) return true;
      return settings.enabled_modules[moduleKey] === true;
    },
    [settings]
  );

  const completedOnboarding = useMemo(
    () => settings?.completed_onboarding ?? false,
    [settings]
  );

  const hasLifetimeAccess = useMemo(
    () => entitlement?.lifetime_access ?? false,
    [entitlement]
  );

  const value = useMemo(
    () => ({
      user,
      session,
      isAuthenticated: Boolean(user),
      isLoading,
      workspace,
      settings,
      entitlement,
      login,
      signUp,
      loginWithGoogle,
      logout,
      refreshWorkspace,
      hasModule,
      completedOnboarding,
      hasLifetimeAccess,
    }),
    [
      user,
      session,
      isLoading,
      workspace,
      settings,
      entitlement,
      login,
      signUp,
      loginWithGoogle,
      logout,
      refreshWorkspace,
      hasModule,
      completedOnboarding,
      hasLifetimeAccess,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
