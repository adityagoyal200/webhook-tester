import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const WebhookTable = ({ webhooks, onCopyUrl, onViewRequests, onDeleteWebhook }) => {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = async (webhook) => {
    await onCopyUrl(webhook);
    setCopiedId(webhook?.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })?.format(date);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success border-success/20';
      case 'inactive': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-foreground">Name</th>
              <th className="text-left py-3 px-4 font-medium text-foreground">Endpoint</th>
              <th className="text-left py-3 px-4 font-medium text-foreground">Requests</th>
              <th className="text-left py-3 px-4 font-medium text-foreground">Last Activity</th>
              <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
              <th className="text-right py-3 px-4 font-medium text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {webhooks?.map((webhook) => (
              <tr key={webhook?.id} className="border-b border-border hover:bg-muted/30 transition-colors duration-200">
                <td className="py-4 px-4">
                  <div>
                    <p className="font-medium text-foreground">{webhook?.name}</p>
                    <p className="text-sm text-muted-foreground">{webhook?.description}</p>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-2">
                    <code className="text-sm bg-muted px-2 py-1 rounded font-mono text-foreground">
                      {webhook?.url}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopy(webhook)}
                      className="h-8 w-8"
                    >
                      <Icon 
                        name={copiedId === webhook?.id ? "Check" : "Copy"} 
                        size={14} 
                        className={copiedId === webhook?.id ? "text-success" : "text-muted-foreground"}
                      />
                    </Button>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-foreground font-medium">{webhook?.requestCount}</span>
                    {webhook?.recentRequests > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                        +{webhook?.recentRequests} new
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm text-muted-foreground">
                    {webhook?.lastActivity ? formatDate(webhook?.lastActivity) : 'Never'}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${getStatusColor(webhook?.status)}`}>
                    {webhook?.status}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewRequests(webhook)}
                      iconName="Eye"
                      iconPosition="left"
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteWebhook(webhook)}
                      className="text-error hover:text-error hover:bg-error/10"
                    >
                      <Icon name="Trash2" size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile Cards */}
      <div className="md:hidden space-y-4 p-4">
        {webhooks?.map((webhook) => (
          <div key={webhook?.id} className="border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-foreground">{webhook?.name}</h3>
                <p className="text-sm text-muted-foreground">{webhook?.description}</p>
              </div>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${getStatusColor(webhook?.status)}`}>
                {webhook?.status}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono text-foreground flex-1 truncate">
                  {webhook?.url}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopy(webhook)}
                  className="h-8 w-8 flex-shrink-0"
                >
                  <Icon 
                    name={copiedId === webhook?.id ? "Check" : "Copy"} 
                    size={14} 
                    className={copiedId === webhook?.id ? "text-success" : "text-muted-foreground"}
                  />
                </Button>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {webhook?.requestCount} requests
                </span>
                <span className="text-muted-foreground">
                  {webhook?.lastActivity ? formatDate(webhook?.lastActivity) : 'Never'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewRequests(webhook)}
                iconName="Eye"
                iconPosition="left"
                className="flex-1"
              >
                View Requests
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDeleteWebhook(webhook)}
                className="text-error hover:text-error hover:bg-error/10"
              >
                <Icon name="Trash2" size={16} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WebhookTable;