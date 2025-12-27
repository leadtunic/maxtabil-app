import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { User, RoleKey } from "@/types";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasRole: (role: RoleKey) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Mock admin user for frontend demo
const mockAdminUser: User = {
  id: "usr_admin_001",
  name: "Administrador ESCOFER",
  email: "admin@escofer.com.br",
  status: "ACTIVE",
  createdAt: new Date("2024-01-01"),
  lastLoginAt: new Date(),
  roles: [
    { id: "role_1", key: "ADMIN", name: "Administrador" },
  ],
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    // Mock login - accepts any credentials with @escofer.com.br
    if (email.endsWith("@escofer.com.br") && password.length >= 6) {
      setUser(mockAdminUser);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const hasRole = useCallback((role: RoleKey): boolean => {
    if (!user) return false;
    return user.roles.some((r) => r.key === role || r.key === "ADMIN");
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        login,
        logout,
        hasRole,
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
