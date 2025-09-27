import React, { useState } from "react";
import { format } from "date-fns";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

export default function HolidayManager({ holidays, onAdd, onDelete, loading, theme }) {
  const [newHoliday, setNewHoliday] = useState({ name: "", date: "" });

  const handleAdd = async () => {
    if (newHoliday.name && newHoliday.date) {
      await onAdd(newHoliday);
      setNewHoliday({ name: "", date: "" });
    }
  };

  if (loading) {
     return <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mt-4 animate-pulse dark:bg-gray-800 dark:border-gray-700">
        <div className="h-10 bg-slate-200 rounded my-4 dark:bg-gray-700"></div>
        <div className="h-8 bg-slate-200 rounded my-2 dark:bg-gray-700"></div>
     </div>
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 mt-4 overflow-hidden dark:bg-gray-800 dark:border-gray-700"
    >
      <div className="p-6 border-b grid md:grid-cols-3 gap-4 items-end dark:border-gray-700">
        <div className="space-y-2">
          <Label htmlFor="holiday_name" className="dark:text-gray-300">Holiday Name</Label>
          <Input id="holiday_name" value={newHoliday.name} onChange={e => setNewHoliday({...newHoliday, name: e.target.value})} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="holiday_date" className="dark:text-gray-300">Date</Label>
          <Input id="holiday_date" type="date" value={newHoliday.date} onChange={e => setNewHoliday({...newHoliday, date: e.target.value})} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        </div>
        <Button onClick={handleAdd} className="dark:bg-blue-700 dark:hover:bg-blue-600 dark:text-white"><Plus className="w-4 h-4 mr-2" /> Add Holiday</Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-gray-800">
              <TableHead className="font-semibold text-slate-700 dark:text-gray-200 dark:bg-gray-900">Holiday</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-gray-200 dark:bg-gray-900">Date</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-gray-200 dark:bg-gray-900">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="dark:text-gray-300">
            {holidays.map(holiday => (
              <TableRow key={holiday.id} className="dark:border-gray-700 dark:hover:bg-gray-700">
                <TableCell className="font-medium dark:text-white">{holiday.name}</TableCell>
                <TableCell className="dark:text-gray-300">{format(new Date(holiday.date), "MMMM d, yyyy")}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(holiday.id)} className="dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-gray-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {holidays.length === 0 && (
          <p className="text-center p-8 text-slate-500 dark:text-gray-400">No holidays added yet.</p>
        )}
      </div>
    </motion.div>
  );
}