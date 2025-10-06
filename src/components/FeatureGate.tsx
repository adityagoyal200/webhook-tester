import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { pricingService } from '../services/pricingService';
import { userService } from '../services/userService';
import Icon from './AppIcon';
import Button from './ui/Button';
import { useNavigate } from 'react-router-dom';

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
  upgradeMessage?: string;
}

const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
  upgradeMessage
}) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const tierId = profile?.subscription_tier || 'free';
  const hasFeature = pricingService.hasFeature(tierId, feature as any);
  
  // Debug logging
  console.log('FeatureGate Debug:', {
    feature,
    tierId,
    hasFeature,
    profile
  });

  if (hasFeature) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  const nextTier = pricingService.getNextTier(tierId);
  const defaultMessage = `This feature is available in ${nextTier?.name || 'higher'} plans.`;

  return (
    <div className="bg-muted/50 border border-border rounded-lg p-6 text-center">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon name="Lock" size={24} className="text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Feature Locked
      </h3>
      <p className="text-muted-foreground mb-4">
        {upgradeMessage || defaultMessage}
      </p>
      {nextTier && (
        <Button
          variant="default"
          onClick={() => navigate('/pricing')}
        >
          Upgrade to {nextTier.name}
        </Button>
      )}
    </div>
  );
};

// Hook for checking features
export const useFeatureGate = (feature: string) => {
  const { profile } = useAuth();
  const tierId = profile?.subscription_tier || 'free';
  return pricingService.hasFeature(tierId, feature as any);
};

// Hook for checking limits
export const useLimitCheck = (limit: string, currentValue: number) => {
  const { profile } = useAuth();
  const tierId = profile?.subscription_tier || 'free';
  return pricingService.isWithinLimit(tierId, limit as any, currentValue);
};

// Hook for getting upgrade suggestions
export const useUpgradeSuggestions = () => {
  const { profile } = useAuth();
  const tierId = profile?.subscription_tier || 'free';
  
  // This would need to be connected to real usage data
  const mockUsage = {
    webhooks: 0,
    requests: 0,
    apiKeys: 0
  };
  
  return pricingService.getUpgradeSuggestions(tierId, mockUsage);
};

export default FeatureGate;
