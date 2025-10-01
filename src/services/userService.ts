import { supabase } from '../lib/supabase';

export const userService = {
  // Get user profile
  async getUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        ?.from('user_profiles')
        ?.select('*')
        ?.eq('id', userId)
        ?.single();

      if (error) {
        if (error?.code === 'PGRST116') {
          return { data: null, error: { message: 'User profile not found.' } };
        }
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err: unknown) {
      if (err instanceof Error && err.message?.includes('Failed to fetch')) {
        return { 
          data: null, 
          error: { message: 'Cannot connect to database. Your Supabase project may be paused or deleted. Please visit your Supabase dashboard to check project status.' }
        };
      }
      
      return { 
        data: null, 
        error: { message: 'Failed to load user profile. Please try again.' }
      };
    }
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: Record<string, unknown>) {
    try {
      const { data, error } = await supabase
        ?.from('user_profiles')
        ?.update(updates)
        ?.eq('id', userId)
        ?.select()
        ?.single();

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: { message: 'Failed to update profile. Please try again.' }
      };
    }
  },

  // Get user dashboard stats
  async getUserStats(userId: string) {
    try {
      // Get webhook count
      const { count: webhookCount, error: webhookError } = await supabase
        ?.from('webhooks')
        ?.select('*', { count: 'exact', head: true })
        ?.eq('user_id', userId);

      if (webhookError) {
        return { data: null, error: webhookError };
      }

      // Prepare list of webhook ids for subsequent queries
      const { data: webhookRows, error: idsError } = await supabase
        ?.from('webhooks')
        ?.select('id')
        ?.eq('user_id', userId);

      if (idsError) {
        return { data: null, error: idsError };
      }

      const webhookIds = (webhookRows ?? []).map((w: { id: string }) => w.id);

      // Get total requests count
      let totalRequests = 0;
      if (webhookIds.length) {
        const { count: totalRequestsCount, error: requestsError } = await supabase
          ?.from('webhook_requests')
          ?.select('webhook_id', { count: 'exact', head: true })
          ?.in('webhook_id', webhookIds);

        if (requestsError) {
          return { data: null, error: requestsError };
        }
        totalRequests = totalRequestsCount || 0;
      }

      // Get today's requests count
      const today = new Date()?.toISOString()?.split('T')?.[0];
      let todayRequests = 0;
      if (webhookIds.length) {
        const { count: todayRequestsCount, error: todayError } = await supabase
          ?.from('webhook_requests')
          ?.select('webhook_id', { count: 'exact', head: true })
          ?.in('webhook_id', webhookIds)
          ?.gte('created_at', `${today}T00:00:00.000Z`)
          ?.lt('created_at', `${today}T23:59:59.999Z`);

        if (todayError) {
          return { data: null, error: todayError };
        }
        todayRequests = todayRequestsCount || 0;
      }

      // Get active webhooks count
      const { count: activeWebhooks, error: activeError } = await supabase
        ?.from('webhooks')
        ?.select('*', { count: 'exact', head: true })
        ?.eq('user_id', userId)
        ?.eq('status', 'active');

      if (activeError) {
        return { data: null, error: activeError };
      }

      const stats = {
        totalWebhooks: webhookCount || 0,
        activeWebhooks: activeWebhooks || 0,
        totalRequests,
        todayRequests
      };

      return { data: stats, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: { message: 'Failed to load dashboard stats. Please try again.' }
      };
    }
  },

  // Get recent webhook activity
  async getRecentActivity(userId: string, limit: number = 10) {
    try {
      const { data, error } = await supabase
        ?.from('webhook_requests')
        ?.select(`
          *,
          webhooks!inner(
            id,
            name,
            user_id
          )
        `)
        ?.eq('webhooks.user_id', userId)
        ?.order('created_at', { ascending: false })
        ?.limit(limit);

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: { message: 'Failed to load recent activity. Please try again.' }
      };
    }
  },

  // Check user subscription limits
  async checkSubscriptionLimits(userId: string) {
    try {
      const { data: profile, error: profileError } = await this.getUserProfile(userId);
      
      if (profileError) {
        return { data: null, error: profileError };
      }

      const { count: currentWebhooks, error: webhookError } = await supabase
        ?.from('webhooks')
        ?.select('*', { count: 'exact', head: true })
        ?.eq('user_id', userId);

      if (webhookError) {
        return { data: null, error: webhookError };
      }

      // Get current month's requests
      const startOfMonth = new Date();
      startOfMonth?.setDate(1);
      startOfMonth?.setHours(0, 0, 0, 0);

      const { data: webhookRows2, error: idsError2 } = await supabase
        ?.from('webhooks')
        ?.select('id')
        ?.eq('user_id', userId);

      if (idsError2) {
        return { data: null, error: idsError2 };
      }

      const webhookIds2 = (webhookRows2 ?? []).map((w: { id: string }) => w.id);

      let currentMonthRequests = 0;
      if (webhookIds2.length) {
        const { count: currentMonthRequestsCount, error: requestsError } = await supabase
          ?.from('webhook_requests')
          ?.select('webhook_id', { count: 'exact', head: true })
          ?.in('webhook_id', webhookIds2)
          ?.gte('created_at', startOfMonth?.toISOString());

        if (requestsError) {
          return { data: null, error: requestsError };
        }
        currentMonthRequests = currentMonthRequestsCount || 0;
      }

      // requestsError handled within the block above when webhookIds2 is non-empty

      const limits = {
        webhookLimit: profile?.webhook_limit || 5,
        requestLimit: profile?.request_limit || 1000,
        currentWebhooks: currentWebhooks || 0,
        currentRequests: currentMonthRequests || 0,
        canCreateWebhook: (currentWebhooks || 0) < (profile?.webhook_limit || 5),
        webhookUsagePercent: Math.round(((currentWebhooks || 0) / (profile?.webhook_limit || 5)) * 100),
        requestUsagePercent: Math.round(((currentMonthRequests || 0) / (profile?.request_limit || 1000)) * 100)
      };

      return { data: limits, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: { message: 'Failed to check subscription limits. Please try again.' }
      };
    }
  }
};