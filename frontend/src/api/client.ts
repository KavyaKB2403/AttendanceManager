// src/api/client.ts
import axios, { AxiosHeaders } from "axios";

// Read from env (CRA-style) with fallback to local FastAPI default
const API_BASE = process.env.REACT_APP_API_BASE;
console.log("API Base URL:", API_BASE);

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// Attach Bearer token if present
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) {
    cfg.headers = cfg.headers || new AxiosHeaders();
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

// Add a response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const message = error.response.data?.detail || error.message;
      import('react-hot-toast').then(module => {
        const toast = module.default;
        toast.error(message);
      });
    } else if (error.request) {
      import('react-hot-toast').then(module => {
        const toast = module.default;
        toast.error("Network Error: No response from server.");
      });
    } else {
      import('react-hot-toast').then(module => {
        const toast = module.default;
        toast.error(`Request Error: ${error.message}`);
      });
    }
    return Promise.reject(error);
  }
);

// ===== AUTH (Unchanged) =====
export const auth = {
  async signIn(email: string, password: string): Promise<any> {
    const res = await api.post("/auth/signin", { email, password });
    const data = res.data as { token?: string };
    if (data && data.token) localStorage.setItem("token", data.token);
    return data;
  },
  async signUp(name: string, email: string, password: string): Promise<any> {
    const res = await api.post("/auth/signup", { name, email, password });
    return res.data;
  },
  async forgotPassword(email: string): Promise<{ reset_token?: string; ok?: boolean }> {
    const res = await api.post("/auth/forgot-password", { email });
    return res.data;
  },
  async resetPassword(token: string, newPassword: string): Promise<{ ok?: boolean }> {
    const res = await api.post("/auth/reset-password", { token: token, new_password: newPassword });
    return res.data;
  },
};

// ===== EMPLOYEES (Unchanged) =====
export const employees = {
  async getAll(): Promise<any[]> {
    const res = await api.get("/employees/");
    return Array.isArray(res.data) ? res.data : [];
  },
  async create(employee: any): Promise<any> {
    const res = await api.post("/employees/", employee);
    return res.data;
  },
  async update(id: number, updates: any): Promise<any> {
    const res = await api.put(`/employees/${id}`, updates);
    return res.data;
  },
  async delete(id: number): Promise<{ ok: boolean }> {
    const res = await api.delete(`/employees/${id}`);
    const ok = typeof (res.data as any)?.ok === "boolean" ? (res.data as any).ok : true;
    return { ok };
  },
};

// ===== ATTENDANCE (Unchanged) =====
export const attendance = {
  async list(params?: { employee_id?: number; start?: string; end?: string }): Promise<any[]> {
    const res = await api.get("/attendance/", { params });
    return Array.isArray(res.data) ? res.data : [];
  },
  async create(record: any): Promise<any> {
    const res = await api.post("/attendance/", record);
    return res.data;
  },
  async update(id: number, updates: any): Promise<any> {
    const res = await api.put(`/attendance/${id}/`, updates);
    return res.data;
  },
};

// ===== SETTINGS (Updated) =====
export const settings = {
  async get(): Promise<any> {
    const res = await api.get("/settings/company");
    return res.data;
  },
  // THIS FUNCTION IS UPDATED
  async update(updates: any, logoFile?: File): Promise<any> {
    const formData = new FormData();

    // Append all the text-based fields from the updates object
    formData.append('company_name', updates.company_name);
    formData.append('standard_work_hours_per_day', updates.standard_work_hours_per_day);
    formData.append('currency', updates.currency);
    formData.append('overtime_multiplier', updates.overtime_multiplier);
    formData.append('mark_sundays_as_holiday', updates.mark_sundays_as_holiday);

    // If a new logo file is provided, append it to the form data
    if (logoFile) {
      formData.append('company_logo', logoFile);
    }

    // Send the request as multipart/form-data
    const res = await api.post("/settings/company", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
  async listHolidays(): Promise<any[]> {
    const res = await api.get("/settings/holidays");
    return Array.isArray(res.data) ? res.data : [];
  },
  async addHoliday(payload: any): Promise<any> {
    const res = await api.post("/settings/holidays", payload);
    return res.data;
  },
  async deleteHoliday(id: number): Promise<{ ok: boolean }> {
    const res = await api.delete(`/settings/holidays/${id}`);
    const ok = typeof (res.data as any)?.ok === "boolean" ? (res.data as any).ok : true;
    return { ok };
  },
};

// ===== REPORTS (Unchanged) =====
export const reports = {
  async getSalaryReport(month: string, employee_id?: number): Promise<any[]> {
    const params: { month: string; employee_id?: number } = { month };
    if (employee_id) {
      params.employee_id = employee_id;
    }
    const res = await api.get("/reports/salary", { params });
    return Array.isArray(res.data) ? res.data : [];
  },
  async exportCSV(month: string, employee_id?: number): Promise<Blob> {
    const params: { month: string; employee_id?: number } = { month };
    if (employee_id) {
      params.employee_id = employee_id;
    }
    const res = await api.get(`/reports/salary.csv`, {
      params,
      responseType: "blob",
    });
    return res.data as Blob;
  },
};
