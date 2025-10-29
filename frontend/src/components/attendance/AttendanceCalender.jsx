// src/components/attendance/AttendanceCalendar.jsx
import React from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isSameMonth } from "date-fns";

export default function AttendanceCalendar({
  currentMonth,
  selectedDate,
  onDateSelect,
  holidays,
  attendance,
  employees,
  selectedEmployee
}) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startingDay = getDay(monthStart);

  const getDayAnalytics = (day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    if (employees.length === 0) return { present: 0, total: 0, isIndividual: !!selectedEmployee };
    if (selectedEmployee) {
      const empAttendance = attendance.find(a => {
        const match = a.date === dateStr && String(a.employee_id) === String(selectedEmployee.id);
        return match;
      });
      return { status: empAttendance?.status || null, isIndividual: true };
    } else {
      const dayAttendance = attendance.filter(a => {
        const match = a.date === dateStr;
        return match;
      });
      const presentCount = dayAttendance.filter(a => a.status === "present" || a.status === "half_day").length; // Changed to lowercase
      return { present: presentCount, total: employees.length, isIndividual: false };
    }
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "present": return "bg-emerald-500"; // Changed to lowercase
      case "half_day": return "bg-amber-500"; // Changed to lowercase
      case "absent": return "bg-red-500"; // Changed to lowercase
      default: return "bg-slate-200";
    }
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 gap-2 text-center text-xs text-slate-600 mb-2">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: startingDay }).map((_, i) => <div key={`pad-${i}`} />)}
        {days.map((day) => {
          const analytics = getDayAnalytics(day);
          const isSelected = isSameDay(day, selectedDate);
          const statusColor = analytics.isIndividual && analytics.status ? getStatusColor(analytics.status) : null;
          return (
            <button
              key={day.toISOString()}
              className={`h-16 rounded border flex flex-col items-center justify-center ${!isSameMonth(day, monthStart) ? "opacity-40" : ""} ${isSelected ? "ring-2 ring-amber-400" : ""}`}
              onClick={() => onDateSelect(day)}
            >
              <div className="text-sm">{format(day, "d")}</div>
              {analytics.isIndividual ? (
                <div className={`mt-1 w-2 h-2 rounded-full ${statusColor || "bg-slate-200"}`} />
              ) : (
                <div className="mt-1 text-xs">
                  {analytics.present}/{analytics.total}
                </div>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-3 text-xs text-slate-600 flex gap-3 items-center">
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Present</span>
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Half-day</span>
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Absent</span>
      </div>
    </div>
  );
}
