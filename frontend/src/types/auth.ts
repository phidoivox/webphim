export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin" | "moderator" | string;
  subscriptionType: "free" | "vip" | "premium" | string;
  subscriptionExpiresAt: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string | null;
}

export interface AuthResponseData {
  user: AuthUser;
  token: string;
}

export interface AuthApiResponse {
  status: "success" | "error";
  message?: string;
  data: AuthResponseData;
}

export interface LoginPayload {
  email: string;
  password: string;
  device_name?: string;
  remember_me?: boolean;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginPayload) => Promise<AuthUser>;
  register: (credentials: RegisterPayload) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
}
