import React from 'react';
import { Button } from "components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, subMonths, format } from "date-fns";

export default function ReportFilters({ selectedMonth, setSelectedMonth, theme }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex justify-center items-center gap-4 dark:bg-gray-800 dark:border-gray-700">
      <Button variant="outline" size="icon" onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))} className="dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600">
        <ChevronLeft className="w-5 h-5" />
      </Button>
      <h3 className="text-xl font-bold text-slate-800 w-48 text-center dark:text-white">
        {format(selectedMonth, "MMMM yyyy")}
      </h3>
      <Button variant="outline" size="icon" onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))} className="dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600">
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );
}