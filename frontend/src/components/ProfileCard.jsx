import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from 'components/ui/button';
import { LogOut, User as UserIcon, Building, Mail, Clock, Edit, PlusCircle, CalendarDays } from 'lucide-react';
import { useAuth } from '../auth/AuthContext'; // Import useAuth to get company name from settings
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const getCompanyInitials = (name) => {
  if (!name) return "";
  const words = name.split(' ').filter(Boolean); // Split by space and remove empty strings
  if (words.length === 0) return "";
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return words.map(word => word.charAt(0)).join('').toUpperCase();
};

export default function ProfileCard({ user, companyLogoUrl, onSignOut, onClose, companyName }) {
  const { lastLoginAt } = useAuth(); // Get lastLoginAt directly from AuthContext
  const navigate = useNavigate(); // Initialize useNavigate
  const lastLogin = "N/A"; // Placeholder for now

  const handleQuickLinkClick = (path) => {
    onClose(); // Close the profile card
    navigate(path);
  };

  const quickLinks = user.role === 'admin' ? [
    { icon: PlusCircle, text: "Add Employee", onClick: () => handleQuickLinkClick('/employees') }, // Navigate to /employees
    { icon: Edit, text: "Settings", onClick: () => handleQuickLinkClick('/settings') }, // Add Settings link for admin
    // Add more admin links here
  ] : [
    { icon: CalendarDays, text: "My Attendance", onClick: () => handleQuickLinkClick('/attendance') }, // Navigate to /attendance
    // Add more staff links here
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="absolute right-4 top-16 mt-2 w-72 rounded-lg shadow-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 z-50 p-6 space-y-4"
      >
        <div className="flex items-center space-x-4">
          {companyLogoUrl ? (
            <img src={companyLogoUrl} alt="Company Logo" className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-gray-600" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 text-xl font-bold">
              {companyName ? getCompanyInitials(companyName) : <Building className="w-6 h-6" />}
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{companyName || "Your Company"}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{user.role === 'admin' ? 'Admin' : 'Staff'}</p>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
          <div className="flex items-center text-gray-700 dark:text-gray-300">
            <Mail className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
            <span className="text-sm">{user.email}</span>
          </div>
          <div className="flex items-center text-gray-700 dark:text-gray-300">
            <Clock className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
            <span className="text-sm">Last Login: {lastLoginAt ? new Date(lastLoginAt).toLocaleString() : "N/A"}</span>
          </div>
        </div>

        {quickLinks.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
            <h4 className="text-md font-medium text-gray-800 dark:text-white">Quick Links</h4>
            {quickLinks.map((link, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
                onClick={link.onClick}
              >
                <link.icon className="w-4 h-4 mr-2" />{link.text}
              </Button>
            ))}
          </div>
        )}

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-gray-700"
            onClick={() => { onSignOut(); onClose(); }}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
