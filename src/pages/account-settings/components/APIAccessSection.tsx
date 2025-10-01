import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const APIAccessSection = () => {
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeys, setApiKeys] = useState([
    {
      id: 'key_1',
      name: 'Production API Key',
      key: 'hc_live_1234567890abcdef',
      created: '2025-09-15',
      lastUsed: '2 hours ago',
      permissions: ['read', 'write']
    }
  ]);

  const mockUsageStats = {
    currentMonth: {
      requests: 1247,
      limit: 10000,
      percentage: 12.47
    },
    rateLimit: {
      perMinute: 60,
      perHour: 1000,
      perDay: 10000
    },
    endpoints: [
      { path: '/webhooks', requests: 856, percentage: 68.7 },
      { path: '/webhooks/{id}', requests: 234, percentage: 18.8 },
      { path: '/webhooks/{id}/requests', requests: 157, percentage: 12.5 }
    ]
  };

  const handleCreateApiKey = () => {
    const newKey = {
      id: `key_${Date.now()}`,
      name: 'New API Key',
      key: `hc_live_${Math.random()?.toString(36)?.substring(2, 18)}`,
      created: new Date()?.toISOString()?.split('T')?.[0],
      lastUsed: 'Never',
      permissions: ['read']
    };
    setApiKeys([...apiKeys, newKey]);
    setShowApiKeyModal(false);
  };

  const handleDeleteApiKey = (keyId: string) => {
    setApiKeys(apiKeys?.filter(key => key?.id !== keyId));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    console.log('API key copied to clipboard');
  };

  const UsageBar: React.FC<{ label: string; used: number; limit: number; unit?: string }> = ({ label, used, limit, unit = '' }) => {
    const percentage = (used / limit) * 100;
    const isNearLimit = percentage > 80;
    
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className={`font-medium ${isNearLimit ? 'text-warning' : 'text-foreground'}`}>
            {used?.toLocaleString()}{unit} / {limit?.toLocaleString()}{unit}
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              isNearLimit ? 'bg-warning' : 'bg-primary'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">API Access & Usage</h2>
          <p className="text-sm text-muted-foreground">Monitor your API usage and manage access keys</p>
        </div>
        <div className="flex items-center space-x-2">
          <Icon name="Activity" size={20} className="text-primary" />
          <span className="text-sm font-medium text-foreground">
            {mockUsageStats?.currentMonth?.percentage?.toFixed(1)}% used
          </span>
        </div>
      </div>
      {/* Usage Statistics */}
      <div className="space-y-4 mb-6">
        <h3 className="font-medium text-foreground">Current Usage</h3>
        <UsageBar 
          label="API Requests this month" 
          used={mockUsageStats?.currentMonth?.requests} 
          limit={mockUsageStats?.currentMonth?.limit} 
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="text-sm text-muted-foreground">Per Minute</div>
            <div className="text-lg font-semibold text-foreground">{mockUsageStats?.rateLimit?.perMinute}</div>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="text-sm text-muted-foreground">Per Hour</div>
            <div className="text-lg font-semibold text-foreground">{mockUsageStats?.rateLimit?.perHour?.toLocaleString()}</div>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="text-sm text-muted-foreground">Per Day</div>
            <div className="text-lg font-semibold text-foreground">{mockUsageStats?.rateLimit?.perDay?.toLocaleString()}</div>
          </div>
        </div>
      </div>
      {/* Top Endpoints */}
      <div className="space-y-4 mb-6">
        <h3 className="font-medium text-foreground">Top API Endpoints</h3>
        <div className="space-y-3">
          {mockUsageStats?.endpoints?.map((endpoint, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <code className="text-sm bg-muted px-2 py-1 rounded font-mono text-foreground">
                  {endpoint?.path}
                </code>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-muted-foreground">
                  {endpoint?.requests} requests ({endpoint?.percentage}%)
                </span>
                <div className="w-16 bg-muted rounded-full h-2">
                  <div 
                    className="h-2 bg-primary rounded-full"
                    style={{ width: `${endpoint?.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* API Keys Management */}
      <div className="border-t border-border pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-foreground">API Keys</h3>
          <Button
            onClick={() => setShowApiKeyModal(true)}
            iconName="Plus"
            size="sm"
          >
            Create API Key
          </Button>
        </div>

        <div className="space-y-3">
          {apiKeys?.map((key) => (
            <div key={key?.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="font-medium text-foreground">{key?.name}</h4>
                  <div className="flex space-x-1">
                    {key?.permissions?.map((permission) => (
                      <span 
                        key={permission}
                        className="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
                      >
                        {permission}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <code className="bg-muted px-2 py-1 rounded font-mono">
                    {key?.key?.substring(0, 20)}...
                  </code>
                  <span>Created: {key?.created}</span>
                  <span>Last used: {key?.lastUsed}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(key?.key)}
                  title="Copy API key"
                >
                  <Icon name="Copy" size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteApiKey(key?.id)}
                  title="Delete API key"
                >
                  <Icon name="Trash2" size={16} className="text-error" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {apiKeys?.length === 0 && (
          <div className="text-center py-8">
            <Icon name="Key" size={32} className="text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No API keys created yet</p>
            <Button
              onClick={() => setShowApiKeyModal(true)}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              Create your first API key
            </Button>
          </div>
        )}
      </div>
      {/* Rate Limiting Info */}
      <div className="border-t border-border pt-6 mt-6">
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Icon name="Info" size={16} className="text-primary" />
            <span className="text-sm font-medium text-primary">Rate Limiting</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Free tier users are limited to 10,000 requests per month. 
            Upgrade to Pro for unlimited API access and higher rate limits.
          </p>
        </div>
      </div>
      {/* Create API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Create API Key</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowApiKeyModal(false)}
              >
                <Icon name="X" size={20} />
              </Button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                API keys allow you to access HookCatch programmatically. Keep your keys secure and never share them publicly.
              </p>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-foreground">Key Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Production API Key"
                    className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground">Permissions</label>
                  <div className="mt-2 space-y-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-sm text-muted-foreground">Read webhooks</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm text-muted-foreground">Write webhooks</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm text-muted-foreground">Delete webhooks</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button onClick={handleCreateApiKey}>
                  Create API Key
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowApiKeyModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default APIAccessSection;