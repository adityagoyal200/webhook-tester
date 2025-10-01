import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const DeveloperTestimonial = () => {
  const testimonial = {
    quote: "HookCatch has streamlined our webhook testing workflow. The real-time payload inspection and permanent URLs make integration testing effortless.",
    author: "Sarah Chen",
    role: "Senior Backend Developer",
    company: "TechFlow Solutions",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=64&h=64&fit=crop&crop=face"
  };

  return (
    <div className="mt-8 bg-muted/50 rounded-lg p-6 border border-border">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <Image
            src={testimonial?.avatar}
            alt={testimonial?.author}
            className="w-12 h-12 rounded-full object-cover"
          />
        </div>
        
        <div className="flex-1">
          <div className="flex items-start space-x-2 mb-3">
            <Icon name="Quote" size={16} className="text-primary mt-1 flex-shrink-0" />
            <p className="text-sm text-foreground italic leading-relaxed">
              {testimonial?.quote}
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                {testimonial?.author}
              </p>
              <p className="text-xs text-muted-foreground">
                {testimonial?.role} at {testimonial?.company}
              </p>
            </div>
            
            <div className="flex items-center space-x-1">
              {[...Array(5)]?.map((_, i) => (
                <Icon
                  key={i}
                  name="Star"
                  size={12}
                  className="text-yellow-500 fill-current"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeveloperTestimonial;