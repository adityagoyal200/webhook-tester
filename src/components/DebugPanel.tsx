import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { pricingService } from '../services/pricingService';

const DebugPanel = () => {
  const { user, profile } = useAuth();
  
  const features = ['realTimeMonitoring', 'webhookTesting', 'analytics', 'dataExport', 'webhookHistory'];
  
  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs max-w-sm">
      <h3 className="font-bold mb-2">Debug Panel</h3>
      <div className="space-y-1">
        <div>User ID: {user?.id || 'None'}</div>
        <div>Profile: {JSON.stringify(profile, null, 2)}</div>
        <div>Current Tier: {profile?.subscription_tier || 'free'}</div>
        <div className="mt-2">
          <div className="font-semibold">Feature Access:</div>
          {features.map(feature => (
            <div key={feature} className="ml-2">
              {feature}: {pricingService.hasFeature(profile?.subscription_tier || 'free', feature as any) ? '✅' : '❌'}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;
