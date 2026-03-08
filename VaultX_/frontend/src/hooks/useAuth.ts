// src/hooks/useAuth.ts
import { useContext } from 'react';
import { AuthContext } from '../contexts/auth/AuthContext';
import { vaultService } from '../services/vaultService';

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  // Wrap the signOut function to also clear vault
  const signOut = async () => {
    await context.signOut();
    vaultService.clear(); // Clear encryption keys on logout
  };

  return {
    ...context,
    signOut
  };
}