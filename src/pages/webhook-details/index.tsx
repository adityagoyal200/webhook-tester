import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
  const { id: routeId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get ID from either route params or query params
  const id = routeId || searchParams.get('id');
  
  // Loaded webhook data
  const [webhook, setWebhook] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      if (!id) {
        setError('No webhook ID provided');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('Loading webhook details for ID:', id);
        
        const { data: webhookData, error: webhookError } = await webhookService.getWebhook(id);
        
        if (webhookError) {
          console.error('Error loading webhook:', webhookError);
          setError(`Failed to load webhook: ${webhookError.message}`);
          setLoading(false);
          return;
        }

        if (webhookData) {
          console.log('Webhook data loaded:', webhookData);
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

        const { data: requestsData, error: requestsError } = await webhookService.getWebhookRequests(id, 1, 50);
        
        if (requestsError) {
          console.error('Error loading requests:', requestsError);
          // Don't overwrite webhook error with requests error
          if (!webhook) {
            setError(`Failed to load requests: ${requestsError.message}`);
          }
        } else if (requestsData) {
          console.log('Requests data loaded:', requestsData.length, 'requests');
          console.log('Raw requests data:', requestsData);
          const transformed = requestsData.map((r: any) => ({
            id: r.id,
            timestamp: new Date(r.created_at),
            method: (r.method || 'POST') as HTTPMethod,
            status: r.status ?? 200,
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
              status: newRecord.status ?? 200,
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
        console.error('Error loading webhook details:', e);
        setError(`Failed to load webhook details: ${e instanceof Error ? e.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
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
      console.log('Creating test webhook request:', testData);

      if (!id) {
        throw new Error('No webhook ID available');
      }

      // Use the webhookService.testWebhook method which creates a test request record
      const { data, error } = await webhookService.testWebhook(
        id, 
        testData.payload ?? {}, 
        testData.method || 'POST', 
        testData.headers || {}
      );

      if (error) {
        console.error('Failed to create test webhook request:', error);
        throw new Error(`Failed to create test request: ${error.message}`);
      }

      console.log('Test webhook request created successfully:', data);
      
      // Refresh the requests list to show the new test request
      const { data: requestsData } = await webhookService.getWebhookRequests(id, 1, 50);
      if (requestsData) {
        const transformed = requestsData.map((r: any) => ({
          id: r.id,
          timestamp: new Date(r.created_at),
          method: (r.method || 'POST') as HTTPMethod,
          status: r.status ?? 200,
          ipAddress: r.ip_address || 'unknown',
          payloadSize: r.payload ? JSON.stringify(r.payload).length : 0,
          responseTime: r.processing_time_ms ?? 0,
          payload: r.payload ?? null,
          headers: r.headers ?? {},
          responseHeaders: {}
        }));
        setAllRequests(transformed);
      }

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

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading webhook details...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-error/10 border border-error/20 rounded-lg p-6">
            <h3 className="text-error font-medium mb-2">Error Loading Webhook</h3>
            <p className="text-error/80 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-error text-white rounded-md hover:bg-error/80"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show no webhook found state
  if (!webhook) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <h3 className="text-foreground font-medium mb-2">Webhook Not Found</h3>
          <p className="text-muted-foreground mb-4">The webhook with ID "{id}" could not be found.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

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