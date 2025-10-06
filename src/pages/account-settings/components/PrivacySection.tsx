import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { userService } from '../../../services/userService';
import { webhookService } from '../../../services/webhookService';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import FeatureGate from '../../../components/FeatureGate';
import Select from '../../../components/ui/Select';

const PrivacySection = () => {
  const { user } = useAuth();
  const [retentionPeriod, setRetentionPeriod] = useState('7');
  const [showDataDeletionConfirm, setShowDataDeletionConfirm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const retentionOptions = [
    { value: '1', label: '1 day' },
    { value: '7', label: '7 days (Default)' },
    { value: '14', label: '14 days' },
    { value: '30', label: '30 days (Pro only)', disabled: true }
  ];

  const handleDataDeletion = async () => {
    try {
      if (!user?.id) {
        console.error('No authenticated user');
        setShowDataDeletionConfirm(false);
        return;
      }
      const { error } = await userService?.deleteUserAccount(user?.id);
      if (error) {
        console.error('Data deletion error:', error?.message || error);
      }
      setShowDataDeletionConfirm(false);
    } catch (err) {
      console.error('Unexpected error during data deletion:', err);
      setShowDataDeletionConfirm(false);
    }
  };

  const handleDataExport = async () => {
    if (!user?.id) {
      setError('No authenticated user found');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);
    setError(null);
    setSuccess(null);

    try {
      // Step 1: Export user profile (25%)
      setExportProgress(25);
      const { data: profile, error: profileError } = await userService.getUserProfile(user.id);
      if (profileError) {
        throw new Error(`Failed to export profile: ${profileError.message}`);
      }

      // Step 2: Export webhooks (50%)
      setExportProgress(50);
      const { data: webhooks, error: webhooksError } = await webhookService.getUserWebhooks(user.id);
      if (webhooksError) {
        throw new Error(`Failed to export webhooks: ${webhooksError.message}`);
      }

      // Step 3: Export webhook requests (75%)
      setExportProgress(75);
      let allRequests: any[] = [];
      if (webhooks && webhooks.length > 0) {
        for (const webhook of webhooks) {
          const { data: requests } = await webhookService.getWebhookRequests(webhook.id, 1000); // Get up to 1000 requests per webhook
          if (requests) {
            allRequests = [...allRequests, ...requests];
          }
        }
      }

      // Step 4: Create export data (100%)
      setExportProgress(100);
      const exportData = {
        exportDate: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
          profile: profile
        },
        webhooks: webhooks?.map((wh: any) => ({
          id: wh.id,
          name: wh.name,
          url: wh.url,
          status: wh.status,
          created_at: wh.created_at,
          settings: wh.settings
        })) || [],
        webhookRequests: allRequests?.map(req => ({
          id: req.id,
          webhook_id: req.webhook_id,
          method: req.method,
          status: req.status,
          ip_address: req.ip_address,
          payload: req.payload,
          headers: req.headers,
          response_status: req.response_status,
          processing_time_ms: req.processing_time_ms,
          created_at: req.created_at
        })) || [],
        summary: {
          totalWebhooks: webhooks?.length || 0,
          totalRequests: allRequests.length,
          exportTimestamp: new Date().toISOString()
        }
      };

      // Download the export file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hookcatch-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess('Data export completed successfully!');
      setTimeout(() => setSuccess(null), 5000);

    } catch (err) {
      console.error('Data export error:', err);
      setError(err instanceof Error ? err.message : 'Failed to export data');
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportProgress(0), 2000);
    }
  };

  const privacyFeatures = [
    {
      title: 'Data Retention',
      description: 'Control how long your webhook data is stored',
      icon: 'Clock',
      status: 'active'
    },
    {
      title: 'Data Encryption',
      description: 'All data is encrypted at rest and in transit',
      icon: 'Shield',
      status: 'active'
    },
    {
      title: 'GDPR Compliance',
      description: 'Full compliance with European data protection regulations',
      icon: 'FileCheck',
      status: 'active'
    },
    {
      title: 'Data Anonymization',
      description: 'Personal identifiers are automatically anonymized',
      icon: 'EyeOff',
      status: 'active'
    }
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Privacy & Data Control</h2>
          <p className="text-sm text-muted-foreground">Manage your data retention and privacy preferences</p>
        </div>
        <div className="flex items-center space-x-2">
          <Icon name="Shield" size={20} className="text-success" />
          <span className="text-sm font-medium text-success">GDPR Compliant</span>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-3 bg-error/10 border border-error/20 rounded-lg flex items-center space-x-2 mb-6">
          <Icon name="AlertTriangle" size={16} className="text-error" />
          <span className="text-sm text-error">{error}</span>
        </div>
      )}
      
      {success && (
        <div className="p-3 bg-success/10 border border-success/20 rounded-lg flex items-center space-x-2 mb-6">
          <Icon name="Check" size={16} className="text-success" />
          <span className="text-sm text-success">{success}</span>
        </div>
      )}
      {/* Privacy Features */}
      <div className="grid gap-4 mb-6">
        {privacyFeatures?.map((feature, index) => (
          <div key={index} className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
            <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center">
              <Icon name={feature?.icon as any} size={16} className="text-success" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-foreground">{feature?.title}</h4>
              <p className="text-sm text-muted-foreground">{feature?.description}</p>
            </div>
            <div className="w-2 h-2 bg-success rounded-full" />
          </div>
        ))}
      </div>
      {/* Data Retention Settings */}
      <div className="space-y-4 mb-6">
        <h3 className="font-medium text-foreground">Data Retention Period</h3>
        <Select
          label="Request History Retention"
          description="How long to keep webhook request data"
          options={retentionOptions}
          value={retentionPeriod}
          onChange={(v) => setRetentionPeriod(String(v))}
          className="max-w-xs"
        />
        <p className="text-xs text-muted-foreground">
          Data older than the selected period will be automatically deleted. 
          Pro users can extend retention up to 30 days.
        </p>
      </div>
      <div className="border-t border-border pt-6">
        <h3 className="font-medium text-foreground mb-4">Data Rights</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <FeatureGate feature="dataExport">
            <Button
              variant="outline"
              onClick={() => setShowExportModal(true)}
              iconName="Download"
            >
              Export My Data
            </Button>
          </FeatureGate>
          <Button
            variant="destructive"
            onClick={() => setShowDataDeletionConfirm(true)}
            iconName="Trash2"
          >
            Request Data Deletion
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Exercise your GDPR rights to data portability and erasure
        </p>
      </div>
      {/* Data Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Export Your Data</h3>
              {!isExporting && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowExportModal(false)}
                >
                  <Icon name="X" size={20} />
                </Button>
              )}
            </div>
            
            {!isExporting && exportProgress === 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Export all your webhook data including URLs, request history, and account information 
                  in JSON format. This may take a few minutes depending on your data size.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Icon name="Check" size={16} className="text-success" />
                    <span className="text-sm text-muted-foreground">User profile and account information</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Icon name="Check" size={16} className="text-success" />
                    <span className="text-sm text-muted-foreground">All webhook URLs and configurations</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Icon name="Check" size={16} className="text-success" />
                    <span className="text-sm text-muted-foreground">Complete request history and payloads</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Icon name="Check" size={16} className="text-success" />
                    <span className="text-sm text-muted-foreground">Response data and processing times</span>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <Button onClick={handleDataExport}>
                    Start Export
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowExportModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <Icon name="Download" size={32} className="text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {exportProgress < 25 ? 'Exporting user profile...' :
                     exportProgress < 50 ? 'Exporting webhooks...' :
                     exportProgress < 75 ? 'Exporting request history...' :
                     exportProgress < 100 ? 'Finalizing export...' : 'Export completed!'}
                  </p>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="h-2 bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  {exportProgress}% complete
                </div>
                {exportProgress === 100 && (
                  <div className="flex space-x-3">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowExportModal(false);
                        setExportProgress(0);
                      }}
                      fullWidth
                    >
                      Close
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Data Deletion Confirmation Modal */}
      {showDataDeletionConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-error/10 rounded-full flex items-center justify-center">
                <Icon name="AlertTriangle" size={20} className="text-error" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Request Data Deletion</h3>
                <p className="text-sm text-muted-foreground">GDPR Article 17 - Right to Erasure</p>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mb-6">
              This will permanently delete all your personal data, webhooks, request history, 
              and account information. This action cannot be undone and complies with GDPR requirements.
            </p>

            <div className="flex space-x-3">
              <Button 
                variant="destructive" 
                onClick={handleDataDeletion}
                size="sm"
              >
                Confirm Deletion
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowDataDeletionConfirm(false)}
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

export default PrivacySection;