import { api } from "api/client"
import { jwtDecode } from "jwt-decode" // Import jwtDecode
import { AxiosError } from "axios"

interface User { // Define User interface
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'staff';
}

export const authService = {
  async signIn(email: string, password: string): Promise<{ token?: string; user?: User; error?: string }> {
    try {
      const res = await api.post("/auth/signin", { email, password })
      const data = res.data as { token: string } // Assume token is always present on success
      
      if (data.token) {
        localStorage.setItem("token", data.token)
        const decoded: any = jwtDecode(data.token);
        const user: User = { // Extract user data including role
          id: decoded.sub,
          email: decoded.email,
          name: decoded.name, // Assuming 'name' is also in the token payload if available
          role: decoded.role,
        };
        return { token: data.token, user: user }
      }
      return { error: "Login failed: No token received." }; // Should not happen with current backend
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.detail) {
        return { error: err.response.data.detail }
      }
      return { error: "An unexpected error occurred during sign-in." }
    }
  },

  async signUp(
    name: string,
    email: string,
    password: string
  ): Promise<{ user?: User; token?: string; error?: string }> {
    try {
      // First, create the user account
      await api.post("/auth/signup", { name, email, password });

      // If signup is successful, automatically sign in the user to get a token
      const signInResult = await authService.signIn(email, password);

      if (signInResult.token && signInResult.user) {
        return { user: signInResult.user, token: signInResult.token };
      } else if (signInResult.error) {
        return { error: `Signup successful, but automatic login failed: ${signInResult.error}` };
      } else {
        return { error: "Signup successful, but no token received after automatic login." };
      }
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.detail) {
        const detail = err.response.data.detail;
        let errorMessage = "An unknown error occurred.";

        if (Array.isArray(detail)) {
          errorMessage = detail.map((e: any) => e.msg).join(", ");
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (detail && typeof detail === 'object' && detail.msg) {
          errorMessage = detail.msg;
        }
        return { error: errorMessage };
      }
      return { error: "An unexpected error occurred during sign-up." };
    }
  },

  async forgotPassword(
    email: string
  ): Promise<{ success: boolean; error?: string; resetToken?: string; message?: string }> {
    try {
      const res = await api.post("/auth/forgot-password", { email })
      return { success: true, ...res.data as { message?: string } }
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.detail) {
        return { success: false, error: err.response.data.detail }
      }
      return { success: false, error: "An unexpected error occurred during forgot password." }
    }
  },

  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await api.post("/auth/reset-password", { token, new_password: newPassword })
      return { success: true, ...res.data as { ok?: boolean } }
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.detail) {
        return { success: false, error: err.response.data.detail }
      }
      return { success: false, error: "An unexpected error occurred during password reset." }
    }
  },

  signOut(): void {
    localStorage.removeItem("token");
  },

  // New method to get current user from token
  getUserFromToken(): User | null {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        return {
          id: decoded.sub,
          email: decoded.email,
          name: decoded.name,
          role: decoded.role,
        };
      } catch (error) {
        console.error("Failed to decode token from localStorage:", error);
        localStorage.removeItem("token");
        return null;
      }
    }
    return null;
  }
};
