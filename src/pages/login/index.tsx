import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContainer from '../../components/ui/AuthContainer';
import LoginForm from './components/LoginForm';
import SecurityBadges from './components/SecurityBadges';
import DeveloperTestimonial from './components/DeveloperTestimonial';

const LoginPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (isAuthenticated === 'true') {
      navigate('/dashboard');
    }
  }, [navigate]);

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