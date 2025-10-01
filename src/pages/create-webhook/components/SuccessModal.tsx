import React from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const SuccessModal = ({ isOpen, onClose, webhookData, onViewWebhook, onCreateAnother }: {
  isOpen: boolean;
  onClose: () => void;
  webhookData?: {
    id?: string;
    identifier?: string;
    httpMethods?: string[];
    description?: string;
  };
  onViewWebhook: () => void;
  onCreateAnother: () => void;
}) => {
  if (!isOpen) return null;

  // Compose functions base URL similar to WebhookPreview
  const configuredBase = (import.meta as any)?.env?.VITE_FUNCTIONS_BASE_URL as string | undefined;
  const supabaseUrl = (import.meta as any)?.env?.VITE_SUPABASE_URL as string | undefined;
  const functionsBase = configuredBase || (supabaseUrl ? supabaseUrl.replace('.supabase.co', '.functions.supabase.co') : 'https://your-project-ref.functions.supabase.co');
  const basePath = `${functionsBase}/catch-webhook`;
  const webhookUrl = webhookData?.id
    ? `${basePath}/${webhookData.id}`
    : `${basePath}/${webhookData?.identifier ?? 'your-identifier'}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard?.writeText(webhookUrl);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card border border-border rounded-lg shadow-elevated max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Success Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
              <Icon name="CheckCircle" size={32} className="text-success" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Webhook Created Successfully!
            </h2>
            <p className="text-muted-foreground text-sm">
              Your webhook endpoint is ready to receive requests
            </p>
          </div>

          {/* Webhook Details */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Webhook URL
              </label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-muted rounded-md p-3 font-mono text-sm break-all">
                  {webhookUrl}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                >
                  <Icon name="Copy" size={16} />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">
                  Identifier
                </label>
                <p className="text-sm text-muted-foreground font-mono">
                  {webhookData?.identifier}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">
                  Methods
                </label>
                <div className="flex flex-wrap gap-1">
                  {webhookData?.httpMethods?.map((method) => (
                    <span
                      key={method}
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        method === 'GET' ? 'http-get' :
                        method === 'POST' ? 'http-post' :
                        method === 'PUT' ? 'http-put' :
                        method === 'DELETE' ? 'http-delete' :
                        'http-patch'
                      }`}
                    >
                      {method}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {webhookData?.description && (
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">
                  Description
                </label>
                <p className="text-sm text-muted-foreground">
                  {webhookData?.description}
                </p>
              </div>
            )}
          </div>

          {/* Quick Test */}
          <div className="bg-primary/10 border border-primary/20 rounded-md p-4 mb-6">
            <div className="flex items-start space-x-2">
              <Icon name="Zap" size={16} className="text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-primary font-medium">Ready to Test</p>
                <p className="text-primary/80 mt-1">
                  Your webhook is immediately available. Send a test request to see it in action!
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="default"
              onClick={onViewWebhook}
              iconName="ExternalLink"
              iconPosition="left"
              className="flex-1"
            >
              View Webhook Details
            </Button>
            <Button
              variant="outline"
              onClick={onCreateAnother}
              iconName="Plus"
              iconPosition="left"
              className="flex-1"
            >
              Create Another
            </Button>
          </div>

          {/* Close Button */}
          <div className="flex justify-center mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;