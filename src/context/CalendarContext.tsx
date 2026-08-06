"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CalendarCategory } from "./CalendarFilterContext";

export interface CalendarEvent {
  id: string;
  dateStr: string; // YYYY-MM-DD
  start: number; // hour (e.g. 9.5 for 9:30 AM)
  dur: number; // duration in hours
  title: string;
  cat: CalendarCategory;
  time: string; // formatted time string e.g. "09:00 — 10:00"
  meta?: string;
  attendees?: string[];
}

export interface NotificationItem {
  id: string;
  title: string;
  time: string;
  read: boolean;
  type: "upcoming" | "reminder" | "system";
}

export type CalendarViewMode = "day" | "week" | "month" | "agenda";

export interface NewEventInitialData {
  id?: string;
  dateStr?: string;
  startHour?: number;
  dur?: number;
  title?: string;
  cat?: CalendarCategory;
  meta?: string;
}

interface CalendarContextType {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  miniCalMonth: Date;
  setMiniCalMonth: (date: Date) => void;
  currentView: CalendarViewMode;
  setCurrentView: (view: CalendarViewMode) => void;
  events: CalendarEvent[];
  addEvent: (event: Omit<CalendarEvent, "id">) => void;
  updateEvent: (id: string, updated: Omit<CalendarEvent, "id">) => void;
  deleteEvent: (id: string) => void;
  isNewEventOpen: boolean;
  openNewEventModal: (initialData?: NewEventInitialData) => void;
  closeNewEventModal: () => void;
  newEventInitialData: NewEventInitialData | null;
  viewingEvent: CalendarEvent | null;
  openEventDetails: (event: CalendarEvent) => void;
  closeEventDetails: () => void;
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  notifications: NotificationItem[];
  isNotificationsOpen: boolean;
  openNotifications: () => void;
  closeNotifications: () => void;
  clearNotifications: () => void;
  markNotificationsRead: () => void;
  isShareOpen: boolean;
  openShare: () => void;
  closeShare: () => void;
  isShortcutsOpen: boolean;
  openShortcuts: () => void;
  closeShortcuts: () => void;
  isReportOpen: boolean;
  openReport: () => void;
  closeReport: () => void;
  isIntegrationsOpen: boolean;
  openIntegrations: () => void;
  closeIntegrations: () => void;
  isBotChatOpen: boolean;
  openBotChat: () => void;
  closeBotChat: () => void;
  toggleBotChat: () => void;
}

