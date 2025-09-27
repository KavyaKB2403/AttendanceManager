import React, { useState, useEffect } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { authService } from "lib/auth" // Corrected import path from @/lib/auth
import { Button } from "components/ui/button"
import { Input } from "components/ui/input"
import { Label } from "components/ui/label"
import { Alert, AlertDescription } from "components/ui/alert"

export function ResetPasswordForm() { // Renamed to ResetPasswordForm for consistency
  const navigate = useNavigate()
  const location = useLocation()
  const [token, setToken] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("") // Added confirm password state
  const [message, setMessage] = useState("")
  const [error, setError] = useState("") // Added error state
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const urlToken = params.get("token")
    if (urlToken) setToken(urlToken)
  }, [location])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    setError("") // Clear error on new submission

    if (newPassword !== confirmPassword) { // Check if passwords match
      setError("Passwords do not match.")
      setLoading(false)
      return
    }

    if (newPassword.length < 6) { // Add password length validation
      setError("Password must be at least 6 characters long.")
      setLoading(false)
      return
    }

    const result = await authService.resetPassword(token, newPassword)

    if (result.success) {
      setMessage("Password reset successful! Redirecting to sign in...")
      setTimeout(() => navigate("/signin"), 2000)
    } else {
      setError(result.error || "Reset failed, please check the link and try again.") // Use error from result
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
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
      <div className="space-y-2">
        <Label htmlFor="token" className="text-slate-700 dark:text-gray-300">Reset Token</Label>
        <Input
          id="token"
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Enter token"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="newPassword" className="text-slate-700 dark:text-gray-300">New Password</Label>
        <Input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Enter new password"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-slate-700 dark:text-gray-300">Confirm New Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          required
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
        {loading ? "Resetting..." : "Reset Password"}
      </Button>
      <div className="text-center text-sm text-slate-600 dark:text-gray-400">
        Remember your password?{" "}
        <Link to="/signin" className="underline text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Back to Sign in</Link>
      </div>
    </form>
  )
}
