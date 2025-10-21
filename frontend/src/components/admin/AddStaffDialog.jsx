import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "components/ui/dialog";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/ui/select";
import { toast } from "sonner";
import { User, Mail } from "lucide-react";
import { adminService } from "api/admin"; // Import adminService
import { employeeService } from "lib/employees"; // Assuming an employee service exists or will be created
import { Alert, AlertDescription, AlertTitle } from "components/ui/alert";
import { CheckCircle2 } from "lucide-react";


export default function AddStaffDialog({ open, onClose, onStaffAdded }) {
  const [formData, setFormData] = useState({
    employee_id: "", // New field for selected employee
    name: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [temporaryPassword, setTemporaryPassword] = useState(null);
  const [employees, setEmployees] = useState([]); // State to store available employees
  const [selectedEmployeeName, setSelectedEmployeeName] = useState(""); // State to store selected employee's name

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        // Fetch employees who do not have a user_id associated
        const availableEmployees = await employeeService.listEmployees({ has_user_account: false });
        setEmployees(availableEmployees);
      } catch (err) {
        toast.error("Failed to load employees for staff assignment.");
        console.error("Failed to load employees:", err);
      }
    };
    if (open) {
      fetchEmployees();
      setTemporaryPassword(null); // Clear temporary password when dialog opens
      setFormData({ employee_id: "", name: "", email: "" }); // Clear form on open
      setError(null);
    }
  }, [open]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleEmployeeSelect = (employeeId) => {
    const employee = employees.find((emp) => emp.id === parseInt(employeeId));
    setFormData((prev) => ({
      ...prev,
      employee_id: employeeId,
      name: employee ? employee.name : "", // Pre-fill name if employee is selected
    }));
    setSelectedEmployeeName(employee ? employee.name : "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setTemporaryPassword(null); // Clear previous temporary password on new submission

    try {
      const response = await adminService.createStaff(formData);
      setTemporaryPassword(response.temp_password);
      // No need to clear form data here as we show success message and then close.
      if (onStaffAdded) {
        onStaffAdded(); // Call parent callback directly to refresh list
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create staff member.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center text-slate-800 dark:text-gray-100">Add New Staff Member</DialogTitle>
          <DialogDescription className="text-center text-slate-600 dark:text-gray-300">
            Select an existing employee and bind an email ID for their login.
          </DialogDescription>
        </DialogHeader>
        {temporaryPassword ? (
          <div className="text-center space-y-4">
            <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">Staff Member Added Successfully!</p>
            <p className="text-slate-700 dark:text-gray-300">
              A temporary password has been generated for{' '}
              <span className="font-medium text-blue-600 dark:text-blue-400">{formData.email}</span>.
            </p>
            <p className="text-slate-700 dark:text-gray-300">
              Please provide this password to{' '}
              <span className="font-medium text-blue-600 dark:text-blue-400">{selectedEmployeeName || formData.name}</span>:
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
              {temporaryPassword}
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-400">
              It is recommended to reset this password after the first login.
            </p>
            <Button onClick={() => {
              onClose();
              onStaffAdded(); // Refresh staff list
            }} className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white">
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <div className="space-y-2">
              <Label htmlFor="employee_id" className="dark:text-gray-300">Select Employee *</Label>
              <Select onValueChange={handleEmployeeSelect} value={formData.employee_id}>
                <SelectTrigger id="employee_id" className="w-full dark:bg-slate-800 dark:text-gray-100 dark:border-slate-600">
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-800 dark:border-slate-600">
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={String(emp.id)} className="dark:text-gray-100 data-[highlighted]:dark:bg-blue-600 data-[highlighted]:dark:text-white">
                      {emp.name} ({emp.email || 'No email'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="dark:text-gray-300">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="employee@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="dark:bg-slate-800 dark:text-gray-100 dark:border-slate-600"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white">
              {loading ? "Adding Staff..." : "Add Staff"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
