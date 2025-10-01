import React from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const TierLimitWarning = ({ currentTier = 'free', webhookCount = 0, onUpgrade }) => {
  const tierLimits = {
    free: {
      maxWebhooks: 5,
      maxRequests: 100,
      retention: 7,
      features: ['Basic webhook URLs', 'Request history (7 days)', 'JSON formatting', 'Basic analytics']
    },
    paid: {
      maxWebhooks: -1, // unlimited
      maxRequests: -1, // unlimited
      retention: 30,
      features: ['Unlimited webhooks', 'Extended history (30 days)', 'Advanced analytics', 'Custom domains', 'Priority support']
    }
  };

  const currentLimits = tierLimits?.[currentTier];
  const isNearLimit = currentTier === 'free' && webhookCount >= currentLimits?.maxWebhooks - 1;
  const isAtLimit = currentTier === 'free' && webhookCount >= currentLimits?.maxWebhooks;

  if (currentTier === 'paid') {
    return (
      <div className="bg-success/10 border border-success/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Icon name="Crown" size={20} className="text-success mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-success font-medium">Pro Plan Active</h4>
            <p className="text-success/80 text-sm mt-1">
              You have unlimited webhook creation and advanced features enabled.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isAtLimit) {
    return (
      <div className="bg-error/10 border border-error/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Icon name="AlertTriangle" size={20} className="text-error mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-error font-medium">Webhook Limit Reached</h4>
            <p className="text-error/80 text-sm mt-1">
              You've reached the maximum of {currentLimits?.maxWebhooks} webhooks for the free plan. 
              Upgrade to Pro for unlimited webhooks and advanced features.
            </p>
            <Button
              variant="default"
              size="sm"
              onClick={onUpgrade}
              iconName="ArrowUp"
              iconPosition="left"
              className="mt-3"
            >
              Upgrade to Pro
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isNearLimit) {
    return (
      <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Icon name="AlertCircle" size={20} className="text-warning mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-warning font-medium">Approaching Webhook Limit</h4>
            <p className="text-warning/80 text-sm mt-1">
              You're using {webhookCount} of {currentLimits?.maxWebhooks} webhooks. 
              Consider upgrading to Pro for unlimited webhooks.
            </p>
            <div className="flex items-center space-x-3 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onUpgrade}
                iconName="ArrowUp"
                iconPosition="left"
              >
                Upgrade to Pro
              </Button>
              <span className="text-xs text-warning/60">
                {currentLimits?.maxWebhooks - webhookCount} webhooks remaining
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <Icon name="Info" size={20} className="text-primary mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-foreground font-medium">Free Plan</h4>
          <p className="text-muted-foreground text-sm mt-1">
            You're using {webhookCount} of {currentLimits?.maxWebhooks} webhooks. 
            Each webhook can receive up to {currentLimits?.maxRequests} requests with {currentLimits?.retention}-day history.
          </p>
          
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Webhook Usage</span>
              <span>{webhookCount}/{currentLimits?.maxWebhooks}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(webhookCount / currentLimits?.maxWebhooks) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onUpgrade}
              iconName="ArrowUp"
              iconPosition="left"
            >
              View Pro Features
            </Button>
            <span className="text-xs text-muted-foreground">
              {currentLimits?.maxWebhooks - webhookCount} remaining
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TierLimitWarning;