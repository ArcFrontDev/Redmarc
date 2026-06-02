// src/hooks/useTheme.js
import { useState, useEffect } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('redmarc-theme') || 'dark');

  useEffect(() => {
    document.body.className = theme === 'light' ? 'light-theme' : theme === 'high-contrast' ? 'high-contrast-theme' : 'dark-theme';
    localStorage.setItem('redmarc-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return { theme, setTheme, toggleTheme };
}
