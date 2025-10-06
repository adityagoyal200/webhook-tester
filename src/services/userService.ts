import { supabase } from '../lib/supabase';
import { pricingService, PRICING_TIERS } from './pricingService';

export const userService = {
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

  // Permanently delete all user-owned data (webhooks, requests, analytics, profile)
  async deleteUserAccount(userId: string) {
    try {
      // Delete all webhooks owned by the user. Foreign keys will cascade to requests/analytics.
      const { error: webhooksError } = await supabase
        ?.from('webhooks')
        ?.delete()
        ?.eq('user_id', userId);

      if (webhooksError) {
        return { error: webhooksError };
      }

      // Delete user profile row
      const { error: profileError } = await supabase
        ?.from('user_profiles')
        ?.delete()
        ?.eq('id', userId);

      if (profileError) {
        return { error: profileError };
      }

      return { error: null };
    } catch (err: unknown) {
      if (err instanceof Error && err.message?.includes('Failed to fetch')) {
        return { 
          error: { message: 'Cannot connect to database. Your Supabase project may be paused or deleted. Please check your Supabase dashboard.' }
        };
      }
      return { error: { message: 'Failed to delete account. Please try again.' } };
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

      // Get today's and yesterday's requests count
      const todayDate = new Date();
      const todayStr = todayDate.toISOString().split('T')[0];
      const yesterdayDate = new Date(todayDate);
      yesterdayDate.setDate(todayDate.getDate() - 1);
      const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

      let todayRequests = 0;
      let yesterdayRequests = 0;
      if (webhookIds.length) {
        const [todayResult, ydayResult] = await Promise.all([
          supabase
            ?.from('webhook_requests')
            ?.select('webhook_id', { count: 'exact', head: true })
            ?.in('webhook_id', webhookIds)
            ?.gte('created_at', `${todayStr}T00:00:00.000Z`)
            ?.lt('created_at', `${todayStr}T23:59:59.999Z`),
          supabase
            ?.from('webhook_requests')
            ?.select('webhook_id', { count: 'exact', head: true })
            ?.in('webhook_id', webhookIds)
            ?.gte('created_at', `${yesterdayStr}T00:00:00.000Z`)
            ?.lt('created_at', `${yesterdayStr}T23:59:59.999Z`),
        ]);

        if (todayResult?.error) return { data: null, error: todayResult.error };
        if (ydayResult?.error) return { data: null, error: ydayResult.error };
        todayRequests = todayResult?.count || 0;
        yesterdayRequests = ydayResult?.count || 0;
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

      // Compute 7-day vs previous 7-day windows for trend on total requests
      let last7Requests = 0;
      let prev7Requests = 0;
      if (webhookIds.length) {
        const endCurrent = new Date();
        endCurrent.setHours(23, 59, 59, 999);
        const startCurrent = new Date(endCurrent);
        startCurrent.setDate(endCurrent.getDate() - 6); // inclusive 7 days
        startCurrent.setHours(0, 0, 0, 0);

        const endPrev = new Date(startCurrent);
        endPrev.setHours(23, 59, 59, 999);
        const startPrev = new Date(endPrev);
        startPrev.setDate(endPrev.getDate() - 6);
        startPrev.setHours(0, 0, 0, 0);

        const [last7, prev7] = await Promise.all([
          supabase
            ?.from('webhook_requests')
            ?.select('webhook_id', { count: 'exact', head: true })
            ?.in('webhook_id', webhookIds)
            ?.gte('created_at', startCurrent.toISOString())
            ?.lte('created_at', endCurrent.toISOString()),
          supabase
            ?.from('webhook_requests')
            ?.select('webhook_id', { count: 'exact', head: true })
            ?.in('webhook_id', webhookIds)
            ?.gte('created_at', startPrev.toISOString())
            ?.lte('created_at', endPrev.toISOString()),
        ]);

        if (last7?.error) return { data: null, error: last7.error };
        if (prev7?.error) return { data: null, error: prev7.error };
        last7Requests = last7?.count || 0;
        prev7Requests = prev7?.count || 0;
      }

      const stats = {
        totalWebhooks: webhookCount || 0,
        activeWebhooks: activeWebhooks || 0,
        totalRequests,
        todayRequests,
        yesterdayRequests,
        last7Requests,
        prev7Requests
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

      const tierId = profile?.subscription_tier || 'free';
      const tier = pricingService.getTier(tierId);

      if (!tier) {
        return { data: null, error: { message: 'Invalid subscription tier' } };
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

      const webhookLimit = tier.limits.webhooks === -1 ? Infinity : tier.limits.webhooks;
      const requestLimit = tier.limits.requestsPerMonth === -1 ? Infinity : tier.limits.requestsPerMonth;
      
      // For free tier, also check daily limits
      let dailyRequestCount = 0;
      if (tierId === 'free' && currentMonthRequests > 0) {
        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Count requests from today
        if (webhookIds2.length) {
          const { count: todayRequestsCount } = await supabase
            ?.from('webhook_requests')
            ?.select('webhook_id', { count: 'exact', head: true })
            ?.in('webhook_id', webhookIds2)
            ?.gte('created_at', today.toISOString())
            ?.lt('created_at', tomorrow.toISOString());
          
          dailyRequestCount = todayRequestsCount || 0;
        }
      }
      
      const limits = {
        tier: tierId,
        tierName: tier.name,
        webhookLimit: webhookLimit,
        requestLimit: requestLimit,
        currentWebhooks: currentWebhooks || 0,
        currentRequests: currentMonthRequests || 0,
        dailyRequests: dailyRequestCount,
        canCreateWebhook: (currentWebhooks || 0) < webhookLimit,
        webhookUsagePercent: webhookLimit === Infinity ? 0 : Math.round(((currentWebhooks || 0) / webhookLimit) * 100),
        requestUsagePercent: requestLimit === Infinity ? 0 : Math.round(((currentMonthRequests || 0) / requestLimit) * 100),
        dailyUsagePercent: tierId === 'free' ? Math.round((dailyRequestCount / 5) * 100) : 0,
        tierLimits: tier.limits,
        tierFeatures: tier.features
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