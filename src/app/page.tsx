"use client";

import React, { useRef, useEffect } from "react";
import { ToastProvider, useToast } from "@/context/ToastContext";
import { CalendarFilterProvider } from "@/context/CalendarFilterContext";
import { CalendarProvider, useCalendar } from "@/context/CalendarContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
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
import { WeeklyReportModal } from "@/components/WeeklyReportModal";
import { IntegrationsModal } from "@/components/IntegrationsModal";
import { BotChatDrawer } from "@/components/BotChatDrawer";

function MainContent() {
  const { showToast } = useToast();
  const {
    selectedDate,
    setSelectedDate,
    setCurrentView,
    openNewEventModal,
    closeNewEventModal,
    openSearch,
    closeSearch,
    openShortcuts,
    closeShortcuts,
    closeEventDetails,
    closeNotifications,
    openShare,
    closeShare,
    openReport,
    closeReport,
    closeIntegrations,
    closeBotChat,
    openBotChat,
    openIntegrations,
  } = useCalendar();
  const { openThemeModal, closeThemeModal } = useTheme();

  const calendarAreaRef = useRef<CalendarAreaRef>(null);

  const handleScrollToToday = () => {
    if (calendarAreaRef.current) {
      calendarAreaRef.current.scrollToToday();
    }
  };

  useEffect(() => {
    // Initial welcome toast
    const timer = setTimeout(() => {
      showToast("Welcome back, Alex — Caspian Bot ready on Telegram & Web");
    }, 600);

    // Comprehensive professional keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        if (e.key === "Escape") {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      const key = e.key.toLowerCase();

      if (key === "escape") {
        closeNewEventModal();
        closeEventDetails();
        closeSearch();
        closeNotifications();
        closeShare();
        closeShortcuts();
        closeThemeModal();
        closeReport();
        closeIntegrations();
        closeBotChat();
      } else if (key === "n" || key === "c") {
        e.preventDefault();
        openNewEventModal();
      } else if (key === "b") {
        e.preventDefault();
        openBotChat();
      } else if (key === "i") {
        e.preventDefault();
        openIntegrations();
      } else if (key === "t") {
        e.preventDefault();
        const today = new Date(2024, 10, 20); // Nov 20, 2024 demo date
        setSelectedDate(today);
        showToast("Scrolled to today");
        handleScrollToToday();
      } else if (key === "w") {
        e.preventDefault();
        setCurrentView("week");
        showToast("Switched to Week view");
      } else if (key === "d") {
        e.preventDefault();
        setCurrentView("day");
        showToast("Switched to Day view");
      } else if (key === "m") {
        e.preventDefault();
        setCurrentView("month");
        showToast("Switched to Month view");
      } else if (key === "a") {
        e.preventDefault();
        setCurrentView("agenda");
        showToast("Switched to Agenda view");
      } else if (key === "e") {
        e.preventDefault();
        openShare();
      } else if (key === "r") {
        e.preventDefault();
        openReport();
      } else if (key === "p") {
        e.preventDefault();
        openThemeModal();
      } else if (key === "j" || key === "arrowleft") {
        e.preventDefault();
        const prevDate = new Date(selectedDate);
        prevDate.setDate(prevDate.getDate() - 7);
        setSelectedDate(prevDate);
        showToast("Jumped to previous period");
      } else if (key === "k" || key === "arrowright") {
        e.preventDefault();
        const nextDate = new Date(selectedDate);
        nextDate.setDate(nextDate.getDate() + 7);
        setSelectedDate(nextDate);
        showToast("Jumped to next period");
      } else if (key === "/" || key === "s") {
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
  }, [
    showToast,
    selectedDate,
    setSelectedDate,
    setCurrentView,
    openNewEventModal,
    closeNewEventModal,
    openSearch,
    closeSearch,
    openShortcuts,
    closeShortcuts,
    closeEventDetails,
    closeNotifications,
    openShare,
    closeShare,
    openReport,
    closeReport,
    closeIntegrations,
    closeBotChat,
    openBotChat,
    openIntegrations,
    openThemeModal,
    closeThemeModal,
  ]);

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
      <WeeklyReportModal />
      <IntegrationsModal />
      <BotChatDrawer />
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
