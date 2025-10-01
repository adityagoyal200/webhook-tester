import React, { useState, useEffect } from 'react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';
import Icon from '../../../components/AppIcon';

interface WebhookFormData {
  identifier: string;
  description: string;
  httpMethods: string[];
  enableRateLimit: boolean;
  rateLimitRequests: number;
  enableNotifications: boolean;
  notificationEmail: string;
}

interface WebhookFormProps {
  onSubmit: (formData: WebhookFormData) => void;
  isLoading: boolean;
  onChange: (formData: WebhookFormData) => void;
}

const WebhookForm = ({ onSubmit, isLoading, onChange }: WebhookFormProps) => {
  const [formData, setFormData] = useState<WebhookFormData>({
    identifier: '',
    description: '',
    httpMethods: ['POST'],
    enableRateLimit: false,
    rateLimitRequests: 100,
    enableNotifications: true,
    notificationEmail: ''
  });

  const [identifierStatus, setIdentifierStatus] = useState({
    isChecking: false,
    isAvailable: null,
    suggestions: []
  });

  const [errors, setErrors] = useState({});

  const httpMethodOptions = [
    { value: 'GET', label: 'GET' },
    { value: 'POST', label: 'POST' },
    { value: 'PUT', label: 'PUT' },
    { value: 'DELETE', label: 'DELETE' },
    { value: 'PATCH', label: 'PATCH' }
  ];

  const rateLimitOptions = [
    { value: 50, label: '50 requests/hour' },
    { value: 100, label: '100 requests/hour' },
    { value: 500, label: '500 requests/hour' },
    { value: 1000, label: '1000 requests/hour' },
    { value: -1, label: 'Unlimited (Paid)' }
  ];

  // Mock existing identifiers for validation
  const existingIdentifiers = ['test-webhook', 'api-endpoint', 'payment-hook', 'user-events'];

  const validateIdentifier = (value) => {
    const regex = /^[a-z0-9-_]+$/;
    if (!value) return 'Identifier is required';
    if (value?.length < 3) return 'Identifier must be at least 3 characters';
    if (value?.length > 50) return 'Identifier must be less than 50 characters';
    if (!regex?.test(value)) return 'Only lowercase letters, numbers, hyphens, and underscores allowed';
    return null;
  };

  const checkIdentifierAvailability = async (identifier) => {
    if (!identifier || validateIdentifier(identifier)) return;

    setIdentifierStatus({ isChecking: true, isAvailable: null, suggestions: [] });

    // Simulate API call
    setTimeout(() => {
      const isAvailable = !existingIdentifiers?.includes(identifier);
      const suggestions = isAvailable ? [] : [
        `${identifier}-1`,
        `${identifier}-new`,
        `${identifier}-${Date.now()?.toString()?.slice(-4)}`
      ];

      setIdentifierStatus({
        isChecking: false,
        isAvailable,
        suggestions
      });
    }, 800);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData?.identifier) {
        checkIdentifierAvailability(formData?.identifier);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData?.identifier]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    onChange(formData);
    
    if (errors?.[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleMethodChange = (methods) => {
    setFormData(prev => ({ ...prev, httpMethods: methods }));
  };

  const validateForm = () => {
    const newErrors = {};

    const identifierError = validateIdentifier(formData?.identifier);
    if (identifierError) newErrors.identifier = identifierError;
    if (identifierStatus?.isAvailable === false) newErrors.identifier = 'This identifier is already taken';

    if (formData?.enableNotifications && !formData?.notificationEmail) {
      newErrors.notificationEmail = 'Email is required when notifications are enabled';
    }

    if (formData?.httpMethods?.length === 0) {
      newErrors.httpMethods = 'At least one HTTP method must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const useSuggestion = (suggestion) => {
    setFormData(prev => ({ ...prev, identifier: suggestion }));
    setIdentifierStatus({ isChecking: false, isAvailable: null, suggestions: [] });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground">Basic Information</h3>
        
        <div>
          <Input
            label="Webhook Identifier"
            type="text"
            placeholder="my-webhook-endpoint"
            description="This will be part of your webhook URL. Use lowercase letters, numbers, hyphens, and underscores only."
            value={formData?.identifier}
            onChange={(e) => handleInputChange('identifier', e?.target?.value)}
            error={errors?.identifier}
            required
            className="mb-2"
          />
          
          {/* Identifier Status */}
          {formData?.identifier && (
            <div className="mt-2">
              {identifierStatus?.isChecking && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span>Checking availability...</span>
                </div>
              )}
              
              {identifierStatus?.isAvailable === true && (
                <div className="flex items-center space-x-2 text-sm text-success">
                  <Icon name="CheckCircle" size={16} />
                  <span>Identifier is available!</span>
                </div>
              )}
              
              {identifierStatus?.isAvailable === false && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-error">
                    <Icon name="XCircle" size={16} />
                    <span>Identifier is already taken</span>
                  </div>
                  {identifierStatus?.suggestions?.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Suggested alternatives:</p>
                      <div className="flex flex-wrap gap-2">
                        {identifierStatus?.suggestions?.map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => useSuggestion(suggestion)}
                            className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded border transition-colors duration-200"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <Input
          label="Description (Optional)"
          type="text"
          placeholder="Brief description of this webhook's purpose"
          description="Help organize your webhooks with a meaningful description"
          value={formData?.description}
          onChange={(e) => handleInputChange('description', e?.target?.value)}
        />
      </div>
      {/* HTTP Methods */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground">HTTP Methods</h3>
        <Select
          label="Allowed HTTP Methods"
          description="Select which HTTP methods this webhook should accept"
          options={httpMethodOptions}
          value={formData?.httpMethods}
          onChange={handleMethodChange}
          multiple
          error={errors?.httpMethods}
          required
        />
      </div>
      {/* Advanced Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground">Advanced Settings</h3>
        
        <div className="space-y-4">
          <Checkbox
            label="Enable Rate Limiting"
            description="Limit the number of requests per hour to prevent abuse"
            checked={formData?.enableRateLimit}
            onChange={(e) => handleInputChange('enableRateLimit', e?.target?.checked)}
          />

          {formData?.enableRateLimit && (
            <Select
              label="Rate Limit"
              description="Maximum requests allowed per hour"
              options={rateLimitOptions}
              value={formData?.rateLimitRequests}
              onChange={(value) => handleInputChange('rateLimitRequests', value)}
            />
          )}

          <Checkbox
            label="Enable Email Notifications"
            description="Get notified when webhooks are received"
            checked={formData?.enableNotifications}
            onChange={(e) => handleInputChange('enableNotifications', e?.target?.checked)}
          />

          {formData?.enableNotifications && (
            <Input
              label="Notification Email"
              type="email"
              placeholder="your-email@example.com"
              description="Email address to receive webhook notifications"
              value={formData?.notificationEmail}
              onChange={(e) => handleInputChange('notificationEmail', e?.target?.value)}
              error={errors?.notificationEmail}
              required
            />
          )}
        </div>
      </div>
      {/* Submit Button */}
      <div className="pt-4 border-t border-border">
        <Button
          type="submit"
          variant="default"
          loading={isLoading}
          disabled={isLoading || identifierStatus?.isChecking || identifierStatus?.isAvailable === false}
          iconName="Plus"
          iconPosition="left"
          className="w-full sm:w-auto"
        >
          {isLoading ? 'Creating Webhook...' : 'Create Webhook'}
        </Button>
      </div>
    </form>
  );
};

export default WebhookForm;