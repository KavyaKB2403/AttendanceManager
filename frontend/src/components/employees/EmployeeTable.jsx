import React, { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Employees } from "entities/all";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "components/ui/table";
import { Badge } from "components/ui/badge";
import { Button } from "components/ui/button";
import { Landmark, CreditCard, Calendar, IndianRupee, Trash2, PencilLine, History } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "components/ui/dialog";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/ui/select";

export default function EmployeeTable({ employees, loading, onEmployeeUpdate, theme }) {
  // const [deletingId, setDeletingId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", position: "", department: "", bank_account: "", base_salary: 0, status: "active", salary_effective_from: "" });
  const [historyOpen, setHistoryOpen] = useState(false);

  const handleDelete = async (employeeId) => {
    console.log("Frontend: Attempting to delete employee with ID:", employeeId);
    if (window.confirm("Are you sure you want to delete this employee? This action cannot be undone.")) {
      try {
        await Employees.delete(employeeId);
        console.log("Frontend: Employee deleted successfully. Refreshing list.");
        await onEmployeeUpdate();
      } catch (error) {
        console.error("Frontend: Error deleting employee:", error);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-800 dark:text-emerald-100 dark:border-emerald-700";
      case "inactive":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-800 dark:text-red-100 dark:border-red-700";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700";
    }
  };

  const openEdit = (emp) => {
    setEditing(emp);
    setEditForm({
      name: emp.name || "",
      position: emp.position || "",
      department: emp.department || "",
      bank_account: emp.bank_account || "",
      base_salary: emp.base_salary || 0,
      status: emp.status || "active",
      salary_effective_from: "",
    });
  };

  const submitEdit = async () => {
    if (!editing) return;
    await Employees.update(editing.id, {
      name: editForm.name,
      position: editForm.position,
      department: editForm.department,
      bank_account: editForm.bank_account,
      base_salary: Number(editForm.base_salary),
      status: editForm.status,
      // pass through additional field for backend (mapped in entities/all.ts)
      salary_effective_from: editForm.salary_effective_from || undefined,
    });
    setEditing(null);
    await onEmployeeUpdate?.();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
        <div className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex space-x-4">
              <div className="w-12 h-12 bg-slate-200 rounded-full dark:bg-gray-700"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4 dark:bg-gray-700"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2 dark:bg-gray-700"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center dark:bg-gray-800 dark:border-gray-700">
        <Landmark className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-gray-600" />
        <h3 className="text-lg font-semibold text-slate-600 mb-2 dark:text-white">No employees found</h3>
        <p className="text-slate-500 dark:text-gray-300">Start by adding your first team member</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-gray-800">
              <TableHead className="font-semibold text-slate-700 dark:text-gray-200 dark:bg-gray-900">Employee</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-gray-200 dark:bg-gray-900">Bank</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-gray-200 dark:bg-gray-900">Bank Account</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-gray-200 dark:bg-gray-900">Salary</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-gray-200 dark:bg-gray-900">Hire Date</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-gray-200 dark:bg-gray-900">Status</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-gray-200 dark:bg-gray-900">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="dark:text-gray-300">
            {employees.map((employee, index) => (
              <motion.tr
                key={employee.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`hover:bg-slate-50 transition-colors dark:hover:bg-gray-700 dark:border-gray-700 ${employee.status === 'inactive' ? 'bg-slate-100 dark:bg-gray-900' : ''}`}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {employee.name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-white">{employee.name}</p>
                      <p className="text-sm text-slate-500 dark:text-gray-400">ID: {employee.employee_id}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-slate-400 dark:text-gray-500" />
                    <span className="text-slate-700 dark:text-gray-300">{employee.position || "Not specified"}</span>
                  </div>
                  {employee.department && (
                    <p className="text-sm text-slate-500 mt-1 dark:text-gray-400">{employee.department}</p>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-slate-400 dark:text-gray-500" />
                    <span className="text-slate-700 dark:text-gray-300">{employee.bank_account || "Not provided"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-slate-400 dark:text-gray-500" />
                    <span className="font-semibold text-slate-800 dark:text-white">
                    {employee.base_salary?.toLocaleString() || "0"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-gray-400">per month</p>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400 dark:text-gray-500" />
                    <span className="text-slate-700 dark:text-gray-300">
                      {employee.hire_date 
                        ? format(new Date(employee.hire_date), "MMM d, yyyy")
                        : "Not specified"
                      }
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`${getStatusColor(employee.status || "active")} dark:${getStatusColor(employee.status || "active").replace('100', '800').replace('800', '100')}`}>
                    {employee.status || "active"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" size="icon"
                      className="text-slate-600 hover:text-slate-800 hover:bg-slate-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
                      onClick={() => openEdit(employee)}
                    >
                      <PencilLine className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" size="icon"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-gray-700"
                      onClick={() => handleDelete(employee.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>
      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2">
            <div>
              <Label>Name</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div>
              <Label>Position</Label>
              <Input value={editForm.position} onChange={(e) => setEditForm({ ...editForm, position: e.target.value })} />
            </div>
            <div>
              <Label>Department</Label>
              <Input value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} />
            </div>
            <div>
              <Label>Bank Account</Label>
              <Input value={editForm.bank_account} onChange={(e) => setEditForm({ ...editForm, bank_account: e.target.value })} />
            </div>
            <div>
              <Label>Monthly Salary</Label>
              <Input type="number" min="0" step="500" value={editForm.base_salary} onChange={(e) => setEditForm({ ...editForm, base_salary: e.target.value })} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Salary Effective From</Label>
              <Input type="date" value={editForm.salary_effective_from} onChange={(e) => setEditForm({ ...editForm, salary_effective_from: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            {editing?.last_updated_at && (
              <div className="mr-auto text-sm text-slate-500 flex items-center gap-1">
                <History className="w-4 h-4" /> Last updated: {format(new Date(editing.last_updated_at), 'MMM d, yyyy h:mm a')}
              </div>
            )}
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={submitEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}