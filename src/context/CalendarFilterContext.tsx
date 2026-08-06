"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type CalendarCategory = string;

export interface CustomCalendar {
  key: string;
  name: string;
  colorVar: string;
}

const defaultCalendars: CustomCalendar[] = [
  { key: "strategy", name: "Strategy", colorVar: "var(--accent)" },
  { key: "meeting", name: "Meetings", colorVar: "var(--orange)" },
  { key: "focus", name: "Focus Time", colorVar: "var(--cyan)" },
  { key: "personal", name: "Personal", colorVar: "var(--pink)" },
  { key: "travel", name: "Travel", colorVar: "var(--yellow)" },
];

interface CalendarFilterContextType {
  calendars: CustomCalendar[];
  activeCategories: Record<string, boolean>;
  toggleCategory: (cat: string) => boolean;
  addCustomCalendar: (name: string, colorVar: string) => void;
  removeCalendar: (key: string) => void;
  isAddCalendarOpen: boolean;
  openAddCalendarModal: () => void;
  closeAddCalendarModal: () => void;
}

const CalendarFilterContext = createContext<CalendarFilterContextType>({
  calendars: defaultCalendars,
  activeCategories: {
    strategy: true,
    meeting: true,
    focus: true,
    personal: true,
    travel: false,
  },
  toggleCategory: () => true,
  addCustomCalendar: () => {},
  removeCalendar: () => {},
  isAddCalendarOpen: false,
  openAddCalendarModal: () => {},
  closeAddCalendarModal: () => {},
});

export const useCalendarFilter = () => useContext(CalendarFilterContext);

const CALENDARS_STORAGE_KEY = "meridian_custom_calendars_v1";

export const CalendarFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [calendars, setCalendars] = useState<CustomCalendar[]>(defaultCalendars);
  const [activeCategories, setActiveCategories] = useState<Record<string, boolean>>({
    strategy: true,
    meeting: true,
    focus: true,
    personal: true,
    travel: false,
  });
  const [isAddCalendarOpen, setIsAddCalendarOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CALENDARS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCalendars(parsed);
          const initialActive: Record<string, boolean> = {};
          parsed.forEach((c: CustomCalendar) => {
            initialActive[c.key] = true;
          });
          setActiveCategories(initialActive);
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  const toggleCategory = (cat: string) => {
    let newState = true;
    setActiveCategories((prev) => {
      newState = !prev[cat];
      return { ...prev, [cat]: newState };
    });
    return newState;
  };

  const addCustomCalendar = (name: string, colorVar: string) => {
    const key = name.toLowerCase().replace(/\s+/g, "_");
    const newCal: CustomCalendar = { key, name, colorVar };
    setCalendars((prev) => {
      const updated = [...prev, newCal];
      try {
        localStorage.setItem(CALENDARS_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
    setActiveCategories((prev) => ({ ...prev, [key]: true }));
  };

  const removeCalendar = (key: string) => {
    setCalendars((prev) => {
      const updated = prev.filter((c) => c.key !== key);
      try {
        localStorage.setItem(CALENDARS_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  return (
    <CalendarFilterContext.Provider
      value={{
        calendars,
        activeCategories,
        toggleCategory,
        addCustomCalendar,
        removeCalendar,
        isAddCalendarOpen,
        openAddCalendarModal: () => setIsAddCalendarOpen(true),
        closeAddCalendarModal: () => setIsAddCalendarOpen(false),
      }}
    >
      {children}
    </CalendarFilterContext.Provider>
  );
};
