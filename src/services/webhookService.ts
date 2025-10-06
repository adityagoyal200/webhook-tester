import { supabase, SUPABASE_URL } from '../lib/supabase';
import { userService } from './userService';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export const webhookService = {
  // Resolve functions base from env or SUPABASE_URL
  resolveFunctionsBase(): string {
    const envSupabaseUrl = (import.meta as any)?.env?.VITE_SUPABASE_URL as string | undefined;
    const configuredBase = (import.meta as any)?.env?.VITE_FUNCTIONS_BASE_URL as string | undefined;
    const resolvedSupabaseUrl = envSupabaseUrl || SUPABASE_URL;
    
    if (configuredBase) {
      // Ensure configured base has https:// protocol
      return configuredBase.startsWith('http') ? configuredBase : `https://${configuredBase}`;
    }
    
    if (resolvedSupabaseUrl) {
      const functionsUrl = resolvedSupabaseUrl.replace('.supabase.co', '.functions.supabase.co');
      return functionsUrl.startsWith('http') ? functionsUrl : `https://${functionsUrl}`;
    }
    
    return '';
  },

  // Backfill missing webhook URLs for a user
  async backfillMissingWebhookUrls(userId: string) {
    const functionsBase = this.resolveFunctionsBase();
    if (!functionsBase) return { updated: 0 };

    const { data: rows, error } = await supabase
      ?.from('webhooks')
      ?.select('id, url')
      ?.eq('user_id', userId)
      ?.limit(1000);

    if (error || !rows?.length) return { updated: 0 };

    const needsUpdate = rows.filter((w: any) => {
      if (!w?.url) return true;
      const mustContain = `/catch-webhook/${w.id}`;
      return !String(w.url).includes(mustContain);
    });

    if (!needsUpdate.length) return { updated: 0 };

    const updates = needsUpdate.map((w: any) => ({ id: w.id, url: `${functionsBase}/catch-webhook/${w.id}` }));
    const { error: updateError } = await supabase
      ?.from('webhooks')
      ?.upsert(updates);

    if (updateError) return { updated: 0 };
    return { updated: updates.length };
  },
  // Get all webhooks for the current user
  async getUserWebhooks(userId?: string) {
    console.log('webhookService.getUserWebhooks called with userId:', userId);
    try {
      const { data, error } = await supabase
        ?.from('webhooks')
        ?.select(`
          *,
          webhook_analytics(
            total_requests,
            successful_requests,
            failed_requests,
            avg_response_time_ms
          )
        `)
        ?.eq('user_id', userId)
        ?.order('created_at', { ascending: false });

      if (error) {
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
        error: { message: 'Failed to load webhooks. Please try again.' }
      };
    }
  },

  // Get a single webhook by ID
  async getWebhook(id: string) {
    try {
      const { data, error } = await supabase
        ?.from('webhooks')
        ?.select(`
          *,
          webhook_analytics(
            total_requests,
            successful_requests,
            failed_requests,
            avg_response_time_ms
          )
        `)
        ?.eq('id', id)
        ?.single();

      if (error) {
        if (error?.code === 'PGRST116') {
          return { data: null, error: { message: 'Webhook not found.' } };
        }
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: { message: 'Failed to load webhook details. Please try again.' }
      };
    }
  },

  // Create a new webhook
  async createWebhook(webhookData: Record<string, any>) {
    try {
      // Check if user can create more webhooks
      const userId = webhookData.user_id;
      if (!userId) {
        return { data: null, error: { message: 'User ID is required' } };
      }

      const { data: limits } = await userService.checkSubscriptionLimits(userId);
      if (limits && !limits.canCreateWebhook) {
        return { 
          data: null, 
          error: { 
            message: `Webhook limit reached (${limits.currentWebhooks}/${limits.webhookLimit}). Upgrade your plan to create more webhooks.` 
          } 
        };
      }

      const functionsBase = this.resolveFunctionsBase();

      let webhookUrl = ''; 
      if (functionsBase) {
        webhookUrl = `${functionsBase}/catch-webhook/`;
      } else {
        console.warn('Warning: functionsBase is empty. Webhook URL might be incomplete due to missing VITE_SUPABASE_URL or VITE_FUNCTIONS_BASE_URL.');
      }
      console.log('Debug: functionsBase:', functionsBase);
      console.log('Debug: Initial webhookUrl:', webhookUrl);

      const { data, error } = await supabase
        ?.from('webhooks')
        ?.insert([{ 
          ...webhookData,
          secret_key: await this.generateSecretKey(),
          url: webhookUrl // Include url in the initial insert
        }])
        ?.select()
        ?.single();

      if (error) {
        return { data: null, error };
      }

      // If we have a base, set the webhook URL to the catch function with webhook id
      if (functionsBase && data?.id) {
        const url = `${functionsBase}/catch-webhook/${data.id}`;
        const { data: updated, error: updateError } = await supabase
          ?.from('webhooks')
          ?.update({ url })
          ?.eq('id', data.id)
          ?.select()
          ?.single();

        if (!updateError) {
          return { data: updated, error: null };
        }
      }

      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: { message: 'Failed to create webhook. Please try again.' }
      };
    }
  },

  // Update a webhook
  async updateWebhook(id: string, updates: Record<string, any>) {
    try {
      const { data, error } = await supabase
        ?.from('webhooks')
        ?.update(updates)
        ?.eq('id', id)
        ?.select()
        ?.single();

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: { message: 'Failed to update webhook. Please try again.' }
      };
    }
  },

  // Delete a webhook
  async deleteWebhook(id: string) {
    try {
      console.log('WebhookService: Deleting webhook with ID:', id);
      
      const { error } = await supabase
        ?.from('webhooks')
        ?.delete()
        ?.eq('id', id);

      if (error) {
        console.error('WebhookService: Delete error:', error);
        return { error };
      }

      console.log('WebhookService: Webhook deleted successfully');
      return { error: null };
    } catch (error) {
      console.error('WebhookService: Delete exception:', error);
      return { 
        error: { message: 'Failed to delete webhook. Please try again.' }
      };
    }
  },

  // Get webhook requests/logs
  async getWebhookRequests(webhookId: string, page: number = 1, limit: number = 20) {
    try {
      const offset = (page - 1) * limit;
      
      const { data, error, count } = await supabase
        ?.from('webhook_requests')
        ?.select('*', { count: 'exact' })
        ?.eq('webhook_id', webhookId)
        ?.order('created_at', { ascending: false })
        ?.range(offset, offset + limit - 1);

      if (error) {
        return { data: null, error, count: 0 };
      }

      return { data, error: null, count };
    } catch (error) {
      return { 
        data: null, 
        error: { message: 'Failed to load webhook requests. Please try again.' },
        count: 0
      };
    }
  },

  // Get webhook analytics
  async getWebhookAnalytics(webhookId: string, days: number = 30) {
    try {
      const startDate = new Date();
      startDate?.setDate(startDate?.getDate() - days);

      const { data, error } = await supabase
        ?.from('webhook_analytics')
        ?.select('*')
        ?.eq('webhook_id', webhookId)
        ?.gte('date', startDate?.toISOString()?.split('T')?.[0])
        ?.order('date', { ascending: true });

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: { message: 'Failed to load webhook analytics. Please try again.' }
      };
    }
  },

  // Generate webhook secret key
  async generateSecretKey() {
    try {
      const { data, error } = await supabase?.rpc('generate_webhook_secret');
      
      if (error) {
        // Fallback to client-side generation
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return 'whsec_' + Array.from(array, byte => byte?.toString(16)?.padStart(2, '0'))?.join('');
      }
      
      return data;
    } catch (error) {
      // Fallback to client-side generation
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      return 'whsec_' + Array.from(array, byte => byte?.toString(16)?.padStart(2, '0'))?.join('');
    }
  },

  // Test webhook endpoint
  async testWebhook(webhookId: string, testPayload: Record<string, any> = {}, testMethod: string = 'POST', testHeaders: Record<string, string> = {}) {
    try {
      const { data, error } = await supabase
        ?.from('webhook_requests')
        ?.insert([{
          webhook_id: webhookId,
          method: testMethod,
          headers: { 
            'Content-Type': 'application/json', 
            'User-Agent': 'HookCatch-Test/1.0',
            ...testHeaders
          },
          payload: testPayload,
          response_status: 200,
          status: 200,
          processing_time_ms: Math.floor(Math.random() * 500) + 50,
          ip_address: '127.0.0.1'
        }])
        ?.select()
        ?.single();

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: { message: 'Failed to test webhook. Please try again.' }
      };
    }
  },

  // Subscribe to real-time webhook requests
  subscribeToWebhookRequests(webhookId: string, callback: (payload: RealtimePostgresChangesPayload<any>) => void): RealtimeChannel | null {
    const channel: RealtimeChannel | null = supabase
      ?.channel(`webhook_requests_${webhookId}`)
      ?.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'webhook_requests',
          filter: `webhook_id=eq.${webhookId}`
        },
        callback
      )
      ?.subscribe();

    return channel;
  },

  // Unsubscribe from real-time updates
  unsubscribeFromWebhookRequests(channel: RealtimeChannel | null) {
    if (channel) {
      supabase?.removeChannel(channel);
    }
  },

  // Get webhook statistics
  async getWebhookStats(webhookId: string) {
    try {
      // Get total requests count
      const { count: totalRequests, error: totalError } = await supabase
        ?.from('webhook_requests')
        ?.select('*', { count: 'exact', head: true })
        ?.eq('webhook_id', webhookId);

      if (totalError) {
        return { data: null, error: totalError };
      }

      // Get today's requests count
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayRequests, error: todayError } = await supabase
        ?.from('webhook_requests')
        ?.select('*', { count: 'exact', head: true })
        ?.eq('webhook_id', webhookId)
        ?.gte('created_at', today.toISOString());

      if (todayError) {
        return { data: null, error: todayError };
      }

      // Get success/error rates
      const { count: successCount, error: successError } = await supabase
        ?.from('webhook_requests')
        ?.select('*', { count: 'exact', head: true })
        ?.eq('webhook_id', webhookId)
        ?.gte('status', 200)
        ?.lt('status', 400);

      if (successError) {
        return { data: null, error: successError };
      }

      const { count: errorCount, error: errorError } = await supabase
        ?.from('webhook_requests')
        ?.select('*', { count: 'exact', head: true })
        ?.eq('webhook_id', webhookId)
        ?.gte('status', 400);

      if (errorError) {
        return { data: null, error: errorError };
      }

      // Get average response time
      const { data: responseTimeData, error: responseTimeError } = await supabase
        ?.from('webhook_requests')
        ?.select('processing_time_ms')
        ?.eq('webhook_id', webhookId)
        ?.not('processing_time_ms', 'is', null);

      if (responseTimeError) {
        return { data: null, error: responseTimeError };
      }

      const avgResponseTime = responseTimeData && responseTimeData.length > 0
        ? responseTimeData.reduce((sum, req) => sum + (req.processing_time_ms || 0), 0) / responseTimeData.length
        : 0;

      const total = totalRequests || 0;
      const success = successCount || 0;
      const error = errorCount || 0;

      const stats = {
        totalRequests: total,
        todayRequests: todayRequests || 0,
        avgResponseTime: Math.round(avgResponseTime),
        successRate: total > 0 ? (success / total) * 100 : 0,
        errorRate: total > 0 ? (error / total) * 100 : 0,
      };

      return { data: stats, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: { message: 'Failed to load webhook statistics. Please try again.' }
      };
    }
  }
};