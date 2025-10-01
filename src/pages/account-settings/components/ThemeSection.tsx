import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ThemeSection = () => {
  const [currentTheme, setCurrentTheme] = useState('system');
  const [systemPreference, setSystemPreference] = useState('light');

  useEffect(() => {
    // Check for saved theme preference or default to 'system'
    const savedTheme = localStorage.getItem('theme') || 'system';
    setCurrentTheme(savedTheme);

    // Detect system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemPreference(mediaQuery?.matches ? 'dark' : 'light');

    // Listen for system theme changes
    const handleChange = (e) => {
      setSystemPreference(e?.matches ? 'dark' : 'light');
    };

    mediaQuery?.addEventListener('change', handleChange);
    return () => mediaQuery?.removeEventListener('change', handleChange);
  }, []);

  const handleThemeChange = (theme) => {
    setCurrentTheme(theme);
    localStorage.setItem('theme', theme);

    // Apply theme to document
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList?.add('dark');
    } else if (theme === 'light') {
      root.classList?.remove('dark');
    } else {
      // System preference
      if (systemPreference === 'dark') {
        root.classList?.add('dark');
      } else {
        root.classList?.remove('dark');
      }
    }
  };

  const themeOptions = [
    {
      id: 'light',
      name: 'Light',
      description: 'Clean and bright interface',
      icon: 'Sun',
      preview: 'bg-white border-gray-200'
    },
    {
      id: 'dark',
      name: 'Dark',
      description: 'Easy on the eyes in low light',
      icon: 'Moon',
      preview: 'bg-slate-900 border-slate-700'
    },
    {
      id: 'system',
      name: 'System',
      description: 'Matches your device settings',
      icon: 'Monitor',
      preview: systemPreference === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'
    }
  ];

  const getEffectiveTheme = () => {
    if (currentTheme === 'system') {
      return systemPreference;
    }
    return currentTheme;
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Theme Preferences</h2>
          <p className="text-sm text-muted-foreground">Customize your visual experience</p>
        </div>
        <div className="flex items-center space-x-2">
          <Icon 
            name={getEffectiveTheme() === 'dark' ? 'Moon' : 'Sun'} 
            size={20} 
            className="text-primary" 
          />
          <span className="text-sm font-medium text-foreground capitalize">
            {getEffectiveTheme()} Mode
          </span>
        </div>
      </div>
      {/* Theme Options */}
      <div className="space-y-3 mb-6">
        {themeOptions?.map((option) => (
          <div
            key={option?.id}
            className={`relative p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:bg-muted/50 ${
              currentTheme === option?.id
                ? 'border-primary bg-primary/5' :'border-border'
            }`}
            onClick={() => handleThemeChange(option?.id)}
          >
            <div className="flex items-center space-x-4">
              {/* Theme Preview */}
              <div className={`w-12 h-8 rounded border-2 ${option?.preview} flex items-center justify-center`}>
                <div className={`w-2 h-2 rounded-full ${
                  option?.id === 'dark' || (option?.id === 'system' && systemPreference === 'dark')
                    ? 'bg-white' :'bg-slate-900'
                }`} />
              </div>

              {/* Theme Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <Icon name={option?.icon} size={16} className="text-muted-foreground" />
                  <h3 className="font-medium text-foreground">{option?.name}</h3>
                  {option?.id === 'system' && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      Currently {systemPreference}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{option?.description}</p>
              </div>

              {/* Selection Indicator */}
              {currentTheme === option?.id && (
                <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <Icon name="Check" size={12} className="text-white" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* Additional Settings */}
      <div className="border-t border-border pt-6">
        <h3 className="font-medium text-foreground mb-4">Additional Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-foreground">Sync with system</h4>
              <p className="text-xs text-muted-foreground">
                Automatically switch themes when your system preference changes
              </p>
            </div>
            <Button
              variant={currentTheme === 'system' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleThemeChange('system')}
            >
              {currentTheme === 'system' ? 'Enabled' : 'Enable'}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-foreground">High contrast mode</h4>
              <p className="text-xs text-muted-foreground">
                Increase contrast for better accessibility (Coming soon)
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Coming Soon
            </Button>
          </div>
        </div>
      </div>
      {/* Theme Preview */}
      <div className="border-t border-border pt-6 mt-6">
        <h3 className="font-medium text-foreground mb-4">Preview</h3>
        <div className="p-4 border border-border rounded-lg bg-muted/30">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Icon name="Webhook" size={16} className="text-white" />
            </div>
            <div>
              <h4 className="font-medium text-foreground">Sample Webhook</h4>
              <p className="text-sm text-muted-foreground">https://hook.catch/sample_123</p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Last request: 2 minutes ago • Status: Active
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSection;