"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CalendarCategory } from "./CalendarFilterContext";
import { supabase } from "@/lib/supabase/client";

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

type EventRow = {
  id: string;
  date_str: string;
  start_hour: number | string;
  dur_hours: number | string;
  title: string;
  category: string;
  time_str: string;
  meta: string | null;
  attendees: string[] | null;
};

function fromDatabaseEvent(row: EventRow): CalendarEvent {
  return {
    id: row.id,
    dateStr: row.date_str,
    start: Number(row.start_hour),
    dur: Number(row.dur_hours),
    title: row.title,
    cat: row.category,
    time: row.time_str,
    meta: row.meta || undefined,
    attendees: row.attendees || undefined,
  };
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
  isMobileSidebarOpen: boolean;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;
}

const seedNotifications: NotificationItem[] = [
  { id: "n1", title: "Architecture Review starting in 18 minutes", time: "14:42", read: false, type: "upcoming" },
  { id: "n2", title: "Marcus marked OOO (AM) for Nov 19", time: "09:15", read: false, type: "reminder" },
  { id: "n3", title: "Company Off-site scheduled for Friday", time: "Yesterday", read: true, type: "system" },
];

const INITIAL_DATE = new Date();
INITIAL_DATE.setHours(0, 0, 0, 0);
const CalendarContext = createContext<CalendarContextType>({
  selectedDate: INITIAL_DATE,
  setSelectedDate: () => {},
  miniCalMonth: INITIAL_DATE,
  setMiniCalMonth: () => {},
  currentView: "week",
  setCurrentView: () => {},
  events: [],
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
  isIntegrationsOpen: false,
  openIntegrations: () => {},
  closeIntegrations: () => {},
  isBotChatOpen: false,
  openBotChat: () => {},
  closeBotChat: () => {},
  toggleBotChat: () => {},
  isMobileSidebarOpen: false,
  toggleMobileSidebar: () => {},
  closeMobileSidebar: () => {},
});

export const useCalendar = () => useContext(CalendarContext);

export const CalendarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date(INITIAL_DATE));
  const [miniCalMonth, setMiniCalMonth] = useState<Date>(() => new Date(INITIAL_DATE));
  const [currentView, setCurrentView] = useState<CalendarViewMode>("week");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const loadEvents = useCallback(async (userId: string | null) => {
    if (!userId) {
      setEvents([]);
      return;
    }

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", userId)
      .order("date_str", { ascending: true })
      .order("start_hour", { ascending: true });

    if (error) {
      console.error("Failed to load calendar events from Supabase:", error.message);
      setEvents([]);
      return;
    }

    setEvents((data as EventRow[] | null)?.map(fromDatabaseEvent) || []);
  }, []);

  useEffect(() => {
    let active = true;

    const loadCurrentUserEvents = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!active) return;
      if (error) {
        console.error("Failed to resolve the Supabase user:", error.message);
        setEvents([]);
        return;
      }
      await loadEvents(data.user?.id || null);
    };

    void loadCurrentUserEvents();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) void loadEvents(session?.user.id || null);
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [loadEvents]);

  const addEvent = useCallback(async (newEvent: Omit<CalendarEvent, "id">) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data, error } = await supabase
      .from("events")
      .insert({
        user_id: userData.user.id,
        date_str: newEvent.dateStr,
        start_hour: newEvent.start,
        dur_hours: newEvent.dur,
        title: newEvent.title,
        category: newEvent.cat,
        time_str: newEvent.time,
        meta: newEvent.meta,
        attendees: newEvent.attendees,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Failed to add calendar event to Supabase:", error.message);
      return;
    }
    setEvents((prev) => [...prev, fromDatabaseEvent(data as EventRow)]);
  }, []);

  const updateEvent = useCallback(async (id: string, updated: Omit<CalendarEvent, "id">) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { error } = await supabase
      .from("events")
      .update({
        date_str: updated.dateStr,
        start_hour: updated.start,
        dur_hours: updated.dur,
        title: updated.title,
        category: updated.cat,
        time_str: updated.time,
        meta: updated.meta,
        attendees: updated.attendees,
      })
      .eq("id", id)
      .eq("user_id", userData.user.id);

    if (error) {
      console.error("Failed to update calendar event in Supabase:", error.message);
      return;
    }
    setEvents((prev) => prev.map((ev) => (ev.id === id ? { ...updated, id } : ev)));
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", id)
      .eq("user_id", userData.user.id);

    if (error) {
      console.error("Failed to delete calendar event from Supabase:", error.message);
      return;
    }
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
        isMobileSidebarOpen,
        toggleMobileSidebar: () => setIsMobileSidebarOpen((prev) => !prev),
        closeMobileSidebar: () => setIsMobileSidebarOpen(false),
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
};
