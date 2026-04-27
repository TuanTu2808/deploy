"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiRequest } from "@/lib/api";
import {
  clearAuth,
  loadRefreshToken,
  loadToken,
  loadUser,
  saveAuth,
  saveAuthUsingCurrentStorage,
  type AuthTokens,
} from "@/lib/auth-storage";
import type { AuthUser } from "@/lib/auth-types";

type AuthContextValue = {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  bootstrapped: boolean;
  signIn: (tokens: AuthTokens, user: AuthUser, remember?: boolean) => void;
  signOut: () => void;
  refreshProfile: () => Promise<AuthUser | null>;
  setUser: (user: AuthUser) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  const signOut = useCallback(() => {
    const currentAccessToken = loadToken();
    const currentRefreshToken = loadRefreshToken();

    if (currentRefreshToken || currentAccessToken) {
      fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001"}/api/auth/logout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(currentAccessToken
              ? { Authorization: `Bearer ${currentAccessToken}` }
              : {}),
          },
          body: JSON.stringify({
            refreshToken: currentRefreshToken,
          }),
          cache: "no-store",
        },
      ).catch(() => {
        // ignore network errors on sign out
      });
    }

    setToken(null);
    setRefreshToken(null);
    setUserState(null);
    clearAuth();
  }, []);

  const signIn = useCallback(
    (nextTokens: AuthTokens, nextUser: AuthUser, remember = true) => {
      setToken(nextTokens.accessToken);
      setRefreshToken(nextTokens.refreshToken);
      setUserState(nextUser);
      saveAuth(nextTokens, nextUser, remember);
    },
    [],
  );

  const refreshProfile = useCallback(async () => {
    const currentAccessToken = loadToken();
    const currentRefreshToken = loadRefreshToken();
    if (!currentAccessToken || !currentRefreshToken) {
      signOut();
      return null;
    }

    try {
      const response = await apiRequest<{ user: AuthUser }>("/api/users/me", {
        token: currentAccessToken,
      });

      const latestAccessToken = loadToken();
      const latestRefreshToken = loadRefreshToken();
      const tokensToPersist: AuthTokens = {
        accessToken: latestAccessToken || currentAccessToken,
        refreshToken: latestRefreshToken || currentRefreshToken,
      };

      setToken(tokensToPersist.accessToken);
      setRefreshToken(tokensToPersist.refreshToken);
      setUserState(response.user);
      saveAuthUsingCurrentStorage(tokensToPersist, response.user);
      return response.user;
    } catch {
      signOut();
      return null;
    }
  }, [signOut]);

  const setUser = useCallback(
    (nextUser: AuthUser) => {
      const currentAccessToken = token || loadToken();
      const currentRefreshToken = refreshToken || loadRefreshToken();
      if (!currentAccessToken || !currentRefreshToken) return;

      const nextTokens: AuthTokens = {
        accessToken: currentAccessToken,
        refreshToken: currentRefreshToken,
      };

      setUserState(nextUser);
      saveAuthUsingCurrentStorage(nextTokens, nextUser);
    },
    [token, refreshToken],
  );

  useEffect(() => {
    const storedAccessToken = loadToken();
    const storedRefreshToken = loadRefreshToken();
    const storedUser = loadUser();

    if (!storedAccessToken || !storedRefreshToken || !storedUser) {
      signOut();
      setBootstrapped(true);
      return;
    }

    setToken(storedAccessToken);
    setRefreshToken(storedRefreshToken);
    setUserState(storedUser);
    refreshProfile().finally(() => setBootstrapped(true));
  }, [refreshProfile, signOut]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      refreshToken,
      user,
      bootstrapped,
      signIn,
      signOut,
      refreshProfile,
      setUser,
      
    }),
    [
      token,
      refreshToken,
      user,
      bootstrapped,
      signIn,
      signOut,
      refreshProfile,
      setUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
