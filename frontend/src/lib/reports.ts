import { attendanceService, type AttendanceRecord } from "./attendance"
import { authService } from "./auth"
import { Employees } from "entities/all"
import { api } from "api/client"; // Import api

// const REPORTS_API_BASE_URL = "http://localhost:8000/api/v1/reports" // Removed as not directly used with api.get

export interface ReportFilter {
  startDate: string
  endDate: string
  employeeIds?: string[]
  departments?: string[]
  status?: AttendanceRecord["status"][]
}

export interface AttendanceSummary {
  employeeId: string
  employeeName: string
  department: string
  totalDays: number
  presentDays: number
  absentDays: number
  lateDays: number
  halfDays: number
  totalHours: number
  averageHours: number
  attendanceRate: number
}

export interface DailyReport {
  date: string
  totalEmployees: number
  present: number
  absent: number
  late: number
  attendanceRate: number
  records: AttendanceRecord[]
}

export interface LateArrivalReport {
  employeeId: string
  employeeName: string
  department: string
  date: string
  checkInTime: string
  minutesLate: number
}

export const reportsService = {
  // Generate attendance summary report
  async generateAttendanceSummary(filter: ReportFilter): Promise<AttendanceSummary[]> {
    const params = new URLSearchParams({
      start_date: filter.startDate,
      end_date: filter.endDate,
    });
    if (filter.employeeIds && filter.employeeIds.length > 0) {
      filter.employeeIds.forEach((id) => params.append("employee_ids", id));
    }
    if (filter.departments && filter.departments.length > 0) {
      filter.departments.forEach((dept) => params.append("departments", dept));
    }
    if (filter.status && filter.status.length > 0) {
      filter.status.forEach((s) => params.append("status", s));
    }

    try {
      const response = await api.get(`/reports/attendance_summary?${params.toString()}`);

      // Removed if (!response.ok) check as axios handles errors via catch block
      const summary: AttendanceSummary[] = response.data;
      return summary;
    } catch (error) {
      console.error("Network error while generating attendance summary:", error);
      return [];
    }
  },

  // Generate daily reports
  async generateDailyReports(filter: ReportFilter): Promise<DailyReport[]> {
    const params = new URLSearchParams({
      start_date: filter.startDate,
      end_date: filter.endDate,
    });
    if (filter.employeeIds && filter.employeeIds.length > 0) {
      filter.employeeIds.forEach((id) => params.append("employee_ids", id));
    }
    if (filter.departments && filter.departments.length > 0) {
      filter.departments.forEach((dept) => params.append("departments", dept));
    }

    try {
      const response = await api.get(`/reports/daily_summary?${params.toString()}`);

      // Removed if (!response.ok) check
      const dailyReports: DailyReport[] = response.data;
      return dailyReports;
    } catch (error) {
      console.error("Network error while generating daily reports:", error);
      return [];
    }
  },

  // Generate late arrival report
  async generateLateArrivalReport(filter: ReportFilter): Promise<LateArrivalReport[]> {
    const params = new URLSearchParams({
      start_date: filter.startDate,
      end_date: filter.endDate,
    });
    if (filter.employeeIds && filter.employeeIds.length > 0) {
      filter.employeeIds.forEach((id) => params.append("employee_ids", id));
    }
    if (filter.departments && filter.departments.length > 0) {
      filter.departments.forEach((dept) => params.append("departments", dept));
    }

    try {
      const response = await api.get(`/reports/late_arrivals?${params.toString()}`);

      // Removed if (!response.ok) check
      const lateArrivals: LateArrivalReport[] = response.data;
      return lateArrivals;
    } catch (error) {
      console.error("Network error while generating late arrival report:", error);
      return [];
    }
  },

  // Export to CSV
  exportToCSV(data: any[], filename: string): void {
    if (data.length === 0) return

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header]
            // Escape commas and quotes in CSV
            if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value
          })
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${filename}-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  },

  // Get available departments for filtering
  async getAvailableDepartments(): Promise<string[]> {
    const employees = await Employees.list();
    const departments = new Set<string>();
    employees.forEach(emp => {
      if (emp.department) {
        departments.add(emp.department);
      }
    });
    return Array.from(departments);
  },

  // Get date range suggestions
  getDateRangePresets(): Array<{ label: string; startDate: string; endDate: string }> {
    const today = new Date()
    const thisWeekStart = new Date(today)
    thisWeekStart.setDate(today.getDate() - today.getDay())
    const thisWeekEnd = new Date(thisWeekStart)
    thisWeekEnd.setDate(thisWeekStart.getDate() + 6)

    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)

    return [
      {
        label: "Today",
        startDate: today.toISOString().split("T")[0],
        endDate: today.toISOString().split("T")[0],
      },
      {
        label: "This Week",
        startDate: thisWeekStart.toISOString().split("T")[0],
        endDate: thisWeekEnd.toISOString().split("T")[0],
      },
      {
        label: "This Month",
        startDate: thisMonthStart.toISOString().split("T")[0],
        endDate: thisMonthEnd.toISOString().split("T")[0],
      },
      {
        label: "Last Month",
        startDate: lastMonthStart.toISOString().split("T")[0],
        endDate: lastMonthEnd.toISOString().split("T")[0],
      },
    ]
  },
};
