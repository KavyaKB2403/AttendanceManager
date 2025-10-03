// src/api/client.ts
import axios, { AxiosHeaders } from "axios";

// Read from env (CRA-style) with fallback to local FastAPI default
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

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
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const message = error.response.data?.detail || error.message;
      // console.error("API Error:", error.response.status, message);
      // Use react-hot-toast to display the error
      import('react-hot-toast').then(module => {
        const toast = module.default;
        toast.error(message);
      });
    } else if (error.request) {
      // The request was made but no response was received
      // console.error("Network Error:", error.request);
      import('react-hot-toast').then(module => {
        const toast = module.default;
        toast.error("Network Error: No response from server.");
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      // console.error("Request Error:", error.message);
      import('react-hot-toast').then(module => {
        const toast = module.default;
        toast.error(`Request Error: ${error.message}`);
      });
    }
    return Promise.reject(error);
  }
);

// ===== AUTH =====
export const auth = {
  async signIn(email: string, password: string): Promise<any> {
    const res = await api.post("/auth/signin", { email, password });
    // Persist token for subsequent requests
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

// ===== EMPLOYEES =====
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
    const res = await api.put(`/employees/${id}/`, updates);
    return res.data;
  },
  async delete(id: number): Promise<{ ok: boolean }> {
    console.log("API Client: employees.delete received ID:", id);
    const res = await api.delete(`/employees/${id}`); // Removed trailing slash
    // Safely extract 'ok' property from res.data if it exists and is boolean, else default to true
    const ok = typeof (res.data as any)?.ok === "boolean" ? (res.data as any).ok : true;
    return { ok };
  },
};

// ===== ATTENDANCE =====
export const attendance = {
  async list(params?: { employee_id?: number; start?: string; end?: string }): Promise<any[]> {
    const res = await api.get("/attendance/", { params }); // Added trailing slash
    // Ensure the returned value is always an array
    return Array.isArray(res.data) ? res.data : [];
  },
  async create(record: any): Promise<any> {
    console.log("Attendances.create received record:", record);
    const res = await api.post("/attendance/", record);
    return res.data;
  },
  async update(id: number, updates: any): Promise<any> {
    console.log(`Attendances.update received for id ${id} with updates:`, updates);
    const res = await api.put(`/attendance/${id}/`, updates);
    return res.data;
  },
};

// ===== SETTINGS =====
export const settings = {
  async get(): Promise<any> {
    const res = await api.get("/settings/company");
    return res.data;
  },
  async update(updates: any): Promise<any> {
    const res = await api.post("/settings/company", updates);
    return res.data;
  },
  async listHolidays(): Promise<any[]> {
    const res = await api.get("/settings/holidays");
    // Ensure the returned value is always an array
    return Array.isArray(res.data) ? res.data : [];
  },
  async addHoliday(payload: any): Promise<any> {
    const res = await api.post("/settings/holidays", payload);
    return res.data;
  },
  async deleteHoliday(id: number): Promise<{ ok: boolean }> {
    const res = await api.delete(`/settings/holidays/${id}`);
    // Safely extract 'ok' property from res.data if it exists and is boolean, else default to true
    const ok = typeof (res.data as any)?.ok === "boolean" ? (res.data as any).ok : true;
    return { ok };
  },
};

// ===== REPORTS =====
export const reports = {
  async getSalaryReport(month: string): Promise<any[]> {
    const res = await api.get("/reports/salary", { params: { month } });
    // Ensure the returned value is always an array
    return Array.isArray(res.data) ? res.data : [];
  },
  async exportCSV(month: string): Promise<Blob> {
    const res = await api.get(`/reports/salary.csv`, {
      params: { month },
      responseType: "blob",
    });
    // Axios returns the blob in res.data, but TypeScript may not infer the type correctly.
    // Explicitly cast to Blob to satisfy the return type.
    return res.data as Blob;
  },
};
