import TierSelectionCard from './TierSelectionCard';

interface TierSelectionProps {
  selectedTier: string;
  onTierSelect: (tierId: string) => void;
  className?: string;
}

const TierSelection = ({ selectedTier, onTierSelect, className = '' }: TierSelectionProps) => {
  const tiers = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      period: '/month',
      popular: false,
      features: [
        'Up to 100 requests per URL',
        '7-day request history',
        'Basic webhook testing',
        'JSON payload viewer',
        'Rate limiting (100 req/hour)',
        'Community support'
      ]
    },
    {
      id: 'paid',
      name: 'Pro',
      price: 19,
      period: '/month',
      popular: true,
      features: [
        'Unlimited requests per URL',
        '30-day request history',
        'Advanced webhook testing',
        'Real-time notifications',
        'Custom webhook URLs',
        'Export functionality',
        'Priority support',
        'Advanced analytics'
      ]
    }
  ];

  return (
    <div className={className}>
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Choose Your Plan
        </h3>
        <p className="text-sm text-muted-foreground">
          Start with our free tier or unlock advanced features with Pro
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tiers?.map((tier) => (
          <TierSelectionCard
            key={tier?.id}
            tier={tier}
            isSelected={selectedTier === tier?.id}
            onSelect={(id) => onTierSelect(String(id))}
          />
        ))}
      </div>
      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <div className="w-2 h-2 bg-primary rounded-full" />
          </div>
          <div>
            <p className="text-sm text-foreground font-medium mb-1">
              Start Free, Upgrade Anytime
            </p>
            <p className="text-xs text-muted-foreground">
              Begin with our free tier and upgrade to Pro when you need advanced features. 
              All webhook URLs remain active during tier changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TierSelection;