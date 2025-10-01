import { useState } from 'react';
import Icon, { type IconName } from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

type TabId = 'payload' | 'headers' | 'response';
type HeaderValue = string | number | boolean | null | undefined | string[];
interface RequestLike {
  id?: string | number;
  payload?: unknown;
  headers?: Record<string, HeaderValue> | undefined;
  status?: number;
  responseTime?: number;
  responseHeaders?: Record<string, HeaderValue> | undefined;
}
interface PayloadViewerProps {
  request?: RequestLike;
}

const PayloadViewer = ({ request }: PayloadViewerProps) => {
  const [activeTab, setActiveTab] = useState<TabId>('payload');
  const [isRawView, setIsRawView] = useState(false);

  const formatJson = (obj: unknown): string => {
    try {
      return typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard?.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const tabs: { id: TabId; label: string; icon: IconName }[] = [
    { id: 'payload', label: 'Payload', icon: 'FileText' },
    { id: 'headers', label: 'Headers', icon: 'List' },
    { id: 'response', label: 'Response', icon: 'ArrowRight' }
  ];

  const renderPayloadContent = () => {
    if (!request?.payload) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No payload data
        </div>
      );
    }

    const content = isRawView ? 
      (typeof request?.payload === 'string' ? request?.payload : formatJson(request?.payload)) :
      formatJson(request?.payload);

    return (
      <div className="relative">
        <div className="absolute top-2 right-2 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            iconName={isRawView ? "Eye" : "Code"}
            onClick={() => setIsRawView(!isRawView)}
          >
            {isRawView ? 'Formatted' : 'Raw'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            iconName="Copy"
            onClick={() => copyToClipboard(content)}
          >
            Copy
          </Button>
        </div>
        <pre className="bg-background border border-border rounded p-4 text-sm font-mono overflow-x-auto text-foreground whitespace-pre-wrap">
          {content}
        </pre>
      </div>
    );
  };

  const renderHeaders = () => {
    if (!request?.headers || Object.keys(request?.headers)?.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No headers data
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {Object.entries((request?.headers ?? {}) as Record<string, HeaderValue>)?.map(([key, value]) => (
          <div key={key} className="flex items-start gap-4 py-2 border-b border-border last:border-b-0">
            <div className="font-medium text-foreground min-w-0 flex-1">
              {key}
            </div>
            <div className="text-muted-foreground font-mono text-sm min-w-0 flex-2 break-all">
              {Array.isArray(value) ? value.join(', ') : String(value)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderResponse = () => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium text-foreground mb-1">Status Code</div>
            <div className="text-sm text-muted-foreground">{request?.status}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-foreground mb-1">Response Time</div>
            <div className="text-sm text-muted-foreground">{request?.responseTime}ms</div>
          </div>
        </div>
        {request?.responseHeaders && (
          <div>
            <div className="text-sm font-medium text-foreground mb-2">Response Headers</div>
            <div className="space-y-1">
              {Object.entries((request?.responseHeaders ?? {}) as Record<string, HeaderValue>)?.map(([key, value]) => (
                <div key={key} className="flex items-start gap-4 text-sm">
                  <div className="font-medium text-foreground min-w-0 flex-1">
                    {key}
                  </div>
                  <div className="text-muted-foreground font-mono min-w-0 flex-2 break-all">
                    {Array.isArray(value) ? value.join(', ') : String(value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'payload':
        return renderPayloadContent();
      case 'headers':
        return renderHeaders();
      case 'response':
        return renderResponse();
      default:
        return null;
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-1">
          {tabs?.map((tab) => (
            <button
              key={tab?.id}
              onClick={() => setActiveTab(tab?.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus-ring ${
                activeTab === tab?.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Icon name={tab?.icon} size={16} />
              <span>{tab?.label}</span>
            </button>
          ))}
        </div>
        
        <div className="text-sm text-muted-foreground">
          Request ID: {request?.id}
        </div>
      </div>
      <div className="min-h-[200px]">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default PayloadViewer;