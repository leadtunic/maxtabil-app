import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";
import { track, identify, AnalyticsEvents, resetAnalytics } from "@/lib/analytics";
import type {
  Workspace,
  WorkspaceSettings,
  Entitlement,
  ModuleKey,
  EnabledModules,
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
  signUp: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWorkspaceData = useCallback(async (userId: string) => {
    // Try to find existing workspace
    let { data: ws, error: wsError } = await supabase
      .from("workspaces")
      .select("*")
      .eq("owner_user_id", userId)
      .single();

    // If no workspace exists, create one
    if (wsError || !ws) {
      const { data: userData } = await supabase.auth.getUser();
      const email = userData?.user?.email || "user@example.com";
      const name = userData?.user?.user_metadata?.name || userData?.user?.user_metadata?.full_name || email.split("@")[0];
      
      const { data: newWs, error: createError } = await supabase
        .from("workspaces")
        .insert({
          owner_user_id: userId,
          name: name,
          slug: generateSlug(email),
        })
        .select()
        .single();

      if (createError || !newWs) {
        console.error("Error creating workspace:", createError);
        return;
      }

      ws = newWs;

      // Create default settings
      await supabase.from("workspace_settings").insert({
        workspace_id: ws.id,
        enabled_modules: {
          financeiro: true,
          financeiro_bpo: true,
          dp: true,
          fiscal_contabil: true,
          legalizacao: true,
          certificado_digital: true,
          admin: true,
        } as EnabledModules,
        completed_onboarding: false,
      });

      // Create entitlement record
      await supabase.from("entitlements").insert({
        workspace_id: ws.id,
        lifetime_access: false,
      });
    }

    setWorkspace(ws);

    // Fetch settings
    const { data: settingsData } = await supabase
      .from("workspace_settings")
      .select("*")
      .eq("workspace_id", ws.id)
      .single();

    if (settingsData) {
      setSettings(settingsData);
    }

    // Fetch entitlement
    const { data: entitlementData } = await supabase
      .from("entitlements")
      .select("*")
      .eq("workspace_id", ws.id)
      .single();

    if (entitlementData) {
      setEntitlement(entitlementData);
    }

    // Identify user in analytics
    identify(userId, {
      email: ws.name,
      workspace_id: ws.id,
      workspace_name: ws.name,
    });
  }, []);

  const refreshWorkspace = useCallback(async () => {
    if (!user) return;
    await fetchWorkspaceData(user.id);
  }, [user, fetchWorkspaceData]);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      
      if (!mounted) return;
      
      if (initialSession?.user) {
        setSession(initialSession);
        setUser(initialSession.user);
        await fetchWorkspaceData(initialSession.user.id);
      }
      
      setIsLoading(false);
    };

    initAuth();

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
    []
  );

  const signUp = useCallback(
    async (email: string, password: string, name?: string) => {
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

      return { success: true };
    },
    []
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
    await supabase.auth.signOut();
    setWorkspace(null);
    setSettings(null);
    setEntitlement(null);
  }, []);

  const hasModule = useCallback(
    (moduleKey: ModuleKey): boolean => {
      if (!settings?.enabled_modules) return true; // Default to true if not set
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
