import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { motion } from "framer-motion";

export default function AttendanceChart({ attendanceData, employees, theme }) {
  const generateWeeklyData = () => {
    const today = new Date();
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return weekDays.map(day => {
      const dateStr = format(day, "yyyy-MM-dd");
      const dayAttendance = attendanceData.filter(a => a.date === dateStr);
      
      const present = dayAttendance.filter(a => a.status === "present").length;
      const halfDay = dayAttendance.filter(a => a.status === "half_day").length;
      const absent = dayAttendance.filter(a => a.status === "absent").length;

      return {
        day: format(day, "EEE"),
        date: format(day, "MMM d"),
        present,
        halfDay,
        absent,
        total: present + halfDay + absent,
        percentage: employees.length > 0 ? Math.round(((present + halfDay * 0.5) / employees.length) * 100) : 0
      };
    });
  };

  const data = generateWeeklyData();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200 dark:bg-gray-700 dark:border-gray-600">
          <p className="font-semibold text-slate-800 dark:text-white">{`${label} (${data.date})`}</p>
          <div className="space-y-1 mt-2">
            <p className="text-emerald-600">Present: {data.present}</p>
            <p className="text-amber-600">Half Day: {data.halfDay}</p>
            <p className="text-red-600">Absent: {data.absent}</p>
            <p className="font-medium text-slate-700 dark:text-gray-200">Attendance: {data.percentage}%</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 dark:bg-gray-800 dark:border-gray-700"
    >
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Weekly Attendance Overview</h3>
        <p className="text-slate-600 text-sm dark:text-gray-300">Current week attendance trends</p>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "#4a5568" : "#e2e8f0"} />
            <XAxis 
              dataKey="day" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: theme === 'dark' ? '#a0aec0' : '#64748b', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: theme === 'dark' ? '#a0aec0' : '#64748b', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="present" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
            <Bar dataKey="halfDay" stackId="a" fill="#f59e0b" />
            <Bar dataKey="absent" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}