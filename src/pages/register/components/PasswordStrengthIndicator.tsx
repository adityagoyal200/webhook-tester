interface PasswordStrengthIndicatorProps {
  password?: string;
  className?: string;
}

interface Checks {
  length: boolean;
  lowercase: boolean;
  uppercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

interface StrengthLevel {
  label: string;
  color: string;
  bgColor: string;
}

const PasswordStrengthIndicator = ({ password, className = '' }: PasswordStrengthIndicatorProps) => {
  const calculateStrength = (password?: string) => {
    if (!password) {
      const emptyChecks: Checks = { length: false, lowercase: false, uppercase: false, numbers: false, symbols: false };
      return { score: 0, checks: emptyChecks, label: '', color: '', bgColor: '' };
    }

    const checks: Checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const score = Object.values(checks).filter(Boolean).length;

    const strengthLevels: Record<number, StrengthLevel> = {
      0: { label: '', color: '', bgColor: '' },
      1: { label: 'Very Weak', color: 'text-red-600', bgColor: 'bg-red-500' },
      2: { label: 'Weak', color: 'text-red-500', bgColor: 'bg-red-400' },
      3: { label: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-500' },
      4: { label: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-500' },
      5: { label: 'Strong', color: 'text-green-600', bgColor: 'bg-green-500' }
    };

    const level = strengthLevels[score] ?? strengthLevels[0];

    return {
      score,
      checks,
      ...level
    };
  };

  const strength = calculateStrength(password);

  if (!password) return null;

  return (
    <div className={`mt-2 ${className}`}>
      {/* Strength Bar */}
      <div className="flex space-x-1 mb-2">
        {[1, 2, 3, 4, 5]?.map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
              level <= strength?.score
                ? strength?.bgColor
                : 'bg-muted'
            }`}
          />
        ))}
      </div>
      {/* Strength Label */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${strength?.color}`}>
          {strength?.label}
        </span>
        <span className="text-xs text-muted-foreground">
          {strength?.score}/5
        </span>
      </div>
      {/* Requirements Checklist */}
      <div className="mt-3 space-y-1">
        <div className={`text-xs flex items-center space-x-2 ${
          strength?.checks?.length ? 'text-green-600' : 'text-muted-foreground'
        }`}>
          <div className={`w-1 h-1 rounded-full ${
            strength?.checks?.length ? 'bg-green-500' : 'bg-muted-foreground'
          }`} />
          <span>At least 8 characters</span>
        </div>
        <div className={`text-xs flex items-center space-x-2 ${
          strength?.checks?.lowercase ? 'text-green-600' : 'text-muted-foreground'
        }`}>
          <div className={`w-1 h-1 rounded-full ${
            strength?.checks?.lowercase ? 'bg-green-500' : 'bg-muted-foreground'
          }`} />
          <span>One lowercase letter</span>
        </div>
        <div className={`text-xs flex items-center space-x-2 ${
          strength?.checks?.uppercase ? 'text-green-600' : 'text-muted-foreground'
        }`}>
          <div className={`w-1 h-1 rounded-full ${
            strength?.checks?.uppercase ? 'bg-green-500' : 'bg-muted-foreground'
          }`} />
          <span>One uppercase letter</span>
        </div>
        <div className={`text-xs flex items-center space-x-2 ${
          strength?.checks?.numbers ? 'text-green-600' : 'text-muted-foreground'
        }`}>
          <div className={`w-1 h-1 rounded-full ${
            strength?.checks?.numbers ? 'bg-green-500' : 'bg-muted-foreground'
          }`} />
          <span>One number</span>
        </div>
        <div className={`text-xs flex items-center space-x-2 ${
          strength?.checks?.symbols ? 'text-green-600' : 'text-muted-foreground'
        }`}>
          <div className={`w-1 h-1 rounded-full ${
            strength?.checks?.symbols ? 'bg-green-500' : 'bg-muted-foreground'
          }`} />
          <span>One special character</span>
        </div>
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;