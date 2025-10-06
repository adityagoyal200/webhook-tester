import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { pricingService } from '../../services/pricingService';
import { userService } from '../../services/userService';
import { paymentService } from '../../services/paymentService';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

const PricingPage = () => {
  const { user, profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState<string>(profile?.subscription_tier || 'free');

  const tiers = pricingService.getAllTiers();
  const featureComparison = pricingService.getFeatureComparison();

  // Update current tier when profile changes
  useEffect(() => {
    const newTier = profile?.subscription_tier || 'free';
    console.log('Pricing Page Debug:', {
      profile,
      currentTier,
      newTier,
      profileSubscriptionTier: profile?.subscription_tier
    });
    setCurrentTier(newTier);
  }, [profile?.subscription_tier]);

  // Upgrade/Downgrade function with payment integration
  const handleUpgrade = async (tierId: string) => {
    if (!user?.id) {
      navigate('/login');
      return;
    }

    setLoading(tierId);
    
    try {
      console.log('Starting tier change:', { from: currentTier, to: tierId });
      
      // If downgrading to free, just update the profile
      if (tierId === 'free') {
        const { error } = await updateProfile({
          subscription_tier: tierId
        });

        if (error) {
          console.error('Failed to downgrade subscription:', error);
          alert('Failed to downgrade subscription. Please try again.');
          return;
        }
        
        setCurrentTier(tierId);
        alert('Successfully downgraded to free tier.');
        navigate('/dashboard');
        return;
      }

      // For paid tiers, process payment
      const { data: paymentIntent, error: paymentError } = await paymentService.createPaymentIntent(tierId, user.id);
      
      if (paymentError || !paymentIntent) {
        console.error('Failed to create payment intent:', paymentError);
        alert('Failed to process payment. Please try again.');
        return;
      }

      // Confirm payment (in real app, this would be done by Stripe)
      const { data: subscription, error: confirmError } = await paymentService.confirmPayment(paymentIntent.id, user.id);
      
      if (confirmError || !subscription) {
        console.error('Failed to confirm payment:', confirmError);
        alert('Payment failed. Please try again.');
        return;
      }

      // Update user profile with new tier
      const { error: profileError } = await updateProfile({
        subscription_tier: tierId
      });

      if (profileError) {
        console.error('Failed to update profile after payment:', profileError);
        alert('Payment succeeded but failed to update account. Please contact support.');
        return;
      }

      setCurrentTier(tierId);
      alert(`Successfully upgraded to ${tierId} tier! Features are now unlocked.`);
      navigate('/dashboard');
      
    } catch (err) {
      console.error('Upgrade error:', err);
      alert('Failed to process subscription change. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const getTierIcon = (tierId: string) => {
    switch (tierId) {
      case 'free': return 'Gift';
      case 'plus': return 'Zap';
      case 'pro': return 'Crown';
      default: return 'Package';
    }
  };

  const getTierColor = (tierId: string) => {
    switch (tierId) {
      case 'free': return 'border-border';
      case 'plus': return 'border-primary';
      case 'pro': return 'border-yellow-500';
      default: return 'border-border';
    }
  };

  const formatLimit = (limit: number) => {
    if (limit === -1) return 'Unlimited';
    if (limit === Infinity) return 'Unlimited';
    return limit.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start free and scale as you grow. All plans include our core webhook management features.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`bg-card border-2 rounded-lg p-8 relative ${
                tier.id === 'plus' ? 'scale-105 shadow-lg' : ''
              } ${getTierColor(tier.id)}`}
            >
              {tier.id === 'plus' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name={getTierIcon(tier.id)} size={32} className="text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">{tier.name}</h3>
                <p className="text-muted-foreground mb-4">{tier.description}</p>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-foreground">
                    ${tier.price}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    {tier.billing === 'free' ? 'forever' : `/ ${tier.billing}`}
                  </span>
                </div>
              </div>

              {/* Limits */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Webhooks</span>
                  <span className="font-medium">{formatLimit(tier.limits.webhooks)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Requests/Month</span>
                  <span className="font-medium">{formatLimit(tier.limits.requestsPerMonth)}</span>
                </div>
                {tier.id === 'free' && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Requests/Day</span>
                    <span className="font-medium">{tier.limits.requestsPerDay}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Data Retention</span>
                  <span className="font-medium">{tier.limits.retentionDays} days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">API Keys</span>
                  <span className="font-medium">{formatLimit(tier.limits.apiKeys)}</span>
                </div>
              </div>

              {/* CTA Button */}
              <Button
                variant={tier.id === 'free' ? 'outline' : 'default'}
                size="lg"
                className="w-full mb-6"
                onClick={() => {
                  console.log('Button clicked:', { tierId: tier.id, currentTier });
                  handleUpgrade(tier.id);
                }}
                disabled={loading === tier.id || currentTier === tier.id}
              >
                {loading === tier.id ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Processing...
                  </div>
                ) : currentTier === tier.id ? (
                  'Current Plan'
                ) : tier.id === 'free' ? (
                  currentTier !== 'free' ? 'Downgrade to Free' : 'Get Started'
                ) : (
                  `Upgrade to ${tier.name}`
                )}
              </Button>

              {/* Key Features */}
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground mb-3">Key Features</h4>
                {Object.entries(tier.features)
                  .filter(([_, enabled]) => enabled)
                  .slice(0, 5)
                  .map(([feature, _]) => (
                    <div key={feature} className="flex items-center text-sm">
                      <Icon name="Check" size={16} className="text-success mr-2" />
                      <span className="text-muted-foreground capitalize">
                        {feature.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </span>
                    </div>
                  ))}
                {Object.values(tier.features).filter(Boolean).length > 5 && (
                  <div className="text-sm text-muted-foreground">
                    +{Object.values(tier.features).filter(Boolean).length - 5} more features
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center text-foreground mb-8">
            Feature Comparison
          </h2>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-semibold text-foreground">Features</th>
                    <th className="text-center p-4 font-semibold text-foreground">Free</th>
                    <th className="text-center p-4 font-semibold text-foreground">Plus</th>
                    <th className="text-center p-4 font-semibold text-foreground">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {featureComparison.map((row, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                      <td className="p-4 text-foreground">{row.feature}</td>
                      <td className="text-center p-4">
                        {row.free ? (
                          <Icon name="Check" size={20} className="text-success mx-auto" />
                        ) : (
                          <Icon name="X" size={20} className="text-muted-foreground mx-auto" />
                        )}
                      </td>
                      <td className="text-center p-4">
                        {row.plus ? (
                          <Icon name="Check" size={20} className="text-success mx-auto" />
                        ) : (
                          <Icon name="X" size={20} className="text-muted-foreground mx-auto" />
                        )}
                      </td>
                      <td className="text-center p-4">
                        {row.pro ? (
                          <Icon name="Check" size={20} className="text-success mx-auto" />
                        ) : (
                          <Icon name="X" size={20} className="text-muted-foreground mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center text-foreground mb-8">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-2">
                Can I change my plan anytime?
              </h3>
              <p className="text-muted-foreground">
                Yes! You can upgrade your plan at any time. Changes take effect immediately and unlock new features.
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-2">
                What happens if I exceed my limits?
              </h3>
              <p className="text-muted-foreground">
                We'll notify you when you're approaching your limits. For free tier users, webhook requests will be blocked when daily limits are reached.
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-2">
                How does the free tier work?
              </h3>
              <p className="text-muted-foreground">
                Free tier includes 1 webhook and 5 requests per day. Upgrade to Plus for webhook testing, analytics, and data export features.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
