import { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { useAuth } from '../../../contexts/AuthContext';
import { userService } from '../../../services/userService';
import { webhookService } from '../../../services/webhookService';
import { supabase } from '../../../lib/supabase';

interface ApiKey {
  id: string;
  name: string;
  api_key: string;
  created_at: string;
  last_used_at: string | null;
  permissions: string[];
}

const APIAccessSection = () => {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [usageStats, setUsageStats] = useState({
    requestsThisMonth: '0 / 1,000',
    usedPercentage: 0,
    rateLimitPerMinute: 60,
    rateLimitPerHour: 1000,
    rateLimitPerDay: 10000,
  });
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApiKeys();
    fetchUsageStats();
    fetchEndpointStats();
  }, [user?.id]);

  const fetchEndpointStats = async () => {
    if (!user?.id) return;

    try {
      // Get all webhooks for the user
      const { data: webhooks, error: webhooksError } = await webhookService.getUserWebhooks(user.id);
      if (webhooksError || !webhooks) return;

      // Get requests for all webhooks
      let totalRequests = 0;
      const endpointStats = {
        '/webhooks': 0,
        '/webhooks/{id}': 0,
        '/webhooks/{id}/requests': 0
      };

      for (const webhook of webhooks) {
        const { data: requests } = await webhookService.getWebhookRequests(webhook.id, 1, 1000);
        if (requests) {
          totalRequests += requests.length;
          
          // Categorize requests by endpoint type
          endpointStats['/webhooks'] += requests.filter(r => r.method === 'GET').length;
          endpointStats['/webhooks/{id}'] += requests.filter(r => r.method === 'POST' || r.method === 'PUT' || r.method === 'PATCH').length;
          endpointStats['/webhooks/{id}/requests'] += requests.filter(r => r.method === 'DELETE').length;
        }
      }

      // Calculate percentages and update state
      const updatedEndpoints = Object.entries(endpointStats).map(([path, requests]) => ({
        path,
        requests,
        percentage: totalRequests > 0 ? Math.round((requests / totalRequests) * 100) : 0
      }));

      setTopEndpoints(updatedEndpoints);
    } catch (error) {
      console.error('Error fetching endpoint stats:', error);
    }
  };

  const fetchUsageStats = async () => {
    if (!user?.id) return;

    setLoadingUsage(true);
    setError(null);

    try {
      const { data: limits, error: limitsError } = await userService.checkSubscriptionLimits(user.id);
      
      if (limitsError) {
        setError(limitsError.message || 'Failed to load usage data');
        return;
      }

      if (limits) {
        const usedPercentage = Math.round((limits.currentRequests / limits.requestLimit) * 100);
        setUsageStats({
          requestsThisMonth: `${limits.currentRequests.toLocaleString()} / ${limits.requestLimit.toLocaleString()}`,
          usedPercentage,
          rateLimitPerMinute: 60,
          rateLimitPerHour: 1000,
          rateLimitPerDay: limits.requestLimit,
        });
      }
    } catch (err) {
      console.error('Error loading usage stats:', err);
      setError('Failed to load usage statistics');
    } finally {
      setLoadingUsage(false);
    }
  };

  const fetchApiKeys = async () => {
    if (!user) return;
    setLoadingKeys(true);
    const { data, error } = await supabase
      .from('api_keys')
      .select('id, name, api_key, created_at, last_used_at, permissions')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching API keys:', error);
    } else {
      setApiKeys(data as ApiKey[]);
    }
    setLoadingKeys(false);
  };

  const handleCreateApiKey = async () => {
    if (!user || !newKeyName.trim()) return;

    setIsCreatingKey(true);
    const newApiKey = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2) + Date.now().toString(36);
    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        name: newKeyName,
        api_key: `sk_live_${newApiKey.replace(/-/g, '')}`,
        permissions: ['read', 'write'], 
      })
      .select();

    if (error) {
      console.error('Error creating API key:', error);
    } else if (data && data.length > 0) {
      setApiKeys((prevKeys) => [...prevKeys, data[0] as ApiKey]);
      setNewKeyName('');
    }
    setIsCreatingKey(false);
  };

  const handleDeleteApiKey = async (keyId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting API key:', error);
    } else {
      setApiKeys((prevKeys) => prevKeys.filter((key) => key.id !== keyId));
    }
  };

  // Calculate real top endpoints from webhook requests
  const [topEndpoints, setTopEndpoints] = useState([
    { path: '/webhooks', requests: 0, percentage: 0 },
    { path: '/webhooks/{id}', requests: 0, percentage: 0 },
    { path: '/webhooks/{id}/requests', requests: 0, percentage: 0 },
  ]);

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">API Access & Usage</h2>
          <p className="text-sm text-muted-foreground">Monitor your API usage and manage access keys</p>
        </div>
        <div className="flex items-center space-x-2">
          <Icon name="Key" size={20} className="text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">API Keys</span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-error/10 border border-error/20 rounded-lg flex items-center space-x-2 mb-6">
          <Icon name="AlertTriangle" size={16} className="text-error" />
          <span className="text-sm text-error">{error}</span>
        </div>
      )}

      {/* Usage Statistics */}
      <div className="space-y-4 mb-6">
        <h3 className="font-medium text-foreground">Current Usage</h3>
        {loadingUsage ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Loading usage data...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border border-border rounded-lg">
              <p className="text-sm text-muted-foreground">API Requests this month</p>
              <p className="text-lg font-semibold text-foreground">{usageStats.requestsThisMonth}</p>
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    usageStats.usedPercentage > 80 ? 'bg-error' : 'bg-primary'
                  }`}
                  style={{ width: `${Math.min(usageStats.usedPercentage, 100)}%` }}
                />
              </div>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <p className="text-sm text-muted-foreground">Per Minute</p>
              <p className="text-lg font-semibold text-foreground">{usageStats.rateLimitPerMinute}</p>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <p className="text-sm text-muted-foreground">Per Hour</p>
              <p className="text-lg font-semibold text-foreground">{usageStats.rateLimitPerHour.toLocaleString()}</p>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <p className="text-sm text-muted-foreground">Per Day</p>
              <p className="text-lg font-semibold text-foreground">{usageStats.rateLimitPerDay.toLocaleString()}</p>
            </div>
          </div>
        )}

        <h3 className="font-medium text-foreground mt-6">Top API Endpoints</h3>
        <div className="space-y-2">
          {topEndpoints.map((endpoint, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <p className="text-sm text-foreground">{endpoint.path}</p>
              <span className="text-sm text-muted-foreground">{endpoint.requests} requests ({endpoint.percentage}%)</span>
            </div>
          ))}
        </div>
      </div>

      {/* API Keys */}
      <div className="border-t border-border pt-6">
        <h3 className="font-medium text-foreground mb-4">API Keys</h3>
        <div className="bg-muted/50 border border-border rounded-lg p-6 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="Clock" size={24} className="text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            API Features Coming Soon
          </h3>
          <p className="text-muted-foreground mb-4">
            API key management and programmatic access will be available in a future update.
          </p>
          <Button variant="outline" disabled>
            Coming Soon
          </Button>
        </div>
      </div>

      {/* Rate Limiting Info */}
      <div className="border-t border-border pt-6 mt-6">
        <h3 className="font-medium text-foreground mb-4">Rate Limiting</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Free tier users are limited to 10,000 requests per month. Upgrade to Pro for unlimited API access and higher rate limits.
        </p>
        <Button onClick={() => console.log('Redirect to upgrade')}>Upgrade to Pro</Button>
      </div>
    </div>
  );
};

export default APIAccessSection;