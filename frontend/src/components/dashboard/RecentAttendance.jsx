import React from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function RecentAttendance({ attendanceData, employees }) {
  const recentAttendance = attendanceData.slice(0, 10);
  
  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp.employee_id === employeeId);
    return employee?.name || "Unknown Employee";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "present":
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case "absent":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "half_day":
        return <AlertCircle className="w-4 h-4 text-amber-600" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "present":
        return "bg-emerald-100 text-emerald-800";
      case "absent":
        return "bg-red-100 text-red-800";
      case "half_day":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 dark:bg-gray-800 dark:border-gray-700"
    >
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Recent Activity</h3>
        <p className="text-slate-600 text-sm dark:text-gray-300">Latest attendance records</p>
      </div>
      
      <div className="space-y-3">
        {recentAttendance.map((record, index) => (
          <motion.div
            key={record.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            <div className="flex items-center gap-3">
              {getStatusIcon(record.status)}
              <div>
                <p className="font-medium text-slate-800 dark:text-white">{getEmployeeName(record.employee_id)}</p>
                <p className="text-sm text-slate-500 dark:text-gray-400">
                  {format(new Date(record.date), "MMM d, yyyy")}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {record.overtime_hours > 0 && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full dark:bg-blue-800 dark:text-blue-100">
                  +{record.overtime_hours}h OT
                </span>
              )}
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                getStatusColor(record.status)} dark:${getStatusColor(record.status).replace('100', '800').replace('800', '100')}`}>
                {record.status.replace('_', ' ')}
              </span>
            </div>
          </motion.div>
        ))}
        
        {recentAttendance.length === 0 && (
          <div className="text-center py-8 text-slate-500 dark:text-gray-400">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50 dark:text-gray-500" />
            <p>No attendance records found</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}