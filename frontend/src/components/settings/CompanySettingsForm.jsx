import React, { useState, useEffect } from "react";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { motion } from "framer-motion";
import { Save } from "lucide-react";
import { Switch } from "components/ui/switch";
// Import the refactored CompanyLogoUploader
import CompanyLogoUploader from "./CompanyLogoUploader"; 

// The 'onSave' prop will now receive two arguments: the form data and the logo file.
export default function CompanySettingsForm({ initialData, onSave, loading }) {
  const [formData, setFormData] = useState({
    company_name: "",
    standard_work_hours_per_day: 8, // Corrected field name to match backend
    overtime_multiplier: 1.5,
    currency: "INR",
    mark_sundays_as_holiday: false,
    company_logo_url: null,
  });
  
  // NEW STATE: State for the selected logo file is now managed here.
  const [logoFile, setLogoFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      // Ensure field names match the state structure
      setFormData({
        company_name: initialData.company_name || "",
        standard_work_hours_per_day: initialData.standard_work_hours_per_day || 8,
        overtime_multiplier: initialData.overtime_multiplier || 1.5,
        currency: initialData.currency || "INR",
        mark_sundays_as_holiday: initialData.mark_sundays_as_holiday || false,
        company_logo_url: initialData.company_logo_url || null,
      });
    }
  }, [initialData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Prepare the data, ensuring numbers are correctly formatted
    const dataToSave = {
      ...formData,
      standard_work_hours_per_day: parseFloat(formData.standard_work_hours_per_day),
      overtime_multiplier: parseFloat(formData.overtime_multiplier),
    };

    // UPDATED LOGIC: Call the onSave prop with both the text data and the logo file.
    await onSave(dataToSave, logoFile);

    setIsSaving(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mt-4 animate-pulse dark:bg-gray-800 dark:border-gray-700">
        <div className="h-8 bg-slate-200 rounded w-1/3 mb-6 dark:bg-gray-700"></div>
        <div className="h-10 bg-slate-200 rounded my-4 dark:bg-gray-700"></div>
        <div className="h-10 bg-slate-200 rounded my-4 dark:bg-gray-700"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mt-4 dark:bg-gray-800 dark:border-gray-700"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* --- Text Inputs (Corrected field names) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <Label htmlFor="company_name" className="dark:text-gray-300">Company Name</Label>
            <Input id="company_name" value={formData.company_name || ""} onChange={e => handleChange('company_name', e.target.value)} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency" className="dark:text-gray-300">Currency Symbol</Label>
            <Input id="currency" value={formData.currency || ""} onChange={e => handleChange('currency', e.target.value)} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="standard_work_hours_per_day" className="dark:text-gray-300">Standard Hours/Day</Label>
            <Input id="standard_work_hours_per_day" type="number" value={formData.standard_work_hours_per_day || ""} onChange={e => handleChange('standard_work_hours_per_day', e.target.value)} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="overtime_multiplier" className="dark:text-gray-300">Overtime Multiplier</Label>
            <Input id="overtime_multiplier" type="number" step="0.1" value={formData.overtime_multiplier || ""} onChange={e => handleChange('overtime_multiplier', e.target.value)} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
        </div>
        
        {/* --- Company Logo Uploader (Updated Props) --- */}
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Company Logo</h3>
          <CompanyLogoUploader 
            currentLogoUrl={formData.company_logo_url}
            onFileSelect={(file) => setLogoFile(file)} // Use onFileSelect to lift the file state up
          />
        </div>

        {/* --- Holiday Settings (Unchanged) --- */}
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Holiday Settings</h3>
          <div className="flex items-center justify-between">
            <Label htmlFor="mark_sundays_as_holiday" className="dark:text-gray-300">Mark all Sundays as Holiday</Label>
            <Switch
              id="mark_sundays_as_holiday"
              checked={formData.mark_sundays_as_holiday}
              onCheckedChange={checked => handleChange('mark_sundays_as_holiday', checked)}
            />
          </div>
        </div>

        {/* --- Save Button (Unchanged) --- */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving} className="dark:bg-blue-700 dark:hover:bg-blue-600 dark:text-white">
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
