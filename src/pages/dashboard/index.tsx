import { useState, useEffect } from 'react';
import type { Activity } from './components/RecentActivity';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import StatsCard from './components/StatsCard';
import WebhookTable from './components/WebhookTable';
import RecentActivity from './components/RecentActivity';
import SearchFilters from './components/SearchFilters';
import UsageLimitBanner from './components/UsageLimitBanner';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import { useAuth } from '../../contexts/AuthContext';
import { webhookService } from '../../services/webhookService';
import { userService } from '../../services/userService';
import Icon from '../../components/AppIcon';
 
interface Webhook {
  id: string;
  name: string;
  description: string;
  url: string;
  requestCount: number;
  recentRequests: number;
  lastActivity: Date | number | null;
  status: string;
  createdAt: Date | string | number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; webhook: Webhook | null }>({ isOpen: false, webhook: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Real data from services
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [userStats, setUserStats] = useState({
    totalWebhooks: 0,
    activeWebhooks: 0,
    totalRequests: 0,
    todayRequests: 0
  });
  const [userLimits, setUserLimits] = useState({
    webhookLimit: 5,
    requestLimit: 1000,
    currentWebhooks: 0,
    currentRequests: 0,
    canCreateWebhook: true,
    webhookUsagePercent: 0,
    requestUsagePercent: 0
  });

  // Load dashboard data
  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);

    try {
      // Load webhooks
      const { data: webhooksData, error: webhooksError } = await webhookService.getUserWebhooks();
      if (webhooksError) {
        setError(webhooksError.message);
        return;
      }

      // Transform webhook data to match interface
      const transformedWebhooks: Webhook[] = (webhooksData || []).map((wh: any) => ({
        id: wh.id,
        name: wh.name,
        description: wh.description || '',
        url: wh.url,
        requestCount: wh.webhook_analytics?.total_requests || 0,
        recentRequests: Math.floor(Math.random() * 5), // This would come from recent requests
        lastActivity: wh.last_request_at ? new Date(wh.last_request_at) : null,
        status: wh.status,
        createdAt: new Date(wh.created_at)
      }));

      setWebhooks(transformedWebhooks);

      // Load user stats
      const { data: statsData, error: statsError } = await userService.getUserStats(user.id);
      if (statsData) {
        setUserStats(statsData);
      }

      // Load subscription limits
      const { data: limitsData, error: limitsError } = await userService.checkSubscriptionLimits(user.id);
      if (limitsData) {
        setUserLimits(limitsData);
      }

      // Load recent activity
      const { data: activityData, error: activityError } = await userService.getRecentActivity(user.id, 10);
      if (activityData) {
        const transformedActivity: Activity[] = (activityData || []).map((req: any) => ({
          id: req.id,
          webhookName: req.webhooks?.name || 'Unknown',
          method: req.method,
          status: req.status,
          ip: req.ip_address,
          userAgent: req.user_agent,
          timestamp: new Date(req.created_at),
          headers: req.headers,
          payload: req.payload
        }));
        setRecentActivity(transformedActivity);
      }

    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Use real stats from service
  const totalRequests = userStats.totalRequests;
  const activeWebhooks = userStats.activeWebhooks;
  const recentRequestsCount = userStats.todayRequests;

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
        case 'activity': {
          const toTime = (val: Date | number | null | undefined): number => {
            if (!val) return 0;
            return typeof val === 'number' ? val : (val as Date).getTime();
          };
          const bTime = toTime(b?.lastActivity);
          const aTime = toTime(a?.lastActivity);
          return bTime - aTime;
        }
        case 'created':
        default: {
          const toCreatedTime = (val: Date | string | number): number => {
            if (val instanceof Date) return val.getTime();
            return new Date(val)?.getTime();
          };
          return toCreatedTime(b.createdAt) - toCreatedTime(a.createdAt);
        }
      }
    });

  const handleCreateWebhook = () => {
    navigate('/create-webhook');
  };

  const handleCopyUrl = async (webhook: Webhook) => {
    try {
      await navigator.clipboard?.writeText(webhook?.url);
      // Show success feedback (handled by WebhookTable component)
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const handleViewRequests = (webhook: Webhook) => {
    navigate(`/webhook-details?id=${webhook?.id}`);
  };

  const handleDeleteWebhook = (webhook: Webhook) => {
    setDeleteModal({ isOpen: true, webhook });
  };

  const confirmDelete = async () => {
    if (!deleteModal?.webhook?.id) {
      console.error('No webhook ID provided for deletion');
      return;
    }
    
    setIsDeleting(true);
    setError(null); // Clear any previous errors
    
    try {
      console.log('Attempting to delete webhook:', deleteModal.webhook.id);
      const { error } = await webhookService.deleteWebhook(deleteModal.webhook.id);
      
      if (error) {
        console.error('Delete webhook error:', error);
        setError(error.message || 'Failed to delete webhook');
        return;
      }
      
      console.log('Webhook deleted successfully');
      
      // Update local state immediately for better UX
      setWebhooks(prev => prev?.filter(wh => wh?.id !== deleteModal?.webhook?.id));
      setDeleteModal({ isOpen: false, webhook: null });
      
      // Show success message
      setSuccessMessage('Webhook deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Reload data to update stats
      await loadDashboardData();
      
    } catch (error) {
      console.error('Failed to delete webhook:', error);
      setError('Failed to delete webhook. Please try again.');
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

  const handleViewActivityDetails = (activity: Activity) => {
    const webhook = webhooks?.find(wh => wh?.name === activity?.webhookName);
    if (webhook) {
      navigate(`/webhook-details?id=${webhook?.id}&request=${activity?.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-muted-foreground">Loading dashboard...</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
              <h3 className="text-destructive font-medium mb-2">Error Loading Dashboard</h3>
              <p className="text-destructive/80 mb-4">{error}</p>
              <Button onClick={loadDashboardData} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 bg-success/10 border border-success/20 rounded-lg p-4 flex items-center space-x-3">
              <div className="w-5 h-5 bg-success rounded-full flex items-center justify-center">
                <Icon name="Check" size={12} className="text-white" />
              </div>
              <span className="text-success font-medium">{successMessage}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-destructive rounded-full flex items-center justify-center">
                  <Icon name="X" size={12} className="text-white" />
                </div>
                <span className="text-destructive font-medium">{error}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="text-destructive hover:text-destructive/80"
              >
                <Icon name="X" size={16} />
              </Button>
            </div>
          )}

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
            currentTier={userProfile?.subscription_tier || 'free'}
            webhookCount={userLimits.currentWebhooks}
            webhookLimit={userLimits.webhookLimit}
            requestCount={userLimits.currentRequests}
            requestLimit={userLimits.requestLimit}
            onUpgrade={handleUpgrade}
          />

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Active Webhooks"
              value={activeWebhooks}
              subtitle={`${userLimits.currentWebhooks}/${userLimits.webhookLimit} total`}
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
              value={`${userProfile?.subscription_tier === 'free' ? '7' : '30'} days`}
              subtitle={userProfile?.subscription_tier === 'free' ? 'Free tier' : 'Pro tier'}
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