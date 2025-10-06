import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { webhookService } from '../../../services/webhookService';
import { websocketService, WebhookRequest, WebhookStats } from '../../../services/websocketService';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

interface WebhookWithStats {
  id: string;
  name: string;
  url: string;
  status: string;
  created_at: string;
  totalRequests: number;
  todayRequests: number;
  avgResponseTime: number;
  successRate: number;
  errorRate: number;
  lastRequest?: WebhookRequest;
}

const RealtimeWebhookDashboard = () => {
  const { user } = useAuth();
  const [webhooks, setWebhooks] = useState<WebhookWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<string | null>(null);
  const [recentRequests, setRecentRequests] = useState<WebhookRequest[]>([]);
  const [stats, setStats] = useState<WebhookStats | null>(null);

  // Load initial webhook data
  useEffect(() => {
    const loadWebhooks = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      setError(null);

      try {
        const { data, error: webhooksError } = await webhookService.getWebhooks(user.id);
        
        if (webhooksError) {
          setError(webhooksError.message || 'Failed to load webhooks');
          return;
        }

        if (data) {
          // Load stats for each webhook
          const webhooksWithStats = await Promise.all(
            data.map(async (webhook) => {
              const { data: stats } = await webhookService.getWebhookStats(webhook.id);
              return {
                ...webhook,
                totalRequests: stats?.totalRequests || 0,
                todayRequests: stats?.todayRequests || 0,
                avgResponseTime: stats?.avgResponseTime || 0,
                successRate: stats?.successRate || 0,
                errorRate: stats?.errorRate || 0,
              };
            })
          );
          
          setWebhooks(webhooksWithStats);
        }
      } catch (err) {
        console.error('Error loading webhooks:', err);
        setError('Failed to load webhooks');
      } finally {
        setIsLoading(false);
      }
    };

    loadWebhooks();
  }, [user?.id]);

  // Setup WebSocket connection
  useEffect(() => {
    if (user?.id) {
      websocketService.connect(user.id);
      setIsConnected(websocketService.isConnected());

      // Check connection status periodically
      const interval = setInterval(() => {
        setIsConnected(websocketService.isConnected());
      }, 5000);

      return () => {
        clearInterval(interval);
        websocketService.disconnect();
      };
    }
  }, [user?.id]);

  // Handle real-time webhook requests
  const handleNewRequest = useCallback((request: WebhookRequest) => {
    setRecentRequests(prev => [request, ...prev.slice(0, 9)]); // Keep last 10 requests
    
    // Update webhook stats
    setWebhooks(prev => prev.map(webhook => {
      if (webhook.id === request.webhook_id) {
        return {
          ...webhook,
          totalRequests: webhook.totalRequests + 1,
          todayRequests: webhook.todayRequests + 1,
          lastRequest: request,
        };
      }
      return webhook;
    }));
  }, []);

  // Handle stats updates
  const handleStatsUpdate = useCallback((newStats: WebhookStats) => {
    setStats(newStats);
    
    setWebhooks(prev => prev.map(webhook => {
      if (webhook.id === selectedWebhook) {
        return {
          ...webhook,
          totalRequests: newStats.totalRequests,
          todayRequests: newStats.todayRequests,
          avgResponseTime: newStats.avgResponseTime,
          successRate: newStats.successRate,
          errorRate: newStats.errorRate,
        };
      }
      return webhook;
    }));
  }, [selectedWebhook]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (selectedWebhook && isConnected) {
      websocketService.subscribeToWebhook(selectedWebhook, handleNewRequest);
      websocketService.subscribeToStats(selectedWebhook, handleStatsUpdate);

      return () => {
        websocketService.unsubscribeFromWebhook(selectedWebhook);
      };
    }
  }, [selectedWebhook, isConnected, handleNewRequest, handleStatsUpdate]);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-success';
    if (status >= 400 && status < 500) return 'text-warning';
    if (status >= 500) return 'text-error';
    return 'text-muted-foreground';
  };

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'bg-blue-100 text-blue-800',
      POST: 'bg-green-100 text-green-800',
      PUT: 'bg-yellow-100 text-yellow-800',
      DELETE: 'bg-red-100 text-red-800',
      PATCH: 'bg-purple-100 text-purple-800',
    };
    return colors[method] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-muted-foreground">Loading webhook dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-error/10 border border-error/20 rounded-lg">
        <div className="flex items-center space-x-2">
          <Icon name="AlertTriangle" size={16} className="text-error" />
          <span className="text-sm text-error">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Real-time Webhook Dashboard</h2>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-success' : 'bg-error'}`} />
          <span className="text-sm text-muted-foreground">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Webhook Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {webhooks.map((webhook) => (
          <div
            key={webhook.id}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              selectedWebhook === webhook.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => setSelectedWebhook(webhook.id)}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-foreground truncate">{webhook.name}</h3>
              <span className={`text-xs px-2 py-1 rounded ${
                webhook.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
              }`}>
                {webhook.status}
              </span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Requests:</span>
                <span className="font-medium">{webhook.totalRequests.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Today:</span>
                <span className="font-medium">{webhook.todayRequests}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Success Rate:</span>
                <span className="font-medium text-success">{webhook.successRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg Response:</span>
                <span className="font-medium">{webhook.avgResponseTime}ms</span>
              </div>
            </div>

            {webhook.lastRequest && (
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Last Request:</span>
                  <span>{formatTimestamp(webhook.lastRequest.created_at)}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Selected Webhook Details */}
      {selectedWebhook && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Requests */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Recent Requests</h3>
            {recentRequests.length === 0 ? (
              <div className="text-center py-8">
                <Icon name="Activity" size={32} className="text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No recent requests</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentRequests.map((request) => (
                  <div key={request.id} className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded ${getMethodColor(request.method)}`}>
                          {request.method}
                        </span>
                        <span className={`text-sm font-medium ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(request.created_at)}
                      </span>
                    </div>
                    
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>IP: {request.ip_address || 'Unknown'}</div>
                      {request.processing_time_ms && (
                        <div>Response Time: {request.processing_time_ms}ms</div>
                      )}
                      {request.user_agent && (
                        <div className="truncate">User Agent: {request.user_agent}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Webhook Stats */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Live Statistics</h3>
            {stats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold text-foreground">{stats.totalRequests}</div>
                    <div className="text-sm text-muted-foreground">Total Requests</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold text-success">{stats.successRate.toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Today's Requests:</span>
                    <span className="font-medium">{stats.todayRequests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Average Response Time:</span>
                    <span className="font-medium">{stats.avgResponseTime}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Error Rate:</span>
                    <span className="font-medium text-error">{stats.errorRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Icon name="BarChart3" size={32} className="text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Loading statistics...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No Webhooks State */}
      {webhooks.length === 0 && (
        <div className="text-center py-12">
          <Icon name="Webhook" size={48} className="text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Webhooks Found</h3>
          <p className="text-muted-foreground mb-4">
            Create your first webhook to start monitoring requests in real-time.
          </p>
          <Button onClick={() => window.location.href = '/create-webhook'}>
            Create Webhook
          </Button>
        </div>
      )}
    </div>
  );
};

export default RealtimeWebhookDashboard;
