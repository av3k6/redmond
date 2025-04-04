
import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu, X, Bell, Mail, ChevronRight, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import ProvinceSelector from "./ProvinceSelector";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import UserMenu from "./UserMenu";

interface MobileMenuProps {
  isAuthenticated: boolean;
  unreadMessageCount: number;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  isAuthenticated,
  unreadMessageCount,
}) => {
  const [open, setOpen] = useState(false);
  const { signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const handleSignOut = async () => {
    setOpen(false); // Close menu first
    
    try {
      const { error } = await signOut();
      
      if (error) {
        console.error("Error signing out:", error);
        toast({
          title: "Error",
          description: "An error occurred while signing out.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
      
      navigate("/");
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Error",
        description: "An error occurred while signing out.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="md:hidden flex items-center">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Menu">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col h-full p-0">
          <div className="border-b py-3 px-4 flex items-center justify-between">
            <h2 className="text-lg font-medium">Menu</h2>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="px-4 py-3">
            <ProvinceSelector className="w-full" />
          </div>

          <div className="px-2 py-4 space-y-1 flex-1 overflow-auto">
            <MobileNavLink to="/" onClick={() => setOpen(false)}>
              Home
            </MobileNavLink>
            <MobileNavLink to="/buy" onClick={() => setOpen(false)}>
              Buy
            </MobileNavLink>
            {isAuthenticated && (
              <MobileNavLink to="/sell" onClick={() => setOpen(false)}>
                Sell
              </MobileNavLink>
            )}
            <MobileNavLink to="/about" onClick={() => setOpen(false)}>
              About
            </MobileNavLink>
            <MobileNavLink to="/professionals" onClick={() => setOpen(false)}>
              Professionals
            </MobileNavLink>
            <MobileNavLink to="/contact" onClick={() => setOpen(false)}>
              Contact Us
            </MobileNavLink>

            {/* Add authentication links */}
            {!isAuthenticated && (
              <>
                <div className="pt-4 pb-1 border-t border-gray-200 dark:border-gray-700">
                  <p className="px-3 text-sm font-medium text-muted-foreground">
                    Account
                  </p>
                </div>
                <MobileNavLink to="/login" onClick={() => setOpen(false)}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </MobileNavLink>
                <MobileNavLink to="/signup" onClick={() => setOpen(false)}>
                  Sign Up
                </MobileNavLink>
              </>
            )}

            {isAuthenticated && (
              <>
                <div className="pt-4 pb-1 border-t border-gray-200 dark:border-gray-700">
                  <p className="px-3 text-sm font-medium text-muted-foreground">
                    Account
                  </p>
                </div>
                <MobileNavLink to="/dashboard" onClick={() => setOpen(false)}>
                  Dashboard
                </MobileNavLink>
                <MobileNavLink to="/messages" onClick={() => setOpen(false)}>
                  Messages
                  {unreadMessageCount > 0 && (
                    <Badge className="ml-1 h-5" variant="secondary">
                      {unreadMessageCount}
                    </Badge>
                  )}
                </MobileNavLink>
                <MobileNavLink to="/showings" onClick={() => setOpen(false)}>
                  My Showings
                </MobileNavLink>
                <MobileNavLink to="/documents" onClick={() => setOpen(false)}>
                  Documents
                </MobileNavLink>
                <MobileNavLink to="/profile" onClick={() => setOpen(false)}>
                  Profile Settings
                </MobileNavLink>
                
                {/* Add logout button */}
                <Button 
                  variant="ghost" 
                  className="flex w-full items-center justify-between px-3 py-2 rounded-md text-sm text-destructive hover:bg-accent hover:text-destructive mt-2"
                  onClick={handleSignOut}
                >
                  <span className="flex items-center">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </span>
                  <ChevronRight className="h-4 w-4 opacity-70" />
                </Button>
              </>
            )}

            <div className="pt-4 px-2 mt-auto border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <ThemeToggle />
              {isAuthenticated && (
                <div className="flex space-x-1">
                  <Button variant="ghost" size="icon" aria-label="Notifications">
                    <Bell className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Messages"
                    asChild
                  >
                    <NavLink to="/messages">
                      <div className="relative">
                        <Mail className="h-5 w-5" />
                        {unreadMessageCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                            {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
                          </span>
                        )}
                      </div>
                    </NavLink>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

interface MobileNavLinkProps {
  to: string;
  children: React.ReactNode;
  onClick?: () => void;
}

const MobileNavLink: React.FC<MobileNavLinkProps> = ({
  to,
  children,
  onClick,
}) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center justify-between px-3 py-2 rounded-md text-sm ${
          isActive
            ? "bg-accent text-accent-foreground font-medium"
            : "text-foreground hover:bg-accent hover:text-accent-foreground"
        }`
      }
      onClick={onClick}
    >
      <span className="flex items-center">{children}</span>
      <ChevronRight className="h-4 w-4 opacity-70" />
    </NavLink>
  );
};

export default MobileMenu;
