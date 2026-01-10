import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from "react";
import type { AuthUser, Profile, RoleKey } from "@/types";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasRole: (role: RoleKey) => boolean;
  refreshProfile: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const buildAuthUser = useCallback((nextProfile: Profile | null): AuthUser | null => {
    if (!nextProfile) return null;
    return {
      id: nextProfile.user_id,
      name: nextProfile.display_name,
      email: nextProfile.email,
      role: nextProfile.role,
      isActive: nextProfile.is_active,
      mustChangePassword: nextProfile.must_change_password,
    };
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      setProfile(null);
      return null;
    }

    if (!data.is_active) {
      await supabase.auth.signOut();
      setProfile(null);
      return null;
    }

    setProfile(data);
    return data;
  }, []);

  const refreshProfile = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setProfile(null);
      return;
    }
    await fetchProfile(user.id);
  }, [fetchProfile]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session?.user?.id) {
        fetchProfile(data.session.user.id).finally(() => {
          if (mounted) setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user?.id) {
        setProfile(null);
        return;
      }
      fetchProfile(session.user.id);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) {
        return { success: false, error: error?.message || "Credenciais inválidas" };
      }

      const loadedProfile = await fetchProfile(data.user.id);
      if (!loadedProfile) {
        return { success: false, error: "Usuário sem perfil ativo." };
      }

      await logAudit("LOGIN_SUCCESS", "auth", data.user.id, { email: loadedProfile.email });
      return { success: true };
    },
    [fetchProfile],
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const updatePassword = useCallback(
    async (newPassword: string) => {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        return { success: false, error: error.message };
      }

      if (profile) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ must_change_password: false })
          .eq("user_id", profile.user_id);

        if (profileError) {
          return { success: false, error: profileError.message };
        }
        await refreshProfile();
      }

      return { success: true };
    },
    [profile, refreshProfile],
  );

  const user = useMemo(() => buildAuthUser(profile), [buildAuthUser, profile]);

  const hasRole = useCallback(
    (role: RoleKey): boolean => {
      if (!user) return false;
      return user.role === "ADMIN" || user.role === role;
    },
    [user],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        logout,
        hasRole,
        refreshProfile,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
