import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ContextualHeader from '../../components/ui/ContextualHeader';
import WebhookForm from './components/WebhookForm';
import WebhookPreview from './components/WebhookPreview';
import TierLimitWarning from './components/TierLimitWarning';
import SuccessModal from './components/SuccessModal';

const CreateWebhook = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState({
    identifier: '',
    httpMethods: ['POST'],
    description: ''
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdWebhook, setCreatedWebhook] = useState(null);

  // Mock user data
  const userData = {
    tier: 'free', // or 'paid'
    webhookCount: 3,
    email: 'developer@example.com'
  };

  const handleFormSubmit = async (formData) => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newWebhook = {
        id: `wh_${Date.now()}`,
        identifier: formData?.identifier,
        description: formData?.description,
        httpMethods: formData?.httpMethods,
        url: `https://api.hookcatch.com/webhook/${formData?.identifier}`,
        createdAt: new Date()?.toISOString(),
        requestCount: 0,
        lastRequest: null,
        settings: {
          enableRateLimit: formData?.enableRateLimit,
          rateLimitRequests: formData?.rateLimitRequests,
          enableNotifications: formData?.enableNotifications,
          notificationEmail: formData?.notificationEmail
        }
      };

      setCreatedWebhook(newWebhook);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Failed to create webhook:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = () => {
    navigate('/account-settings');
  };

  const handleViewWebhook = () => {
    setShowSuccessModal(false);
    navigate('/webhook-details', { 
      state: { webhook: createdWebhook } 
    });
  };

  const handleCreateAnother = () => {
    setShowSuccessModal(false);
    setCreatedWebhook(null);
    setPreviewData({
      identifier: '',
      httpMethods: ['POST'],
      description: ''
    });
    // Reset form by remounting component
    window.location?.reload();
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    navigate('/dashboard');
  };

  // Update preview data when form changes
  const handleFormChange = (formData) => {
    setPreviewData({
      identifier: formData?.identifier,
      httpMethods: formData?.httpMethods,
      description: formData?.description
    });
  };

  const breadcrumbs = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Create Webhook', path: '/create-webhook', current: true }
  ];

  return (
    <div className="min-h-screen bg-background">
      <ContextualHeader
        title="Create New Webhook"
        subtitle="Generate a permanent webhook URL for receiving HTTP requests"
        backPath="/dashboard"
        breadcrumbs={breadcrumbs}
      />
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tier Limit Warning */}
        <div className="mb-8">
          <TierLimitWarning
            currentTier={userData?.tier}
            webhookCount={userData?.webhookCount}
            onUpgrade={handleUpgrade}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Webhook Configuration
                </h2>
                <p className="text-muted-foreground text-sm">
                  Configure your webhook endpoint settings and preferences
                </p>
              </div>

              <WebhookForm
                onSubmit={handleFormSubmit}
                isLoading={isLoading}
                onChange={handleFormChange}
              />
            </div>
          </div>

          {/* Preview Section */}
          <div className="space-y-6">
            <div className="sticky top-24">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Webhook Preview
                </h2>
                <p className="text-muted-foreground text-sm">
                  Preview your webhook URL and test commands
                </p>
              </div>

              <WebhookPreview
                identifier={previewData?.identifier}
                httpMethods={previewData?.httpMethods}
                description={previewData?.description}
              />
            </div>
          </div>
        </div>

        {/* Getting Started Tips */}
        <div className="mt-12 bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-medium text-foreground mb-4">
            Getting Started with Your Webhook
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="text-primary font-semibold text-sm">1</span>
              </div>
              <h4 className="font-medium text-foreground">Create & Configure</h4>
              <p className="text-muted-foreground text-sm">
                Set up your webhook with custom identifier and HTTP methods
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="text-primary font-semibold text-sm">2</span>
              </div>
              <h4 className="font-medium text-foreground">Test & Validate</h4>
              <p className="text-muted-foreground text-sm">
                Use the provided cURL commands to send test requests
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="text-primary font-semibold text-sm">3</span>
              </div>
              <h4 className="font-medium text-foreground">Monitor & Analyze</h4>
              <p className="text-muted-foreground text-sm">
                View request history and analyze webhook performance
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleCloseModal}
        webhookData={createdWebhook}
        onViewWebhook={handleViewWebhook}
        onCreateAnother={handleCreateAnother}
      />
    </div>
  );
};

export default CreateWebhook;