export type Role = "ADMIN" | "USER";

export interface UserSummary {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string | null;
  createdAt: Date;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
