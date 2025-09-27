import React from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Alert, AlertDescription } from "components/ui/alert";
import { auth } from "api/client";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setIsLoading(true);
    const res = await auth.resetPassword(token, password);
    if (res?.ok) {
      setMessage("Password reset successful! You can now sign in.");
      setTimeout(() => navigate("/signin"), 2000);
    } else {
      setError("Reset failed, please check the link and try again.");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-800 dark:via-gray-900 dark:to-black p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">Reset Password</h1>
          <p className="text-slate-600 dark:text-gray-300">Set your new password</p>
        </div>
        <form onSubmit={handleSubmit} className="w-full space-y-3">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {message && (
            <Alert variant="success">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          <div>
            <label className="block text-sm mb-1 text-slate-700 dark:text-gray-300">New Password</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm mb-1 text-slate-700 dark:text-gray-300">Confirm Password</label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">{isLoading ? "Resetting..." : "Reset Password"}</Button>
          <div className="text-center">
            <Link to="/signin" className="underline text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Back to Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
