import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { IconName } from '../../components/AppIcon';
import ContextualHeader from '../../components/ui/ContextualHeader';
import WebhookHeader from './components/WebhookHeader';
import RequestFilters from './components/RequestFilters';
import RequestTable from './components/RequestTable';
import RealTimeIndicator from './components/RealTimeIndicator';
import WebhookTestModal from './components/WebhookTestModal';

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
  
  // Mock webhook data
  const [webhook] = useState({
    id: id || 'wh_1234567890',
    name: 'Payment Processing Webhook',
    url: 'https://hooks.hookcatch.com/wh_1234567890',
    createdAt: new Date('2025-09-15T10:30:00Z'),
    totalRequests: 1247,
    todayRequests: 23,
    avgResponseTime: 145,
    status: 'active'
  });

  // Mock requests data
  const [allRequests] = useState<RequestRecord[]>([
    {
      id: 'req_001',
      timestamp: new Date('2025-10-01T09:30:00Z'),
      method: 'POST',
      status: 200,
      ipAddress: '192.168.1.100',
      payloadSize: 1024,
      responseTime: 120,
      payload: {
        event: 'payment.completed',
        data: {
          id: 'pay_1234567890',
          amount: 2999,
          currency: 'usd',
          customer: {
            id: 'cus_1234567890',
            email: 'john.doe@example.com',
            name: 'John Doe'
          },
          metadata: {
            order_id: 'order_123',
            source: 'web_checkout'
          }
        },
        created: 1696147800
      },
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Stripe/1.0 (+https://stripe.com/docs/webhooks)',
        'Stripe-Signature': 't=1696147800,v1=abc123def456...',
        'X-Forwarded-For': '192.168.1.100'
      },
      responseHeaders: {
        'Content-Type': 'application/json',
        'X-Response-Time': '120ms'
      }
    },
    {
      id: 'req_002',
      timestamp: new Date('2025-10-01T09:25:00Z'),
      method: 'POST',
      status: 201,
      ipAddress: '10.0.0.50',
      payloadSize: 2048,
      responseTime: 95,
      payload: {
        event: 'customer.created',
        data: {
          id: 'cus_0987654321',
          email: 'jane.smith@example.com',
          name: 'Jane Smith',
          phone: '+1-555-0123',
          address: {
            line1: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            postal_code: '94105',
            country: 'US'
          }
        },
        created: 1696147500
      },
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MyApp/2.1.0',
        'Authorization': 'Bearer sk_test_...',
        'X-Request-ID': 'req_abc123'
      },
      responseHeaders: {
        'Content-Type': 'application/json',
        'X-Response-Time': '95ms'
      }
    },
    {
      id: 'req_003',
      timestamp: new Date('2025-10-01T09:20:00Z'),
      method: 'PUT',
      status: 400,
      ipAddress: '172.16.0.25',
      payloadSize: 512,
      responseTime: 200,
      payload: {
        error: 'Invalid request format',
        details: 'Missing required field: customer_id',
        timestamp: '2025-10-01T09:20:00Z'
      },
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TestClient/1.0',
        'X-API-Key': 'test_key_123'
      },
      responseHeaders: {
        'Content-Type': 'application/json',
        'X-Error-Code': 'VALIDATION_ERROR',
        'X-Response-Time': '200ms'
      }
    },
    {
      id: 'req_004',
      timestamp: new Date('2025-10-01T09:15:00Z'),
      method: 'GET',
      status: 404,
      ipAddress: '203.0.113.10',
      payloadSize: 0,
      responseTime: 50,
      payload: null,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      responseHeaders: {
        'Content-Type': 'text/html',
        'X-Response-Time': '50ms'
      }
    },
    {
      id: 'req_005',
      timestamp: new Date('2025-10-01T09:10:00Z'),
      method: 'DELETE',
      status: 500,
      ipAddress: '198.51.100.5',
      payloadSize: 256,
      responseTime: 1500,
      payload: {
        action: 'delete_webhook',
        webhook_id: 'wh_test_123',
        force: true
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sk_live_...',
        'X-Idempotency-Key': 'idem_key_456'
      },
      responseHeaders: {
        'Content-Type': 'application/json',
        'X-Error-Type': 'INTERNAL_SERVER_ERROR',
        'X-Response-Time': '1500ms'
      }
    }
  ]);

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

  // Simulate real-time connection
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly simulate connection status
      setIsConnected(Math.random() > 0.1);
      
      // Randomly add new requests notification
      if (Math.random() > 0.8) {
        setNewRequestsCount(prev => prev + Math.floor(Math.random() * 3) + 1);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard?.writeText(webhook?.url);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const handleDeleteWebhook = () => {
    if (window.confirm('Are you sure you want to delete this webhook? This action cannot be undone.')) {
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

  const handleReplayRequest = (request: RequestRecord) => {
    console.log('Replaying request:', request);
    // In a real app, this would send the request to a test endpoint
    alert(`Replaying ${request?.method} request from ${request?.timestamp?.toLocaleString()}`);
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
      </div>
    </div>
  );
};

export default WebhookDetails;