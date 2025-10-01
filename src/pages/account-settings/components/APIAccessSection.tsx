import { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

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

  useEffect(() => {
    fetchApiKeys();
  }, []);

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
    const newApiKey = uuidv4(); // Generate a new UUID for the API key
    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        name: newKeyName,
        api_key: `sk_live_${newApiKey.replace(/-/g, '')}`,
        permissions: ['read', 'write'], // Default permissions
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

  const mockUsageStats = {
    usedPercentage: 12.5,
    requestsThisMonth: '1,247 / 10,000',
    rateLimitPerMinute: 60,
    rateLimitPerHour: 1000,
    rateLimitPerDay: 10000,
    topEndpoints: [
      { path: '/webhooks', requests: 856, percentage: 68.7 },
      { path: '/webhooks/{id}', requests: 234, percentage: 18.8 },
      { path: '/webhooks/{id}/requests', requests: 157, percentage: 12.5 },
    ],
  };

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

      {/* Usage Statistics */}
      <div className="space-y-4 mb-6">
        <h3 className="font-medium text-foreground">Current Usage</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 border border-border rounded-lg">
            <p className="text-sm text-muted-foreground">API Requests this month</p>
            <p className="text-lg font-semibold text-foreground">{mockUsageStats.requestsThisMonth}</p>
          </div>
          <div className="p-4 border border-border rounded-lg">
            <p className="text-sm text-muted-foreground">Per Minute</p>
            <p className="text-lg font-semibold text-foreground">{mockUsageStats.rateLimitPerMinute}</p>
          </div>
          <div className="p-4 border border-border rounded-lg">
            <p className="text-sm text-muted-foreground">Per Hour</p>
            <p className="text-lg font-semibold text-foreground">{mockUsageStats.rateLimitPerHour}</p>
          </div>
          <div className="p-4 border border-border rounded-lg">
            <p className="text-sm text-muted-foreground">Per Day</p>
            <p className="text-lg font-semibold text-foreground">{mockUsageStats.rateLimitPerDay}</p>
          </div>
        </div>

        <h3 className="font-medium text-foreground mt-6">Top API Endpoints</h3>
        <div className="space-y-2">
          {mockUsageStats.topEndpoints.map((endpoint, index) => (
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
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="New API Key Name"
              className="flex-grow p-2 border border-border rounded-lg bg-background text-foreground"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
            />
            <Button onClick={handleCreateApiKey} disabled={isCreatingKey || !newKeyName.trim()}>
              {isCreatingKey ? 'Creating...' : 'Create API Key'}
            </Button>
          </div>

          {loadingKeys ? (
            <p className="text-muted-foreground">Loading API keys...</p>
          ) : apiKeys.length === 0 ? (
            <p className="text-muted-foreground">No API keys found. Create one above.</p>
          ) : (
            apiKeys.map((key) => (
              <div key={key.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Icon name="Key" size={20} className="text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">{key.name}</p>
                    <p className="text-sm text-muted-foreground">{key.permissions.join(', ')}</p>
                    <p className="text-xs text-muted-foreground">{key.api_key.substring(0, 20)}...</p>
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(key.created_at).toLocaleDateString()} 
                      {key.last_used_at && ` | Last used: ${new Date(key.last_used_at).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteApiKey(key.id)}
                  iconName="Trash"
                >
                  Delete
                </Button>
              </div>
            ))
          )}
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