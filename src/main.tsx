import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import './styles/tailwind.css'
import App from './App.tsx'

// Initialize theme on app start
const initializeTheme = () => {
  const savedTheme = localStorage.getItem('theme') || 'system';
  const root = document.documentElement;
  
  if (savedTheme === 'dark') {
    root.classList.add('dark');
  } else if (savedTheme === 'light') {
    root.classList.remove('dark');
  } else {
    // System preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (mediaQuery.matches) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
};

// Initialize theme before rendering
initializeTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
