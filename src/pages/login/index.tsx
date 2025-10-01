import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContainer from '../../components/ui/AuthContainer';
import LoginForm from './components/LoginForm';
import SecurityBadges from './components/SecurityBadges';
import DeveloperTestimonial from './components/DeveloperTestimonial';
import { useAuth } from '../../contexts/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // Check if user is already authenticated
    if (!loading && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, loading, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <AuthContainer
        title="Welcome Back"
        subtitle="Sign in to your HookCatch developer account"
      >
        <LoginForm />
        <SecurityBadges />
        <DeveloperTestimonial />
      </AuthContainer>
    </div>
  );
};

export default LoginPage;