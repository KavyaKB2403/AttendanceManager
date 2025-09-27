import React, { useState, useEffect, useMemo, useCallback } from "react";
import { CompanySettings, Reports } from "entities/all";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { motion } from "framer-motion";
import ReportFilters from "../components/reports/ReportFilters";
import SalaryReportTable from "../components/reports/SalaryReportTable";
import { Download, AlertTriangle } from "lucide-react";
import { Button } from "components/ui/button";

export default function ReportsPage({ theme }) {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const memoizedReportData = useMemo(() => reportData, [reportData]);

  const generateReport = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsData] = await Promise.all([
        CompanySettings.list(),
      ]);
      
      const companySettings = settingsData[0];
      setSettings(companySettings);

      if (!companySettings) {
        setReportData([]);
        return;
      }
      
      const report = await Reports.getSalaryReport(format(selectedMonth, 'yyyy-MM'));
      setReportData(report);

    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    generateReport();
  }, [generateReport]);

  const handleExport = () => {
    const headers = ["Employee", "Base Salary", "Hourly Rate", "Present Days", "Regular Hours", "Total Overtime", "Total Late Hours", "Total Payable"]; // Add "Total Late Hours"
    const rows = reportData.map(d => [
      d.name,
      d.base_monthly_salary.toFixed(2),
      d.hourly_rate.toFixed(2),
      d.present_days + d.half_days * 0.5,
      d.regular_hours.toFixed(2),
      d.total_overtime_hours.toFixed(2),
      d.total_late_hours.toFixed(2), // Add total late hours
      d.total_payable_salary.toFixed(2)
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Salary_Report_${format(selectedMonth, "MMMM_yyyy")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Reports & Analytics</h1>
          <p className="text-slate-600 mt-1 dark:text-gray-300">Generate salary reports and analyze data</p>
        </div>
        <Button onClick={handleExport} disabled={reportData.length === 0} className="dark:bg-blue-700 dark:hover:bg-blue-600 dark:text-white">
          <Download className="w-4 h-4 mr-2" /> Export to CSV
        </Button>
      </motion.div>

      <ReportFilters 
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        theme={theme}
      />
      
      {!settings && !loading && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg dark:bg-yellow-900 dark:border-yellow-700">
          <div className="flex">
            <div className="py-1"><AlertTriangle className="h-5 w-5 text-yellow-500 mr-3 dark:text-yellow-400" /></div>
            <div>
              <p className="font-bold dark:text-white">Company Settings Not Found</p>
              <p className="text-sm dark:text-gray-300">Please configure your company settings on the Settings page to generate reports.</p>
            </div>
          </div>
        </div>
      )}
      
      {settings && <SalaryReportTable data={memoizedReportData} loading={loading} currency={settings?.currency || '$'} theme={theme} />}
    </div>
  );
}