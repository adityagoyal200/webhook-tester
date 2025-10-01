import { Fragment } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../AppIcon';
import type { IconName } from '../AppIcon';
import Button from './Button';

type Breadcrumb = {
  label: string;
  path: string;
  current?: boolean;
};

type HeaderAction = {
  label: string;
  onClick?: () => void;
  variant?: 'default' | 'ghost' | 'outline' | 'destructive' | 'secondary' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  className?: string;
};

interface ContextualHeaderProps {
  title: string;
  subtitle?: string;
  backPath?: string;
  actions?: HeaderAction[];
  breadcrumbs?: Breadcrumb[];
}

const ContextualHeader = ({ 
  title, 
  subtitle, 
  backPath = '/dashboard',
  actions = [],
  breadcrumbs = []
}: ContextualHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    navigate(backPath);
  };

  const defaultBreadcrumbs = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: title, path: location?.pathname, current: true }
  ];

  const displayBreadcrumbs = breadcrumbs?.length > 0 ? breadcrumbs : defaultBreadcrumbs;

  return (
    <div className="bg-background border-b border-border">
      <div className="px-6 py-4">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm mb-4">
          {displayBreadcrumbs?.map((crumb, index) => (
            <Fragment key={crumb?.path}>
              {index > 0 && (
                <Icon name="ChevronRight" size={14} className="text-muted-foreground" />
              )}
              {crumb?.current ? (
                <span className="text-foreground font-medium">
                  {crumb?.label}
                </span>
              ) : (
                <button
                  onClick={() => navigate(crumb?.path)}
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200 focus-ring rounded px-1"
                >
                  {crumb?.label}
                </button>
              )}
            </Fragment>
          ))}
        </nav>

        {/* Header Content */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="focus-ring"
            >
              <Icon name="ArrowLeft" size={20} />
            </Button>
            
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                {title}
              </h1>
              {subtitle && (
                <p className="text-muted-foreground text-sm mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          {actions?.length > 0 && (
            <div className="flex items-center space-x-3">
              {actions?.map((action, index) => (
                <Button
                  key={index}
                  variant={action?.variant || 'default'}
                  size={action?.size || 'default'}
                  onClick={action?.onClick}
                  disabled={action?.disabled}
                  iconName={action?.icon}
                  iconPosition={action?.iconPosition || 'left'}
                  className={action?.className}
                >
                  {action?.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContextualHeader;