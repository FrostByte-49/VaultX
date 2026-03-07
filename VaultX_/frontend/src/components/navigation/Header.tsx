import { Vault, Moon, Sun, ArrowLeft, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../../hooks/UseAuth';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

const Header: React.FC<HeaderProps> = ({ showBack = false, onBack }) => {
  const navigate = useNavigate();
//   const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('binx-dark-mode');
      if (saved !== null) return JSON.parse(saved);
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Toggle Dark Mode Class On Html Element
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('binx-dark-mode', 'true');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('binx-dark-mode', 'false');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

//   const handleAuthClick = async () => {
//     if (user) {
//       try {
//         await logout();
//         navigate('/');
//       } catch (error) {
//         console.error('Logout error:', error);
//       }
//     } else {
//       navigate('/login');
//     }
//   };

  // Default Back Behavior
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border backdrop-blur-sm bg-background/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-4 lg:px-4">
        <div className="flex items-center justify-between h-16  ">
          {/* Left Section */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center">
                  <Vault className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-[hsl(142,76%,36%)] rounded-full flex items-center justify-center">
                  <Sparkles className="w-2 h-2 text-white" />
                </div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-foreground leading-tight">VaultX</h1>
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
                <span className="text-sm font-medium text-foreground">Back</span>
              </button>
            )}
            
            {/* User Authentication Section */}
            {/* <div className="flex items-center gap-2">
              {user ? (
                <>
                  User Info
                  <div className="hidden sm:flex items-center gap-3 px-2 py-1 rounded-xl border border-border">
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground leading-tight">
                        {user.displayName || 'User'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {user.email}
                      </p>
                    </div>
                    
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {user.displayName?.[0] || user.email?.[0] || 'U'}
                      </span>
                    </div>
                  </div>
                  
                  Mobile User Icon
                  <div className="sm:hidden w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  
                  Logout Button
                  <button
                    onClick={handleAuthClick}
                    className="group flex items-center justify-center w-10 h-10 rounded-xl border border-destructive/30 hover:bg-destructive/10 transition-colors"
                    aria-label="Logout"
                  >
                    <LogOut className="w-4 h-4 text-destructive group-hover:scale-110 transition-transform" />
                  </button>
                </>
              ) : (
                Login Button
                <button
                  onClick={handleAuthClick}
                  className="group flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:bg-accent transition-colors"
                  aria-label="Login to your account"
                >
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-primary group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-sm font-medium text-foreground hidden sm:inline">
                    Login
                  </span>
                </button>
              )}
            </div> */}
            
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="flex items-center justify-center w-10 h-10 rounded-xl border border-border hover:bg-accent transition-colors group"
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-foreground group-hover:scale-110 transition-transform" />
              ) : (
                <Moon className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;