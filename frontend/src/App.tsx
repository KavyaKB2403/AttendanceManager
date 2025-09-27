// src/App.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext"; // Import AuthProvider and useAuth
import { Toaster } from 'react-hot-toast'; // Import Toaster

// Auth pages
import SignInPage from "auth/sign-in/page";
import SignUpPage from "auth/sign-up/page";
import ForgotPasswordPage from "auth/forgot-password/page";
import ResetPasswordPage from "auth/reset-password/page";

import Layout from "./Layout";
// App pages (JSX files are allowed since allowJs is enabled in tsconfig)
import Dashboard from "Pages/Dashboard";
import Employees from "Pages/Employees.jsx";
import Attendance from "Pages/Attendance.jsx";
import Reports from "Pages/Reports.jsx";
import Settings from "Pages/Settings.jsx";

function AppContent() { // Renamed App to AppContent
  const { isAuthenticated, signIn, signOut } = useAuth(); // Use auth context
  
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches))
      ? 'dark'
      : 'light';
  });

  React.useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Removed localStorage event listener as AuthContext handles token changes

  const ProtectedRoute = (props: { children: React.ReactNode }) => {
    return isAuthenticated ? (
      <>{props.children}</>
    ) : (
      <Navigate to="/signin" replace />
    );
  };

  const PublicOnlyRoute = (props: { children: React.ReactNode }) => {
    return isAuthenticated ? (
      <Navigate to="/dashboard" replace />
    ) : (
      <>{props.children}</>
    );
  };

  const handleSignedIn = (token: string) => {
    signIn(token);
  };

  const handleSignOut = () => {
    signOut();
  };

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Routes>
        {/* Default redirect based on auth */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/signin" replace />
            )
          }
        />

        {/* Auth routes */}
        <Route
          path="/signin"
          element={
            <PublicOnlyRoute>
              <SignInPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicOnlyRoute>
              <SignUpPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicOnlyRoute>
              <ForgotPasswordPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicOnlyRoute>
              <ResetPasswordPage />
            </PublicOnlyRoute>
          }
        />

        {/* Protected app routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout currentPageName="Dashboard" onSignOut={handleSignOut} theme={theme} toggleTheme={toggleTheme}>
                <Dashboard onSignOut={handleSignOut} theme={theme} />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees"
          element={
            <ProtectedRoute>
              <Layout currentPageName="Employees" onSignOut={handleSignOut} theme={theme} toggleTheme={toggleTheme}>
                <Employees theme={theme} />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance"
          element={
            <ProtectedRoute>
              <Layout currentPageName="Attendance" onSignOut={handleSignOut} theme={theme} toggleTheme={toggleTheme}>
                <Attendance theme={theme} />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Layout currentPageName="Reports" onSignOut={handleSignOut} theme={theme} toggleTheme={toggleTheme}>
                <Reports theme={theme} />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout currentPageName="Settings" onSignOut={handleSignOut} theme={theme} toggleTheme={toggleTheme}>
                <Settings theme={theme} />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route
          path="*"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/signin" replace />
            )
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster /> {/* Add Toaster here */}
    </AuthProvider>
  );
}

export default App;
