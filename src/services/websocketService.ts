import { supabase } from '../lib/supabase';

export interface WebhookRequest {
  id: string;
  webhook_id: string;
  method: string;
  status: number;
  ip_address?: string;
  user_agent?: string;
  headers: Record<string, string>;
  payload: any;
  response_status?: number;
  processing_time_ms?: number;
  created_at: string;
}

export interface WebhookStats {
  totalRequests: number;
  todayRequests: number;
  avgResponseTime: number;
  successRate: number;
  errorRate: number;
}

export interface WebSocketService {
  connect: (userId: string) => void;
  disconnect: () => void;
  subscribeToWebhook: (webhookId: string, callback: (request: WebhookRequest) => void) => void;
  subscribeToStats: (webhookId: string, callback: (stats: WebhookStats) => void) => void;
  unsubscribeFromWebhook: (webhookId: string) => void;
  isConnected: () => boolean;
}

class WebSocketServiceImpl implements WebSocketService {
  private ws: WebSocket | null = null;
  private userId: string | null = null;
  private subscriptions: Map<string, (data: any) => void> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;

  connect(userId: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.userId = userId;
    const wsUrl = process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:8080';
    
    try {
      this.ws = new WebSocket(`${wsUrl}?userId=${userId}`);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.setupSupabaseRealtime();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }

  private setupSupabaseRealtime() {
    // Subscribe to webhook_requests table changes
    supabase
      .channel('webhook-requests')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'webhook_requests'
        },
        (payload) => {
          this.handleNewWebhookRequest(payload.new as WebhookRequest);
        }
      )
      .subscribe();

    // Subscribe to webhooks table changes
    supabase
      .channel('webhooks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'webhooks'
        },
        (payload) => {
          this.handleWebhookChange(payload);
        }
      )
      .subscribe();
  }

  private handleNewWebhookRequest(request: WebhookRequest) {
    // Notify subscribers about new webhook request
    this.subscriptions.forEach((callback) => {
      if (callback.name === 'webhookRequest') {
        callback(request);
      }
    });
  }

  private handleWebhookChange(payload: any) {
    // Notify subscribers about webhook changes
    this.subscriptions.forEach((callback) => {
      if (callback.name === 'webhookChange') {
        callback(payload);
      }
    });
  }

  private handleMessage(data: any) {
    const { type, payload } = data;
    
    switch (type) {
      case 'webhook_request':
        this.subscriptions.forEach((callback) => {
          if (callback.name === 'webhookRequest') {
            callback(payload);
          }
        });
        break;
      case 'webhook_stats':
        this.subscriptions.forEach((callback) => {
          if (callback.name === 'webhookStats') {
            callback(payload);
          }
        });
        break;
      default:
        console.log('Unknown message type:', type);
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.userId) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(this.userId!);
      }, this.reconnectInterval);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  subscribeToWebhook(webhookId: string, callback: (request: WebhookRequest) => void) {
    const subscriptionKey = `webhook_${webhookId}`;
    const wrappedCallback = (data: any) => {
      if (data.webhook_id === webhookId) {
        callback(data);
      }
    };
    wrappedCallback.name = 'webhookRequest';
    this.subscriptions.set(subscriptionKey, wrappedCallback);
  }

  subscribeToStats(webhookId: string, callback: (stats: WebhookStats) => void) {
    const subscriptionKey = `stats_${webhookId}`;
    const wrappedCallback = (data: any) => {
      if (data.webhook_id === webhookId) {
        callback(data);
      }
    };
    wrappedCallback.name = 'webhookStats';
    this.subscriptions.set(subscriptionKey, wrappedCallback);
  }

  unsubscribeFromWebhook(webhookId: string) {
    const subscriptionKey = `webhook_${webhookId}`;
    this.subscriptions.delete(subscriptionKey);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
    this.userId = null;
  }

  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const websocketService = new WebSocketServiceImpl();
