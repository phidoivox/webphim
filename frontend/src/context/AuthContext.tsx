"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type {
  AuthContextType,
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from "@/types/auth";
import {
  getStoredToken,
  getStoredUser,
  removeStoredToken,
  removeStoredUser,
  setStoredToken,
  setStoredUser,
} from "@/lib/auth";
import { getMeApi, loginApi, logoutApi, registerApi } from "@/lib/api";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Khởi tạo trạng thái xác thực từ LocalStorage / Cookie
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      const storedToken = getStoredToken();
      const cachedUser = getStoredUser();

      if (!storedToken) {
        if (isMounted) {
          setUser(null);
          setToken(null);
          setIsLoading(false);
        }
        return;
      }

      // Đặt tạm cachedUser để render tức thì tránh UI chớp giật (optimistic render)
      if (isMounted) {
        setToken(storedToken);
        if (cachedUser) setUser(cachedUser);
      }

      // Xác thực lại với Backend Laravel để lấy data mới nhất
      try {
        const freshUser = await getMeApi(storedToken);
        if (isMounted) {
          setUser(freshUser);
          setStoredUser(freshUser);
        }
      } catch (err) {
        // Token không còn hợp lệ hoặc đã bị revoke -> xóa session
        if (isMounted) {
          removeStoredToken();
          removeStoredUser();
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (credentials: LoginPayload): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      const data = await loginApi(credentials);
      setStoredToken(data.token);
      setStoredUser(data.user);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (credentials: RegisterPayload): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      const data = await registerApi(credentials);
      setStoredToken(data.token);
      setStoredUser(data.user);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    const currentToken = token || getStoredToken();
    try {
      if (currentToken) {
        await logoutApi(currentToken);
      }
    } catch {
      // Ignored: vẫn xóa local session dù backend timeout hoặc lỗi mạng
    } finally {
      removeStoredToken();
      removeStoredUser();
      setUser(null);
      setToken(null);
    }
  }, [token]);

  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    const currentToken = token || getStoredToken();
    if (!currentToken) return null;

    try {
      const freshUser = await getMeApi(currentToken);
      setUser(freshUser);
      setStoredUser(freshUser);
      return freshUser;
    } catch {
      await logout();
      return null;
    }
  }, [token, logout]);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: Boolean(user && token),
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
