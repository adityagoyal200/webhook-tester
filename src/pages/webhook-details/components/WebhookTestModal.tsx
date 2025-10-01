import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

interface WebhookTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  webhookUrl: string;
  onSendTest: (testData: any) => Promise<void>;
}

const WebhookTestModal = ({ isOpen, onClose, webhookUrl, onSendTest }: WebhookTestModalProps) => {
  const [testMethod, setTestMethod] = useState('POST');
  const [testPayload, setTestPayload] = useState(`{
  "event": "test.webhook",
  "data": {
    "message": "This is a test webhook payload",
    "timestamp": "${new Date().toISOString()}",
    "test": true
  }
}`);
  const [customHeaders, setCustomHeaders] = useState('{\n  "Content-Type": "application/json",\n  "X-Test-Header": "test-value"\n}');
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const methodOptions = [
    { value: 'GET', label: 'GET' },
    { value: 'POST', label: 'POST' },
    { value: 'PUT', label: 'PUT' },
    { value: 'PATCH', label: 'PATCH' },
    { value: 'DELETE', label: 'DELETE' }
  ];

  const handleSendTest = async () => {
    setIsSending(true);
    setError(null);
    setResult(null);

    try {
      let parsedHeaders = {};
      let parsedPayload = null;

      // Parse custom headers
      try {
        parsedHeaders = JSON.parse(customHeaders);
      } catch (e) {
        setError('Invalid JSON in custom headers');
        setIsSending(false);
        return;
      }

      // Parse payload for non-GET requests
      if (testMethod !== 'GET') {
        try {
          parsedPayload = JSON.parse(testPayload);
        } catch (e) {
          setError('Invalid JSON in payload');
          setIsSending(false);
          return;
        }
      }

      const testData = {
        method: testMethod,
        url: webhookUrl,
        headers: parsedHeaders,
        payload: parsedPayload
      };

      await onSendTest(testData);
      
      setResult({
        status: 'success',
        message: 'Test webhook sent successfully! Check your webhook endpoint to see the request.',
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send test webhook');
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Test Webhook</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
          >
            <Icon name="X" size={20} />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Webhook URL */}
          <div>
            <label className="text-sm font-medium text-foreground">Webhook URL</label>
            <div className="mt-1 p-3 bg-muted rounded-lg">
              <code className="text-sm text-foreground break-all">{webhookUrl}</code>
            </div>
          </div>

          {/* HTTP Method */}
          <div>
            <Select
              label="HTTP Method"
              options={methodOptions}
              value={testMethod}
              onChange={(value) => setTestMethod(String(value))}
              className="max-w-xs"
            />
          </div>

          {/* Custom Headers */}
          <div>
            <label className="text-sm font-medium text-foreground">Custom Headers (JSON)</label>
            <textarea
              value={customHeaders}
              onChange={(e) => setCustomHeaders(e.target.value)}
              className="w-full mt-1 p-3 border border-border rounded-md bg-background text-foreground font-mono text-sm"
              rows={4}
              placeholder="Enter custom headers as JSON"
            />
          </div>

          {/* Test Payload */}
          {testMethod !== 'GET' && (
            <div>
              <label className="text-sm font-medium text-foreground">Test Payload (JSON)</label>
              <textarea
                value={testPayload}
                onChange={(e) => setTestPayload(e.target.value)}
                className="w-full mt-1 p-3 border border-border rounded-md bg-background text-foreground font-mono text-sm"
                rows={8}
                placeholder="Enter test payload as JSON"
              />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-lg flex items-center space-x-2">
              <Icon name="AlertTriangle" size={16} className="text-error" />
              <span className="text-sm text-error">{error}</span>
            </div>
          )}

          {/* Success Result */}
          {result && (
            <div className="p-3 bg-success/10 border border-success/20 rounded-lg flex items-center space-x-2">
              <Icon name="Check" size={16} className="text-success" />
              <span className="text-sm text-success">{result.message}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              onClick={handleSendTest}
              disabled={isSending}
              iconName="Send"
            >
              {isSending ? 'Sending...' : 'Send Test Webhook'}
            </Button>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSending}
            >
              Close
            </Button>
          </div>

          {/* Help Text */}
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Icon name="Info" size={16} className="text-primary mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Testing Tips:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Make sure your webhook endpoint is running and accessible</li>
                  <li>• Check your endpoint logs to see the incoming request</li>
                  <li>• The test request will appear in your webhook request history</li>
                  <li>• Use realistic payload data that matches your actual webhook events</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebhookTestModal;
