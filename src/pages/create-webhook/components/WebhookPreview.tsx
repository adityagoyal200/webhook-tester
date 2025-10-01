import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const WebhookPreview = ({ identifier, httpMethods = ['POST'], description }: {
  identifier?: string;
  httpMethods?: string[];
  description?: string;
}) => {
  const [copied, setCopied] = useState(false);
  
  const configuredBase = (import.meta as any)?.env?.VITE_FUNCTIONS_BASE_URL as string | undefined;
  const supabaseUrl = (import.meta as any)?.env?.VITE_SUPABASE_URL as string | undefined;
  const functionsBase = configuredBase || (supabaseUrl ? supabaseUrl.replace('.supabase.co', '.functions.supabase.co') : 'https://your-project-ref.functions.supabase.co');
  const basePath = `${functionsBase}/catch-webhook`;
  const webhookUrl = identifier ? `${basePath}/${identifier}` : `${basePath}/your-identifier`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard?.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  const generateCurlCommand = (method: string) => {
    return `curl -X ${method} "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{"test": "data", "timestamp": "${new Date()?.toISOString()}"}'`;
  };

  if (!identifier) {
    return (
      <div className="bg-muted/30 border border-border rounded-lg p-6">
        <div className="text-center">
          <Icon name="Globe" size={48} className="text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Webhook URL Preview</h3>
          <p className="text-muted-foreground text-sm">
            Enter an identifier to see your webhook URL preview
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* URL Preview */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-foreground">Your Webhook URL</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            iconName={copied ? "Check" : "Copy"}
            iconPosition="left"
          >
            {copied ? 'Copied!' : 'Copy URL'}
          </Button>
        </div>
        
        <div className="bg-muted rounded-md p-4 font-mono text-sm break-all">
          <span className="text-foreground">{webhookUrl}</span>
        </div>
        
        {description && (
          <p className="text-muted-foreground text-sm mt-3">{description}</p>
        )}
      </div>
      {/* HTTP Methods */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-md font-medium text-foreground mb-3">Accepted HTTP Methods</h4>
        <div className="flex flex-wrap gap-2">
          {httpMethods?.map((method) => (
            <span
              key={method}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
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
      {/* Sample cURL Commands */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-md font-medium text-foreground mb-4">Test Your Webhook</h4>
        <div className="space-y-4">
          {httpMethods?.slice(0, 2)?.map((method) => (
            <div key={method} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Sample {method} Request</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigator.clipboard?.writeText(generateCurlCommand(method))}
                  iconName="Copy"
                  iconPosition="left"
                >
                  Copy
                </Button>
              </div>
              <div className="bg-muted rounded-md p-3 overflow-x-auto">
                <pre className="text-xs font-mono text-foreground whitespace-pre-wrap">
                  {generateCurlCommand(method)}
                </pre>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-md">
          <div className="flex items-start space-x-2">
            <Icon name="Info" size={16} className="text-primary mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-primary font-medium">Testing Tips</p>
              <p className="text-primary/80 mt-1">
                Use these cURL commands in your terminal to test your webhook immediately after creation. 
                You can also use tools like Postman, Insomnia, or any HTTP client.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebhookPreview;