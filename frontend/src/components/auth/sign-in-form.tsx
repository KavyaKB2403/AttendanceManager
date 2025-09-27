import type React from "react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "components/ui/button"
import { Input } from "components/ui/input"
import { Label } from "components/ui/label"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "components/ui/card"
import { Alert, AlertDescription } from "components/ui/alert"
import { authService } from "lib/auth"

interface SignInFormProps {
  onSuccess: (token: string) => void // Updated to accept token
}

export function SignInForm({ onSuccess }: SignInFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  // const navigate = useNavigate() // Removed unused navigate

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Call authService.signIn and get the token
    const result = await authService.signIn(email, password)

    if (result.error) { // Check for error property
      setError(result.error)
      setIsLoading(false)
      return
    }

    if (result.token) { // Check for token property
      onSuccess(result.token)         // Pass the token to onSuccess
      // navigate("/dashboard") // Redirection will be handled by SignInPage
    }

    setIsLoading(false)
  }

  return (
    // <Card className="w-full max-w-md">
    //   <CardHeader className="text-center">
    //     <CardTitle className="text-2xl font-heading font-black text-amber-300">Sign In</CardTitle>
    //     <CardDescription>Enter your credentials to access your account</CardDescription>
    //   </CardHeader>
    //   <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
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
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-700 dark:text-gray-300">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-center" disabled={isLoading}>
            <span>{isLoading ? "Signing in..." : "Sign In"}</span>
          </Button>

          <div className="text-center space-y-2 text-slate-600 dark:text-gray-400">
            <Link to="/forgot-password" className="text-sm hover:underline text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
              Forgot your password?
            </Link>
            <div className="text-sm">
              {"Don't have an account? "}
              <Link to="/signup" className="hover:underline text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                Sign up
              </Link>
            </div>
          </div>
        </form>
    //   </CardContent>
    // </Card>
  )
}
