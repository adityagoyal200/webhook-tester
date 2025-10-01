import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { webhookService } from '../../../services/webhookService';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';

const WebhookManagementSection = () => {
  const { user } = useAuth();
  const [selectedWebhooks, setSelectedWebhooks] = useState<string[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    browserNotifications: false,
    webhookAlerts: true,
    dailyDigest: false
  });

  // Load real webhook data
  useEffect(() => {
    const loadWebhooks = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      setError(null);

      try {
        const hasSupabaseEnv =
          Boolean(import.meta.env?.VITE_SUPABASE_URL || process?.env?.VITE_SUPABASE_URL) &&
          Boolean(import.meta.env?.VITE_SUPABASE_ANON_KEY || process?.env?.VITE_SUPABASE_ANON_KEY);
        if (!hasSupabaseEnv) {
          setError('Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
          return;
        }
        const { data, error: webhooksError } = await webhookService.getUserWebhooks(user.id);
        
        if (webhooksError) {
          setError(webhooksError.message || 'Failed to load webhooks');
          return;
        }

        if (data) {
          setWebhooks(data);
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

  const handleWebhookSelect = (webhookId: string) => {
    setSelectedWebhooks(prev => 
      prev?.includes(webhookId) 
        ? prev?.filter(id => id !== webhookId)
        : [...prev, webhookId]
    );
  };

  const handleSelectAll = () => {
    setSelectedWebhooks(
      selectedWebhooks?.length === webhooks?.length 
        ? [] 
        : webhooks?.map(wh => wh?.id) || []
    );
  };

  const handleBulkDelete = async () => {
    if (selectedWebhooks.length === 0) return;

    setIsDeleting(true);
    setError(null);

    try {
      // Delete each selected webhook
      for (const webhookId of selectedWebhooks) {
        const { error: deleteError } = await webhookService.deleteWebhook(webhookId);
        if (deleteError) {
          console.error('Failed to delete webhook:', webhookId, deleteError);
        }
      }

      // Remove deleted webhooks from local state
      setWebhooks(prev => prev?.filter(wh => !selectedWebhooks?.includes(wh?.id)));
      setSelectedWebhooks([]);
      setShowBulkDeleteConfirm(false);
    } catch (err) {
      console.error('Bulk delete error:', err);
      setError('Failed to delete some webhooks. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportData = () => {
    try {
      const exportData = {
        webhooks: webhooks.map(wh => ({
          id: wh.id,
          name: wh.name,
          url: wh.url,
          status: wh.status,
          created_at: wh.created_at
        })),
        exportDate: new Date().toISOString(),
        totalWebhooks: webhooks.length
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `webhooks-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export data');
    }
  };

  const handleNotificationChange = (setting: keyof typeof notificationSettings) => {
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
              iconName={selectedWebhooks?.length === webhooks?.length ? "Square" : "CheckSquare"}
            >
              {selectedWebhooks?.length === webhooks?.length ? 'Deselect All' : 'Select All'}
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
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Loading webhooks...</span>
          </div>
        ) : error ? (
          <div className="p-3 bg-error/10 border border-error/20 rounded-lg flex items-center space-x-2">
            <Icon name="AlertTriangle" size={16} className="text-error" />
            <span className="text-sm text-error">{error}</span>
          </div>
        ) : webhooks?.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="Webhook" size={32} className="text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No webhooks created yet</p>
            <Button
              onClick={() => window.location.href = '/create-webhook'}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              Create your first webhook
            </Button>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            {webhooks?.map((webhook) => (
              <div key={webhook?.id} className="flex items-center space-x-4 p-4 border-b border-border last:border-b-0 hover:bg-muted/50">
                <Checkbox
                  checked={selectedWebhooks?.includes(webhook?.id)}
                  onChange={() => handleWebhookSelect(webhook?.id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-foreground truncate">{webhook?.name}</h4>
                    <span className={`text-xs px-2 py-1 rounded ${
                      webhook?.status === 'active' 
                        ? 'bg-success/10 text-success' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {webhook?.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{webhook?.url}</p>
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(webhook?.created_at)?.toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
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
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Webhooks'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowBulkDeleteConfirm(false)}
                size="sm"
                disabled={isDeleting}
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
