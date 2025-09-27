import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/ui/select";
import { User, Landmark, IndianRupee, Calendar } from "lucide-react";

export default function AddEmployeeDialog({ open, onClose, onSubmit, theme }) {
  const [formData, setFormData] = useState({
    employee_id: "",
    name: "",
    bank_account: "",
    position: "",
    department: "",
    base_salary: "",
    hire_date: "",
    status: "active"
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const apiEmployeeData = toApiEmployee(formData);
      await onSubmit(apiEmployeeData);
      setFormData({
        employee_id: "",
        name: "",
        bank_account: "",
        position: "",
        department: "",
        base_salary: "",
        hire_date: "",
        status: "active"
      });
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toApiEmployee = (uiEmployee) => {
      console.log("toApiEmployee: Received UiEmployee:", uiEmployee);
      return {
          name: uiEmployee.name,
          base_salary: uiEmployee.base_salary ? parseFloat(uiEmployee.base_salary) : undefined,
          hire_date: uiEmployee.hire_date || undefined,
          bank_account: uiEmployee.bank_account || undefined,
          position: uiEmployee.position || null,
          department: uiEmployee.department || null,
      };
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl dark:bg-gray-800 dark:text-white dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl dark:text-white">
            <User className="w-5 h-5 dark:text-gray-300" />
            Add New Employee
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee_id" className="dark:text-gray-300">Employee ID *</Label>
              <Input
                id="employee_id"
                value={formData.employee_id}
                onChange={(e) => handleChange("employee_id", e.target.value)}
                placeholder="e.g., EMP001"
                required
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name" className="dark:text-gray-300">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="John Doe"
                required
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bank_account" className="dark:text-gray-300">Bank Account</Label>
              <div className="relative">
                <Landmark className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-gray-500" />
                <Input
                  id="bank_account"
                  
                  value={formData.bank_account}
                  onChange={(e) => handleChange("bank_account", e.target.value)}
                  placeholder="4826XXXXX435"
                  className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="position" className="dark:text-gray-300">Bank Name</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => handleChange("position", e.target.value)}
                placeholder="Axis/PNB etc."
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department" className="dark:text-gray-300">IFSC Code</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => handleChange("department", e.target.value)}
                placeholder="ABCXX126"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="base_salary" className="dark:text-gray-300">Monthly Salary *</Label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-gray-500" />
                <Input
                  id="base_salary"
                  type="number"
                  min="0"
                  step="500"
                  value={formData.base_salary}
                  onChange={(e) => handleChange("base_salary", e.target.value)}
                  placeholder="5000"
                  className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hire_date" className="dark:text-gray-300">Hire Date</Label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-gray-500" />
                <Input
                  id="hire_date"
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => handleChange("hire_date", e.target.value)}
                  className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status" className="dark:text-gray-300">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <Button type="button" variant="outline" onClick={onClose} className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:border-gray-600">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600">
              {loading ? "Adding..." : "Add Employee"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}