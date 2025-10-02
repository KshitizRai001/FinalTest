import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Train,
  PlayCircle,
  Database,
  Settings2,
  History,
  Sparkles,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import ModeToggle from "@/components/ModeToggle";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getUserDisplayName } from "@/lib/auth";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  
  const nav = [
    { to: "/dashboard", label: "Dashboard", icon: Sparkles },
    { to: "/data", label: "Data Feeds", icon: Database },
    { to: "/rules", label: "Rules", icon: Settings2 },
    { to: "/simulate", label: "Simulate", icon: PlayCircle },
    { to: "/history", label: "History", icon: History },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error(error.message || 'Logout failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b">
        <div className="container mx-auto flex items-center justify-between py-3">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="h-9 w-9 grid place-items-center rounded-md bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-brand">
              <Train className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="font-extrabold tracking-tight">R.O.P.S.</div>
              <div className="text-xs text-muted-foreground">
                Rail Optmization and Planning System
              </div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-1.5">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "px-3.5 py-2 rounded-full text-sm font-medium transition-colors",
                  pathname === n.to
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                )}
              >
                <span className="inline-flex items-center gap-2">
                  <n.icon className="h-4 w-4" /> {n.label}
                </span>
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild size="sm">
              <Link to="/simulate">
                <PlayCircle className="h-4 w-4" /> Run Optimisation
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" /> Logout {user && `(${getUserDisplayName(user)})`}
            </Button>
            {/* Theme toggle */}
            <div className="hidden sm:block">
              <ModeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t">
        <div className="container mx-auto py-6 text-sm text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-2">
          <div>© {new Date().getFullYear()} Kochi Metro Rail Limited</div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-foreground">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground">
              Terms
            </a>
            <a href="#" className="hover:text-foreground">
              Status
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
