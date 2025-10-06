import type React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

type Tier = 'free' | 'plus' | 'pro' | string;

interface UsageLimitBannerProps {
  currentTier: Tier;
  webhookCount: number;
  webhookLimit: number;
  requestCount: number;
  requestLimit: number;
  dailyRequestCount?: number;
  onUpgrade?: () => void;
}

const UsageLimitBanner = ({ 
  currentTier, 
  webhookCount, 
  webhookLimit, 
  requestCount, 
  requestLimit, 
  dailyRequestCount = 0,
  onUpgrade 
}: UsageLimitBannerProps) => {
  const webhookUsagePercent = (webhookCount / webhookLimit) * 100;
  const requestUsagePercent = (requestCount / requestLimit) * 100;
  
  // Daily limit checking for free tier
  const dailyRequestUsagePercent = currentTier === 'free' ? (dailyRequestCount / 5) * 100 : 0;
  const isNearDailyLimit = currentTier === 'free' && dailyRequestUsagePercent >= 80;
  const isAtDailyLimit = currentTier === 'free' && dailyRequestUsagePercent >= 100;
  
  const isNearWebhookLimit = webhookUsagePercent >= 80;
  const isNearRequestLimit = requestUsagePercent >= 80;
  const isAtWebhookLimit = webhookUsagePercent >= 100;
  const isAtRequestLimit = requestUsagePercent >= 100;
  
  const showBanner = (currentTier === 'free' || currentTier === 'plus') && (isNearWebhookLimit || isNearRequestLimit || isNearDailyLimit);
  const showCriticalBanner = isAtWebhookLimit || isAtRequestLimit || isAtDailyLimit;

  if (!showBanner && !showCriticalBanner) return null;

  const bannerColor = showCriticalBanner ? 'destructive' : 'warning';
  const bannerTitle = showCriticalBanner ? 'Usage Limit Reached' : 'Approaching Usage Limits';

  return (
    <div className={`bg-${bannerColor}/10 border border-${bannerColor}/20 rounded-lg p-4 mb-6`}>
      <div className="flex items-start space-x-3">
        <Icon name="AlertTriangle" size={20} className={`text-${bannerColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-foreground mb-1">
            {bannerTitle}
          </h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            {isNearWebhookLimit && (
              <p>
                You're using {webhookCount} of {webhookLimit} webhook URLs ({Math.round(webhookUsagePercent)}%)
              </p>
            )}
            {isNearRequestLimit && (
              <p>
                You've received {requestCount?.toLocaleString()} of {requestLimit?.toLocaleString()} requests this month ({Math.round(requestUsagePercent)}%)
              </p>
            )}
            {isNearDailyLimit && (
              <p>
                You've received {dailyRequestCount} of 5 requests today ({Math.round(dailyRequestUsagePercent)}%)
              </p>
            )}
            <p>
              {currentTier === 'free' 
                ? 'Upgrade to Plus or Pro for more webhooks and extended request history.'
                : 'Upgrade to Pro for unlimited webhooks and extended request history.'
              }
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onUpgrade}
          iconName="ArrowRight"
          iconPosition="right"
          className="flex-shrink-0"
        >
          Upgrade
        </Button>
      </div>
    </div>
  );
};

export default UsageLimitBanner;