const seedEvents: CalendarEvent[] = [
  // Monday Nov 18
  { id: "1", dateStr: "2024-11-18", start: 9, dur: 1, title: "Q4 Strategy Review", cat: "strategy", time: "09:00 — 10:00", meta: "Conf Room A · 6 people", attendees: ["SC", "MR", "JD", "KP", "TB", "+2"] },
  { id: "2", dateStr: "2024-11-18", start: 11, dur: 0.5, title: "Daily Standup", cat: "meeting", time: "11:00 — 11:30", meta: "Engineering" },
  { id: "3", dateStr: "2024-11-18", start: 14, dur: 1, title: "Design Review", cat: "focus", time: "14:00 — 15:00", meta: "with Sarah Chen" },
  { id: "4", dateStr: "2024-11-18", start: 16, dur: 1.5, title: "Sprint Planning", cat: "meeting", time: "16:00 — 17:30", meta: "Product · 8 people" },

  // Tuesday Nov 19
  { id: "5", dateStr: "2024-11-19", start: 8.5, dur: 1, title: "1:1 with Marcus", cat: "meeting", time: "08:30 — 09:30", meta: "Bi-weekly sync" },
  { id: "6", dateStr: "2024-11-19", start: 10, dur: 2, title: "Investor Sync — Series B", cat: "strategy", time: "10:00 — 12:00", meta: "Sequoia · 4 people" },
  { id: "7", dateStr: "2024-11-19", start: 13, dur: 1, title: "Product Workshop", cat: "focus", time: "13:00 — 14:00", meta: "Q1 Roadmap" },
  { id: "8", dateStr: "2024-11-19", start: 15.5, dur: 1, title: "Customer Interview", cat: "meeting", time: "15:30 — 16:30", meta: "Acme · Discovery" },

  // Wednesday Nov 20 (today)
  { id: "9", dateStr: "2024-11-20", start: 9, dur: 0.5, title: "Daily Standup", cat: "meeting", time: "09:00 — 09:30", meta: "Engineering" },
  { id: "10", dateStr: "2024-11-20", start: 10.5, dur: 1.5, title: "User Research Debrief", cat: "focus", time: "10:30 — 12:00", meta: "Research · 5 people", attendees: ["EM", "JK", "PT", "LR", "+1"] },
  { id: "11", dateStr: "2024-11-20", start: 13, dur: 1, title: "Lunch with Elena", cat: "personal", time: "13:00 — 14:00", meta: "Cafe Rouge" },
  { id: "12", dateStr: "2024-11-20", start: 15, dur: 1, title: "Architecture Review", cat: "focus", time: "15:00 — 16:00", meta: "Platform · 6 people", attendees: ["SC", "MR", "JD", "+3"] },
  { id: "13", dateStr: "2024-11-20", start: 16, dur: 0.5, title: "1:1 with Priya", cat: "meeting", time: "16:00 — 16:30", meta: "Weekly sync" },
  { id: "14", dateStr: "2024-11-20", start: 17, dur: 1, title: "Team Happy Hour", cat: "personal", time: "17:00 — 18:00", meta: "The Rooftop" },

  // Thursday Nov 21
  { id: "15", dateStr: "2024-11-21", start: 9, dur: 1, title: "Coffee with David", cat: "personal", time: "09:00 — 10:00", meta: "Blue Bottle" },
  { id: "16", dateStr: "2024-11-21", start: 11, dur: 1, title: "Q4 Budget Planning", cat: "strategy", time: "11:00 — 12:00", meta: "CFO Office" },
  { id: "17", dateStr: "2024-11-21", start: 14, dur: 1.5, title: "Customer Demo — Acme", cat: "meeting", time: "14:00 — 15:30", meta: "Zoom · 12 people" },
  { id: "18", dateStr: "2024-11-21", start: 16, dur: 1, title: "1:1 with Priya Shah", cat: "meeting", time: "16:00 — 17:00", meta: "Weekly sync" },

  // Friday Nov 22
  { id: "19", dateStr: "2024-11-22", start: 9, dur: 1, title: "Weekly Review", cat: "strategy", time: "09:00 — 10:00", meta: "Leadership · 6 people" },
  { id: "20", dateStr: "2024-11-22", start: 11, dur: 1.5, title: "Roadmap Workshop", cat: "focus", time: "11:00 — 12:30", meta: "Product + Eng" },
  { id: "21", dateStr: "2024-11-22", start: 14, dur: 1, title: "All-hands Meeting", cat: "meeting", time: "14:00 — 15:00", meta: "Company-wide" },

  // Saturday Nov 23
  { id: "22", dateStr: "2024-11-23", start: 10, dur: 2, title: "Brunch + Run", cat: "personal", time: "10:00 — 12:00", meta: "Marina Side" },
];

const seedNotifications: NotificationItem[] = [
  { id: "n1", title: "Architecture Review starting in 18 minutes", time: "14:42", read: false, type: "upcoming" },
  { id: "n2", title: "Marcus marked OOO (AM) for Nov 19", time: "09:15", read: false, type: "reminder" },
  { id: "n3", title: "Company Off-site scheduled for Friday", time: "Yesterday", read: true, type: "system" },
];

const INITIAL_DATE = new Date(2024, 10, 20);
const STORAGE_KEY = "meridian_events_v1";

