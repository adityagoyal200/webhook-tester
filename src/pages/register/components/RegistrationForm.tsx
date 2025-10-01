import { useState } from 'react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import Icon from '../../../components/AppIcon';
import { authService } from '../../../services/authService';

interface RegistrationFormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  agreeToTerms: boolean;
  subscribeNewsletter: boolean;
}

type FormErrors = Partial<Record<keyof RegistrationFormData | 'general', string>>;

interface RegistrationFormProps {
  selectedTier: string;
  onSubmit?: (data: RegistrationFormData & { tier?: string }) => void;
  className?: string;
}

const RegistrationForm = ({ selectedTier, onSubmit, className = '' }: RegistrationFormProps) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegistrationFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    agreeToTerms: false,
    subscribeNewsletter: false
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex?.test(email);
  };

  const validatePassword = (password: string): boolean => {
    const minLength = password?.length >= 8;
    const hasLowercase = /[a-z]/?.test(password);
    const hasUppercase = /[A-Z]/?.test(password);
    const hasNumbers = /\d/?.test(password);
    const hasSymbols = /[!@#$%^&*(),.?":{}|<>]/?.test(password);
    
    return minLength && hasLowercase && hasUppercase && hasNumbers && hasSymbols;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData?.fullName?.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData?.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData?.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData?.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData?.password)) {
      newErrors.password = 'Password does not meet security requirements';
    }

    if (!formData?.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData?.password !== formData?.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData?.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms of service';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleInputChange = (field: keyof RegistrationFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors?.[field as keyof RegistrationFormData]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const { data, error } = await authService?.signUp(
        formData?.email,
        formData?.password,
        {
          full_name: formData?.fullName,
          subscription_tier: selectedTier || 'free',
          subscribe_newsletter: formData?.subscribeNewsletter
        }
      );

      if (error) {
        setErrors({
          general: error?.message || 'Registration failed. Please try again.'
        });
      } else if (data?.user) {
        // Call onSubmit if provided
        if (onSubmit) {
          onSubmit({
            ...formData,
            tier: selectedTier
          });
        }
        
        // Show success message or navigate
        if (data?.user?.email_confirmed_at) {
          // Email confirmed, can sign in immediately
          navigate('/dashboard');
        } else {
          // Need email confirmation
          setErrors({
            general: 'Please check your email and click the confirmation link to complete registration.'
          });
        }
      }
    } catch (error) {
      setErrors({
        general: 'Registration failed. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignInClick = () => {
    navigate('/login');
  };

  return (
    <div className="space-y-6">
      {/* Demo Information */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Icon name="Info" size={20} className="text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-primary text-sm font-medium">Demo Registration</p>
            <p className="text-primary/80 text-sm mt-1">
              Create a new account or use existing demo credentials on the login page.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
        {/* Full Name Field */}
        <Input
          label="Full Name"
          type="text"
          placeholder="Enter your full name"
          value={formData?.fullName}
          onChange={(e) => handleInputChange('fullName', e?.target?.value)}
          error={errors?.fullName}
          required
          disabled={isLoading}
        />
        
        {/* Email Field */}
        <Input
          label="Email Address"
          type="email"
          placeholder="Enter your email"
          value={formData?.email}
          onChange={(e) => handleInputChange('email', e?.target?.value)}
          error={errors?.email}
          required
          disabled={isLoading}
        />
        
        {/* Password Field */}
        <div>
          <Input
            label="Password"
            type="password"
            placeholder="Create a strong password"
            value={formData?.password}
            onChange={(e) => handleInputChange('password', e?.target?.value)}
            error={errors?.password}
            required
            disabled={isLoading}
          />
          <PasswordStrengthIndicator password={formData?.password} />
        </div>
        
        {/* Confirm Password Field */}
        <Input
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
          value={formData?.confirmPassword}
          onChange={(e) => handleInputChange('confirmPassword', e?.target?.value)}
          error={errors?.confirmPassword}
          required
          disabled={isLoading}
        />
        
        {/* Terms Agreement */}
        <div className="space-y-3">
          <Checkbox
            label="I agree to the Terms of Service and Privacy Policy"
            checked={formData?.agreeToTerms}
            onChange={(e) => handleInputChange('agreeToTerms', e?.target?.checked)}
            error={errors?.agreeToTerms}
            required
            disabled={isLoading}
          />

          <Checkbox
            label="Subscribe to product updates and developer tips"
            checked={formData?.subscribeNewsletter}
            onChange={(e) => handleInputChange('subscribeNewsletter', e?.target?.checked)}
            disabled={isLoading}
          />
        </div>
        
        {/* General Error */}
        {errors?.general && (
          <div className="bg-error/10 border border-error/20 rounded-lg p-4 flex items-start space-x-3">
            <Icon name="AlertCircle" size={20} className="text-error mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-error text-sm font-medium">Registration Status</p>
              <p className="text-error/80 text-sm mt-1">{errors?.general}</p>
            </div>
          </div>
        )}
        
        {/* Submit Button */}
        <Button
          type="submit"
          variant="default"
          size="lg"
          fullWidth
          loading={isLoading}
          disabled={isLoading}
          iconName="UserPlus"
          iconPosition="left"
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Button>
        
        {/* Sign In Link */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <button
              type="button"
              onClick={handleSignInClick}
              className="text-primary hover:text-primary/80 font-medium transition-colors duration-200 focus-ring rounded px-1"
              disabled={isLoading}
            >
              Sign In
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default RegistrationForm;