import { api } from "./client"; // Assuming client.ts exports the configured axios instance

interface StaffCreatePayload {
  name: string;
  email: string;
}

interface StaffCreatedResponse {
  id: number;
  email: string;
  name: string;
  role: "admin" | "staff";
  created_at: string; // ISO date string
  temp_password?: string; // Only present on creation for admin
}

interface StaffUser { // For listing staff
  id: number;
  email: string;
  name: string;
  role: "admin" | "staff";
  created_at: string;
}

interface PasswordResetResponse {
  ok: boolean;
  message: string;
  new_temporary_password: string;
}

export const adminService = {
  async createStaff(payload: StaffCreatePayload): Promise<StaffCreatedResponse> {
    const res = await api.post("/admin/staff", payload);
    return res.data;
  },

  async listStaff(): Promise<StaffUser[]> {
    const res = await api.get("/admin/staff");
    return res.data;
  },

  async resetStaffPassword(userId: number): Promise<PasswordResetResponse> {
    const res = await api.post(`/admin/staff/${userId}/reset-password`);
    return res.data;
  },

  async deleteStaff(userId: number): Promise<void> {
    await api.delete(`/admin/staff/${userId}`);
  },
};
