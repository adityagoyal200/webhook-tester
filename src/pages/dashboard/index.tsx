import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import StatsCard from './components/StatsCard';
import WebhookTable from './components/WebhookTable';
import RecentActivity from './components/RecentActivity';
import SearchFilters from './components/SearchFilters';
import UsageLimitBanner from './components/UsageLimitBanner';
import DeleteConfirmModal from './components/DeleteConfirmModal';

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, webhook: null });
  const [isDeleting, setIsDeleting] = useState(false);

  // Mock user data
  const currentUser = {
    tier: 'free',
    webhookLimit: 5,
    requestLimit: 1000,
    retentionDays: 7
  };

  // Mock webhook data
  const [webhooks, setWebhooks] = useState([
    {
      id: 'wh_1',
      name: 'Payment Gateway',
      description: 'Stripe payment confirmations',
      url: 'https://api.hookcatch.com/wh/abc123def456',
      requestCount: 247,
      recentRequests: 3,
      lastActivity: new Date(Date.now() - 300000),
      status: 'active',
      createdAt: new Date('2024-09-15')
    },
    {
      id: 'wh_2',
      name: 'User Registration',
      description: 'New user signup notifications',
      url: 'https://api.hookcatch.com/wh/xyz789ghi012',
      requestCount: 89,
      recentRequests: 0,
      lastActivity: new Date(Date.now() - 3600000),
      status: 'active',
      createdAt: new Date('2024-09-20')
    },
    {
      id: 'wh_3',
      name: 'Order Updates',
      description: 'E-commerce order status changes',
      url: 'https://api.hookcatch.com/wh/mno345pqr678',
      requestCount: 156,
      recentRequests: 1,
      lastActivity: new Date(Date.now() - 1800000),
      status: 'active',
      createdAt: new Date('2024-09-10')
    }
  ]);

  // Mock recent activity data
  const [recentActivity] = useState([
    {
      id: 'req_1',
      webhookName: 'Payment Gateway',
      method: 'POST',
      status: 200,
      ip: '192.168.1.100',
      userAgent: 'Stripe/1.0',
      timestamp: new Date(Date.now() - 120000),
      headers: {
        'content-type': 'application/json',
        'stripe-signature': 'v1=abc123...',
        'user-agent': 'Stripe/1.0'
      },
      payload: {
        id: 'evt_1234567890',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_1234567890',
            amount: 2000,
            currency: 'usd'
          }
        }
      }
    },
    {
      id: 'req_2',
      webhookName: 'User Registration',
      method: 'POST',
      status: 201,
      ip: '10.0.0.50',
      userAgent: 'MyApp/2.1.0',
      timestamp: new Date(Date.now() - 300000),
      headers: {
        'content-type': 'application/json',
        'authorization': 'Bearer token123',
        'x-api-version': '2024-01-01'
      },
      payload: {
        event: 'user.created',
        user: {
          id: 'user_123',
          email: 'john@example.com',
          name: 'John Doe'
        }
      }
    },
    {
      id: 'req_3',
      webhookName: 'Order Updates',
      method: 'PUT',
      status: 200,
      ip: '172.16.0.25',
      userAgent: 'ShopifyWebhook/1.0',
      timestamp: new Date(Date.now() - 600000),
      headers: {
        'content-type': 'application/json',
        'x-shopify-topic': 'orders/updated',
        'x-shopify-hmac-sha256': 'xyz789...'
      },
      payload: {
        id: 'order_456',
        status: 'shipped',
        tracking_number: 'TRK123456789'
      }
    }
  ]);

  // Calculate stats
  const totalRequests = webhooks?.reduce((sum, wh) => sum + wh?.requestCount, 0);
  const activeWebhooks = webhooks?.filter(wh => wh?.status === 'active')?.length;
  const recentRequestsCount = webhooks?.reduce((sum, wh) => sum + wh?.recentRequests, 0);

  // Filter and sort webhooks
  const filteredWebhooks = webhooks?.filter(webhook => {
      const matchesSearch = webhook?.name?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
                           webhook?.url?.toLowerCase()?.includes(searchQuery?.toLowerCase());
      const matchesStatus = statusFilter === 'all' || webhook?.status === statusFilter;
      return matchesSearch && matchesStatus;
    })?.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a?.name?.localeCompare(b?.name);
        case 'requests':
          return b?.requestCount - a?.requestCount;
        case 'activity':
          return (b?.lastActivity || 0) - (a?.lastActivity || 0);
        case 'created':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

  const handleCreateWebhook = () => {
    navigate('/create-webhook');
  };

  const handleCopyUrl = async (webhook) => {
    try {
      await navigator.clipboard?.writeText(webhook?.url);
      // Show success feedback (handled by WebhookTable component)
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const handleViewRequests = (webhook) => {
    navigate(`/webhook-details?id=${webhook?.id}`);
  };

  const handleDeleteWebhook = (webhook) => {
    setDeleteModal({ isOpen: true, webhook });
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setWebhooks(prev => prev?.filter(wh => wh?.id !== deleteModal?.webhook?.id));
      setDeleteModal({ isOpen: false, webhook: null });
    } catch (error) {
      console.error('Failed to delete webhook:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ isOpen: false, webhook: null });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSortBy('created');
  };

  const handleUpgrade = () => {
    navigate('/account-settings');
  };

  const handleViewActivityDetails = (activity) => {
    const webhook = webhooks?.find(wh => wh?.name === activity?.webhookName);
    if (webhook) {
      navigate(`/webhook-details?id=${webhook?.id}&request=${activity?.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Page Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-semibold text-foreground mb-2">
                Webhook Dashboard
              </h1>
              <p className="text-muted-foreground">
                Manage your webhook URLs and monitor incoming requests in real-time
              </p>
            </div>
            <div className="mt-4 lg:mt-0">
              <Button
                variant="default"
                size="lg"
                onClick={handleCreateWebhook}
                iconName="Plus"
                iconPosition="left"
              >
                Create New Webhook
              </Button>
            </div>
          </div>

          {/* Usage Limit Banner */}
          <UsageLimitBanner
            currentTier={currentUser?.tier}
            webhookCount={webhooks?.length}
            webhookLimit={currentUser?.webhookLimit}
            requestCount={totalRequests}
            requestLimit={currentUser?.requestLimit}
            onUpgrade={handleUpgrade}
          />

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Active Webhooks"
              value={activeWebhooks}
              subtitle={`${webhooks?.length}/${currentUser?.webhookLimit} total`}
              icon="Webhook"
              color="primary"
            />
            <StatsCard
              title="Total Requests"
              value={totalRequests?.toLocaleString()}
              subtitle="All time"
              icon="BarChart3"
              color="success"
              trend="up"
              trendValue="+12%"
            />
            <StatsCard
              title="Recent Requests"
              value={recentRequestsCount}
              subtitle="Last 24 hours"
              icon="Activity"
              color="warning"
              trend="up"
              trendValue="+5"
            />
            <StatsCard
              title="Data Retention"
              value={`${currentUser?.retentionDays} days`}
              subtitle={currentUser?.tier === 'free' ? 'Free tier' : 'Pro tier'}
              icon="Clock"
              color="primary"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="xl:col-span-2 space-y-6">
              {/* Search and Filters */}
              <SearchFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                sortBy={sortBy}
                onSortChange={setSortBy}
                onClearFilters={handleClearFilters}
              />

              {/* Webhooks Table */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-foreground">
                    Your Webhooks ({filteredWebhooks?.length})
                  </h2>
                </div>
                
                {filteredWebhooks?.length === 0 ? (
                  <div className="bg-card border border-border rounded-lg p-12 text-center">
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-muted-foreground"
                      >
                        <path
                          d="M12 2L2 7L12 12L22 7L12 2Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M2 17L12 22L22 17"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M2 12L12 17L22 12"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      {searchQuery || statusFilter !== 'all' ? 'No webhooks found' : 'No webhooks yet'}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {searchQuery || statusFilter !== 'all' ? 'Try adjusting your search or filters' : 'Create your first webhook URL to start receiving HTTP requests'}
                    </p>
                    {(!searchQuery && statusFilter === 'all') && (
                      <Button
                        variant="default"
                        onClick={handleCreateWebhook}
                        iconName="Plus"
                        iconPosition="left"
                      >
                        Create Your First Webhook
                      </Button>
                    )}
                  </div>
                ) : (
                  <WebhookTable
                    webhooks={filteredWebhooks}
                    onCopyUrl={handleCopyUrl}
                    onViewRequests={handleViewRequests}
                    onDeleteWebhook={handleDeleteWebhook}
                  />
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <RecentActivity
                activities={recentActivity}
                onViewDetails={handleViewActivityDetails}
              />
            </div>
          </div>
        </div>
      </main>
      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal?.isOpen}
        webhook={deleteModal?.webhook}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default Dashboard;