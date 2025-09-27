import React, { useState, useEffect } from "react";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { motion } from "framer-motion";
import { Save } from "lucide-react";
import { Switch } from "components/ui/switch"; // Import Switch component
import CompanyLogoUploader from "./CompanyLogoUploader"; // Import CompanyLogoUploader

export default function CompanySettingsForm({ initialData, onSave, loading, theme }) {
  const [formData, setFormData] = useState({
    company_name: "",
    standard_work_hours: 8,
    overtime_multiplier: 1.5,
    currency: "INR",
    mark_sundays_as_holiday: false, // Initialize new setting
    company_logo_url: null, // Initialize company logo URL
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const dataToSave = {
      ...formData,
      standard_work_hours: parseFloat(formData.standard_work_hours),
      overtime_multiplier: parseFloat(formData.overtime_multiplier),
    };
    await onSave(dataToSave);
    setIsSaving(false);
  };

  if (loading) {
    return <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mt-4 animate-pulse dark:bg-gray-800 dark:border-gray-700">
        <div className="h-8 bg-slate-200 rounded w-1/3 mb-6 dark:bg-gray-700"></div>
        <div className="h-10 bg-slate-200 rounded my-4 dark:bg-gray-700"></div>
        <div className="h-10 bg-slate-200 rounded my-4 dark:bg-gray-700"></div>
    </div>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mt-4 dark:bg-gray-800 dark:border-gray-700"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
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
            <Label htmlFor="standard_work_hours" className="dark:text-gray-300">Standard Hours/Day</Label>
            <Input id="standard_work_hours" type="number" value={formData.standard_work_hours || ""} onChange={e => handleChange('standard_work_hours', e.target.value)} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="overtime_multiplier" className="dark:text-gray-300">Overtime Multiplier</Label>
            <Input id="overtime_multiplier" type="number" step="0.1" value={formData.overtime_multiplier || ""} onChange={e => handleChange('overtime_multiplier', e.target.value)} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
        </div>
        
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Company Logo</h3>
          <CompanyLogoUploader 
            currentLogoUrl={initialData?.company_logo_url}
            onLogoUploadSuccess={(newLogoUrl) => handleChange('company_logo_url', newLogoUrl)}
          />
        </div>

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