const CalendarContext = createContext<CalendarContextType>({
  selectedDate: INITIAL_DATE,
  setSelectedDate: () => {},
  miniCalMonth: INITIAL_DATE,
  setMiniCalMonth: () => {},
  currentView: "week",
  setCurrentView: () => {},
  events: seedEvents,
  addEvent: () => {},
  updateEvent: () => {},
  deleteEvent: () => {},
  isNewEventOpen: false,
  openNewEventModal: () => {},
  closeNewEventModal: () => {},
  newEventInitialData: null,
  viewingEvent: null,
  openEventDetails: () => {},
  closeEventDetails: () => {},
  isSearchOpen: false,
  openSearch: () => {},
  closeSearch: () => {},
  notifications: seedNotifications,
  isNotificationsOpen: false,
  openNotifications: () => {},
  closeNotifications: () => {},
  clearNotifications: () => {},
  markNotificationsRead: () => {},
  isShareOpen: false,
  openShare: () => {},
  closeShare: () => {},
  isShortcutsOpen: false,
  openShortcuts: () => {},
  closeShortcuts: () => {},
  isReportOpen: false,
  openReport: () => {},
  closeReport: () => {},
});

export const useCalendar = () => useContext(CalendarContext);

export const CalendarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(INITIAL_DATE);
  const [miniCalMonth, setMiniCalMonth] = useState<Date>(INITIAL_DATE);
  const [currentView, setCurrentView] = useState<CalendarViewMode>("week");
  const [events, setEvents] = useState<CalendarEvent[]>(seedEvents);
  const [isNewEventOpen, setIsNewEventOpen] = useState<boolean>(false);
  const [newEventInitialData, setNewEventInitialData] = useState<NewEventInitialData | null>(null);
  const [viewingEvent, setViewingEvent] = useState<CalendarEvent | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(seedNotifications);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isIntegrationsOpen, setIsIntegrationsOpen] = useState<boolean>(false);
  const [isBotChatOpen, setIsBotChatOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEvents(parsed);
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch {
      // Ignore
    }
  }, [events]);

  const addEvent = useCallback((newEvent: Omit<CalendarEvent, "id">) => {
    const id = Date.now().toString();
    setEvents((prev) => [...prev, { ...newEvent, id }]);
  }, []);

  const updateEvent = useCallback((id: string, updated: Omit<CalendarEvent, "id">) => {
    setEvents((prev) => prev.map((ev) => (ev.id === id ? { ...updated, id } : ev)));
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((ev) => ev.id !== id));
  }, []);

  const openNewEventModal = useCallback((initialData?: NewEventInitialData) => {
    setNewEventInitialData(initialData || null);
    setIsNewEventOpen(true);
  }, []);

  const closeNewEventModal = useCallback(() => {
    setIsNewEventOpen(false);
    setNewEventInitialData(null);
  }, []);

  const openEventDetails = useCallback((event: CalendarEvent) => {
    setViewingEvent(event);
  }, []);

  const closeEventDetails = useCallback(() => {
    setViewingEvent(null);
  }, []);

  return (
    <CalendarContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
        miniCalMonth,
        setMiniCalMonth,
        currentView,
        setCurrentView,
        events,
        addEvent,
        updateEvent,
        deleteEvent,
        isNewEventOpen,
        openNewEventModal,
        closeNewEventModal,
        newEventInitialData,
        viewingEvent,
        openEventDetails,
        closeEventDetails,
        isSearchOpen,
        openSearch: () => setIsSearchOpen(true),
        closeSearch: () => setIsSearchOpen(false),
        notifications,
        isNotificationsOpen,
        openNotifications: () => setIsNotificationsOpen(true),
        closeNotifications: () => setIsNotificationsOpen(false),
        clearNotifications: () => setNotifications([]),
        markNotificationsRead: () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))),
        isShareOpen,
        openShare: () => setIsShareOpen(true),
        closeShare: () => setIsShareOpen(false),
        isShortcutsOpen,
        openShortcuts: () => setIsShortcutsOpen(true),
        closeShortcuts: () => setIsShortcutsOpen(false),
        isReportOpen,
        openReport: () => setIsReportOpen(true),
        closeReport: () => setIsReportOpen(false),
        isIntegrationsOpen,
        openIntegrations: () => setIsIntegrationsOpen(true),
        closeIntegrations: () => setIsIntegrationsOpen(false),
        isBotChatOpen,
        openBotChat: () => setIsBotChatOpen(true),
        closeBotChat: () => setIsBotChatOpen(false),
        toggleBotChat: () => setIsBotChatOpen((prev) => !prev),
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
};
