import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import PayloadViewer from './PayloadViewer';

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RequestRecord {
  id: string;
  timestamp: Date | number | string;
  method: HTTPMethod;
  status: number;
  ipAddress: string;
  payloadSize: number;
  responseTime: number;
  payload: unknown | null;
  headers: Record<string, string>;
  responseHeaders: Record<string, string>;
}

interface RequestTableProps {
  requests: RequestRecord[];
  onReplayRequest: (request: RequestRecord) => void;
}

const RequestTable = ({ requests, onReplayRequest }: RequestTableProps) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const getMethodColor = (method: HTTPMethod): string => {
    const colors: Record<HTTPMethod, string> = {
      GET: 'http-get',
      POST: 'http-post',
      PUT: 'http-put',
      DELETE: 'http-delete',
      PATCH: 'http-patch'
    };
    return colors?.[method] || 'bg-muted text-muted-foreground';
  };

  const getStatusColor = (status: number): string => {
    if (status >= 200 && status < 300) return 'status-success';
    if (status >= 400 && status < 500) return 'status-warning';
    if (status >= 500) return 'status-error';
    return 'bg-muted text-muted-foreground';
  };

  const formatTimestamp = (timestamp: Date | number | string): string => {
    const normalized: Date | number =
      typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })?.format(normalized);
  };

  const formatPayloadSize = (size: number): string => {
    if (size < 1024) return `${size}B`;
    if (size < 1024 * 1024) return `${(size / 1024)?.toFixed(1)}KB`;
    return `${(size / (1024 * 1024))?.toFixed(1)}MB`;
  };

  const toggleRowExpansion = (requestId: string) => {
    setExpandedRow(expandedRow === requestId ? null : requestId);
  };

  if (requests?.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon name="Webhook" size={24} className="text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          No requests yet
        </h3>
        <p className="text-muted-foreground">
          Webhook requests will appear here once they start coming in.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-foreground">
                Timestamp
              </th>
              <th className="text-left py-3 px-4 font-medium text-foreground">
                Method
              </th>
              <th className="text-left py-3 px-4 font-medium text-foreground">
                Status
              </th>
              <th className="text-left py-3 px-4 font-medium text-foreground">
                IP Address
              </th>
              <th className="text-left py-3 px-4 font-medium text-foreground">
                Size
              </th>
              <th className="text-left py-3 px-4 font-medium text-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {requests?.map((request: RequestRecord) => (
              <React.Fragment key={request?.id}>
                <tr 
                  className="border-b border-border hover:bg-muted/30 transition-colors duration-200 cursor-pointer"
                  onClick={() => toggleRowExpansion(request?.id)}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Icon 
                        name={expandedRow === request?.id ? "ChevronDown" : "ChevronRight"} 
                        size={16} 
                        className="text-muted-foreground" 
                      />
                      <span className="text-sm font-mono text-foreground">
                        {formatTimestamp(request?.timestamp)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getMethodColor(request?.method)}`}>
                      {request?.method}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getStatusColor(request?.status)}`}>
                      {request?.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm font-mono text-muted-foreground">
                      {request?.ipAddress}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-muted-foreground">
                      {formatPayloadSize(request?.payloadSize)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      iconName="RotateCcw"
                      onClick={(e) => {
                        e?.stopPropagation();
                        onReplayRequest(request);
                      }}
                    >
                      Replay
                    </Button>
                  </td>
                </tr>
                
                {expandedRow === request?.id && (
                  <tr>
                    <td colSpan={6} className="p-0">
                      <div className="border-t border-border bg-muted/20">
                        <PayloadViewer request={request} />
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RequestTable;