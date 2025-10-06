import Routes from "./Routes";
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'sonner';
import DebugPanel from './components/DebugPanel';

function App() {
  return (
    <AuthProvider>
      <Routes />
      <Toaster />
      <DebugPanel />
    </AuthProvider>
  );
}

export default App;
