import Header from '../../components/ui/Header';
import ContextualHeader from '../../components/ui/ContextualHeader';
import ProfileSection from './components/ProfileSection';
import SubscriptionSection from './components/SubscriptionSection';
import WebhookManagementSection from './components/WebhookManagementSection';
import PrivacySection from './components/PrivacySection';
import ThemeSection from './components/ThemeSection';
import SecuritySection from './components/SecuritySection';
import APIAccessSection from './components/APIAccessSection';

const AccountSettings = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-16">
        <ContextualHeader
          title="Account Settings"
          subtitle="Manage your profile, subscription, and privacy preferences"
          backPath="/dashboard"
        />
        
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="space-y-8">
            {/* Profile Information */}
            <ProfileSection />
            
            {/* Subscription & Usage */}
            <SubscriptionSection />
            
            {/* Webhook Management */}
            <WebhookManagementSection />
            
            {/* Privacy & Data Control */}
            <PrivacySection />
            
            {/* Theme Preferences */}
            <ThemeSection />
            
            {/* Security Settings */}
            <SecuritySection />
            <APIAccessSection />
          </div>
          
          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              Need help? Contact our support team at{' '}
              <a href="mailto:support@hookcatch.com" className="text-primary hover:underline">
                support@hookcatch.com
              </a>
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              © {new Date()?.getFullYear()} HookCatch. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;