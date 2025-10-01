import Icon from '../../../components/AppIcon';
import type { IconName } from '../../../components/AppIcon';

const SecurityBadges = (): React.ReactElement => {
  const securityFeatures: { icon: IconName; text: string; description: string }[] = [
    {
      icon: 'Shield',
      text: 'SSL Encrypted',
      description: '256-bit encryption'
    },
    {
      icon: 'Lock',
      text: 'Secure Login',
      description: 'Protected authentication'
    },
    {
      icon: 'Eye',
      text: 'Privacy First',
      description: 'GDPR compliant'
    }
  ];

  return (
    <div className="mt-8">
      <div className="flex items-center justify-center space-x-8">
        {securityFeatures?.map((feature, index) => (
          <div
            key={index}
            className="flex items-center space-x-2 text-muted-foreground group"
          >
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center group-hover:bg-primary/10 transition-colors duration-200">
              <Icon 
                name={feature?.icon} 
                size={16} 
                className="group-hover:text-primary transition-colors duration-200" 
              />
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-medium text-foreground">
                {feature?.text}
              </p>
              <p className="text-xs text-muted-foreground">
                {feature?.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      {/* Trust Indicators */}
      <div className="text-center mt-6">
        <p className="text-xs text-muted-foreground">
          Trusted by 10,000+ developers worldwide
        </p>
        <div className="flex items-center justify-center space-x-4 mt-2">
          <div className="flex items-center space-x-1">
            <Icon name="Star" size={12} className="text-yellow-500 fill-current" />
            <Icon name="Star" size={12} className="text-yellow-500 fill-current" />
            <Icon name="Star" size={12} className="text-yellow-500 fill-current" />
            <Icon name="Star" size={12} className="text-yellow-500 fill-current" />
            <Icon name="Star" size={12} className="text-yellow-500 fill-current" />
            <span className="text-xs text-muted-foreground ml-1">4.9/5</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityBadges;