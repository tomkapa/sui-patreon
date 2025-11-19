'use client';

import { User } from '@/types';
import { useCurrentAccount } from '@mysten/dapp-kit';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

type UserRole = 'fan' | 'creator';

interface UserContextType {
  user: User | null;
  currentRole: UserRole;
  setUser: (user: User | null) => void;
  switchRole: (role: UserRole) => void;
  isCreatorMode: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('fan');
  const [isInitialized, setIsInitialized] = useState(false);
  const account = useCurrentAccount();

  // Restore user session and role from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Restore role
      const savedRole = localStorage.getItem('userRole') as UserRole | null;
      if (savedRole === 'creator' || savedRole === 'fan') {
        setCurrentRole(savedRole);
      }

      // Restore zkLogin session if valid
      if (account) {
        setUser({
          address: account.address,
          email: account.label,
          displayName: account.label || 'User',
          avatarUrl: account.icon || '',
          suinsName: null,
          subscriptions: [],
          createdAt: new Date(),
        });
      } else {
        setUser(null);
      }

      setIsInitialized(true);
    }
  }, [account]);

  const switchRole = useCallback((role: UserRole) => {
    setCurrentRole(role);
    // Store preference in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('userRole', role);
    }
  }, []);

  const isCreatorMode = currentRole === 'creator';

  // Don't render children until we've restored the role from localStorage
  // This prevents flash of wrong content
  if (!isInitialized) {
    return null;
  }

  return (
    <UserContext.Provider
      value={{
        user,
        currentRole,
        setUser,
        switchRole,
        isCreatorMode,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
