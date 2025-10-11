import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "components/ui/table";
import { motion } from "framer-motion";

export default function SalaryReportTable({ data, loading, currency, theme }) {
  if (loading) {
    return <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-pulse dark:bg-gray-800 dark:border-gray-700">
      {[...Array(5)].map(i => <div key={i} className="h-10 bg-slate-200 rounded my-2 dark:bg-gray-700"></div>)}
    </div>
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden dark:bg-gray-800 dark:border-gray-700"
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-gray-800">
              <TableHead className="font-semibold text-slate-700 dark:text-gray-200 dark:bg-gray-900">Employee</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-gray-200 dark:bg-gray-900">Base Monthly Salary</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-gray-200 dark:bg-gray-900">Hourly Rate</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-gray-200 dark:bg-gray-900">Work Days</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-gray-200 dark:bg-gray-900">Paid Holidays</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-gray-200 dark:bg-gray-900">Total Paid Days</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-gray-200 dark:bg-gray-900">Regular Hours</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-gray-200 dark:bg-gray-900">Overtime</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-gray-200 dark:bg-gray-900">Late Hours</TableHead>
              <TableHead className="text-right font-bold text-blue-600 dark:text-blue-400 dark:bg-gray-900">Total Payable Salary</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="dark:text-gray-300">
            {data.map((row, index) => {
              return (
              <motion.tr
                key={row.employee_id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="dark:border-gray-700 dark:hover:bg-gray-700"
              >
                <TableCell className="font-medium text-slate-800 dark:text-white">{row.name}</TableCell>
                <TableCell>{currency}{row.base_monthly_salary.toLocaleString()}</TableCell>
                <TableCell>{currency}{row.hourly_rate.toFixed(2)}</TableCell>
                <TableCell>{(Number(row.work_days ?? (((Number(row.days_present ?? 0)) + (Number(row.half_days ?? 0)) * 0.5))))}</TableCell>
                <TableCell>{Number(row.paid_holiday_days ?? 0)}</TableCell>
                <TableCell>{(Number(row.total_paid_days ?? 0))}</TableCell>
                <TableCell>{(row.total_hours_worked - row.total_overtime_hours + row.total_late_hours).toFixed(2)}h</TableCell>
                <TableCell>{row.total_overtime_hours.toFixed(2)}h</TableCell>
                <TableCell>{row.total_late_hours.toFixed(2)}h</TableCell>
                <TableCell className="text-right font-bold text-lg text-emerald-600 dark:text-emerald-400">
                  {currency}{row.total_payable_salary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </TableCell>
              </motion.tr>
            )})}
          </TableBody>
        </Table>
        {data.length === 0 && (
          <div className="text-center p-12 text-slate-500 dark:text-gray-400">
            <p>No report data available for the selected month.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}