export interface PricingTier {
  id: 'free' | 'plus' | 'pro';
  name: string;
  description: string;
  price: number;
  billing: 'monthly' | 'yearly' | 'free';
  limits: {
    webhooks: number;
    requestsPerMonth: number;
    requestsPerHour: number;
    requestsPerMinute: number;
    retentionDays: number;
    apiKeys: number;
    teamMembers: number;
    customDomains: number;
    webhookTimeout: number; // in seconds
    maxPayloadSize: number; // in KB
  };
  features: {
    realTimeMonitoring: boolean;
    webhookTesting: boolean;
    analytics: boolean;
    dataExport: boolean;
    webhookHistory: boolean;
  };
}

export const PRICING_TIERS: Record<string, PricingTier> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started with webhooks',
    price: 0,
    billing: 'free',
    limits: {
      webhooks: 1,
      requestsPerMonth: 150, // 5 per day * 30 days
      requestsPerDay: 5,
      requestsPerHour: 2,
      requestsPerMinute: 1,
      retentionDays: 3,
      apiKeys: 1,
      teamMembers: 1,
      customDomains: 0,
      webhookTimeout: 15,
      maxPayloadSize: 32, // 32KB
    },
    features: {
      realTimeMonitoring: false,
      webhookTesting: false, // Locked for free tier
      analytics: false,
      dataExport: false,
      webhookHistory: false, // Locked for free tier
    },
  },
  plus: {
    id: 'plus',
    name: 'Plus',
    description: 'Great for growing businesses',
    price: 9,
    billing: 'monthly',
    limits: {
      webhooks: 10,
      requestsPerMonth: 10000,
      requestsPerHour: 100,
      requestsPerMinute: 10,
      retentionDays: 30,
      apiKeys: 5,
      teamMembers: 3,
      customDomains: 1,
      webhookTimeout: 60,
      maxPayloadSize: 512, // 512KB
    },
    features: {
      realTimeMonitoring: true,
      webhookTesting: true,
      analytics: true,
      dataExport: true,
      webhookHistory: true,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'For enterprises and high-volume applications',
    price: 29,
    billing: 'monthly',
    limits: {
      webhooks: -1, // unlimited
      requestsPerMonth: -1, // unlimited
      requestsPerHour: 1000,
      requestsPerMinute: 100,
      retentionDays: 365,
      apiKeys: -1, // unlimited
      teamMembers: -1, // unlimited
      customDomains: -1, // unlimited
      webhookTimeout: 300,
      maxPayloadSize: 10240, // 10MB
    },
    features: {
      realTimeMonitoring: true,
      webhookTesting: true,
      analytics: true,
      dataExport: true,
      webhookHistory: true,
    },
  },
};

export const pricingService = {
  // Get tier information
  getTier(tierId: string): PricingTier | null {
    return PRICING_TIERS[tierId] || null;
  },

  // Get all tiers
  getAllTiers(): PricingTier[] {
    return Object.values(PRICING_TIERS);
  },

  // Check if user has access to a feature
  hasFeature(tierId: string, feature: keyof PricingTier['features']): boolean {
    const tier = this.getTier(tierId);
    const result = tier ? tier.features[feature] : false;
    
    // Debug logging
    console.log('hasFeature Debug:', {
      tierId,
      feature,
      tier,
      result
    });
    
    return result;
  },

  // Check if user is within limits
  isWithinLimit(tierId: string, limit: keyof PricingTier['limits'], currentValue: number): boolean {
    const tier = this.getTier(tierId);
    if (!tier) return false;
    
    const limitValue = tier.limits[limit];
    if (limitValue === -1) return true; // unlimited
    return currentValue < limitValue;
  },

  // Get upgrade suggestions
  getUpgradeSuggestions(tierId: string, currentUsage: Record<string, number>): string[] {
    const suggestions: string[] = [];
    const tier = this.getTier(tierId);
    
    if (!tier) return suggestions;

    // Check webhook limit
    if (!this.isWithinLimit(tierId, 'webhooks', currentUsage.webhooks || 0)) {
      suggestions.push('Upgrade to create more webhooks');
    }

    // Check request limit
    if (!this.isWithinLimit(tierId, 'requestsPerMonth', currentUsage.requests || 0)) {
      suggestions.push('Upgrade for more monthly requests');
    }

    // Check API keys
    if (!this.isWithinLimit(tierId, 'apiKeys', currentUsage.apiKeys || 0)) {
      suggestions.push('Upgrade to create more API keys');
    }

    return suggestions;
  },

  // Get next tier for upgrade
  getNextTier(currentTierId: string): PricingTier | null {
    const tierOrder = ['free', 'plus', 'pro'];
    const currentIndex = tierOrder.indexOf(currentTierId);
    
    if (currentIndex === -1 || currentIndex === tierOrder.length - 1) {
      return null; // Already at highest tier
    }
    
    return this.getTier(tierOrder[currentIndex + 1]);
  },


  // Get feature comparison
  getFeatureComparison(): Array<{
    feature: string;
    free: boolean;
    plus: boolean;
    pro: boolean;
  }> {
    const features = [
      { key: 'realTimeMonitoring', name: 'Real-time Monitoring' },
      { key: 'webhookTesting', name: 'Webhook Testing' },
      { key: 'analytics', name: 'Basic Analytics' },
      { key: 'dataExport', name: 'Data Export' },
      { key: 'webhookHistory', name: 'Webhook History' },
    ] as const;

    return features.map(({ key, name }) => ({
      feature: name,
      free: PRICING_TIERS.free.features[key],
      plus: PRICING_TIERS.plus.features[key],
      pro: PRICING_TIERS.pro.features[key],
    }));
  },
};
