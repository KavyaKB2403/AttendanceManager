import React, { useState, useEffect, useCallback, useMemo, useContext } from "react";
import { Employees, Attendances, Holidays, CompanySettings } from "entities/all";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { motion } from "framer-motion";
import { Button } from "components/ui/button";
import { ChevronLeft, ChevronRight, AlertTriangle, User } from "lucide-react";
import AttendanceCalendar from "../components/attendance/AttendanceCalender";
import DailyAttendanceTable from "../components/attendance/DailyAttendanceTable";
import { useAuth } from "../auth/AuthContext";
// import { v4 as uuidv4 } from 'uuid'; // Removed as callId is no longer used

export default function AttendancePage({ theme }) {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [settings, setSettings] = useState(null);
  const { user } = useAuth(); // Get logged-in user info
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  const monthStart = useMemo(() => startOfMonth(currentMonth), [currentMonth]);
  const monthEnd = useMemo(() => endOfMonth(currentMonth), [currentMonth]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [empData, holidayData, settingsData] = await Promise.all([
        Employees.list(),
        Holidays.list(),
        CompanySettings.list()
      ]);
      setEmployees(empData);
      setHolidays(holidayData);
      setSettings(settingsData[0]);
      
      let attendanceData;
      if (user && user.role === "staff" && user.employee_id) {
        // If staff, fetch only their attendance
        attendanceData = await Attendances.filter({ // Assuming Attendances.filter can take employee_id
          employee_id: user.employee_id,
          start: format(monthStart, 'yyyy-MM-dd'),
          end: format(monthEnd, 'yyyy-MM-dd'),
        });
      } else {
        // If admin or no specific user, fetch all attendance
        attendanceData = await Attendances.filter({
          start: format(monthStart, 'yyyy-MM-dd'),
          end: format(monthEnd, 'yyyy-MM-dd'),
        });
      }
      setAttendance(attendanceData);
      console.log("loadData: Fetched attendanceData (after update):", attendanceData);
      
    } catch (error) {
      console.error("Error loading attendance data:", error);
    } finally {
      setLoading(false);
    }
  }, [monthStart, monthEnd, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleAttendanceUpdate = async (employeeId, date, status, overtime, lateHours) => {
    // const callId = uuidv4(); // Removed unused variable
    const dateStr = format(date, 'yyyy-MM-dd');
    const existingRecord = attendance.find(a => a.employee_id === employeeId && a.date === dateStr);

    const dataToSave = {
      employee_id: employeeId,
      date: dateStr,
      status: status,
      overtime_hours: parseFloat(overtime) || 0,
      late_hours: parseFloat(lateHours) || 0, // Include late_hours in payload
    };

    try {
      if (existingRecord) {
        await Attendances.update(existingRecord.id, { ...dataToSave });
      } else {
        await Attendances.create({ ...dataToSave });
      }
      // Refresh data for the month
      await loadData();
    } catch (error) {
      console.error("Failed to update attendance:", error);
    } finally {
      // Optional: Add a visual feedback for successful save if needed
    }
  };

  const attendanceForSelectedDate = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const filteredAttendance = attendance.filter(a => a.date === dateStr);
    return filteredAttendance;
  }, [selectedDate, attendance]);

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(selectedEmployee?.id === employee.id ? null : employee);
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Attendance Tracker</h1>
        <p className="text-slate-600 mt-1 dark:text-gray-300">Manage daily attendance and overtime</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 dark:bg-gray-800 dark:border-gray-700"
        >
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                {format(currentMonth, "MMMM yyyy")}
              </h2>
              {selectedEmployee && (
                <div className="flex items-center gap-2 mt-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-600 font-medium">{selectedEmployee.name}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedEmployee(null)}
                    className="text-xs"
                  >
                    View All
                  </Button>
                </div>
              )}
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <AttendanceCalendar
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            holidays={holidays}
            attendance={attendance}
            employees={employees}
            selectedEmployee={selectedEmployee}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2"
        >
          {settings ? (
            <DailyAttendanceTable
              selectedDate={selectedDate}
              employees={employees}
              attendanceForDate={attendanceForSelectedDate}
              holidays={holidays}
              companySettings={settings}
              onUpdate={handleAttendanceUpdate}
              onEmployeeSelect={handleEmployeeSelect}
              selectedEmployee={selectedEmployee}
              loading={loading}
              theme={theme}
            />
          ) : (
             <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg dark:bg-yellow-900 dark:border-yellow-700">
                <div className="flex">
                  <div className="py-1"><AlertTriangle className="h-5 w-5 text-yellow-500 mr-3 dark:text-yellow-400" /></div>
                  <div>
                    <p className="font-bold dark:text-white">Company Settings Not Found</p>
                    <p className="text-sm dark:text-gray-300">Please configure your company settings on the Settings page to enable attendance tracking.</p>
                  </div>
                </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}