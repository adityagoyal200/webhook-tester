import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { authService } from '../services/authService';
 
type User = { id: string; email?: string } | null;
type UserProfile = Record<string, any> | null;

type AuthContextValue = {
  user: User;
  userProfile: UserProfile;
  loading: boolean;
  profileLoading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<any>;
  signOut: () => Promise<any>;
  resetPassword: (email: string) => Promise<any>;
  updatePassword: (password: string) => Promise<any>;
  updateProfile: (updates: Record<string, any>) => Promise<{ data?: any; error?: any }>;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children?: ReactNode }) => {
  const [user, setUser] = useState<User>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);

  // Isolated async operations - never called from auth callbacks
  const profileOperations = {
    async load(userId?: string) {
      if (!userId) return
      setProfileLoading(true)
      try {
        const { data, error } = await supabase?.from('user_profiles')?.select('*')?.eq('id', userId)?.single()
        if (!error && data) {
          setUserProfile(data)
        } else if (error && error?.code !== 'PGRST116') {
          // Log non-404 errors but don't show to user during auth flow
          console.error('Profile load error:', error?.message)
        }
      } catch (error) {
        console.error('Profile load error:', error)
      } finally {
        setProfileLoading(false)
      }
    },

    clear() {
      setUserProfile(null)
      setProfileLoading(false)
    }
  }

  // Auth state handlers - PROTECTED from async modification
  const authStateHandlers = {
    // This handler MUST remain synchronous - Supabase requirement
    onChange: (_event: any, session: any) => {
      setUser(session?.user ?? null)
      setLoading(false)
      
      if (session?.user) {
        profileOperations?.load(session?.user?.id) // Fire-and-forget
      } else {
        profileOperations?.clear()
      }
    }
  }

  useEffect(() => {
    // Initial session check
    supabase?.auth?.getSession()?.then(({ data: { session } }) => {
      authStateHandlers?.onChange(null, session)
    })

    // CRITICAL: This must remain synchronous
    const { data: { subscription } } = supabase?.auth?.onAuthStateChange(
      authStateHandlers?.onChange
    )

    return () => subscription?.unsubscribe()
  }, [])

  // Auth methods using authService
  const signIn = async (email: string, password: string) => {
    return await authService?.signIn(email, password);
  }

  const signUp = async (email: string, password: string, metadata: Record<string, any> = {}) => {
    return await authService?.signUp(email, password, metadata);
  }

  const signOut = async () => {
    const result = await authService?.signOut()
    if (!result?.error) {
      setUser(null)
      profileOperations?.clear()
    }
    return result
  }

  const resetPassword = async (email: string) => {
    return await authService?.resetPassword(email);
  }

  const updatePassword = async (password: string) => {
    return await authService?.updatePassword(password);
  }

  const updateProfile = async (updates: Record<string, any>) => {
    if (!user) return { error: { message: 'No user logged in' } } as { error: { message: string } }
    
    try {
      const { data, error } = await supabase?.from('user_profiles')?.update(updates)?.eq('id', user?.id)?.select()?.single()
      if (!error && data) {
        setUserProfile(data)
      }
      return { data, error }
    } catch (error) {
      return { error: { message: 'Network error. Please try again.' } }
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    profileLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
