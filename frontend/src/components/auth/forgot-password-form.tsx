"use client"

import type React from "react"

import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "components/ui/button"
import { Input } from "components/ui/input"
import { Label } from "components/ui/label"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "components/ui/card"
import { Alert, AlertDescription } from "components/ui/alert"
import { authService } from "lib/auth"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setMessage("")
  
    if (!email) {
      setError("Email address is required.");
      setIsLoading(false);
      return;
    }
  
    const { success, /* resetToken, */ error: resetError, message: successMessage } = await authService.forgotPassword(email)

    if (resetError) {
      setError(resetError)
    } else if (success) {
      setMessage(successMessage || "If an account with that email exists, we've sent a password reset link to your inbox.")
      // No longer redirecting automatically as token is sent via email
    }

  
    setIsLoading(false)
  }
  

  return (
    // <Card className="w-full max-w-md">
    //   <CardHeader className="text-center">
    //     <CardTitle className="text-2xl font-heading font-black">Reset Password</CardTitle>
    //     <CardDescription>Enter your email address and we'll send you a link to reset your password</CardDescription>
    //   </CardHeader>
    //   <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label htmlFor="email" className="text-slate-700 dark:text-gray-300">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send Reset Link"}
          </Button>

          <div className="text-center text-sm text-slate-600 dark:text-gray-400">
            Remember your password?{" "}
            <Link to = "/sign-in" className="text-blue-600 hover:underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
              Sign in
            </Link>
          </div>
        </form>
    //   </CardContent>
    // </Card>
  )
}
