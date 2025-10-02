import { Train, LogIn, Shield, Users, Eye, EyeOff } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { user, loading, signIn, signUp } = useAuth();
  const [showStaffLogin, setShowStaffLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signIn(email, password);
      toast.success(`Welcome back!`);
      navigate("/");
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Login failed");
    }

    setIsLoading(false);
  };

  const handleStaffSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signUp(email, password, {
        first_name: firstName,
        last_name: lastName,
        username: username
      });
      
      toast.success("Account created successfully! Please check your email to confirm your account.");
      setShowSignup(false);
      setUsername("");
      setPassword("");
      setFirstName("");
      setLastName("");
      setEmail("");
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error.message || "Signup failed");
    }

    setIsLoading(false);
  };

  if (showStaffLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="absolute inset-0 -z-10 bg-mesh bg-grid" />
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="h-10 w-10 grid place-items-center rounded-md bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-brand">
                <Train className="h-5 w-5" />
              </div>
              <div className="leading-tight text-left">
                <div className="font-extrabold tracking-tight text-xl">
                  R.O.P.S.
                </div>
                <div className="text-xs text-muted-foreground">
                  Rail Optmization and Planning System
                </div>
              </div>
            </div>
            <CardTitle>Staff Login</CardTitle>
            <CardDescription>Enter your credentials to access the system</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <form onSubmit={handleStaffLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
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
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign in"}
                  {!isLoading && <LogIn className="h-4 w-4 ml-2" />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowStaffLogin(false)}
                >
                  Back to options
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setShowStaffLogin(false);
                    setShowSignup(true);
                  }}
                >
                  Create new account
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showSignup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="absolute inset-0 -z-10 bg-mesh bg-grid" />
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="h-10 w-10 grid place-items-center rounded-md bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-brand">
                <Train className="h-5 w-5" />
              </div>
              <div className="leading-tight text-left">
                <div className="font-extrabold tracking-tight text-xl">
                  R.O.P.S.
                </div>
                <div className="text-xs text-muted-foreground">
                  Rail Optmization and Planning System
                </div>
              </div>
            </div>
            <CardTitle>Create Staff Account</CardTitle>
            <CardDescription>Enter your details to create a new staff account</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <form onSubmit={handleStaffSignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password (8+ characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create account"}
                  {!isLoading && <Users className="h-4 w-4 ml-2" />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowSignup(false)}
                >
                  Back to options
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setShowSignup(false);
                    setShowStaffLogin(true);
                  }}
                >
                  Already have an account? Sign in
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="absolute inset-0 -z-10 bg-mesh bg-grid" />
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-10 w-10 grid place-items-center rounded-md bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-brand">
              <Train className="h-5 w-5" />
            </div>
            <div className="leading-tight text-left">
              <div className="font-extrabold tracking-tight text-xl">
                R.O.P.S.
              </div>
              <div className="text-xs text-muted-foreground">
                Rail Optmization and Planning System
              </div>
            </div>
          </div>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Select an access type</CardDescription>
        </CardHeader>
        <CardContent className="pt-2 space-y-3">
          <Button className="w-full" onClick={() => setShowStaffLogin(true)}>
            <LogIn className="h-4 w-4 mr-2" /> Staff login
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowSignup(true)}
          >
            <Users className="h-4 w-4 mr-2" /> Create staff account
          </Button>
          <div className="pt-2 text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Shield className="h-3.5 w-3.5" />
            <span>Authorised personnel only</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
