import type React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

type Tier = 'free' | 'pro' | 'enterprise' | string;

interface UsageLimitBannerProps {
  currentTier: Tier;
  webhookCount: number;
  webhookLimit: number;
  requestCount: number;
  requestLimit: number;
  onUpgrade?: () => void;
}

const UsageLimitBanner = ({ 
  currentTier, 
  webhookCount, 
  webhookLimit, 
  requestCount, 
  requestLimit, 
  onUpgrade 
}: UsageLimitBannerProps) => {
  const webhookUsagePercent = (webhookCount / webhookLimit) * 100;
  const requestUsagePercent = (requestCount / requestLimit) * 100;
  
  const isNearWebhookLimit = webhookUsagePercent >= 80;
  const isNearRequestLimit = requestUsagePercent >= 80;
  const showBanner = currentTier === 'free' && (isNearWebhookLimit || isNearRequestLimit);

  if (!showBanner) return null;

  return (
    <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-6">
      <div className="flex items-start space-x-3">
        <Icon name="AlertTriangle" size={20} className="text-warning flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-foreground mb-1">
            Approaching Usage Limits
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
            <p>
              Upgrade to Pro for unlimited webhooks and extended request history.
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