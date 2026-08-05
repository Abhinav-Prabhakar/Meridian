"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface ThemePreset {
  name: string;
  color: string;
}

export const themePresets: ThemePreset[] = [
  { name: "Lime (Default)", color: "#d4ff3d" },
  { name: "Cyber Cyan", color: "#5dd9d4" },
  { name: "Neon Orange", color: "#ff9248" },
  { name: "Hot Pink", color: "#ff7ab0" },
  { name: "Electric Gold", color: "#ffd23f" },
  { name: "Ultra Violet", color: "#a855f7" },
];

interface ThemeContextType {
  accentColor: string;
  setAccentColor: (color: string) => void;
  isThemeModalOpen: boolean;
  openThemeModal: () => void;
  closeThemeModal: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  accentColor: "#d4ff3d",
  setAccentColor: () => {},
  isThemeModalOpen: false,
  openThemeModal: () => {},
  closeThemeModal: () => {},
});

export const useTheme = () => useContext(ThemeContext);

const THEME_STORAGE_KEY = "meridian_accent_color";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accentColor, setAccentColorState] = useState<string>("#d4ff3d");
  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved) {
        setAccentColorState(saved);
        document.documentElement.style.setProperty("--accent", saved);
      }
    } catch {
      // Ignore
    }
  }, []);

  const setAccentColor = (color: string) => {
    setAccentColorState(color);
    document.documentElement.style.setProperty("--accent", color);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, color);
    } catch {
      // Ignore
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        accentColor,
        setAccentColor,
        isThemeModalOpen,
        openThemeModal: () => setIsThemeModalOpen(true),
        closeThemeModal: () => setIsThemeModalOpen(false),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
