"use client";

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { useCalendar } from "@/context/CalendarContext";
import { WeekHeader } from "./WeekHeader";
import { AllDayRow } from "./AllDayRow";
import { WeekBody } from "./WeekBody";
import { DayView } from "./DayView";
import { MonthView } from "./MonthView";
import { AgendaView } from "./AgendaView";

export interface CalendarAreaRef {
  scrollToToday: () => void;
}

export const CalendarArea = forwardRef<CalendarAreaRef>((_, ref) => {
  const { currentView } = useCalendar();
  const calAreaRef = useRef<HTMLDivElement>(null);

  const scrollToCurrentTime = () => {
    if (calAreaRef.current) {
      const nowTop = (10 + 42 / 60 - 7) * 60;
      calAreaRef.current.scrollTo({
        top: Math.max(0, nowTop - 180),
        behavior: "smooth",
      });
    }
  };

  useImperativeHandle(ref, () => ({
    scrollToToday: scrollToCurrentTime,
  }));

  useEffect(() => {
    // Initial scroll position on load
    if (calAreaRef.current && currentView === "week") {
      const nowTop = (10 + 42 / 60 - 7) * 60;
      calAreaRef.current.scrollTop = Math.max(0, nowTop - 180);
    }
  }, [currentView]);

  if (currentView === "day") {
    return <DayView />;
  }

  if (currentView === "month") {
    return <MonthView />;
  }

  if (currentView === "agenda") {
    return <AgendaView />;
  }

  return (
    <div className="calendar-area fade-up fade-up-2" ref={calAreaRef}>
      <WeekHeader />
      <AllDayRow />
      <WeekBody />
    </div>
  );
});

CalendarArea.displayName = "CalendarArea";
