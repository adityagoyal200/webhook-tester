import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { IconName } from '../../components/AppIcon';
import ContextualHeader from '../../components/ui/ContextualHeader';
import WebhookHeader from './components/WebhookHeader';
import RequestFilters from './components/RequestFilters';
import RequestTable from './components/RequestTable';
import RealTimeIndicator from './components/RealTimeIndicator';
import WebhookTestModal from './components/WebhookTestModal';
import { webhookService } from '../../services/webhookService';

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RequestRecord {
  id: string;
  timestamp: Date;
  method: HTTPMethod;
  status: number;
  ipAddress: string;
  payloadSize: number;
  responseTime: number;
  payload: unknown | null;
  headers: Record<string, string>;
  responseHeaders: Record<string, string>;
}

interface Filters {
  search: string;
  method: '' | HTTPMethod;
  status: string;
  ipAddress: string;
}

const WebhookDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Loaded webhook data
  const [webhook, setWebhook] = useState<any | null>(null);

  // Loaded requests data
  const [allRequests, setAllRequests] = useState<RequestRecord[]>([]);

  const [filters, setFilters] = useState<Filters>({
    search: '',
    method: '',
    status: '',
    ipAddress: ''
  });

  const [filteredRequests, setFilteredRequests] = useState<RequestRecord[]>(allRequests);
  const [isConnected, setIsConnected] = useState(true);
  const [newRequestsCount, setNewRequestsCount] = useState(0);
  const [showTestModal, setShowTestModal] = useState(false);

  // Filter requests based on current filters
  useEffect(() => {
    let filtered = allRequests;

    if (filters?.search) {
      filtered = filtered?.filter(request => 
        JSON.stringify(request?.payload)?.toLowerCase()?.includes(filters?.search?.toLowerCase())
      );
    }

    if (filters?.method) {
      filtered = filtered?.filter(request => request?.method === filters?.method);
    }

    if (filters?.status) {
      filtered = filtered?.filter(request => request?.status?.toString() === filters?.status);
    }

    if (filters?.ipAddress) {
      filtered = filtered?.filter(request => 
        request?.ipAddress?.includes(filters?.ipAddress)
      );
    }

    setFilteredRequests(filtered);
  }, [filters, allRequests]);

  // Load webhook and requests from Supabase and subscribe to realtime
  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      try {
        const { data: webhookData } = await webhookService.getWebhook(id);
        if (webhookData) {
          setWebhook({
            id: webhookData.id,
            name: webhookData.name,
            url: webhookData.url,
            createdAt: new Date(webhookData.created_at),
            totalRequests: webhookData?.webhook_analytics?.total_requests ?? 0,
            todayRequests: 0,
            avgResponseTime: webhookData?.webhook_analytics?.avg_response_time_ms ?? 0,
            status: webhookData.status
          });
        }

        const { data: requestsData } = await webhookService.getWebhookRequests(id, 1, 50);
        if (requestsData) {
          const transformed = requestsData.map((r: any) => ({
            id: r.id,
            timestamp: new Date(r.created_at),
            method: (r.method || 'POST') as HTTPMethod,
            status: r.response_status ?? 200,
            ipAddress: r.ip_address || 'unknown',
            payloadSize: r.payload ? JSON.stringify(r.payload).length : 0,
            responseTime: r.processing_time_ms ?? 0,
            payload: r.payload ?? null,
            headers: r.headers ?? {},
            responseHeaders: {}
          }));
          setAllRequests(transformed);
        }

        const channel = webhookService.subscribeToWebhookRequests(id, (payload) => {
          const newRecord: any = (payload as any)?.new;
          if (newRecord?.webhook_id === id) {
            setAllRequests(prev => [{
              id: newRecord.id,
              timestamp: new Date(newRecord.created_at),
              method: (newRecord.method || 'POST') as HTTPMethod,
              status: newRecord.response_status ?? 200,
              ipAddress: newRecord.ip_address || 'unknown',
              payloadSize: newRecord.payload ? JSON.stringify(newRecord.payload).length : 0,
              responseTime: newRecord.processing_time_ms ?? 0,
              payload: newRecord.payload ?? null,
              headers: newRecord.headers ?? {},
              responseHeaders: {}
            }, ...prev]);
            setNewRequestsCount(prev => prev + 1);
          }
        });
        setIsConnected(!!channel);

        return () => webhookService.unsubscribeFromWebhookRequests(channel);
      } catch (e) {
        // swallow errors in UI
      }
    };
    loadData();
  }, [id]);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard?.writeText(webhook?.url);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const handleDeleteWebhook = async () => {
    if (!id) return;
    if (window.confirm('Are you sure you want to delete this webhook? This action cannot be undone.')) {
      await webhookService.deleteWebhook(id);
      navigate('/dashboard');
    }
  };

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      method: '',
      status: '',
      ipAddress: ''
    });
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(filteredRequests, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `webhook-${webhook?.id}-requests.json`;
    document.body?.appendChild(link);
    link?.click();
    document.body?.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleTestWebhook = () => {
    if (webhook) {
      setShowTestModal(true);
    }
  };

  const handleSendTestWebhook = async (testData: any) => {
    try {
      // Send the test webhook
      const response = await fetch(webhook?.url || testData.url, {
        method: testData.method,
        headers: {
          'Content-Type': 'application/json',
          ...testData.headers
        },
        body: testData.method !== 'GET' ? JSON.stringify(testData.payload) : undefined
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (id) {
        await webhookService.testWebhook(id, testData.payload ?? {});
      }

      console.log('Test webhook sent successfully');
    } catch (error) {
      console.error('Failed to send test webhook:', error);
      throw error;
    }
  };

  const handleReplayRequest = async (request: RequestRecord) => {
    try {
      const replayUrl = webhook?.url || '';
      
      const replayOptions: RequestInit = {
        method: request.method,
        headers: {
          ...request.headers,
          'X-Replay-Source': 'HookCatch',
          'X-Original-Timestamp': request.timestamp.toString(),
          'X-Replay-ID': request.id
        }
      };

      // Add body for non-GET requests
      if (request.method !== 'GET' && request.payload) {
        replayOptions.body = JSON.stringify(request.payload);
      }

      const response = await fetch(replayUrl, replayOptions);
      
      if (response.ok) {
        alert(`✅ Request replayed successfully!\n\nMethod: ${request.method}\nStatus: ${response.status}\nOriginal: ${request.timestamp.toLocaleString()}`);
      } else {
        alert(`⚠️ Replay completed with status ${response.status}\n\nMethod: ${request.method}\nOriginal: ${request.timestamp.toLocaleString()}`);
      }
    } catch (error) {
      console.error('Replay failed:', error);
      alert(`❌ Replay failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleClearNewRequests = () => {
    setNewRequestsCount(0);
  };

  const breadcrumbs: { label: string; path: string; current?: boolean }[] = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Webhooks', path: '/dashboard' },
    { label: webhook?.name, path: `/webhook-details/${webhook?.id}`, current: true }
  ];

  type HeaderActionLocal = {
    label: string;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    icon?: IconName;
    onClick: () => void;
  };

  const headerActions: HeaderActionLocal[] = [
    {
      label: 'Create New',
      variant: 'default',
      icon: 'Plus',
      onClick: () => navigate('/create-webhook')
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <ContextualHeader
        title="Webhook Details"
        subtitle="Monitor and inspect webhook requests in real-time"
        breadcrumbs={breadcrumbs}
        actions={headerActions}
      />
      <div className="px-6 py-6">
        <WebhookHeader
          webhook={webhook}
          onCopyUrl={handleCopyUrl}
          onDeleteWebhook={handleDeleteWebhook}
          onTestWebhook={handleTestWebhook}
        />

        <RequestFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          onExportData={handleExportData}
          totalRequests={filteredRequests?.length}
        />

        <RequestTable
          requests={filteredRequests}
          onReplayRequest={(request: any) => handleReplayRequest(request)}
        />

        <RealTimeIndicator
          isConnected={isConnected}
          newRequestsCount={newRequestsCount}
          onClearNewRequests={handleClearNewRequests}
        />

        <WebhookTestModal
          isOpen={showTestModal && webhook !== null}
          onClose={() => setShowTestModal(false)}
          webhookUrl={webhook?.url || ''}
          onSendTest={handleSendTestWebhook}
        />
      </div>
    </div>
  );
};

export default WebhookDetails;