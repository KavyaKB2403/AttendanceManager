import React, { useState, useEffect, useCallback } from "react";
import type { Employee, Attendance, CompanySettingsType } from "../entities/all";
import { Employees, Attendances, CompanySettings } from "../entities/all"; // Import the entities with mapping logic
import { format } from "date-fns";
import { TrendingUp, TrendingDown, Users, Calendar, Clock, Eye, EyeOff, IndianRupee } from "lucide-react";
import { motion } from "framer-motion";
import { Switch } from "components/ui/switch";
import { Label } from "components/ui/label";

import StatsCard from "components/dashboard/StatsCard.jsx";
import AttendanceChart from "components/dashboard/AttendanceChart";
import RecentAttendance from "components/dashboard/RecentAttendance.jsx";
import EmployeeOverview from "components/dashboard/EmployeeOverview";

interface DashboardProps {
  onSignOut: () => void;
  theme: 'light' | 'dark';
}
export default function Dashboard({ onSignOut, theme }: DashboardProps) {
  // ✅ renamed state variables to avoid collision with API clients
  const [employeeList, setEmployeeList] = useState<Employee[]>([]);
  const [attendanceList, setAttendanceList] = useState<Attendance[]>([]);
  const [settingsData, setSettingsData] = useState<CompanySettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartToggles, setChartToggles] = useState({
    showAttendanceChart: true,
    showEmployeeOverview: true,
    showRecentActivity: true,
  });
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    attendanceRate: 0,
    averageSalary: 0,
  });

  const loadDashboardData = useCallback(async () => {
    try {
      const [employeesFetched, attendanceFetched, settingsFetched] = await Promise.all([
        Employees.list(),
        Attendances.list(), // Fixed: use .list() instead of .getMonth()
        CompanySettings.list(),
      ]);

      setEmployeeList(employeesFetched);
      setAttendanceList(attendanceFetched);
      setSettingsData(
        settingsFetched[0] || { // Access the first item as CompanySettings.list returns an array
          standard_work_hours: 8,
          currency: "INR",
        }
      );

      calculateStats(employeesFetched, attendanceFetched);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const calculateStats = (employeesFetched: Employee[], attendanceFetched: Attendance[]) => {
    const today = format(new Date(), "yyyy-MM-dd");
    const todayAttendance = attendanceFetched.filter((a) => a.date === today);
    const presentToday = todayAttendance.filter(
      (a) => a.status === "present" || a.status === "half_day"
    ).length;

    const thisMonth = format(new Date(), "yyyy-MM");
    const monthAttendance = attendanceFetched.filter((a) => a.date.startsWith(thisMonth));
    const totalWorkingDays = employeesFetched.length > 0 ? monthAttendance.length / employeesFetched.length : 1;
    const presentDays = monthAttendance.filter(
      (a) => a.status === "present" || a.status === "half_day"
    ).length;
    const attendanceRate =
      totalWorkingDays > 0 ? (presentDays / (employeesFetched.length * totalWorkingDays)) * 100 : 0;

    const averageSalary =
      employeesFetched.reduce((sum, emp) => sum + (emp.base_salary || 0), 0) /
      (employeesFetched.length || 1);

    const finalStats = {
      totalEmployees: employeesFetched.length,
      presentToday,
      attendanceRate: Math.round(attendanceRate),
      averageSalary: Math.round(averageSalary),
    };
    setStats(finalStats);
  };

  const handleToggleChart = (chartName: string, enabled: boolean) => {
    setChartToggles((prev) => ({
      ...prev,
      [chartName]: enabled,
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-slate-200 rounded w-1/2 mb-4"></div>
              <div className="h-3 bg-slate-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Dashboard Overview</h1>
          <p className="text-slate-600 mt-1">Monitor your team's attendance and performance</p>
        </div>
        <div className="text-sm text-slate-500">
          Last updated: {format(new Date(), "MMM d, yyyy 'at' h:mm a")}
        </div>
      </motion.div>

      {/* Chart Toggle Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 dark:bg-gray-800 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2 dark:text-white">
          <Eye className="w-5 h-5" />
          Chart Display Options
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="attendance-chart" className="text-sm font-medium text-slate-700 dark:text-gray-300">
              Weekly Attendance Chart
            </Label>
            <Switch
              id="attendance-chart"
              checked={chartToggles.showAttendanceChart}
              onCheckedChange={(checked) => handleToggleChart("showAttendanceChart", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="employee-overview" className="text-sm font-medium text-slate-700 dark:text-gray-300">
              Employee Performance
            </Label>
            <Switch
              id="employee-overview"
              checked={chartToggles.showEmployeeOverview}
              onCheckedChange={(checked) => handleToggleChart("showEmployeeOverview", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="recent-activity" className="text-sm font-medium text-slate-700 dark:text-gray-300">
              Recent Activity
            </Label>
            <Switch
              id="recent-activity"
              checked={chartToggles.showRecentActivity}
              onCheckedChange={(checked) => handleToggleChart("showRecentActivity", checked)}
            />
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Employees"
          value={stats.totalEmployees}
          icon={Users}
          color="blue"
          trend={`${stats.totalEmployees > 0 ? "+" : ""}${stats.totalEmployees}`}
        />
        <StatsCard
          title="Present Today"
          value={stats.presentToday}
          icon={Calendar}
          color="green"
          trend={`${Math.round((stats.presentToday / stats.totalEmployees) * 100) || 0}% of team`}
        />
        <StatsCard
          title="Attendance Rate"
          value={`${stats.attendanceRate}%`}
          icon={Clock}
          color="purple"
          trend={stats.attendanceRate > 85 ? "Excellent" : "Needs improvement"}
          trendIcon={stats.attendanceRate > 85 ? TrendingUp : TrendingDown}
        />
        <StatsCard
          title="Average Salary"
          value={`${settingsData?.currency || "₹"}${stats.averageSalary.toLocaleString()}`}
          icon={IndianRupee}
          color="orange"
          trend="Monthly"
        />
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {chartToggles.showAttendanceChart && (
          <AttendanceChart attendanceData={attendanceList} employees={employeeList} theme={theme} />
        )}
        {chartToggles.showEmployeeOverview && (
          <EmployeeOverview employees={employeeList} attendanceData={attendanceList} />
        )}
      </div>

      {/* Recent Activity */}
      {chartToggles.showRecentActivity && (
        <RecentAttendance attendanceData={attendanceList} employees={employeeList} />
      )}

      {/* Info when all charts are hidden */}
      {!chartToggles.showAttendanceChart &&
        !chartToggles.showEmployeeOverview &&
        !chartToggles.showRecentActivity && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-100 rounded-2xl p-12 text-center"
          >
            <EyeOff className="w-16 h-16 mx-auto mb-4 text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">All Charts Hidden</h3>
            <p className="text-slate-500">Enable chart display options above to view analytics</p>
          </motion.div>
        )}
    </div>
  );
}
