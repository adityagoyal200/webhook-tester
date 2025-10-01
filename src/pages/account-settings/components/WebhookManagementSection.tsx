import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';

const WebhookManagementSection = () => {
  const [selectedWebhooks, setSelectedWebhooks] = useState([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    browserNotifications: false,
    webhookAlerts: true,
    dailyDigest: false
  });

  const mockWebhooks = [
    {
      id: 'wh_1',
      name: 'Payment Gateway',
      url: 'https://hook.catch/wh_payment_123',
      requests: 1247,
      lastUsed: '2 hours ago'
    },
    {
      id: 'wh_2',
      name: 'User Registration',
      url: 'https://hook.catch/wh_users_456',
      requests: 89,
      lastUsed: '1 day ago'
    },
    {
      id: 'wh_3',
      name: 'Order Processing',
      url: 'https://hook.catch/wh_orders_789',
      requests: 567,
      lastUsed: '3 hours ago'
    }
  ];

  const handleWebhookSelect = (webhookId) => {
    setSelectedWebhooks(prev => 
      prev?.includes(webhookId) 
        ? prev?.filter(id => id !== webhookId)
        : [...prev, webhookId]
    );
  };

  const handleSelectAll = () => {
    setSelectedWebhooks(
      selectedWebhooks?.length === mockWebhooks?.length 
        ? [] 
        : mockWebhooks?.map(wh => wh?.id)
    );
  };

  const handleBulkDelete = () => {
    console.log('Deleting webhooks:', selectedWebhooks);
    setSelectedWebhooks([]);
    setShowBulkDeleteConfirm(false);
  };

  const handleExportData = () => {
    console.log('Exporting webhook data...');
    // Mock export functionality
  };

  const handleNotificationChange = (setting) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev?.[setting]
    }));
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Webhook Management</h2>
          <p className="text-sm text-muted-foreground">Bulk operations and notification preferences</p>
        </div>
      </div>
      {/* Bulk Operations */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-foreground">Bulk Operations</h3>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              iconName={selectedWebhooks?.length === mockWebhooks?.length ? "Square" : "CheckSquare"}
            >
              {selectedWebhooks?.length === mockWebhooks?.length ? 'Deselect All' : 'Select All'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportData}
              iconName="Download"
            >
              Export Data
            </Button>
            {selectedWebhooks?.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowBulkDeleteConfirm(true)}
                iconName="Trash2"
              >
                Delete Selected ({selectedWebhooks?.length})
              </Button>
            )}
          </div>
        </div>

        {/* Webhook List */}
        <div className="border border-border rounded-lg overflow-hidden">
          {mockWebhooks?.map((webhook) => (
            <div key={webhook?.id} className="flex items-center space-x-4 p-4 border-b border-border last:border-b-0 hover:bg-muted/50">
              <Checkbox
                checked={selectedWebhooks?.includes(webhook?.id)}
                onChange={() => handleWebhookSelect(webhook?.id)}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-foreground truncate">{webhook?.name}</h4>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    {webhook?.requests} requests
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{webhook?.url}</p>
                <p className="text-xs text-muted-foreground">Last used {webhook?.lastUsed}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Notification Preferences */}
      <div className="border-t border-border pt-6">
        <h3 className="font-medium text-foreground mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          <Checkbox
            label="Email Notifications"
            description="Receive email alerts for webhook activity"
            checked={notificationSettings?.emailNotifications}
            onChange={() => handleNotificationChange('emailNotifications')}
          />
          <Checkbox
            label="Browser Notifications"
            description="Show desktop notifications for incoming webhooks"
            checked={notificationSettings?.browserNotifications}
            onChange={() => handleNotificationChange('browserNotifications')}
          />
          <Checkbox
            label="Webhook Alerts"
            description="Get notified when webhooks fail or exceed rate limits"
            checked={notificationSettings?.webhookAlerts}
            onChange={() => handleNotificationChange('webhookAlerts')}
          />
          <Checkbox
            label="Daily Digest"
            description="Receive a daily summary of webhook activity"
            checked={notificationSettings?.dailyDigest}
            onChange={() => handleNotificationChange('dailyDigest')}
          />
        </div>
      </div>
      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-error/10 rounded-full flex items-center justify-center">
                <Icon name="AlertTriangle" size={20} className="text-error" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Delete Webhooks</h3>
                <p className="text-sm text-muted-foreground">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mb-6">
              You are about to delete {selectedWebhooks?.length} webhook{selectedWebhooks?.length > 1 ? 's' : ''} 
              and all associated request history. This action cannot be reversed.
            </p>

            <div className="flex space-x-3">
              <Button 
                variant="destructive" 
                onClick={handleBulkDelete}
                size="sm"
              >
                Yes, Delete Webhooks
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowBulkDeleteConfirm(false)}
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebhookManagementSection;