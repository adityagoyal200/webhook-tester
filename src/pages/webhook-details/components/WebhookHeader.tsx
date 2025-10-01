import { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

interface WebhookSummary {
  name?: string;
  createdAt?: Date | number | string;
  url?: string;
  totalRequests?: number;
  todayRequests?: number;
  avgResponseTime?: number; // in ms
  status?: 'active' | 'inactive' | string;
}

interface WebhookHeaderProps {
  webhook: WebhookSummary;
  onCopyUrl: () => Promise<void> | void;
  onDeleteWebhook: () => void;
  onTestWebhook?: () => void;
}

const WebhookHeader = ({ webhook, onCopyUrl, onDeleteWebhook, onTestWebhook }: WebhookHeaderProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = async () => {
    await onCopyUrl();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (date: Date | number | string | undefined): string => {
    if (date === undefined) return '';
    const normalized: Date | number = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })?.format(normalized);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Icon name="Webhook" size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                {webhook?.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                Created {formatDate(webhook?.createdAt)}
              </p>
            </div>
          </div>

          <div className="bg-muted rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <code className="text-sm font-mono text-foreground break-all">
                {webhook?.url}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyUrl}
                iconName={copied ? "Check" : "Copy"}
                className="ml-2 flex-shrink-0"
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-semibold text-foreground">
                {webhook?.totalRequests?.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Requests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-foreground">
                {webhook?.todayRequests}
              </div>
              <div className="text-sm text-muted-foreground">Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-foreground">
                {webhook?.avgResponseTime}ms
              </div>
              <div className="text-sm text-muted-foreground">Avg Response</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-semibold ${webhook?.status === 'active' ? 'text-success' : 'text-muted-foreground'}`}>
                {webhook?.status === 'active' ? 'Active' : 'Inactive'}
              </div>
              <div className="text-sm text-muted-foreground">Status</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="default"
            iconName="Play"
            onClick={onTestWebhook}
          >
            Test Webhook
          </Button>
          <Button
            variant="outline"
            iconName="Settings"
            onClick={() => {}}
          >
            Settings
          </Button>
          <Button
            variant="destructive"
            iconName="Trash2"
            onClick={onDeleteWebhook}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WebhookHeader;