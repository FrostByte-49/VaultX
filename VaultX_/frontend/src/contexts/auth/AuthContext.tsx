// src/contexts/auth/AuthContext.tsx
import { createContext } from 'react';
import { type User, type Session } from '@supabase/supabase-js';

export type AuthContextType = {
  user: User | null;
  session: Session | null; 
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);