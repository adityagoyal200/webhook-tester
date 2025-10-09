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
  updatePassword: (currentPassword: string, newPassword: string) => Promise<any>;
  updateProfile: (updates: Record<string, any>) => Promise<{ data?: any; error?: any }>;
  refreshProfile: () => Promise<{ data?: any; error?: any }>;
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
        console.log('AuthContext loading profile for user:', userId);
        const { data, error } = await supabase?.from('user_profiles')?.select('*')?.eq('id', userId)?.single()
        if (!error && data) {
          console.log('AuthContext profile loaded:', data);
          setUserProfile(data)
        } else if (error && error?.code !== 'PGRST116') {
          // Log non-404 errors but don't show to user during auth flow
          console.error('Profile load error:', error?.message)
        } else if (error?.code === 'PGRST116') {
          console.log('Profile not found, user might be new');
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

  // Ensure profile loads if user exists but profile is null
  useEffect(() => {
    if (user && !userProfile && !profileLoading) {
      console.log('AuthContext: User exists but profile is null, retrying load for:', user.id);
      profileOperations?.load(user?.id);
    }
  }, [user, userProfile, profileLoading])

  // Auth methods using authService
  const signIn = async (email: string, password: string) => {
    return await authService?.signIn(email, password);
  }

  const signUp = async (email: string, password: string, metadata: Record<string, any> = {}) => {
    return await authService?.signUp(email, password, metadata);
  }

  const signOut = async () => {
    try {
      console.log('Signing out user');
      const result = await authService?.signOut()
      
      if (!result?.error) {
        console.log('Sign out successful, clearing user state');
        setUser(null)
        profileOperations?.clear()
        
        // Clear any stored data
        localStorage.removeItem('rememberMe');
        
        // Redirect to login page
        window.location.href = '/login';
      } else {
        console.error('Sign out error:', result.error);
      }
      
      return result
    } catch (error) {
      console.error('Sign out error:', error);
      return { error: { message: 'Failed to sign out. Please try again.' } }
    }
  }

  const resetPassword = async (email: string) => {
    return await authService?.resetPassword(email);
  }

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    return await authService?.updatePassword({ currentPassword, newPassword });
  }

  const updateProfile = async (updates: Record<string, any>) => {
    if (!user) return { error: { message: 'No user logged in' } } as { error: { message: string } }
    
    try {
      console.log('AuthContext updateProfile:', { userId: user.id, updates });
      const { data, error } = await supabase?.from('user_profiles')?.update(updates)?.eq('id', user?.id)?.select()
      if (error) {
        console.error('Supabase update error:', error);
        return { data: null, error };
      }
      if (data && data.length > 0) {
        console.log('AuthContext profile updated:', data[0]);
        setUserProfile(data[0]) 
        return { data: data[0], error: null }
      } else {
        console.warn('Profile update returned no data. User profile might be missing or RLS policy prevented update.');
        return { data: null, error: { message: 'Profile not found or update failed.' } };
      }
    } catch (error) {
      console.error('AuthContext updateProfile error:', error);
      return { error: { message: 'Network error. Please try again.' } }
    }
  }

  const refreshProfile = async () => {
    if (!user) return { error: { message: 'No user logged in' } } as { error: { message: string } }
    
    try {
      console.log('AuthContext refreshProfile:', { userId: user.id });
      profileOperations?.load(user?.id);
      return { data: null, error: null };
    } catch (error) {
      console.error('AuthContext refreshProfile error:', error);
      return { error: { message: 'Failed to refresh profile' } }
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
    refreshProfile,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
