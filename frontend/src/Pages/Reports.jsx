import React, { useState, useEffect, useMemo, useCallback } from "react";
import { CompanySettings, Reports } from "entities/all";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { motion } from "framer-motion";
import ReportFilters from "../components/reports/ReportFilters";
import SalaryReportTable from "../components/reports/SalaryReportTable";
import { Download, AlertTriangle } from "lucide-react";
import { Button } from "components/ui/button";
import { useAuth } from "../auth/AuthContext";

export default function ReportsPage({ theme }) {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const { user } = useAuth();

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
      
      const monthParam = format(selectedMonth, 'yyyy-MM');
      let report;

      if (user && user.role === "staff" && user.employee_id) {
        report = await Reports.getSalaryReport(monthParam, user.employee_id);
      } else {
        report = await Reports.getSalaryReport(monthParam);
      }
      setReportData(report);

    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, user]);

  useEffect(() => {
    generateReport();
  }, [generateReport]);

  const handleExport = async () => {
    try {
      const monthParam = format(selectedMonth, 'yyyy-MM');
      let employeeIdParam = undefined;

      if (user && user.role === "staff" && user.employee_id) {
        employeeIdParam = user.employee_id;
      }

      const csvBlob = await Reports.exportCSV(monthParam, employeeIdParam);

      // Create a URL for the blob and trigger download
      const url = window.URL.createObjectURL(csvBlob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Salary_Report_${format(selectedMonth, "MMMM_yyyy")}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url); // Clean up the object URL
    } catch (error) {
      console.error("Error exporting CSV:", error);
      // Display an error toast to the user
      import('react-hot-toast').then(module => {
        const toast = module.default;
        toast.error("Failed to export CSV report.");
      });
    }
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