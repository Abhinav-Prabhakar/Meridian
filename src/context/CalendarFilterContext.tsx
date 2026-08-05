"use client";

import React, { createContext, useContext, useState } from "react";

export type CalendarCategory = "strategy" | "meeting" | "focus" | "personal" | "travel";

interface CalendarFilterContextType {
  activeCategories: Record<CalendarCategory, boolean>;
  toggleCategory: (cat: CalendarCategory) => boolean;
}

const CalendarFilterContext = createContext<CalendarFilterContextType>({
  activeCategories: {
    strategy: true,
    meeting: true,
    focus: true,
    personal: true,
    travel: false,
  },
  toggleCategory: () => true,
});

export const useCalendarFilter = () => useContext(CalendarFilterContext);

export const CalendarFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeCategories, setActiveCategories] = useState<Record<CalendarCategory, boolean>>({
    strategy: true,
    meeting: true,
    focus: true,
    personal: true,
    travel: false,
  });

  const toggleCategory = (cat: CalendarCategory) => {
    let newState = true;
    setActiveCategories((prev) => {
      newState = !prev[cat];
      return { ...prev, [cat]: newState };
    });
    return newState;
  };

  return (
    <CalendarFilterContext.Provider value={{ activeCategories, toggleCategory }}>
      {children}
    </CalendarFilterContext.Provider>
  );
};
