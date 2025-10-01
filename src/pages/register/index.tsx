import { useState } from 'react';
import AuthContainer from '../../components/ui/AuthContainer';
import TierSelection from './components/TierSelection';
import RegistrationForm from './components/RegistrationForm';

const Register = () => {
  type Tier = 'free' | 'pro' | 'enterprise' | string;
  const [selectedTier, setSelectedTier] = useState<Tier>('free');

  const handleTierSelect = (tierId: Tier) => {
    setSelectedTier(tierId);
  };

  const handleRegistrationSubmit = (data: unknown) => {
    console.log('Registration submitted:', data);
  };

  return (
    <div className="min-h-screen bg-background">
      <AuthContainer
        title="Create Your Account"
        subtitle="Join thousands of developers testing webhooks with HookCatch"
      >
        <div className="space-y-8">
          <TierSelection
            selectedTier={selectedTier}
            onTierSelect={handleTierSelect}
          />
          <RegistrationForm
            selectedTier={selectedTier}
            onSubmit={handleRegistrationSubmit}
          />
        </div>
      </AuthContainer>
    </div>
  );
};

export default Register;