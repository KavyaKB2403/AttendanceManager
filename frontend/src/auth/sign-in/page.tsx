import React from "react";
import { useNavigate } from "react-router-dom";
import { SignInForm } from "components/auth/sign-in-form";
import { useAuth } from "../AuthContext"; // Import useAuth

export default function SignInPage() { // Removed onSignIn prop
  const navigate = useNavigate();
  const { signIn } = useAuth(); // Use signIn from AuthContext

  const handleSuccess = (token: string) => { // Updated to accept token
    signIn(token);             // Use signIn from AuthContext
    navigate("/dashboard"); // redirect after login
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-800 dark:via-gray-900 dark:to-black p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">AttendanceManager Pro</h1>
          <p className="text-slate-600 dark:text-gray-300">Sign in to your account</p>
        </div>
        <SignInForm onSuccess={handleSuccess} /> {/* Pass handleSuccess */}
      </div>
    </div>
  )
}
