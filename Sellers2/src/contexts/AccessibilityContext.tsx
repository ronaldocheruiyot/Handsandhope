import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';

interface AccessibilityContextType {
  fontSize: 'normal' | 'large' | 'extra-large';
  setFontSize: (size: 'normal' | 'large' | 'extra-large') => void;
  highContrast: boolean;
  setHighContrast: (value: boolean) => void;
  screenReader: boolean;
  setScreenReader: (value: boolean) => void;
  voiceNavigation: boolean;
  setVoiceNavigation: (value: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

interface AccessibilityProviderProps {
  children: ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [fontSize, setFontSizeState] = useState<'normal' | 'large' | 'extra-large'>('normal');
  const [highContrast, setHighContrastState] = useState(false);
  const [screenReader, setScreenReaderState] = useState(false);
  const [voiceNavigation, setVoiceNavigationState] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedFontSize = localStorage.getItem('a11y-fontSize') as 'normal' | 'large' | 'extra-large' | null;
    const savedHighContrast = localStorage.getItem('a11y-highContrast') === 'true';
    const savedScreenReader = localStorage.getItem('a11y-screenReader') === 'true';
    const savedVoiceNavigation = localStorage.getItem('a11y-voiceNavigation') === 'true';

    if (savedFontSize) setFontSizeState(savedFontSize);
    if (savedHighContrast) setHighContrastState(true);
    if (savedScreenReader) setScreenReaderState(true);
    if (savedVoiceNavigation) setVoiceNavigationState(true);

    setIsHydrated(true);
  }, []);

  const setFontSize = (size: 'normal' | 'large' | 'extra-large') => {
    setFontSizeState(size);
    localStorage.setItem('a11y-fontSize', size);
  };

  const setHighContrast = (value: boolean) => {
    setHighContrastState(value);
    localStorage.setItem('a11y-highContrast', String(value));
  };

  const setScreenReader = (value: boolean) => {
    setScreenReaderState(value);
    localStorage.setItem('a11y-screenReader', String(value));
  };

  const setVoiceNavigation = (value: boolean) => {
    setVoiceNavigationState(value);
    localStorage.setItem('a11y-voiceNavigation', String(value));
  };

  // Don't render children until we've hydrated from localStorage
  if (!isHydrated) {
    return <>{children}</>;
  }

  return (
    <AccessibilityContext.Provider
      value={{
        fontSize,
        setFontSize,
        highContrast,
        setHighContrast,
        screenReader,
        setScreenReader,
        voiceNavigation,
        setVoiceNavigation,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}
