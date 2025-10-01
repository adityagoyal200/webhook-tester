import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { userService } from '../../../services/userService';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const SubscriptionSection = () => {
  const { user, profile } = useAuth();
  const [currentTier, setCurrentTier] = useState('free');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [usageData, setUsageData] = useState({
    webhooksUsed: 0,
    webhooksLimit: 5,
    requestsThisMonth: 0,
    requestsLimit: 1000,
    storageUsed: '0 MB',
    storageLimit: '100 MB'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load real usage data
  useEffect(() => {
    const loadUsageData = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      setError(null);

      try {
        const { data: limits, error: limitsError } = await userService.checkSubscriptionLimits(user.id);
        
        if (limitsError) {
          setError(limitsError.message || 'Failed to load usage data');
          return;
        }

        if (limits) {
          setUsageData({
            webhooksUsed: limits.currentWebhooks,
            webhooksLimit: limits.webhookLimit,
            requestsThisMonth: limits.currentRequests,
            requestsLimit: limits.requestLimit,
            storageUsed: '2.3 MB', // TODO: Calculate actual storage usage
            storageLimit: '100 MB'
          });
        }

        // Set current tier from profile
        setCurrentTier(profile?.subscription_tier || 'free');
      } catch (err) {
        console.error('Error loading usage data:', err);
        setError('Failed to load usage data');
      } finally {
        setIsLoading(false);
      }
    };

    loadUsageData();
  }, [user?.id, profile?.subscription_tier]);

  const tierFeatures = {
    free: [
      'Up to 10 webhook URLs',
      '10,000 requests per month',
      '7-day request history',
      '100 MB storage',
      'Basic analytics'
    ],
    pro: [
      'Unlimited webhook URLs',
      'Unlimited requests',
      '30-day request history',
      '10 GB storage',
      'Advanced analytics',
      'Custom domains',
      'Priority support',
      'Two-factor authentication'
    ]
  };

  const handleUpgrade = () => {
    // Mock Stripe integration
    console.log('Redirecting to Stripe checkout...');
    setShowUpgradeModal(false);
  };

  const handleDowngrade = () => {
    // Mock downgrade functionality
    console.log('Downgrade requested');
  };

  const UsageBar = ({ label, used, limit, unit = '' }) => {
    const percentage = (used / limit) * 100;
    const isNearLimit = percentage > 80;
    
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className={`font-medium ${isNearLimit ? 'text-warning' : 'text-foreground'}`}>
            {used?.toLocaleString()}{unit} / {limit?.toLocaleString()}{unit}
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              isNearLimit ? 'bg-warning' : 'bg-primary'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Subscription & Usage</h2>
          <p className="text-sm text-muted-foreground">Manage your plan and monitor usage</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            currentTier === 'free' ?'bg-muted text-muted-foreground' :'bg-primary/10 text-primary'
          }`}>
            {currentTier === 'free' ? 'Free Tier' : 'Pro Tier'}
          </div>
        </div>
      </div>
      {/* Current Usage */}
      <div className="space-y-4 mb-6">
        <h3 className="font-medium text-foreground">Current Usage</h3>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Loading usage data...</span>
          </div>
        ) : error ? (
          <div className="p-3 bg-error/10 border border-error/20 rounded-lg flex items-center space-x-2">
            <Icon name="AlertTriangle" size={16} className="text-error" />
            <span className="text-sm text-error">{error}</span>
          </div>
        ) : (
          <div className="grid gap-4">
            <UsageBar 
              label="Webhook URLs" 
              used={usageData?.webhooksUsed} 
              limit={usageData?.webhooksLimit} 
            />
            <UsageBar 
              label="Requests this month" 
              used={usageData?.requestsThisMonth} 
              limit={usageData?.requestsLimit} 
            />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Storage used</span>
              <span className="font-medium text-foreground">
                {usageData?.storageUsed} / {usageData?.storageLimit}
              </span>
            </div>
          </div>
        )}
      </div>
      {/* Plan Features */}
      <div className="border-t border-border pt-6">
        <h3 className="font-medium text-foreground mb-4">Current Plan Features</h3>
        <div className="grid gap-2">
          {tierFeatures?.[currentTier]?.map((feature, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Icon name="Check" size={16} className="text-success" />
              <span className="text-sm text-muted-foreground">{feature}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Action Buttons */}
      <div className="flex space-x-3 mt-6 pt-6 border-t border-border">
        {currentTier === 'free' ? (
          <Button 
            onClick={() => setShowUpgradeModal(true)}
            iconName="Zap"
          >
            Upgrade to Pro
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={handleDowngrade}>
              Downgrade to Free
            </Button>
            <Button variant="outline" iconName="CreditCard">
              Manage Billing
            </Button>
          </>
        )}
        <Button variant="ghost" iconName="BarChart3">
          View Analytics
        </Button>
      </div>
      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-foreground">Upgrade to Pro</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowUpgradeModal(false)}
              >
                <Icon name="X" size={20} />
              </Button>
            </div>

            <div className="space-y-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">$29</div>
                <div className="text-sm text-muted-foreground">per month</div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Pro Features Include:</h4>
                {tierFeatures?.pro?.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Icon name="Check" size={16} className="text-success" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="flex space-x-3">
                <Button onClick={handleUpgrade} fullWidth>
                  Start Pro Trial
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowUpgradeModal(false)}
                  fullWidth
                >
                  Maybe Later
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                14-day free trial • Cancel anytime • Secure payment via Stripe
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionSection;