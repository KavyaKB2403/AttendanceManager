// frontend/src/lib/employees.ts
import { api } from "../api/client"; // Assuming api is in ../api/client

export interface Employee {
  id: number;
  user_id?: number; // Optional, as some employees might not have a linked user account
  name: string;
  position: string;
  department: string;
  monthly_salary: number;
  date_of_joining: string; // YYYY-MM-DD
  bank_account?: string;
  status: "active" | "inactive";
  salary_effective_from?: string; // YYYY-MM-DD
  created_at: string;
  updated_at: string;
}

export const employeeService = {
  async listEmployees(
    params?: { has_user_account?: boolean }
  ): Promise<Employee[]> {
    try {
      const res = await api.get("/admin/employees/available", { params });
      return res.data;
    } catch (error) {
      console.error("Failed to fetch available employees:", error);
      throw error;
    }
  },
  // Add other employee-related services here if needed
};
