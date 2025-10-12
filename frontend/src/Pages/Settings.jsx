import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "components/ui/tabs";
import { Settings as SettingsIcon, CalendarDays, UsersRound, KeyRound, PlusCircle, Trash2 } from "lucide-react";
import CompanySettingsForm from "../components/settings/CompanySettingsForm";
import HolidayManager from "../components/settings/HolidayManager";
import AddStaffDialog from "components/admin/AddStaffDialog";
import { adminService } from "api/admin";
import { settingsService } from "../services/settings"; // Correct: For company settings
import { settings as settingsApi } from "../api/client"; // Correct: For holiday functions
import { Button } from "components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import { useAuth } from "../auth/AuthContext";
import { toast } from "react-hot-toast";

export default function SettingsPage({ theme }) {
  const [settings, setSettings] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [staffUsers, setStaffUsers] = useState([]);
  const [showAddStaffDialog, setShowAddStaffDialog] = useState(false);
  const { role } = useAuth();

  // --- REFACTORED AND CORRECTED DATA FETCHING ---
  const loadSettings = useCallback(async () => {
    try {
      const settingsData = await settingsService.getSettings();
      setSettings(settingsData || null);
    } catch (error) {
      toast.error("Failed to load company settings.");
    }
  }, []);

  const loadHolidays = useCallback(async () => {
    try {
      const holidayData = await settingsApi.listHolidays();
      setHolidays(holidayData);
    } catch (error) {
      toast.error("Failed to load holidays.");
    }
  }, []);

  const loadStaff = useCallback(async () => {
    if (role === 'admin') {
      try {
        const staff = await adminService.listStaff();
        setStaffUsers(staff);
      } catch (error) {
        toast.error("Failed to load staff data.");
      }
    }
  }, [role]);

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      await Promise.all([loadSettings(), loadHolidays(), loadStaff()]);
      setLoading(false);
    };
    loadAllData();
  }, [loadSettings, loadHolidays, loadStaff]);
  
  // --- CORRECTED SAVE HANDLERS ---
  const handleSettingsSave = async (data, logoFile) => {
    try {
      const updatedSettings = await settingsService.updateSettings(data, logoFile);
      if (updatedSettings) {
        setSettings(updatedSettings);
        toast.success("Company settings saved!");
      }
    } catch(error) {
      console.error("Failed to save company settings.", error);
    }
  };

  const handleHolidayAdd = async (data) => {
    try {
      await settingsApi.addHoliday(data);
      await loadHolidays(); // ONLY reloads holidays
      toast.success("Holiday added successfully!");
    } catch(error) {
      toast.error("Failed to add holiday.");
    }
  };
  
  const handleHolidayDelete = async (id) => {
    try {
      await settingsApi.deleteHoliday(id);
      await loadHolidays(); // ONLY reloads holidays
      toast.success("Holiday deleted successfully!");
    } catch(error) {
      toast.error("Failed to delete holiday.");
    }
  };

  const handleStaffAdded = () => {
    loadStaff();
  };

  const handleResetStaffPassword = async (userId, staffEmail) => {
    if (window.confirm(`Are you sure you want to reset the password for ${staffEmail}?`)) {
      try {
        const response = await adminService.resetStaffPassword(userId);
        toast.success(`Password Reset Successfully! Temporary Password: ${response.new_temporary_password}. Please provide this to ${staffEmail}.`, { duration: 10000 });
        loadStaff();
      } catch (error) {
        toast.error(error.response?.data?.detail || "Failed to reset staff password.");
      }
    }
  };

  const handleDeleteStaff = async (userId, staffName) => {
    if (window.confirm(`Are you sure you want to delete staff member "${staffName}"? This action cannot be undone.`)) {
      try {
        await adminService.deleteStaff(userId);
        toast.success(`Staff member "${staffName}" deleted successfully!`);
        loadStaff();
      } catch (error) {
        toast.error(error.response?.data?.detail || "Failed to delete staff member.");
      }
    }
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">System Settings</h1>
        <p className="text-slate-600 mt-1 dark:text-gray-300">Configure company policies and holidays</p>
      </motion.div>

      <Tabs defaultValue="company" className="w-full">
        <TabsList className="grid w-full grid-cols-3 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
          <TabsTrigger value="company" className="dark:data-[state=active]:bg-blue-700 dark:data-[state=active]:text-white dark:data-[state=active]:border-blue-700"><SettingsIcon className="w-4 h-4 mr-2" />Company Settings</TabsTrigger>
          <TabsTrigger value="holidays" className="dark:data-[state=active]:bg-blue-700 dark:data-[state=active]:text-white dark:data-[state=active]:border-blue-700"><CalendarDays className="w-4 h-4 mr-2" />Holiday Management</TabsTrigger>
          {role === 'admin' && (
            <TabsTrigger value="staff-management" className="dark:data-[state=active]:bg-blue-700 dark:data-[state=active]:text-white dark:data-[state=active]:border-blue-700">
              <UsersRound className="w-4 h-4 mr-2" />Staff Management
            </TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="company">
          <CompanySettingsForm
            initialData={settings}
            onSave={handleSettingsSave}
            loading={loading}
            theme={theme}
          />
        </TabsContent>
        <TabsContent value="holidays">
          <HolidayManager
            holidays={holidays}
            onAdd={handleHolidayAdd}
            onDelete={handleHolidayDelete}
            loading={loading}
            theme={theme}
          />
        </TabsContent>
        {role === 'admin' && (
          <TabsContent value="staff-management">
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-white">Manage Staff Accounts</h2>
                <Button onClick={() => setShowAddStaffDialog(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <PlusCircle className="w-4 h-4 mr-2" />Add New Staff
                </Button>
              </div>
              {loading ? (
                <p className="text-center text-slate-500 dark:text-gray-400">Loading staff...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffUsers.map((staff) => (
                      <TableRow key={staff.id}>
                        <TableCell>{staff.id}</TableCell>
                        <TableCell>{staff.name}</TableCell>
                        <TableCell>{staff.email}</TableCell>
                        <TableCell>{staff.role}</TableCell>
                        <TableCell>{new Date(staff.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResetStaffPassword(staff.id, staff.email)}
                            className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-gray-700"
                          >
                            <KeyRound className="w-4 h-4 mr-2" />Reset Password
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteStaff(staff.id, staff.name)}
                            className="ml-2"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
            <AddStaffDialog
              open={showAddStaffDialog}
              onClose={() => setShowAddStaffDialog(false)}
              onStaffAdded={handleStaffAdded}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
