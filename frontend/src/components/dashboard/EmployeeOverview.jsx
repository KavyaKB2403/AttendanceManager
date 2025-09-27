import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";

export default function EmployeeOverview({ employees, attendanceData }) {
  const calculateEmployeeStats = () => {
    const thisMonth = format(new Date(), "yyyy-MM");
    const monthAttendance = attendanceData.filter(a => a.date.startsWith(thisMonth));
    
    return employees.map(employee => {
      const empAttendance = monthAttendance.filter(a => a.employee_id === employee.employee_id);
      const presentDays = empAttendance.filter(a => a.status === "present").length;
      const halfDays = empAttendance.filter(a => a.status === "half_day").length;
      const totalDays = empAttendance.length;
      
      const attendanceRate = totalDays > 0 ? ((presentDays + halfDays * 0.5) / totalDays) * 100 : 0;
      
      return {
        ...employee,
        attendanceRate: Math.round(attendanceRate),
        presentDays,
        totalDays
      };
    }).sort((a, b) => b.attendanceRate - a.attendanceRate);
  };

  const employeeStats = calculateEmployeeStats();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 dark:bg-gray-800 dark:border-gray-700"
    >
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Employee Performance</h3>
        <p className="text-slate-600 text-sm dark:text-gray-300">Monthly attendance rankings</p>
      </div>
      
      <div className="space-y-4 max-h-80 overflow-y-auto">
        {employeeStats.slice(0, 5).map((employee, index) => (
          <motion.div
            key={employee.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                index === 0 ? "bg-gradient-to-r from-yellow-400 to-orange-500" :
                index === 1 ? "bg-gradient-to-r from-gray-400 to-gray-500" :
                index === 2 ? "bg-gradient-to-r from-orange-400 to-red-500" :
                "bg-gradient-to-r from-blue-400 to-blue-500"
              }`}>
                {index + 1}
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-white">{employee.name}</p>
                <p className="text-xs text-slate-500 dark:text-gray-400">{employee.position || "Employee"}</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${
                  employee.attendanceRate >= 90 ? "text-emerald-600" :
                  employee.attendanceRate >= 75 ? "text-amber-600" :
                  "text-red-600"
                }`}>
                  {employee.attendanceRate}%
                </span>
                {employee.attendanceRate >= 90 ? (
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                ) : employee.attendanceRate < 75 ? (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                ) : null}
              </div>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                {employee.presentDays}/{employee.totalDays} days
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}