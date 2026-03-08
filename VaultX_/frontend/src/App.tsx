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
import { Shield } from 'lucide-react';

// Protected Route Component 
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        if (isMounted) {
          setIsAuthenticated(false);
          navigate('/login', { state: { from: location.pathname }, replace: true });
        }
      } else {
        if (isMounted) {
          setIsAuthenticated(true);
        }
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        if (isMounted) {
          setIsAuthenticated(false);
          navigate('/login', { state: { from: location.pathname }, replace: true });
        }
      } else {
        if (isMounted) {
          setIsAuthenticated(true);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, location]);

  // Show loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary animate-pulse" />
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

  // Check if current route is auth page
  const isAuthPage = currentPage === 'login' || currentPage === 'signup';
  // Check if current route is public
  const isPublicRoute = currentPage === 'home' || isAuthPage;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hide Header On Auth Pages */}
      {!isAuthPage && <Header />}
      
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
          
          {/* Catch-all route for 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {/* Hide BottomNav On Auth Pages */}
      {!isAuthPage && (
        <BottomNav currentPage={currentPage} onNavigate={handleNavigate} />
      )}
    </div>
  );
}

// Simple 404 page component
const NotFoundPage = () => (
  <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
    <Shield className="w-20 h-20 text-primary mb-6" />
    <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>
    <p className="text-muted-foreground mb-6">Page not found</p>
    <button
      onClick={() => window.history.back()}
      className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all"
    >
      Go Back
    </button>
  </div>
);

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;