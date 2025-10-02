import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Shield, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface SupervisorAuthProps {
  onAuthenticated: (supervisorInfo: { name: string; id: string }) => void;
  children: React.ReactNode;
}

export default function SupervisorAuth({ onAuthenticated, children }: SupervisorAuthProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // For demo purposes, we'll check if the current user is trying to authenticate
      // In a real system, you'd verify supervisor credentials against a database
      if (user && user.email === email) {
        const supervisorInfo = {
          name: user.user_metadata?.first_name || user.email.split('@')[0],
          id: user.id
        };
        
        onAuthenticated(supervisorInfo);
        setIsOpen(false);
        toast.success("Supervisor authentication successful");
        
        // Reset form
        setEmail("");
        setPassword("");
      } else {
        toast.error("Invalid supervisor credentials");
      }
    } catch (error) {
      console.error("Supervisor auth error:", error);
      toast.error("Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Supervisor Authentication
          </DialogTitle>
        </DialogHeader>
        <Card>
          <CardHeader className="pb-4">
            <p className="text-sm text-muted-foreground">
              Manual overrides require supervisor approval. Please enter your credentials to continue.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="supervisor-email">Supervisor Email</Label>
                <Input
                  id="supervisor-email"
                  type="email"
                  placeholder="Enter supervisor email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supervisor-password">Password</Label>
                <div className="relative">
                  <Input
                    id="supervisor-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
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
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? "Authenticating..." : "Authenticate"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}





