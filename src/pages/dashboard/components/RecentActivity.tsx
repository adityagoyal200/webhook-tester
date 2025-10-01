import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface Activity {
  id: string | number;
  method: HTTPMethod;
  webhookName: string;
  status: number;
  timestamp: Date | number;
  ip: string;
  userAgent: string;
  headers: Record<string, string>;
  payload?: unknown;
}

interface RecentActivityProps {
  activities: Activity[];
  onViewDetails: (activity: Activity) => void;
}

const RecentActivity: React.FC<RecentActivityProps> = ({ activities, onViewDetails }) => {
  const [expandedId, setExpandedId] = useState<string | number | null>(null);

  const formatTime = (date: Date | number) => {
    const d = typeof date === 'number' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })?.format(d);
  };

  const getMethodColor = (method: HTTPMethod) => {
    const colors: Record<HTTPMethod, string> = {
      'GET': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      'POST': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      'PUT': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
      'DELETE': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
      'PATCH': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
    };
    return colors?.[method] || 'bg-muted text-muted-foreground';
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-success';
    if (status >= 400 && status < 500) return 'text-warning';
    if (status >= 500) return 'text-error';
    return 'text-muted-foreground';
  };

  const toggleExpanded = (id: string | number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="bg-card border border-border rounded-lg">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
          <Button variant="ghost" size="sm" iconName="RefreshCw">
            Refresh
          </Button>
        </div>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {activities?.length === 0 ? (
          <div className="p-8 text-center">
            <Icon name="Activity" size={48} className="text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium text-foreground mb-2">No Recent Activity</h4>
            <p className="text-muted-foreground">
              Webhook requests will appear here as they come in
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {activities?.map((activity: Activity) => (
              <div key={activity?.id} className="p-4 hover:bg-muted/30 transition-colors duration-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getMethodColor(activity?.method)}`}>
                      {activity?.method}
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {activity?.webhookName}
                    </span>
                    <span className={`text-sm font-medium ${getStatusColor(activity?.status)}`}>
                      {activity?.status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">
                      {formatTime(activity?.timestamp)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleExpanded(activity?.id)}
                      className="h-6 w-6"
                    >
                      <Icon 
                        name={expandedId === activity?.id ? "ChevronUp" : "ChevronDown"} 
                        size={14} 
                      />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Icon name="Globe" size={14} />
                    <span>{activity?.ip}</span>
                    <span>•</span>
                    <span>{activity?.userAgent}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(activity)}
                    className="text-xs"
                  >
                    View Details
                  </Button>
                </div>

                {expandedId === activity?.id && (
                  <div className="mt-3 p-3 bg-muted/50 rounded-md">
                    <div className="space-y-2">
                      <div>
                        <h5 className="text-xs font-medium text-foreground mb-1">Headers</h5>
                        <div className="text-xs text-muted-foreground space-y-1">
                          {Object.entries(activity?.headers)?.slice(0, 3)?.map(([key, value]) => (
                            <div key={key} className="flex">
                              <span className="font-mono w-24 flex-shrink-0">{key}:</span>
                              <span className="font-mono truncate">{value}</span>
                            </div>
                          ))}
                          {Object.keys(activity?.headers)?.length > 3 && (
                            <div className="text-muted-foreground">
                              +{Object.keys(activity?.headers)?.length - 3} more headers
                            </div>
                          )}
                        </div>
                      </div>

                      {(activity?.payload !== undefined && activity?.payload !== null) && (
                        <div>
                          <h5 className="text-xs font-medium text-foreground mb-1">Payload Preview</h5>
                          <pre className="text-xs bg-background p-2 rounded border font-mono text-foreground overflow-x-auto">
                            {JSON.stringify(activity?.payload, null, 2)?.slice(0, 200)}
                            {JSON.stringify(activity?.payload)?.length > 200 && '...'}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;