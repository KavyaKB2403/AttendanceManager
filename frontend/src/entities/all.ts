// src/entities/all.ts
import {
  employees as employeesApi,
  attendance as attendanceApi,
  settings as settingsApi,
  reports as reportsApi,
  auth as authApi,
} from "api/client";

// --------------------
// Backend (API) shapes
// --------------------
export interface ApiEmployee {
  id: number;
  name: string;
  monthly_salary: number;
  date_of_joining?: string; // yyyy-MM-dd
  user_id: number;
  bank_account?: string; // Renamed from email
  position?: string;
  department?: string;
  status?: "active" | "inactive";
  salary_effective_from?: string;
  last_updated_at?: string;
}

export interface ApiAttendance {
  id: number;
  date: string; // yyyy-MM-dd
  status: "Present" | "Absent" | "Half-day";
  manual_overtime_hours: number;
  late_hours?: number; // Added late_hours field
  employee_id: number;
  user_id: number;
}

export interface ApiHoliday {
  id: number;
  date: string; // yyyy-MM-dd
  name: string;
  user_id: number;
}

export interface ApiSettings {
  id?: number;
  user_id?: number;
  standard_work_hours_per_day: number;
  currency?: string; // Added for currency
  company_name?: string; // Added for company name
  overtime_multiplier?: number; // Added for overtime multiplier
  mark_sundays_as_holiday?: boolean; // Added for marking Sundays as holiday
  company_logo_url?: string; // Added for company logo
}

// --------------------
// UI (Front-end) shapes
// --------------------
export interface UiEmployee {
  id: number;
  employee_id: string; // string for easy equality in UI
  name: string;
  base_salary: number;
  hire_date?: string; // yyyy-MM-dd
  status?: "active" | "inactive";
  bank_account?: string; // Renamed from email
  position?: string;
  department?: string;
  last_updated_at?: string;
}

export interface UiAttendance {
  id: number;
  date: string; // yyyy-MM-dd
  status: "present" | "absent" | "half_day";
  overtime_hours: number; // maps to manual_overtime_hours
  late_hours: number; // Added late_hours field
  employee_id: string; // keep as string to match UiEmployee.employee_id
}

export interface UiHoliday {
  id: number;
  date: string;
  name: string;
}

export interface UiCompanySettings {
  // UI-facing fields (some are client-only)
  company_name?: string;
  currency?: string; // client-only
  overtime_multiplier?: number; // overtime multiplier should not be client-only anymore
  mark_sundays_as_holiday?: boolean; // Added for marking Sundays as holiday
  company_logo_url?: string; // Added for company logo
  standard_work_hours: number;
  // keep raw server payload if needed
  __server?: ApiSettings;
}

// --------------------
// Mapping helpers
// --------------------
const statusToApi: Record<UiAttendance["status"], ApiAttendance["status"]> = {
  present: "Present",
  absent: "Absent",
  half_day: "Half-day",
};

const statusFromApi: Record<ApiAttendance["status"], UiAttendance["status"]> = {
  Present: "present",
  Absent: "absent",
  "Half-day": "half_day",
};

function toUiEmployee(e: ApiEmployee): UiEmployee {
  console.log("toUiEmployee: Received ApiEmployee:", e);
  console.log(`toUiEmployee: monthly_salary=${e.monthly_salary}, date_of_joining=${e.date_of_joining}`);
  return {
    id: e.id,
    employee_id: String(e.id),
    name: e.name,
    base_salary: e.monthly_salary ?? 0,
    hire_date: e.date_of_joining,
    status: (e.status as any) || "active",
    bank_account: e.bank_account, // Corrected from email
    position: e.position,
    department: e.department,
    last_updated_at: e.last_updated_at,
  };
}

function toApiEmployee(e: Partial<UiEmployee>): Partial<ApiEmployee> {
  console.log("toApiEmployee: Received UiEmployee:", e);
  const monthly_salary_val = e.base_salary ? Number(e.base_salary) : undefined;
  const date_of_joining_val = e.hire_date || undefined;
  console.log(`toApiEmployee: Processing base_salary=${e.base_salary}, parsed_monthly_salary=${monthly_salary_val}`);
  console.log(`toApiEmployee: Processing hire_date=${e.hire_date}, parsed_date_of_joining=${date_of_joining_val}`);
  return {
    name: e.name ?? "",
    monthly_salary: monthly_salary_val,
    date_of_joining: date_of_joining_val,
    bank_account: e.bank_account || undefined,
    position: e.position,
    department: e.department,
    status: e.status,
    salary_effective_from: (e as any).salary_effective_from,
  };
}

function toUiAttendance(a: ApiAttendance): UiAttendance {
  return {
    id: a.id,
    date: a.date,
    status: statusFromApi[a.status],
    overtime_hours: a.manual_overtime_hours ?? 0,
    late_hours: a.late_hours ?? 0,
    employee_id: String(a.employee_id),
  };
}

function toApiAttendance(a: Partial<UiAttendance>): Partial<ApiAttendance> {
  return {
    date: a.date!,
    status: a.status ? statusToApi[a.status] : "Absent",
    manual_overtime_hours: Number(a.overtime_hours ?? 0),
    late_hours: Number(a.late_hours ?? 0), // Include late_hours from UI
    employee_id: a.employee_id != null ? Number(a.employee_id) : undefined,
  };
}

function toUiHoliday(h: ApiHoliday): UiHoliday {
  return { id: h.id, date: h.date, name: h.name };
}

