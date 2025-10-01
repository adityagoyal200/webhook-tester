import { supabase } from '../lib/supabase';

export const authService = {
  // Sign in with email and password
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase?.auth?.signInWithPassword({
        email,
        password
      });

      if (error) {
        // Handle specific Supabase auth errors
        if (error?.message?.includes('Invalid login credentials')) {
          return { 
            data: null, 
            error: { message: 'Invalid email or password. Please try again.' } 
          };
        }
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err: unknown) {
      // Handle network/connection errors
      if (err instanceof Error && (err.message?.includes('Failed to fetch') || 
          err.message?.includes('NetworkError'))) {
        return { 
          data: null, 
          error: { message: 'Cannot connect to authentication service. Your Supabase project may be paused or inactive. Please check your Supabase dashboard and resume your project if needed.' }
        };
      }
      
      return { 
        data: null, 
        error: { message: 'Authentication failed. Please try again.' }
      };
    }
  },

  // Sign up with email and password
  async signUp(email: string, password: string, metadata: Record<string, any> = {}) {
    try {
      const { data, error } = await supabase?.auth?.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });

      if (error) {
        if (error?.message?.includes('User already registered')) {
          return { 
            data: null, 
            error: { message: 'An account with this email already exists. Please sign in instead.' }
          };
        }
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err: unknown) {
      // Handle network/connection errors
      if (err instanceof Error && (err.message?.includes('Failed to fetch') || 
          err.message?.includes('NetworkError'))) {
        return { 
          data: null, 
          error: { message: 'Cannot connect to authentication service. Your Supabase project may be paused or inactive. Please check your Supabase dashboard and resume your project if needed.' }
        };
      }
      
      return { 
        data: null, 
        error: { message: 'Registration failed. Please try again.' }
      };
    }
  },

  // Sign out
  async signOut() {
    try {
      const { error } = await supabase?.auth?.signOut();
      return { error };
    } catch (error) {
      return { 
        error: { message: 'Sign out failed. Please try again.' }
      };
    }
  },

  // Get current session
  async getSession() {
    try {
      const { data: { session }, error } = await supabase?.auth?.getSession();
      return { data: session, error };
    } catch (error) {
      return { 
        data: null, 
        error: { message: 'Failed to get current session.' }
      };
    }
  },

  // Get current user
  async getUser() {
    try {
      const { data: { user }, error } = await supabase?.auth?.getUser();
      return { data: user, error };
    } catch (error) {
      return { 
        data: null, 
        error: { message: 'Failed to get current user.' }
      };
    }
  },

  // Update user metadata
  async updateUser(updates: Record<string, any>) {
    try {
      const { data, error } = await supabase?.auth?.updateUser(updates);
      return { data, error };
    } catch (error) {
      return { 
        data: null, 
        error: { message: 'Failed to update user. Please try again.' }
      };
    }
  },

  // Reset password
  async resetPassword(email: string) {
    try {
      const { data, error } = await supabase?.auth?.resetPasswordForEmail(email, {
        redirectTo: `${window?.location?.origin}/reset-password`
      });
      return { data, error };
    } catch (error) {
      return { 
        data: null, 
        error: { message: 'Failed to send reset email. Please try again.' }
      };
    }
  },

  // Update password
  async updatePassword(password: string) {
    try {
      const { data, error } = await supabase?.auth?.updateUser({
        password
      });
      return { data, error };
    } catch (error) {
      return { 
        data: null, 
        error: { message: 'Failed to update password. Please try again.' }
      };
    }
  }
};