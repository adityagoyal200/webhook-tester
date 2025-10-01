import Icon, { type IconProps } from '../../../components/AppIcon';

type StatColor = 'primary' | 'success' | 'warning' | 'error';
type Trend = 'up' | 'down' | 'neutral';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: IconProps['name'];
  trend?: Trend;
  trendValue?: string | number;
  color?: StatColor;
}

const StatsCard = ({ title, value, subtitle, icon, trend, trendValue, color = 'primary' }: StatsCardProps) => {
  const colorClasses: Record<StatColor, string> = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    error: 'bg-error/10 text-error border-error/20'
  };

  const trendColors: Record<Trend, string> = {
    up: 'text-success',
    down: 'text-error',
    neutral: 'text-muted-foreground'
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-subtle hover:shadow-moderate transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses?.[color]}`}>
          <Icon name={icon} size={24} />
        </div>
        {trend && trendValue && (
          <div className={`flex items-center space-x-1 ${trendColors?.[trend as Trend]}`}>
            <Icon 
              name={trend === 'up' ? 'TrendingUp' : trend === 'down' ? 'TrendingDown' : 'Minus'} 
              size={16} 
            />
            <span className="text-sm font-medium">{trendValue}</span>
          </div>
        )}
      </div>
      <div>
        <h3 className="text-2xl font-semibold text-foreground mb-1">{value}</h3>
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default StatsCard;