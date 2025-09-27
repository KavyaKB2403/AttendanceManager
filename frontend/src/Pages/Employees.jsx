import React, { useState, useEffect } from "react";
import { Employees } from "entities/all";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Plus, Search } from "lucide-react";
import { motion } from "framer-motion";

import EmployeeTable from "../components/employees/EmployeeTable";
import AddEmployeeDialog from "../components/employees/AddEmployeeDialog";

export default function EmployeesPage({ theme }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await Employees.list("-created_date");
      setEmployees(data);
    } catch (error) {
      console.error("Error loading employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async (employeeData) => {
    try {
      await Employees.create(employeeData);
      await loadEmployees();
      setShowAddDialog(false);
    } catch (error) {
      console.error("Error adding employee:", error);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.position?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Employee Management</h1>
          <p className="text-slate-600 mt-1 dark:text-gray-300">Manage your team members and their information</p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2 dark:bg-blue-700 dark:hover:bg-blue-600"
        >
          <Plus className="w-4 h-4" />
          Add Employee
        </Button>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 dark:bg-gray-800 dark:border-gray-700"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-gray-500" />
            <Input
              placeholder="Search employees by name, ID, or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-slate-200 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:border-blue-600"
            />
          </div>
        </div>
        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-slate-600 dark:text-gray-300">
            Showing {filteredEmployees.length} of {employees.length} employees
          </p>
        </div>
      </motion.div>

      {/* Employee Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <EmployeeTable 
          employees={filteredEmployees}
          loading={loading}
          onEmployeeUpdate={loadEmployees}
          theme={theme}
        />
      </motion.div>

      {/* Add Employee Dialog */}
      <AddEmployeeDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSubmit={handleAddEmployee}
        theme={theme}
      />
    </div>
  );
}