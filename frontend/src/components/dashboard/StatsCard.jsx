import React from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

const colorSchemes = {
  blue: {
    bg: "from-blue-500 to-blue-600",
    light: "bg-blue-50",
    text: "text-blue-600"
  },
  green: {
    bg: "from-emerald-500 to-emerald-600",
    light: "bg-emerald-50",
    text: "text-emerald-600"
  },
  purple: {
    bg: "from-purple-500 to-purple-600",
    light: "bg-purple-50",
    text: "text-purple-600"
  },
  orange: {
    bg: "from-orange-500 to-orange-600",
    light: "bg-orange-50",
    text: "text-orange-600"
  }
};

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  color = "blue", 
  trend, 
  trendIcon: TrendIcon = TrendingUp 
}) {
  const colorScheme = colorSchemes[color];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className="group relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300 dark:bg-gray-800 dark:border-gray-700"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorScheme.light}`}>
          <Icon className={`w-6 h-6 ${colorScheme.text}`} />
        </div>
        <div className={`w-16 h-16 bg-gradient-to-r ${colorScheme.bg} rounded-full opacity-0 group-hover:opacity-10 transform scale-75 group-hover:scale-100 transition-all duration-300 absolute top-4 right-4`}></div>
      </div>
      
      <div className="space-y-2">
        <p className="text-slate-600 text-sm font-medium dark:text-gray-300">{title}</p>
        <p className="text-3xl font-bold text-slate-800 dark:text-white">{value}</p>
        {trend && (
          <div className="flex items-center gap-1">
            <TrendIcon className={`w-4 h-4 ${colorScheme.text}`} />
            <span className={`text-sm font-medium ${colorScheme.text}`}>{trend}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}