import { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';


const SecuritySection = () => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);

  const mockSessions = [
    {
      id: 'session_1',
      device: 'MacBook Pro',
      browser: 'Chrome 118',
      location: 'San Francisco, CA',
      ip: '192.168.1.100',
      lastActive: '2 minutes ago',
      current: true
    },
    {
      id: 'session_2',
      device: 'iPhone 15',
      browser: 'Safari Mobile',
      location: 'San Francisco, CA',
      ip: '192.168.1.101',
      lastActive: '1 hour ago',
      current: false
    },
    {
      id: 'session_3',
      device: 'Windows PC',
      browser: 'Edge 118',
      location: 'New York, NY',
      ip: '203.0.113.45',
      lastActive: '2 days ago',
      current: false
    }
  ];

  const mockLoginHistory = [
    {
      id: 'login_1',
      timestamp: '2025-10-01 09:30:00',
      device: 'MacBook Pro',
      location: 'San Francisco, CA',
      ip: '192.168.1.100',
      status: 'success'
    },
    {
      id: 'login_2',
      timestamp: '2025-09-30 14:22:00',
      device: 'iPhone 15',
      location: 'San Francisco, CA',
      ip: '192.168.1.101',
      status: 'success'
    },
    {
      id: 'login_3',
      timestamp: '2025-09-29 10:15:00',
      device: 'Unknown Device',
      location: 'Unknown Location',
      ip: '203.0.113.99',
      status: 'failed'
    }
  ];

  const handleTwoFactorToggle = () => {
    if (!twoFactorEnabled) {
      setShowTwoFactorSetup(true);
    } else {
      setTwoFactorEnabled(false);
    }
  };

  const handleTwoFactorSetup = () => {
    setTwoFactorEnabled(true);
    setShowTwoFactorSetup(false);
    console.log('Two-factor authentication enabled');
  };

  const handleTerminateSession = (sessionId) => {
    console.log('Terminating session:', sessionId);
  };

  const handleTerminateAllSessions = () => {
    console.log('Terminating all other sessions');
  };

  const getDeviceIcon = (device) => {
    if (device?.includes('iPhone') || device?.includes('Android')) return 'Smartphone';
    if (device?.includes('iPad') || device?.includes('Tablet')) return 'Tablet';
    if (device?.includes('Mac')) return 'Laptop';
    return 'Monitor';
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Security Settings</h2>
          <p className="text-sm text-muted-foreground">Manage your account security and access</p>
        </div>
        <div className="flex items-center space-x-2">
          <Icon name="Shield" size={20} className={twoFactorEnabled ? 'text-success' : 'text-muted-foreground'} />
          <span className={`text-sm font-medium ${twoFactorEnabled ? 'text-success' : 'text-muted-foreground'}`}>
            {twoFactorEnabled ? 'Secured' : 'Basic'}
          </span>
        </div>
      </div>
      {/* Two-Factor Authentication */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between p-4 border border-border rounded-lg">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              twoFactorEnabled ? 'bg-success/10' : 'bg-muted'
            }`}>
              <Icon 
                name={twoFactorEnabled ? 'ShieldCheck' : 'Shield'} 
                size={20} 
                className={twoFactorEnabled ? 'text-success' : 'text-muted-foreground'} 
              />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Two-Factor Authentication</h3>
              <p className="text-sm text-muted-foreground">
                {twoFactorEnabled 
                  ? 'Your account is protected with 2FA' :'Add an extra layer of security to your account'
                }
              </p>
              {!twoFactorEnabled && (
                <span className="text-xs text-warning bg-warning/10 px-2 py-1 rounded mt-1 inline-block">
                  Pro feature
                </span>
              )}
            </div>
          </div>
          <Button
            variant={twoFactorEnabled ? 'destructive' : 'default'}
            size="sm"
            onClick={handleTwoFactorToggle}
            disabled={!twoFactorEnabled} // Disabled for free tier
          >
            {twoFactorEnabled ? 'Disable' : 'Enable'}
          </Button>
        </div>
      </div>
      {/* Active Sessions */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-foreground">Active Sessions</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSessionModal(true)}
            iconName="Eye"
          >
            View All
          </Button>
        </div>

        <div className="space-y-3">
          {mockSessions?.slice(0, 2)?.map((session) => (
            <div key={session?.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div className="flex items-center space-x-3">
                <Icon name={getDeviceIcon(session?.device)} size={20} className="text-muted-foreground" />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-foreground">{session?.device}</span>
                    {session?.current && (
                      <span className="text-xs bg-success/10 text-success px-2 py-1 rounded">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {session?.browser} • {session?.location}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {session?.ip} • {session?.lastActive}
                  </p>
                </div>
              </div>
              {!session?.current && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTerminateSession(session?.id)}
                  iconName="X"
                >
                  Terminate
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Recent Login Activity */}
      <div className="border-t border-border pt-6">
        <h3 className="font-medium text-foreground mb-4">Recent Login Activity</h3>
        <div className="space-y-3">
          {mockLoginHistory?.slice(0, 3)?.map((login) => (
            <div key={login?.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  login?.status === 'success' ? 'bg-success' : 'bg-error'
                }`} />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(login.timestamp)?.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {login?.device} • {login?.location} • {login?.ip}
                  </p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${
                login?.status === 'success' ?'bg-success/10 text-success' :'bg-error/10 text-error'
              }`}>
                {login?.status}
              </span>
            </div>
          ))}
        </div>
      </div>
      {/* Two-Factor Setup Modal */}
      {showTwoFactorSetup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Enable Two-Factor Authentication</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowTwoFactorSetup(false)}
              >
                <Icon name="X" size={20} />
              </Button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Two-factor authentication is available for Pro users. Upgrade your account to enable this security feature.
              </p>
              
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Icon name="Crown" size={16} className="text-warning" />
                  <span className="text-sm font-medium text-warning">Pro Feature</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Upgrade to Pro to access advanced security features including 2FA
                </p>
              </div>

              <div className="flex space-x-3">
                <Button onClick={() => console.log('Redirect to upgrade')}>
                  Upgrade to Pro
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowTwoFactorSetup(false)}
                >
                  Maybe Later
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Sessions Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Active Sessions</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSessionModal(false)}
              >
                <Icon name="X" size={20} />
              </Button>
            </div>
            
            <div className="space-y-4">
              {mockSessions?.map((session) => (
                <div key={session?.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Icon name={getDeviceIcon(session?.device)} size={24} className="text-muted-foreground" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-foreground">{session?.device}</span>
                        {session?.current && (
                          <span className="text-xs bg-success/10 text-success px-2 py-1 rounded">
                            Current Session
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{session?.browser}</p>
                      <p className="text-sm text-muted-foreground">{session?.location}</p>
                      <p className="text-xs text-muted-foreground">
                        IP: {session?.ip} • Last active: {session?.lastActive}
                      </p>
                    </div>
                  </div>
                  {!session?.current && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleTerminateSession(session?.id)}
                    >
                      Terminate
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-6 pt-6 border-t border-border">
              <Button
                variant="destructive"
                onClick={handleTerminateAllSessions}
                iconName="LogOut"
              >
                Terminate All Other Sessions
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowSessionModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecuritySection;