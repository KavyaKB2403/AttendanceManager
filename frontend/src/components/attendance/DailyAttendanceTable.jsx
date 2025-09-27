import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/ui/select";
import { Input } from "components/ui/input";
import { Button } from "components/ui/button";
import { Badge } from "components/ui/badge";
import { Save, Eye } from "lucide-react";

export default function DailyAttendanceTable({ 
  selectedDate, 
  employees, 
  attendanceForDate, 
  holidays, 
  companySettings, 
  onUpdate, 
  onEmployeeSelect, 
  selectedEmployee,
  loading, 
  theme
}) {
  const [dailyRecords, setDailyRecords] = useState({});
  const isHoliday = holidays.some(h => h.date === format(selectedDate, 'yyyy-MM-dd'));

  useEffect(() => {
    const records = {};
    employees.forEach(emp => {
      const existing = attendanceForDate.find(a => a.employee_id === String(emp.id)); // Convert emp.id to string for comparison
      records[emp.id] = {
        status: existing?.status || 'absent',
        overtime: existing?.overtime_hours || 0,
        late_hours: existing?.late_hours || 0, // Initialize late_hours
        changed: false
      };
    });
    setDailyRecords(records);
  }, [selectedDate, employees, attendanceForDate]);

  const handleUpdate = (employeeId, field, value) => {
    setDailyRecords(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [field]: value,
        changed: true
      }
    }));
  };

  const handleSave = async (employeeId) => {
    const record = dailyRecords[employeeId];
    await onUpdate(employeeId, selectedDate, record.status, record.overtime, record.late_hours); // Pass late_hours
    // After saving, reset 'changed' state
    setDailyRecords(prev => ({
      ...prev,
      [employeeId]: { ...prev[employeeId], changed: false }
    }));
  };

  const getHolidayOvertime = (employeeId) => {
    const status = dailyRecords[employeeId]?.status;
    if (isHoliday && status === 'present') {
      return companySettings?.standard_work_hours || 8;
    }
    return 0;
  };
  
  if (loading) {
     return <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-pulse dark:bg-gray-800 dark:border-gray-700">
        {[...Array(5)].map(i => <div key={i} className="h-10 bg-slate-200 rounded my-2 dark:bg-gray-700"></div>)}
     </div>
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
      <div className="p-6 border-b dark:border-gray-700">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white">
          Attendance for {format(selectedDate, "MMMM d, yyyy")}
        </h3>
        {isHoliday && (
          <Badge className="mt-2 bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-800 dark:text-purple-100 dark:border-purple-700">
            Holiday: {holidays.find(h => h.date === format(selectedDate, 'yyyy-MM-dd'))?.name}
          </Badge>
        )}
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-gray-800">
              <TableHead className="font-semibold text-slate-700 dark:text-gray-200 dark:bg-gray-900">Employee</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-gray-200 dark:bg-gray-900">Status</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-gray-200 dark:bg-gray-900">Overtime (Holiday)</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-gray-200 dark:bg-gray-900">Overtime (Manual)</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-gray-200 dark:bg-gray-900">Late Hours</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-gray-200 dark:bg-gray-900">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="dark:text-gray-300">
            {employees.map(employee => (
              <TableRow 
                key={employee.id} 
                className={`${selectedEmployee?.id === employee.id ? 'bg-blue-50 border-blue-200 dark:bg-blue-900 dark:border-blue-700' : 'hover:bg-slate-50 dark:hover:bg-gray-700 dark:border-gray-700'}`}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {employee.name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white">{employee.name}</p>
                      <p className="text-xs text-slate-500 dark:text-gray-400">{employee.id}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Select
                    value={dailyRecords[employee.id]?.status || 'absent'}
                    onValueChange={(value) => handleUpdate(employee.id, 'status', value)}
                  >
                    <SelectTrigger className="w-32 dark:bg-gray-700 dark:text-white dark:border-gray-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="half_day">Half-day</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="dark:bg-purple-800 dark:text-purple-100">
                    {getHolidayOvertime(employee.id)}h
                  </Badge>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    className="w-24 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    value={dailyRecords[employee.id]?.overtime || 0}
                    onChange={(e) => handleUpdate(employee.id, 'overtime', e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    className="w-24 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    value={dailyRecords[employee.id]?.late_hours || 0}
                    onChange={(e) => handleUpdate(employee.id, 'late_hours', e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {dailyRecords[employee.id]?.changed && (
                      <Button size="sm" onClick={() => handleSave(employee.id)} className="dark:bg-blue-700 dark:text-white dark:hover:bg-blue-600">
                        <Save className="w-4 h-4 mr-2" /> Save
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => onEmployeeSelect(employee)}
                      className={`${selectedEmployee?.id === employee.id ? 'bg-blue-100 border-blue-200 dark:bg-blue-800 dark:text-blue-100' : 'dark:text-white dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600'}`}
                    >
                      <Eye className="w-4 h-4 mr-2" /> 
                      {selectedEmployee?.id === employee.id ? 'Hide' : 'View'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}