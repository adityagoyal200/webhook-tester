import { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

interface RealTimeIndicatorProps {
  isConnected: boolean;
  newRequestsCount: number;
  onClearNewRequests: () => void;
}

const RealTimeIndicator = ({ isConnected, newRequestsCount, onClearNewRequests }: RealTimeIndicatorProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (newRequestsCount > 0) {
      setIsVisible(true);
    }
  }, [newRequestsCount]);

  const handleClearNew = () => {
    onClearNewRequests();
    setIsVisible(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Connection Status */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium mb-2 ${
        isConnected 
          ? 'bg-success/10 text-success border border-success/20' :'bg-error/10 text-error border border-error/20'
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-success animate-pulse' : 'bg-error'
        }`} />
        <span>{isConnected ? 'Live' : 'Disconnected'}</span>
      </div>

      {/* New Requests Notification */}
      {isVisible && newRequestsCount > 0 && (
        <div className="bg-primary text-primary-foreground rounded-lg shadow-elevated p-4 max-w-sm animate-slide-in">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Icon name="Zap" size={16} />
              <div>
                <div className="font-medium">
                  {newRequestsCount} new request{newRequestsCount !== 1 ? 's' : ''}
                </div>
                <div className="text-sm opacity-90">
                  Scroll up to see the latest requests
                </div>
              </div>
            </div>
            <button
              onClick={handleClearNew}
              className="text-primary-foreground/70 hover:text-primary-foreground transition-colors duration-200 focus-ring rounded"
            >
              <Icon name="X" size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeIndicator;