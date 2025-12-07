import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('verso-theme') || 'vscode';
  });

  // The initial useEffect to load theme is now integrated into useState's initial value function.
  // This useEffect now only handles applying the theme to the document and saving it.
  useEffect(() => {
    // Apply theme to document body
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('verso-theme', theme);
  }, [theme]);

  const toggleTheme = (newTheme) => {
    if (['classic', 'vscode', 'material'].includes(newTheme)) {
      setTheme(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