function toUiSettings(s: ApiSettings): UiCompanySettings {
  return {
    company_name: s.company_name ?? "", // Get company name from server or use empty string
    currency: s.currency ?? "INR", // Get currency from server or use default
    overtime_multiplier: s.overtime_multiplier ?? 1.5, // Get overtime multiplier from server or use default
    mark_sundays_as_holiday: s.mark_sundays_as_holiday ?? false, // Get mark_sundays_as_holiday from server or use default
    company_logo_url: s.company_logo_url, // Get company logo URL from server
    standard_work_hours: s.standard_work_hours_per_day ?? 8,
    __server: s,
  };
}

function toApiSettings(ui: Partial<UiCompanySettings>): ApiSettings {
  const hours = Number(ui.standard_work_hours ?? 8);
  return {
    standard_work_hours_per_day: hours,
    currency: ui.currency,
    company_name: ui.company_name, // Include company name from UI
    overtime_multiplier: ui.overtime_multiplier, // Include overtime multiplier from UI
    mark_sundays_as_holiday: ui.mark_sundays_as_holiday, // Include mark_sundays_as_holiday from UI
    company_logo_url: ui.company_logo_url, // Include company logo URL from UI
  };
}

// ---------------------------------
// Entities API exposed to the pages
// ---------------------------------

// Employees
export const Employees = {
  async list(sort?: string): Promise<UiEmployee[]> {
    const list: ApiEmployee[] = await employeesApi.getAll();
    const mapped = list.map(toUiEmployee);
    if (sort === "-created_date") return mapped; // no created_at in API; return as-is
    return mapped;
  },
  async create(data: UiEmployee): Promise<UiEmployee> {
    const payload = toApiEmployee(data);
    const created: ApiEmployee = await employeesApi.create(payload);
    return toUiEmployee(created);
  },
  async update(id: number, updates: Partial<UiEmployee>): Promise<UiEmployee> {
    const payload = toApiEmployee(updates);
    const saved: ApiEmployee = await employeesApi.update(id, payload);
    return toUiEmployee(saved);
  },
  async delete(id: number): Promise<{ ok: boolean }> {
    console.log("Entities.Employees.delete received ID:", id);
    return employeesApi.delete(id);
  },
};

// Attendance
export const Attendances = {
  async list(limit?: number): Promise<UiAttendance[]> {
    const apiList: ApiAttendance[] = await attendanceApi.list({});
    const mapped = apiList.map(toUiAttendance);
    return typeof limit === "number" ? mapped.slice(0, limit) : mapped;
  },
  async filter(filters: any): Promise<UiAttendance[]> {
    // Expect filters: { date: { $gte, $lte }, employee_id? (string) }
    const date = filters?.date || {};
    const params: any = {};
    if (date.$gte) params.start = date.$gte;
    if (date.$lte) params.end = date.$lte;
    if (filters?.employee_id) params.employee_id = Number(filters.employee_id);
    const apiList: ApiAttendance[] = await attendanceApi.list(params);
    return apiList.map(toUiAttendance);
  },
  async create(record: UiAttendance): Promise<UiAttendance> {
    // console.log("Entities.Attendances.create received record:", record);
    const payload = toApiAttendance(record);
    const saved: ApiAttendance = await attendanceApi.create(payload);
    return toUiAttendance(saved);
  },
  async update(id: number, updates: Partial<UiAttendance>): Promise<UiAttendance> {
    // console.log(`Entities.Attendances.update received for id ${id} with updates:`, updates);
    // Server uses POST /attendance as upsert; include date/employee_id/status as needed
    const payload = toApiAttendance(updates);
    const saved: ApiAttendance = await attendanceApi.create(payload);
    return toUiAttendance(saved);
  },
};

// Holidays
export const Holidays = {
  async list(sort?: string): Promise<UiHoliday[]> {
    const list: ApiHoliday[] = await settingsApi.listHolidays();
    const mapped = list.map(toUiHoliday);
    if (sort === "-date") return [...mapped].sort((a, b) => (a.date < b.date ? 1 : -1));
    return mapped;
  },
  async create(payload: { name: string; date: string }): Promise<UiHoliday> {
    const h: ApiHoliday = await settingsApi.addHoliday(payload);
    return toUiHoliday(h);
  },
  async delete(id: number): Promise<{ ok: boolean }> {
    return settingsApi.deleteHoliday(id);
  },
};

// Company Settings
export const CompanySettings = {
  async list(): Promise<UiCompanySettings[]> {
    const s: ApiSettings | null = await settingsApi.get();
    if (!s) return [];
    return [toUiSettings(s)];
  },
  async create(payload: UiCompanySettings): Promise<ApiSettings> {
    const body = toApiSettings(payload);
    return settingsApi.update(body);
  },
  async update(_id: number, payload: UiCompanySettings): Promise<ApiSettings> {
    const body = toApiSettings(payload);
    return settingsApi.update(body);
  },
};

// Auth passthrough
export const Auth = {
  signIn: authApi.signIn,
  signUp: authApi.signUp,
  forgotPassword: authApi.forgotPassword,
  resetPassword: authApi.resetPassword,
};

// --------------------
// Re-exports (optional)
// --------------------
// Export UI types explicitly so consumers can `import type` safely
export type {
  UiEmployee as Employee,
  UiAttendance as Attendance,
  UiHoliday as Holiday,
  UiCompanySettings as CompanySettingsType,
};

export const Reports = {
  async getSalaryReport(month: string) {
    return reportsApi.getSalaryReport(month);
  },
  exportCSV: reportsApi.exportCSV,
};
