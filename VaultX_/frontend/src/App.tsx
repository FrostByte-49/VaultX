// src/App.tsx
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './services/supabase';
import Header from './components/navigation/Header';
import BottomNav from './components/navigation/BottomNav';
import HomePage from './pages/Home';
import DashboardPage from './pages/Dashboard';
import VaultPage from './pages/Vault';
import NomineesPage from './pages/Nominees';
import DeadManSwitchPage from './pages/DeadManSwitch';
import SettingsPage from './pages/Settings';
import AuditPage from './pages/Audit';
import NomineeAccessPage from './pages/NomineeAccess';
import LoginPage from './pages/Login';
import SignupPage from './pages/Signup';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Redirect to login with the intended destination
        navigate('/login', { state: { from: location.pathname } });
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(true);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/login', { state: { from: location.pathname } });
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location]);

  // Show loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-primary/20 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
};

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'dashboard';
    if (path === '/vault') return 'vault';
    if (path === '/nominees') return 'nominees';
    if (path === '/dead-man-switch') return 'dead-man-switch';
    if (path === '/settings') return 'settings';
    if (path === '/audit') return 'audit';
    if (path === '/nominee-access') return 'nominee-access';
    if (path === '/login') return 'login';
    if (path === '/signup') return 'signup';
    return 'home';
  };

  const currentPage = getCurrentPage();

  const handleNavigate = (page: string) => {
    const path = page === 'home' ? '/' : `/${page}`;
    navigate(path);
  };

  // Check if current route is public
  const isPublicRoute = currentPage === 'home' || currentPage === 'login' || currentPage === 'signup';

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      {/* Hide Header On Login Page */}
      {currentPage !== 'login' && currentPage !== 'signup' && <Header />}
      
      <main className={!isPublicRoute ? 'pb-16' : ''}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/vault" 
            element={
              <ProtectedRoute>
                <VaultPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/nominees" 
            element={
              <ProtectedRoute>
                <NomineesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dead-man-switch" 
            element={
              <ProtectedRoute>
                <DeadManSwitchPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/audit" 
            element={
              <ProtectedRoute>
                <AuditPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/nominee-access" 
            element={
              <ProtectedRoute>
                <NomineeAccessPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>

      {/* Hide Nav On Auth Pages */}
      {currentPage !== 'login' && currentPage !== 'signup' && (
        <BottomNav currentPage={currentPage} onNavigate={handleNavigate} />
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;