import type React from "react"

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Button } from "components/ui/button"
import { Input } from "components/ui/input"
import { Label } from "components/ui/label"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "components/ui/card"
import { Alert, AlertDescription } from "components/ui/alert"
import { authService } from "lib/auth"

export function SignUpForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      setIsLoading(false)
      return
    }

    const { user, error: authError } = await authService.signUp(name, email, password)

    if (authError) {
      setError(authError)
      setIsLoading(false)
      return
    }

    if (user) {
      navigate("/dashboard")
    }

    setIsLoading(false)
  }

  return (
    // <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
    //   <Card className="w-full max-w-md">
    //     <CardHeader className="text-center">
    //       <CardTitle className="text-center text-2xl font-heading font-black text-amber-300 items-center justify-center">Create Account</CardTitle>
    //       <CardDescription>Sign up to start tracking attendance</CardDescription>
    //     </CardHeader>
    //     <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700 dark:text-gray-300">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 dark:text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 dark:text-gray-300">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-700 dark:text-gray-300">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center" disabled={isLoading}>
              <span>{isLoading ? "Creating account..." : "Create Account"}</span>
            </Button>

            <div className="text-center text-sm text-slate-600 dark:text-gray-400">
              Already have an account?{" "}
              <Link to = "/sign-in" className="hover:underline text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                Sign in
              </Link>
            </div>
          </form>
    //     </CardContent>
    //   </Card>
    // </div>
  )
}
