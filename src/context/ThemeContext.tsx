"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";

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

  const applyColor = useCallback((color: string) => {
    setAccentColorState(color);
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty("--accent", color);
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, color);
    } catch {
      // Ignore
    }
  }, []);

  // Sync with Supabase on mount & auth changes
  useEffect(() => {
    // 1. Instant local load
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved) {
        applyColor(saved);
      }
    } catch {
      // Ignore
    }

    // 2. Fetch remote color from Supabase user_settings / user_metadata
    const loadRemoteSettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check auth user_metadata first for instant claim
        if (user.user_metadata?.accent_color) {
          applyColor(user.user_metadata.accent_color);
        }

        // Fetch from Supabase user_settings table
        const { data, error } = await supabase
          .from("user_settings")
          .select("accent_color")
          .eq("user_id", user.id)
          .maybeSingle();

        if (data?.accent_color) {
          applyColor(data.accent_color);
        } else if (error && error.code === "PGRST205") {
          // Table doesn't exist yet, metadata fallback handled
        }
      } catch {
        // Fallback gracefully
      }
    };

    loadRemoteSettings();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        if (session.user.user_metadata?.accent_color) {
          applyColor(session.user.user_metadata.accent_color);
        }
        loadRemoteSettings();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [applyColor]);

  const setAccentColor = (color: string) => {
    applyColor(color);

    // Save to Supabase (User metadata & user_settings table)
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Update Auth Metadata
        await supabase.auth.updateUser({
          data: { accent_color: color },
        });

        // Upsert to user_settings table
        await supabase
          .from("user_settings")
          .upsert({
            user_id: user.id,
            accent_color: color,
            updated_at: new Date().toISOString(),
          });
      } catch {
        // Ignore
      }
    })();
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

