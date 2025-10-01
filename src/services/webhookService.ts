import { supabase } from '../lib/supabase';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export const webhookService = {
  // Get all webhooks for the current user
  async getUserWebhooks() {
    try {
      const { data, error } = await supabase
        ?.from('webhooks')
        ?.select(`
          *,
          webhook_analytics!inner(
            total_requests,
            successful_requests,
            failed_requests,
            avg_response_time_ms
          )
        `)
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
        ?.select('*')
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
      const { data, error } = await supabase
        ?.from('webhooks')
        ?.insert([{
          ...webhookData,
          secret_key: await this.generateSecretKey()
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
      const { error } = await supabase
        ?.from('webhooks')
        ?.delete()
        ?.eq('id', id);

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
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
  async testWebhook(webhookId: string, testPayload: Record<string, any> = {}) {
    try {
      // In a real application, this would trigger a test request to the webhook URL
      // For now, we'll create a test request record
      const { data, error } = await supabase
        ?.from('webhook_requests')
        ?.insert([{
          webhook_id: webhookId,
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'User-Agent': 'HookCatch-Test/1.0' },
          payload: testPayload,
          response_status: 200,
          status: 'success',
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
  }
};