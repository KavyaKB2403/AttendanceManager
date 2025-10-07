import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "./lib/utils";
import { useAuth } from "./auth/AuthContext"; // Import useAuth
import { Helmet, HelmetProvider } from "react-helmet-async"; // Import Helmet
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Settings,
  Menu,
  X,
  LogOut,
  Sun,
  Moon,
  UserRound, // Changed from UsersRound to UserRound for individual profile
} from "lucide-react";
import { Button } from "./components/ui/button";
import { motion } from "framer-motion";
import ProfileCard from "./components/ProfileCard"; // Import the new ProfileCard component

const getCompanyInitials = (name) => {
  if (!name) return "";
  const words = name.split(' ').filter(Boolean); // Split by space and remove empty strings
  if (words.length === 0) return "";
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return words.map(word => word.charAt(0)).join('').toUpperCase();
};

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
  },
  {
    title: "Employees",
    url: createPageUrl("Employees"),
    icon: Users,
  },
  {
    title: "Attendance",
    url: createPageUrl("Attendance"),
    icon: Calendar,
  },
  {
    title: "Reports",
    url: createPageUrl("Reports"),
    icon: FileText,
  },
  // Settings and Staff Management will be conditionally added
];

export default function Layout({ children, currentPageName, onSignOut, theme, toggleTheme }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [profileCardOpen, setProfileCardOpen] = useState(false); // New state for profile card visibility
  const { role, user, companyLogoUrl, companyName } = useAuth(); // Get the user role, user data, and company logo URL from AuthContext

  const adminNavigationItems = [
    {
      title: "Settings",
      url: createPageUrl("Settings"),
      icon: Settings,
    },
  ];

  const filteredNavigationItems = [
    ...navigationItems,
    ...(role === 'admin' ? adminNavigationItems : []), // Conditionally add admin links
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-800 dark:via-gray-900 dark:to-black">
      <HelmetProvider>
      <Helmet>
          <title>{currentPageName ? `${currentPageName} | AttendanceManager` : "AttendanceManager"}</title>
        </Helmet>
      </HelmetProvider>
      {/* Top Navigation */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50 dark:bg-gray-950/95 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  AttendanceManager
                </h1>
                <p className="text-xs text-slate-500">Professional Workforce Management</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              {filteredNavigationItems.map((item) => ( // Use filteredNavigationItems
                <Link
                  key={item.title}
                  to={item.url}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                    location.pathname === item.url
                      ? "bg-blue-600 text-white shadow-lg"
                      : "text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.title}
                </Link>
              ))}
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button
                variant="ghost"
                className="text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
                onClick={() => setProfileCardOpen(!profileCardOpen)} // Toggle profile card
              >
                {companyLogoUrl ? (
                  <img src={companyLogoUrl} alt="Company Logo" className="w-6 h-6 rounded-full object-cover mr-2" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 text-sm font-bold mr-2">
                    {companyName ? companyName.charAt(0).toUpperCase() : user?.name?.charAt(0).toUpperCase() || "P"}
                  </div>
                )}
                Profile
              </Button>
            </div>

            {/* Profile Card */}
            {profileCardOpen && user && (
                <ProfileCard
                    user={user}
                    companyLogoUrl={companyLogoUrl}
                    onSignOut={onSignOut}
                    onClose={() => setProfileCardOpen(false)}
                    companyName={companyName} // Pass companyName to ProfileCard
                />
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-white border-t border-slate-200"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {filteredNavigationItems.map((item) => ( // Use filteredNavigationItems
                <Link
                  key={item.title}
                  to={item.url}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                    location.pathname === item.url
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  {item.title}
                </Link>
              ))}
              <Button
                variant="ghost"
                className="w-full justify-start text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
                onClick={() => { toggleTheme(); setMobileMenuOpen(false); }}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5 mr-3" /> : <Moon className="w-5 h-5 mr-3" />}
                Toggle Theme
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
                onClick={() => { setProfileCardOpen(true); setMobileMenuOpen(false); }}
              >
                {companyLogoUrl ? (
                  <img src={companyLogoUrl} alt="Company Logo" className="w-6 h-6 rounded-full object-cover mr-3" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 text-sm font-bold mr-3">
                    {companyName ? getCompanyInitials(companyName) : user?.name?.charAt(0).toUpperCase() || "P"}
                  </div>
                )}
                Profile
              </Button>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}