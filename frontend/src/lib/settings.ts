// src/services/settings.ts
import { settings as settingsApi } from "../api/client"; // Import the settings API object from your client
import { api } from "../api/client"; // Import the main API instance

// 1. Define a simplified interface that matches your backend model
export interface CompanySettings {
  company_name: string;
  standard_work_hours_per_day: number;
  currency: string;
  overtime_multiplier: number;
  mark_sundays_as_holiday: boolean;
  company_logo_url?: string;
}

// 2. Create a clean service object with just the functions you need
export const settingsService = {
  /**
   * Fetches the current company settings from the backend.
   */
  async getSettings(): Promise<CompanySettings | null> {
    try {
      // Use the GET function from your api/client.ts
      const data = await settingsApi.get();
      return data;
    } catch (error) {
      console.error("Error fetching settings:", error);
      // The error is already handled by the toast in client.ts,
      // but you can add further component-level handling if needed.
      return null;
    }
  },

  /**
   * Updates the company settings. This single function handles both
   * text data and the optional logo file upload.
   * @param updates - An object containing the settings fields.
   * @param logoFile - An optional File object for the new company logo.
   */
  async updateSettings(updates: CompanySettings, logoFile?: File): Promise<CompanySettings | null> {
    try {
      // Use the updated UPDATE function from your api/client.ts,
      // which now correctly sends multipart/form-data.
      const data = await settingsApi.update(updates, logoFile);
      return data;
    } catch (error) {
      console.error("Error updating settings:", error);
      return null;
    }
  },

  async listHolidays(): Promise<any[]> {
    const res = await api.get("/settings/holidays");
    return Array.isArray(res.data) ? res.data : [];
  },

  async addHoliday(holiday: { name: string; date: string }, overridePastAttendance: boolean): Promise<any> {
    const formData = new FormData();
    formData.append("name", holiday.name);
    formData.append("date", holiday.date);
    formData.append("override_past_attendance", String(overridePastAttendance));

    const res = await api.post("/settings/holidays", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  async deleteHoliday(id: number, revertAttendance: boolean): Promise<{ ok: boolean }> {
    const res = await api.delete(`/settings/holidays/${id}`, { params: { revert_attendance: revertAttendance } });
    const ok = typeof (res.data as any)?.ok === "boolean" ? (res.data as any).ok : true;
    return { ok };
  },
};


