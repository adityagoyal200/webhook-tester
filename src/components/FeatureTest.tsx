import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { pricingService } from '../services/pricingService';
import FeatureGate from './FeatureGate';
import Button from './ui/Button';

const FeatureTest = () => {
  const { user, profile } = useAuth();
  
  const features = [
    { key: 'realTimeMonitoring', name: 'Real-time Monitoring', component: <Button>Test Real-time</Button> },
    { key: 'webhookTesting', name: 'Webhook Testing', component: <Button>Test Webhook</Button> },
    { key: 'analytics', name: 'Analytics', component: <Button>View Analytics</Button> },
    { key: 'dataExport', name: 'Data Export', component: <Button>Export Data</Button> },
    { key: 'webhookHistory', name: 'Webhook History', component: <Button>View History</Button> }
  ];
  
  return (
    <div className="bg-card border border-border rounded-lg p-6 m-4">
      <h2 className="text-xl font-semibold mb-4">Feature Test Panel</h2>
      <div className="mb-4">
        <p><strong>User ID:</strong> {user?.id || 'None'}</p>
        <p><strong>Current Tier:</strong> {profile?.subscription_tier || 'free'}</p>
        <p><strong>Profile:</strong> {JSON.stringify(profile, null, 2)}</p>
      </div>
      
      <div className="space-y-4">
        {features.map(feature => (
          <div key={feature.key} className="border border-border rounded p-4">
            <h3 className="font-medium mb-2">{feature.name}</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Direct check: {pricingService.hasFeature(profile?.subscription_tier || 'free', feature.key as any) ? '✅ Has Access' : '❌ No Access'}
            </p>
            <FeatureGate feature={feature.key}>
              {feature.component}
            </FeatureGate>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeatureTest;
