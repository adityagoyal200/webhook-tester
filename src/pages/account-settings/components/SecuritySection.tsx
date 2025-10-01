import { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { useAuth } from '../../../contexts/AuthContext';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';

interface LoginHistoryEntry {
  id: string;
  user_id: string;
  timestamp: string;
  ip_address: string;
  device_info: string;
  status: string;
}

const SecuritySection = () => {
  const { user } = useAuth();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionToTerminate, setSessionToTerminate] = useState<string | null>(
    null
  );
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([]);
  const [loadingLoginHistory, setLoadingLoginHistory] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const [{ data: sessionData }, { data, error }] = await Promise.all([
        supabase.auth.getSession(),
        supabase.auth.getSessions(),
      ]);
      setCurrentSessionId(sessionData?.session?.id ?? null);
      if (error) {
        console.error('Error fetching sessions:', error);
        toast.error('Error fetching active sessions.', error.message);
      } else if (data) {
        setActiveSessions(data.sessions || []);
      }
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

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

  const handleTerminateSession = async (sessionId: string) => {
    console.log('Terminating session:', sessionId);
    const { error } = await supabase.auth.signOut({ scope: 'others' });
    if (error) {
      console.error('Error terminating session:', error);
    } else {
      // Re-fetch sessions to update the UI
      const { data, error: fetchError } = await supabase.auth.getSessions();
      if (fetchError) {
        console.error('Error re-fetching sessions:', fetchError);
      } else if (data) {
        setActiveSessions(data.sessions || []);
      }
    }
  };

  const handleTerminateAllSessions = async () => {
    console.log('Terminating all other sessions');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error terminating all sessions:', error);
    } else {
      // After terminating all sessions, the user will be logged out, so we should clear local state
      setActiveSessions([]);
    }
  };

  const getDeviceIcon = (userAgent: string | null | undefined) => {
    if (!userAgent) return 'Monitor';
    if (userAgent.includes('iPhone') || userAgent.includes('Android') || userAgent.includes('Mobile')) return 'Smartphone';
    if (userAgent.includes('iPad') || userAgent.includes('Tablet')) return 'Tablet';
    if (userAgent.includes('Mac OS X') || userAgent.includes('Windows NT') || userAgent.includes('Linux')) return 'Laptop';
    return 'Monitor';
  };

  const fetchLoginHistory = async () => {
    if (!user) return;
    setLoadingLoginHistory(true);
    const { data, error } = await supabase
      .from("login_history")
      .select("*")
      .eq("user_id", user.id)
      .order("timestamp", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Error fetching login history:", error);
      toast.error("Error fetching login history.", error.message);
    } else {
      setLoginHistory(data || []);
    }
    setLoadingLoginHistory(false);
  };

  useEffect(() => {
    fetchSessions();
    fetchLoginHistory();
  }, [user]);

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
                  ? 'Your account is protected with 2FA' : 'Add an extra layer of security to your account'
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
          {loadingSessions ? (
            <p className="text-muted-foreground">Loading sessions...</p>
          ) : activeSessions?.length === 0 ? (
            <p className="text-muted-foreground">No active sessions found.</p>
          ) : (
            activeSessions?.slice(0, 2)?.map((session) => (
              <div key={session?.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Icon name={getDeviceIcon(session?.user_agent)} size={20} className="text-muted-foreground" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-foreground">{session?.user_agent || 'Unknown Device'}</span>
                      {session?.id === currentSessionId && (
                        <span className="text-xs bg-success/10 text-success px-2 py-1 rounded">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {/* {session?.browser} • {session?.location} */}
                      Last active: {new Date(session?.last_accessed_at || '').toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {/* IP: {session?.factor_id} This is a placeholder, actual IP might not be directly available in session object */}
                    </p>
                  </div>
                </div>
                {session?.id !== currentSessionId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => session?.id && handleTerminateSession(session.id)}
                    iconName="X"
                  >
                    Terminate
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      {/* Recent Login Activity */}
      <div className="border-t border-border pt-6">
        <h3 className="font-medium text-foreground mb-4">Recent Login Activity</h3>
        <div className="space-y-3">
          {loadingLoginHistory ? (
            <p className="text-muted-foreground">Loading login history...</p>
          ) : loginHistory.length === 0 ? (
            <p className="text-muted-foreground">No recent login activity found.</p>
          ) : (
            loginHistory.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      entry.status === "success" ? "bg-success" : "bg-error"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {new Date(entry.timestamp)?.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.device_info} • {entry.ip_address}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    entry.status === "success"
                      ? "bg-success/10 text-success"
                      : "bg-error/10 text-error"
                  }`}
                >
                  {entry.status}
                </span>
              </div>
            ))
          )}
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
              {loadingSessions ? (
                <p className="text-muted-foreground">Loading sessions...</p>
              ) : activeSessions?.length === 0 ? (
                <p className="text-muted-foreground">No active sessions found.</p>
              ) : (
                activeSessions?.map((session) => (
                  <div key={session?.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Icon name={getDeviceIcon(session?.user_agent)} size={24} className="text-muted-foreground" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-foreground">{session?.user_agent || 'Unknown Device'}</span>
                          {session?.id === currentSessionId && (
                            <span className="text-xs bg-success/10 text-success px-2 py-1 rounded">
                              Current Session
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">Last active: {new Date(session?.last_accessed_at || '').toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {/* IP: {session?.factor_id} Placeholder for IP */}
                        </p>
                      </div>
                    </div>
                    {session?.id !== currentSessionId && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => session?.id && handleTerminateSession(session.id)}
                      >
                        Terminate
                      </Button>
                    )}
                  </div>
                ))
              )}
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