import { api } from "api/client"; // Import api

export interface CompanySettings {
  name: string
  address: string
  phone: string
  email: string
  website: string
  workingHours: {
    start: string // HH:MM format
    end: string // HH:MM format
  }
  workingDays: string[] // ['monday', 'tuesday', etc.]
  timeZone: string
  dateFormat: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD"
  currency: string
  company_logo_url?: string; // Add optional company_logo_url
}

export interface AttendancePolicy {
  lateThresholdMinutes: number
  halfDayThresholdHours: number
  overtimeThresholdHours: number
  breakDurationMinutes: number
  allowEarlyCheckout: boolean
  requireCheckoutConfirmation: boolean
  autoMarkAbsent: boolean
  autoMarkAbsentTime: string // HH:MM format
}

export interface NotificationSettings {
  emailNotifications: boolean
  lateArrivalAlerts: boolean
  absenteeAlerts: boolean
  overtimeAlerts: boolean
  weeklyReports: boolean
  monthlyReports: boolean
}

export interface ChartSettings {
  attendanceOverview: {
    enabled: boolean
    interval: "daily" | "weekly" | "monthly"
  }
  employeeAttendance: {
    enabled: boolean
    interval: "daily" | "weekly" | "monthly"
  }
  attendanceChart: {
    enabled: boolean
    interval: "daily" | "weekly" | "monthly"
  }
  recentActivity: {
    enabled: boolean
    maxItems: number
  }
}

export interface SystemSettings {
  generalSettings: {
    workingHours: {
      start: string // HH:MM format
      end: string // HH:MM format
    }
    workingDays: string[] // ['monday', 'tuesday', etc.]
    timeZone: string
    dateFormat: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD"
    currency: string
  }
  chartSettings: ChartSettings
}

const SETTINGS_STORAGE_KEY = "attendance_tracker_settings"
const SETTINGS_API_BASE_URL = "/settings"; // Use relative path since api has baseURL

export const settingsService = {
  // Get current settings
  async getSettings(): Promise<any | null> {
    try {
      const response = await api.get(`${SETTINGS_API_BASE_URL}/company`);
      return response.data;
    } catch (error) {
      console.error("Network error while fetching settings:", error);
      return null;
    }
  },

  // Update settings
  async updateSettings(updates: Partial<SystemSettings>): Promise<any | null> {
    try {
      const response = await api.put(`${SETTINGS_API_BASE_URL}/company`, updates); // Using PUT for updates
      return response.data;
    } catch (error) {
      console.error("Network error while updating settings:", error);
      return null;
    }
  },

  // Update company settings
  async updateCompanySettings(companySettings: CompanySettings): Promise<any | null> {
    return this.updateSettings({ generalSettings: companySettings } as Partial<SystemSettings>);
  },

  // Update attendance policy
  async updateAttendancePolicy(attendancePolicy: AttendancePolicy): Promise<any | null> {
    // Assuming attendancePolicy is part of SystemSettings
    return this.updateSettings({ attendancePolicy } as Partial<SystemSettings>);
  },

  // Update notification settings
  async updateNotificationSettings(notificationSettings: NotificationSettings): Promise<any | null> {
    // Assuming notificationSettings is part of SystemSettings
    return this.updateSettings({ notificationSettings } as Partial<SystemSettings>);
  },

  // Update general settings
  async updateGeneralSettings(generalSettings: SystemSettings["generalSettings"]): Promise<any | null> {
    return this.updateSettings({ generalSettings } as Partial<SystemSettings>);
  },

  // Update chart settings
  async updateChartSettings(chartSettings: ChartSettings): Promise<any | null> {
    return this.updateSettings({ chartSettings } as Partial<SystemSettings>);
  },

  async uploadCompanyLogo(formData: FormData): Promise<any> {
    try {
      const response = await api.post(`${SETTINGS_API_BASE_URL}/company/logo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error uploading company logo:", error);
      throw error; // Re-throw to be caught by the component
    }
  },

  // Get default settings - no longer fetched from frontend
  getDefaultSettings(): SystemSettings {
    return {} as SystemSettings; // Return empty or default structure if needed for type safety
  },

  // Export settings
  exportSettings(): string {
    // This method needs to be reconsidered if settings are always fetched from backend
    console.warn("Export settings functionality might need re-evaluation with new API structure.");
    return JSON.stringify(this.getSettings(), null, 2);
  },

  // Import settings
  async importSettings(settingsJson: string): Promise<any | null> {
    try {
      const importedSettings = JSON.parse(settingsJson);
      return await this.updateSettings(importedSettings);
    } catch (error) {
      throw new Error("Invalid settings format");
    }
  },

  // Reset to defaults
  async resetToDefaults(): Promise<any | null> {
    // In a real app, this would involve a backend API call to reset settings to defaults
    console.warn("Resetting to defaults is not yet fully implemented via backend API.");
    return null;
  },
};
