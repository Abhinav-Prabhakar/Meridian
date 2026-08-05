"use client";

import React, { useRef, useEffect } from "react";
import { ToastProvider, useToast } from "@/context/ToastContext";
import { CalendarFilterProvider } from "@/context/CalendarFilterContext";
import { CalendarProvider, useCalendar } from "@/context/CalendarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { Topbar } from "@/components/Topbar/Topbar";
import { CalendarArea, CalendarAreaRef } from "@/components/Calendar/CalendarArea";
import { DetailPanel } from "@/components/DetailPanel/DetailPanel";
import { NewEventModal } from "@/components/NewEventModal";
import { EventDetailModal } from "@/components/EventDetailModal";
import { SearchModal } from "@/components/SearchModal";
import { NotificationsModal } from "@/components/NotificationsModal";
import { ShareModal } from "@/components/ShareModal";
import { ShortcutsModal } from "@/components/ShortcutsModal";
import { ThemeCustomizerModal } from "@/components/ThemeCustomizerModal";
import { NewCalendarModal } from "@/components/NewCalendarModal";

function MainContent() {
  const { showToast } = useToast();
  const {
    selectedDate,
    setSelectedDate,
    openNewEventModal,
    openSearch,
    openShortcuts,
  } = useCalendar();
  const calendarAreaRef = useRef<CalendarAreaRef>(null);

  const handleScrollToToday = () => {
    if (calendarAreaRef.current) {
      calendarAreaRef.current.scrollToToday();
    }
  };

  useEffect(() => {
    // Initial welcome toast
    const timer = setTimeout(() => {
      showToast("Welcome back, Alex — 3 meetings left today");
    }, 600);

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      const key = e.key.toLowerCase();
      if (key === "n") {
        e.preventDefault();
        openNewEventModal();
      } else if (key === "t") {
        e.preventDefault();
        const today = new Date(2024, 10, 20); // Nov 20, 2024 demo date
        setSelectedDate(today);
        showToast("Scrolled to today");
        handleScrollToToday();
      } else if (key === "arrowleft") {
        const prevDate = new Date(selectedDate);
        prevDate.setDate(prevDate.getDate() - 7);
        setSelectedDate(prevDate);
        showToast("Jumped to previous week");
      } else if (key === "arrowright") {
        const nextDate = new Date(selectedDate);
        nextDate.setDate(nextDate.getDate() + 7);
        setSelectedDate(nextDate);
        showToast("Jumped to next week");
      } else if (key === "/") {
        e.preventDefault();
        openSearch();
      } else if (key === "?" || (e.shiftKey && key === "/")) {
        e.preventDefault();
        openShortcuts();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showToast, selectedDate, setSelectedDate, openNewEventModal, openSearch, openShortcuts]);

  return (
    <>
      <div className="atmosphere"></div>
      <div className="app-shell">
        <Sidebar />
        <div className="main-area">
          <Topbar onScrollToToday={handleScrollToToday} />
          <div className="calendar-wrap">
            <CalendarArea ref={calendarAreaRef} />
            <DetailPanel />
          </div>
        </div>
      </div>
      <NewEventModal />
      <EventDetailModal />
      <SearchModal />
      <NotificationsModal />
      <ShareModal />
      <ShortcutsModal />
      <ThemeCustomizerModal />
      <NewCalendarModal />
    </>
  );
}

export default function Home() {
  return (
    <ToastProvider>
      <ThemeProvider>
        <CalendarFilterProvider>
          <CalendarProvider>
            <MainContent />
          </CalendarProvider>
        </CalendarFilterProvider>
      </ThemeProvider>
    </ToastProvider>
  );
}
