// src/components/auth/AuthGuard.tsx
import { type ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { Shield } from 'lucide-react';

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
      }
      
      setIsLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}