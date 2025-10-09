import { supabase } from '../lib/supabase';

export const authService = {
  // Sign in with email and password
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase?.auth?.signInWithPassword({
        email,
        password
      });

      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      const ipAddress = ipData.ip;
      const userAgent = navigator.userAgent;

      if (data?.user) {
        await supabase.from('login_history').insert({
          user_id: data.user.id,
          ip_address: ipAddress,
          device_info: userAgent,
          status: 'success',
        });
      }

      if (error) {
        // Log failed login attempt
        if (data?.user?.id) {
          await supabase.from('login_history').insert({
            user_id: data.user.id,
            ip_address: ipAddress,
            device_info: userAgent,
            status: 'failed',
          });
        }
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
      console.log('AuthService signUp:', { email, metadata });
      
      const { data, error } = await supabase?.auth?.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });

      console.log('Supabase signUp response:', { data, error });

      if (error) {
        console.error('Signup error:', error);
        if (error?.message?.includes('User already registered')) {
          return {
            data: null,
            error: { message: 'An account with this email already exists. Please sign in instead.' }
          };
        }
        return { data: null, error };
      }

      // If signup was successful and user was created
      if (data?.user) {
        console.log('User created successfully:', data.user.id);
        
        // The handle_new_user trigger should automatically create the profile
        // But let's also manually ensure the profile is created with the correct metadata
        try {
          const profileData = {
            id: data.user.id,
            email: data.user.email,
            full_name: metadata?.full_name || metadata?.fullName || email.split('@')[0],
            subscription_tier: metadata?.subscription_tier || 'free'
          };

          console.log('Creating user profile:', profileData);
          
          const { data: profileResult, error: profileError } = await supabase
            ?.from('user_profiles')
            ?.upsert(profileData, { onConflict: 'id' })
            ?.select()
            ?.single();

          if (profileError) {
            console.error('Profile creation error:', profileError);
            // Don't fail the signup if profile creation fails - the trigger should handle it
          } else {
            console.log('Profile created successfully:', profileResult);
          }
        } catch (profileErr) {
          console.error('Profile creation error:', profileErr);
          // Don't fail the signup if profile creation fails
        }

        // Log successful signup
        try {
          const ipResponse = await fetch('https://api.ipify.org?format=json');
          const ipData = await ipResponse.json();
          const ipAddress = ipData.ip;
          const userAgent = navigator.userAgent;

          await supabase.from('login_history').insert({
            user_id: data.user.id,
            ip_address: ipAddress,
            device_info: userAgent,
            status: 'success',
          });
        } catch (logErr) {
          console.error('Login history logging error:', logErr);
          // Don't fail signup if logging fails
        }
      }

      return { data, error: null };
    } catch (err: unknown) {
      console.error('Signup error:', err);
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

  // Update password with current password verification
  async updatePassword({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) {
    try {
      // First verify the current password by attempting to sign in
      const { data: { user } } = await supabase?.auth?.getUser();
      if (!user?.email) {
        return { 
          data: null, 
          error: { message: 'No authenticated user found' }
        };
      }

      // Verify current password
      const { error: signInError } = await supabase?.auth?.signInWithPassword({
        email: user.email,
        password: currentPassword
      });

      if (signInError) {
        return { 
          data: null, 
          error: { message: 'Current password is incorrect' }
        };
      }

      // Update to new password
      const { data, error } = await supabase?.auth?.updateUser({
        password: newPassword
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