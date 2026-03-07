// src/components/navigation/Header.tsx
import { Vault, Moon, Sun, ArrowLeft, Sparkles, User, LogOut, ChevronDown, Mail, Shield, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import { type User as UserType } from "@supabase/supabase-js";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

const Header: React.FC<HeaderProps> = ({ showBack = false, onBack }) => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("vaultx-dark-mode");
      if (saved !== null) return JSON.parse(saved);
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  const [user, setUser] = useState<UserType | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Check auth state on mount and listen for changes
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setShowUserMenu(false); // Close menu on auth change
    });

    return () => subscription.unsubscribe();
  }, []);

  // Apply dark mode to HTML root
  useEffect(() => {
    const root = document.documentElement;

    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("vaultx-dark-mode", "true");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("vaultx-dark-mode", "false");
    }
  }, [darkMode]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showUserMenu) {
        const target = e.target as HTMLElement;
        if (!target.closest('.user-menu-container')) {
          setShowUserMenu(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserMenu]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleLoginClick = () => {
    navigate("/login");
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setShowUserMenu(false);
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleDashboardClick = () => {
    navigate("/dashboard");
    setShowUserMenu(false);
  };

  const handleSettingsClick = () => {
    navigate("/settings");
    setShowUserMenu(false);
  };

  // Default back behaviour
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  // Get user display name or email
  const getUserDisplay = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return "User";
  };

  const getUserInitial = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name[0].toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  // Format date for account creation
  const getAccountCreatedDate = () => {
    if (user?.created_at) {
      return new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    return 'N/A';
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border backdrop-blur-sm bg-background/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-4 lg:px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left Section */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              {/* Mobile Back Button */}
              {showBack && (
                <button
                  onClick={handleBack}
                  className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl border border-border hover:bg-accent transition-colors"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-5 h-5 text-foreground" />
                </button>
              )}

              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Vault className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                  <Sparkles className="w-2 h-2 text-white" />
                </div>
              </div>

              <div 
                className="hidden sm:block cursor-pointer hover:opacity-80 transition-opacity" 
                onClick={() => navigate("/")}
              >
                <h1 className="text-xl font-bold text-foreground leading-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  VaultX
                </h1>
                <p className="text-xs text-muted-foreground">
                  Digital Legacy Vault
                </p>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop Back Button */}
            {showBack && (
              <button
                onClick={handleBack}
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:bg-accent transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-4 h-4 text-foreground" />
                <span className="text-sm font-medium text-foreground">
                  Back
                </span>
              </button>
            )}

            {/* User Menu - Only show when logged in */}
            {user && (
              <div className="relative user-menu-container">
                {/* User Button with Purple Icon */}
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border hover:bg-accent transition-all group"
                  aria-label="User menu"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                    <span className="text-sm font-medium text-white">
                      {getUserInitial()}
                    </span>
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-foreground">
                    {getUserDisplay()}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-72 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-fadeIn">
                    {/* User Details Header */}
                    <div className="p-4 bg-gradient-to-r from-primary/5 to-purple-500/5 border-b border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center shadow-md">
                          <span className="text-lg font-bold text-white">
                            {getUserInitial()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">
                            {getUserDisplay()}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user?.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* User Details */}
                    <div className="p-3 border-b border-border bg-muted/20">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>Member since: {getAccountCreatedDate()}</span>
                      </div>
                      {user?.user_metadata?.full_name && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <User className="w-3 h-3" />
                          <span>{user.user_metadata.full_name}</span>
                        </div>
                      )}
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      <button
                        onClick={handleDashboardClick}
                        className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-accent rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <Vault className="w-4 h-4 text-primary" />
                        Dashboard
                      </button>
                      <button
                        onClick={handleSettingsClick}
                        className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-accent rounded-lg flex items-center gap-2 transition-colors mt-1"
                      >
                        <Shield className="w-4 h-4 text-purple-500" />
                        Settings
                      </button>
                    </div>

                    {/* Logout Button */}
                    <div className="p-2 border-t border-border">
                      <button
                        onClick={handleLogout}
                        className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-red-500/10 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Login Button - Only show when not logged in */}
            {!user && (
              <button
                onClick={handleLoginClick}
                className="group flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:bg-accent transition-all hover:scale-105"
                aria-label="Login to your account"
              >
                <div className="w-6 h-6 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <User className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-medium text-foreground hidden sm:inline">
                  Login
                </span>
              </button>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="flex items-center justify-center w-10 h-10 rounded-xl border border-border hover:bg-accent transition-all hover:scale-110 group"
              aria-label={
                darkMode ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-foreground group-hover:rotate-90 transition-transform" />
              ) : (
                <Moon className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:scale-110 transition-all" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Add fadeIn animation to index.css if not exists */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </header>
  );
};

export default Header;  