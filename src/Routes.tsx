import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import ErrorBoundry from "./components/ErrorBoundry";
import NotFound from "./pages/NotFound";
import CreateWebhook from './pages/create-webhook';
import LoginPage from './pages/login';
import AccountSettings from './pages/account-settings';
import WebhookDetails from './pages/webhook-details';
import Dashboard from './pages/dashboard';
import Register from './pages/register';

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundry>
      <ScrollToTop />
      <RouterRoutes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/create-webhook" element={<CreateWebhook />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/account-settings" element={<AccountSettings />} />
        <Route path="/webhook-details" element={<WebhookDetails />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundry>
    </BrowserRouter>
  );
};

export default Routes;
