export interface AttendanceRecord {
  id: string
  employeeId: string
  employeeName: string
  date: string // YYYY-MM-DD format
  checkIn?: string // ISO timestamp
  checkOut?: string // ISO timestamp
  status: "present" | "absent" | "late" | "half-day" | "holiday"
  hoursWorked?: number
  notes?: string
  markedBy?: string // User ID who marked the attendance
  createdAt: string
  updatedAt: string
}

export interface AttendanceStats {
  totalEmployees: number
  presentToday: number
  absentToday: number
  lateToday: number
  attendanceRate: number
  averageHours: number
}

const ATTENDANCE_STORAGE_KEY = "attendance_tracker_records"
const ATTENDANCE_API_BASE_URL = "http://localhost:8000/api/v1/attendance"

import { api } from "api/client"; // Import api
import { Employees } from "entities/all"

export const attendanceService = {
  // Get all attendance records
  async getAttendanceRecords(): Promise<AttendanceRecord[]> {
    try {
      const response = await api.get("/attendance/");
      const records: AttendanceRecord[] = response.data;
      return records;
    } catch (error) {
      console.error("Network error while fetching attendance records:", error);
      return [];
    }
  },

  // Get attendance records for a specific date
  async getAttendanceByDate(date: string): Promise<AttendanceRecord[]> {
    try {
      const response = await api.get(`/attendance/date/${date}`);
      const records: AttendanceRecord[] = response.data;
      return records;
    } catch (error) {
      console.error(`Network error while fetching attendance for date ${date}:`, error);
      return [];
    }
  },

  // Get attendance records for a specific employee
  async getAttendanceByEmployee(employeeId: string, startDate?: string, endDate?: string): Promise<AttendanceRecord[]> {
    let url = `/attendance/employee/${employeeId}`;
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (params.toString()) url += `?${params.toString()}`;

    try {
      const response = await api.get(url);
      const records: AttendanceRecord[] = response.data;
      return records;
    } catch (error) {
      console.error(`Network error while fetching attendance for employee ${employeeId}:`, error);
      return [];
    }
  },

  // Mark attendance for an employee (Create or Update)
  async markAttendance(
    employeeId: string,
    employeeName: string,
    date: string,
    status: AttendanceRecord["status"],
    checkIn?: string,
    checkOut?: string,
    notes?: string,
    markedBy?: string,
    id?: string // Optional ID for updating an existing record
  ): Promise<AttendanceRecord | null> {
    const payload = {
      employee_id: employeeId,
      employee_name: employeeName,
      date,
      status,
      check_in: checkIn,
      check_out: checkOut,
      notes,
      marked_by: markedBy,
      hours_worked: checkIn && checkOut ? this.calculateHours(checkIn, checkOut) : undefined,
    };

    try {
      let response;
      let url = "/attendance/"; // Use relative URL

      if (id) {
        // Update existing record
        url = `/attendance/${id}`;
        response = await api.put(url, payload);
      } else {
        // Create new record
        response = await api.post(url, payload);
      }
      const attendanceRecord: AttendanceRecord = response.data;
      return attendanceRecord;
    } catch (error) {
      console.error(`Network error while marking attendance ${id ? 'update' : 'create'}:`, error);
      return null;
    }
  },

  // Check in employee
  async checkIn(employeeId: string, employeeName: string, time?: string): Promise<AttendanceRecord | null> {
    const now = time || new Date().toISOString();
    const date = now.split("T")[0];
    const checkInTime = new Date(now);
    const workStartTime = new Date(date + "T09:00:00");

    // Determine if late (after 9:00 AM)
    const status = checkInTime > workStartTime ? "late" : "present";

    // Check if there's an existing record for today to update
    const existingRecords = await this.getAttendanceByEmployee(employeeId, date, date);
    const existingRecord = existingRecords.find(record => record.date === date);

    if (existingRecord) {
      // Update existing record with check-in time
      return this.markAttendance(
        employeeId,
        employeeName,
        date,
        status,
        now,
        existingRecord.checkOut,
        existingRecord.notes,
        existingRecord.markedBy,
        existingRecord.id,
      );
    } else {
      // Create new record
      return this.markAttendance(employeeId, employeeName, date, status, now, undefined, undefined, employeeId);
    }
  },

  // Check out employee
  async checkOut(employeeId: string, time?: string): Promise<AttendanceRecord | null> {
    const now = time || new Date().toISOString();
    const date = now.split("T")[0];

    const existingRecords = await this.getAttendanceByEmployee(employeeId, date, date);
    const existingRecord = existingRecords.find((r) => r.employeeId === employeeId && r.date === date);

    if (!existingRecord || !existingRecord.checkIn) {
      console.error("Cannot check out: no existing check-in record for today.");
      return null;
    }

    return this.markAttendance(
      employeeId,
      existingRecord.employeeName,
      date,
      existingRecord.status,
      existingRecord.checkIn,
      now,
      existingRecord.notes,
      existingRecord.markedBy,
      existingRecord.id,
    );
  },

  // Get today's attendance statistics
  async getTodayStats(): Promise<AttendanceStats> {
    const today = new Date().toISOString().split("T")[0];
    const todayRecords = await this.getAttendanceByDate(today);
    const allEmployees = await Employees.list();
    const activeEmployees = allEmployees.filter((emp: any) => emp.status === "active");
    const totalEmployees = activeEmployees.length;

    const presentToday = todayRecords.filter((r) => r.status === "present" || r.status === "late").length;
    const absentToday = totalEmployees - presentToday; // Assuming any active employee not present is absent
    const lateToday = todayRecords.filter((r) => r.status === "late").length;

    const attendanceRate = totalEmployees > 0 ? (presentToday / totalEmployees) * 100 : 0;

    // Calculate average hours for today
    const recordsWithHours = todayRecords.filter((r) => r.hoursWorked !== undefined);
    const averageHours =
      recordsWithHours.length > 0
        ? recordsWithHours.reduce((sum, r) => sum + (r.hoursWorked || 0), 0) / recordsWithHours.length
        : 0;

    return {
      totalEmployees,
      presentToday,
      absentToday,
      lateToday,
      attendanceRate,
      averageHours,
    };
  },

  // Get weekly attendance data for charts
  async getWeeklyAttendanceData(): Promise<Array<{ day: string; present: number; absent: number }>> {
    try {
      const response = await api.get("/attendance/weekly_summary");
      const weeklyData: Array<{ day: string; present: number; absent: number }> = response.data;
      return weeklyData;
    } catch (error) {
      console.error("Network error while fetching weekly attendance data:", error);
      return [];
    }
  },

  // Calculate hours worked between check-in and check-out
  calculateHours(checkIn: string, checkOut: string): number {
    const checkInTime = new Date(checkIn);
    const checkOutTime = new Date(checkOut);
    const diffMs = checkOutTime.getTime() - checkInTime.getTime();
    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places
  },

  // Get recent activity for dashboard
  async getRecentActivity(limit = 5): Promise<Array<{
    id: string
    employee: string
    action: string
    time: string
    status: "present" | "absent" | "late"
  }>> {
    try {
      const response = await api.get(`/attendance/recent_activity?limit=${limit}`);
      const recentActivity: Array<{
        id: string
        employee: string
        action: string
        time: string
        status: "present" | "absent" | "late"
      }> = response.data;
      return recentActivity.map(item => ({
        ...item,
        // Adjust action string if necessary to match original frontend logic
        action: item.action === "present" ? "Checked in" : `Marked ${item.status}`,
        time: new Date(item.time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
      }));
    } catch (error) {
      console.error("Network error while fetching recent attendance activity:", error);
      return [];
    }
  },

  // Generate sample attendance records - no longer needed as data is from backend
  getSampleAttendanceRecords(): AttendanceRecord[] {
    return [];
  },
};
