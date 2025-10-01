import type React from 'react';
import Icon from '../../../components/AppIcon';

interface Tier {
  id?: string | number;
  name?: string;
  price?: number | string;
  period?: string;
  features?: string[];
  popular?: boolean;
}

interface TierSelectionCardProps {
  tier?: Tier;
  isSelected?: boolean;
  onSelect: (id?: string | number) => void;
  className?: string;
}

const TierSelectionCard: React.FC<TierSelectionCardProps> = ({ tier, isSelected, onSelect, className = '' }) => {
  const handleSelect = () => {
    onSelect(tier?.id);
  };

  return (
    <div
      className={`relative border rounded-lg p-6 cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'border-primary bg-primary/5 shadow-moderate'
          : 'border-border bg-card hover:border-primary/50 hover:shadow-subtle'
      } ${className}`}
      onClick={handleSelect}
    >
      {/* Selection Indicator */}
      <div className="absolute top-4 right-4">
        <div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors duration-200 ${
            isSelected
              ? 'border-primary bg-primary' :'border-muted-foreground/30'
          }`}
        >
          {isSelected && (
            <Icon name="Check" size={12} color="white" />
          )}
        </div>
      </div>
      {/* Tier Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground mb-1">
          {tier?.name}
        </h3>
        <div className="flex items-baseline space-x-1">
          <span className="text-2xl font-bold text-foreground">
            ${tier?.price}
          </span>
          <span className="text-muted-foreground text-sm">
            {tier?.period}
          </span>
        </div>
      </div>
      {/* Features List */}
      <ul className="space-y-2 mb-4">
        {tier?.features?.map((feature, index) => (
          <li key={index} className="flex items-start space-x-2">
            <Icon
              name="Check"
              size={16}
              className="text-success mt-0.5 flex-shrink-0"
            />
            <span className="text-sm text-muted-foreground">
              {feature}
            </span>
          </li>
        ))}
      </ul>
      {/* Popular Badge */}
      {tier?.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
            Most Popular
          </span>
        </div>
      )}
    </div>
  );
};

export default TierSelectionCard;