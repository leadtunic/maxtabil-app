import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { apiRequest, buildApiUrl } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { track, identify, AnalyticsEvents, resetAnalytics } from "@/lib/analytics";
import type {
  Workspace,
  WorkspaceSettings,
  Entitlement,
  ModuleKey,
} from "@/types/supabase";

type AuthUser = {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  emailVerified?: boolean;
};

type AuthSession = {
  id: string;
  userId: string;
  expiresAt: string;
};

type SessionResponse = {
  session: AuthSession;
  user: AuthUser;
} | null;

type WorkspaceBootstrapResponse = {
  workspace: Workspace | null;
  settings: WorkspaceSettings | null;
  entitlement: Entitlement | null;
};

interface AuthContextType {
  // User & Session
  user: AuthUser | null;
  session: AuthSession | null;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearState = useCallback(() => {
    setSession(null);
    setUser(null);
    setWorkspace(null);
    setSettings(null);
    setEntitlement(null);
  }, []);

  const fetchWorkspaceData = useCallback(async (userId: string) => {
    try {
      const data = await apiRequest<WorkspaceBootstrapResponse>("/api/workspace/bootstrap");

      if (!data?.workspace) {
        setWorkspace(null);
        setSettings(null);
        setEntitlement(null);
        return null;
      }

      setWorkspace(data.workspace);
      setSettings(data.settings);
      setEntitlement(data.entitlement);

      identify(userId, {
        email: data.workspace.name,
        workspace_id: data.workspace.id,
        workspace_name: data.workspace.name,
      });
      return data;
    } catch (error) {
      console.error("[Auth] Error loading workspace data:", error);
      return null;
    }
  }, []);

  const refreshWorkspace = useCallback(async () => {
    if (!user) return;
    await fetchWorkspaceData(user.id);
  }, [user, fetchWorkspaceData]);

  const isEmailAllowed = useCallback(async (email: string): Promise<boolean> => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return false;

    try {
      const data = await apiRequest<{ allowed: boolean }>(
        `/api/allowlist/check?email=${encodeURIComponent(normalizedEmail)}`
      );
      return Boolean(data?.allowed);
    } catch (error) {
      console.error("[Auth] allowlist check failed:", error);
      return false;
    }
  }, []);

  const loadSession = useCallback(async () => {
    try {
      const sessionData = await apiRequest<SessionResponse>("/api/auth/get-session");

      if (!sessionData?.user) {
        clearState();
        return null;
      }

      setSession(sessionData.session);
      setUser(sessionData.user);
      await fetchWorkspaceData(sessionData.user.id);
      return sessionData;
    } catch (error) {
      console.error("[Auth] Error initializing auth:", error);
      clearState();
      return null;
    }
  }, [clearState, fetchWorkspaceData]);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      await loadSession();
      if (mounted) setIsLoading(false);
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, [loadSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const allowed = await isEmailAllowed(email);
      if (!allowed) {
        return { success: false, error: "E-mail não autorizado para acesso." };
      }

      try {
        await apiRequest("/api/auth/sign-in/email", {
          method: "POST",
          body: { email, password },
        });

        const sessionData = await loadSession();
        track(AnalyticsEvents.AUTH_LOGIN_SUCCESS, { method: "email" });
        await logAudit(
          "LOGIN_SUCCESS",
          "auth",
          sessionData?.user?.id ?? null,
          { email },
          null
        );

        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Credenciais inválidas",
        };
      }
    },
    [isEmailAllowed, loadSession]
  );

  const signUp = useCallback(
    async (email: string, password: string, name?: string) => {
      const allowed = await isEmailAllowed(email);
      if (!allowed) {
        return { success: false, error: "E-mail não autorizado para cadastro." };
      }

      const displayName = name || email.split("@")[0];

      try {
        const response = await apiRequest<{ token?: string | null }>("/api/auth/sign-up/email", {
          method: "POST",
          body: {
            name: displayName,
            email,
            password,
          },
        });

        track(AnalyticsEvents.AUTH_SIGNUP_SUCCESS, { method: "email" });

        if (response?.token) {
          await loadSession();
        }

        return {
          success: true,
          requiresEmailConfirmation: !response?.token,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Erro ao criar conta",
        };
      }
    },
    [isEmailAllowed, loadSession]
  );

  const loginWithGoogle = useCallback(async () => {
    const callbackURL = `${window.location.origin}/app`;
    const url = new URL(buildApiUrl("/api/auth/sign-in/social"));
    url.searchParams.set("provider", "google");
    url.searchParams.set("callbackURL", callbackURL);
    window.location.href = url.toString();
  }, []);

  const logout = useCallback(async () => {
    track(AnalyticsEvents.AUTH_LOGOUT);
    resetAnalytics();
    try {
      await apiRequest("/api/auth/sign-out", { method: "POST" });
    } catch (error) {
      console.error("[Auth] Error during logout:", error);
    }
    clearState();
  }, [clearState]);

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
