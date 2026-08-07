"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CalendarCategory } from "./CalendarFilterContext";
import { supabase } from "@/lib/supabase/client";
import { addDays, eventsForDate, formatDateStr } from "@/lib/dateUtils";
import { syncCalendarEvents } from "@/lib/bot/calendarStore";

export interface CalendarEvent {
  id: string;
  dateStr: string; // YYYY-MM-DD
  start: number; // hour (e.g. 9.5 for 9:30 AM)
  dur: number; // duration in hours
  title: string;
  cat: CalendarCategory;
  time: string; // formatted time string e.g. "09:00 — 10:00"
  allDay: boolean;
  meta?: string;
  attendees?: string[];
  recurrence?: RecurrenceRule;
  alerts?: EventAlert[];
  invitees?: EventInvitee[];
  proposals?: EventProposal[];
}

export type RecurrenceFrequency = "daily" | "weekdays" | "weekly" | "monthly";

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number;
  weekdays?: number[];
  until?: string;
  count?: number;
}

export interface EventAlert {
  id?: string;
  kind: "reminder" | "travel";
  minutesBefore: number;
  travelMinutes?: number;
}

export type InviteeResponse = "pending" | "going" | "maybe" | "declined";
export type InviteeAvailability = "unknown" | "free" | "busy";

export interface EventInvitee {
  id: string;
  email: string;
  displayName?: string;
  response: InviteeResponse;
  responseComment?: string;
  availability: InviteeAvailability;
  availabilityUpdatedAt?: string;
}

export interface EventProposal {
  id: string;
  proposerId: string;
  proposedDateStr: string;
  proposedStart: number;
  proposedDur: number;
  comment?: string;
  status: "pending" | "accepted" | "declined" | "withdrawn";
  createdAt: string;
  respondedAt?: string;
}

type EventRow = {
  id: string;
  date_str: string;
  start_hour: number | string;
  dur_hours: number | string;
  title: string;
  category: string;
  time_str: string;
  all_day: boolean | null;
  meta: string | null;
  attendees: string[] | null;
  recurrence_rule: RecurrenceRule | null;
};

type EventAlertRow = {
  id: string;
  event_id: string;
  kind: "reminder" | "travel";
  minutes_before: number;
  travel_minutes: number | null;
};

type EventInviteeRow = {
  id: string;
  event_id: string;
  email: string;
  display_name: string | null;
  response: InviteeResponse;
  response_comment: string | null;
  availability: InviteeAvailability;
  availability_updated_at: string | null;
};

type EventProposalRow = {
  id: string;
  event_id: string;
  proposer_id: string;
  proposed_date_str: string;
  proposed_start_hour: number | string;
  proposed_dur_hours: number | string;
  comment: string | null;
  status: EventProposal["status"];
  created_at: string;
  responded_at: string | null;
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
    allDay: Boolean(row.all_day),
    meta: row.meta || undefined,
    attendees: row.attendees || undefined,
    recurrence: row.recurrence_rule || undefined,
  };
}

function withEventExtras(
  event: CalendarEvent,
  alerts: EventAlertRow[],
  invitees: EventInviteeRow[],
  proposals: EventProposalRow[]
): CalendarEvent {
  const eventInvitees = invitees
    .filter((invitee) => invitee.event_id === event.id)
    .map((invitee) => ({
      id: invitee.id,
      email: invitee.email,
      displayName: invitee.display_name || undefined,
      response: invitee.response,
      responseComment: invitee.response_comment || undefined,
      availability: invitee.availability,
      availabilityUpdatedAt: invitee.availability_updated_at || undefined,
    }));

  return {
    ...event,
    alerts: alerts
      .filter((alert) => alert.event_id === event.id)
      .map((alert) => ({
        id: alert.id,
        kind: alert.kind,
        minutesBefore: alert.minutes_before,
        travelMinutes: alert.travel_minutes || undefined,
      })),
    invitees: eventInvitees,
    attendees: eventInvitees.map((invitee) => invitee.displayName || invitee.email),
    proposals: proposals
      .filter((proposal) => proposal.event_id === event.id)
      .map((proposal) => ({
        id: proposal.id,
        proposerId: proposal.proposer_id,
        proposedDateStr: proposal.proposed_date_str,
        proposedStart: Number(proposal.proposed_start_hour),
        proposedDur: Number(proposal.proposed_dur_hours),
        comment: proposal.comment || undefined,
        status: proposal.status,
        createdAt: proposal.created_at,
        respondedAt: proposal.responded_at || undefined,
      })),
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
  allDay?: boolean;
  recurrence?: RecurrenceRule;
  alerts?: EventAlert[];
  invitees?: EventInvitee[];
}

export interface EventExtrasInput {
  alerts: EventAlert[];
  invitees: Array<Pick<EventInvitee, "email" | "displayName">>;
}

interface CalendarContextType {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  miniCalMonth: Date;
  setMiniCalMonth: (date: Date) => void;
  currentView: CalendarViewMode;
  setCurrentView: (view: CalendarViewMode) => void;
  events: CalendarEvent[];
  addEvent: (event: Omit<CalendarEvent, "id">) => Promise<CalendarEvent | null>;
  updateEvent: (id: string, updated: Omit<CalendarEvent, "id">) => void;
  saveEventExtras: (eventId: string, extras: EventExtrasInput) => Promise<void>;
  updateInvitee: (eventId: string, inviteeId: string, update: Partial<Pick<EventInvitee, "response" | "responseComment" | "availability">>) => Promise<void>;
  createProposal: (eventId: string, proposal: Omit<EventProposal, "id" | "proposerId" | "createdAt" | "respondedAt" | "status">) => Promise<void>;
  respondToProposal: (eventId: string, proposalId: string, status: "accepted" | "declined") => Promise<void>;
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
  isTeamInviteOpen: boolean;
  openTeamInvite: (calName?: string) => void;
  closeTeamInvite: () => void;
  activeShareCalendar: string | null;
}

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
  addEvent: async () => null,
  updateEvent: () => {},
  saveEventExtras: async () => {},
  updateInvitee: async () => {},
  createProposal: async () => {},
  respondToProposal: async () => {},
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
  notifications: [],
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
  isTeamInviteOpen: false,
  openTeamInvite: () => {},
  closeTeamInvite: () => {},
  activeShareCalendar: null,
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
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isIntegrationsOpen, setIsIntegrationsOpen] = useState<boolean>(false);
  const [isBotChatOpen, setIsBotChatOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isTeamInviteOpen, setIsTeamInviteOpen] = useState<boolean>(false);
  const [activeShareCalendar, setActiveShareCalendar] = useState<string | null>(null);

  const loadEvents = useCallback(async (userId: string | null) => {
    if (!userId) {
      setEvents([]);
      return;
    }

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order("date_str", { ascending: true })
      .order("start_hour", { ascending: true });

    if (error) {
      console.error("Failed to load calendar events from Supabase:", error.message);
      setEvents([]);
      return;
    }

    const baseEvents = (data as EventRow[] | null)?.map(fromDatabaseEvent) || [];
    if (baseEvents.length === 0) {
      setEvents([]);
      return;
    }

    const eventIds = baseEvents.map((event) => event.id);
    const [alertsResult, inviteesResult, proposalsResult] = await Promise.all([
      supabase.from("event_alerts").select("*").in("event_id", eventIds),
      supabase.from("event_invitees").select("*").in("event_id", eventIds),
      supabase.from("event_proposals").select("*").in("event_id", eventIds).order("created_at", { ascending: false }),
    ]);

    if (alertsResult.error || inviteesResult.error || proposalsResult.error) {
      console.error("Failed to load event collaboration details:", alertsResult.error?.message || inviteesResult.error?.message || proposalsResult.error?.message);
    }

    const fullEvents = baseEvents.map((event) =>
      withEventExtras(
        event,
        (alertsResult.data as EventAlertRow[] | null) || [],
        (inviteesResult.data as EventInviteeRow[] | null) || [],
        (proposalsResult.data as EventProposalRow[] | null) || []
      )
    );
    setEvents(fullEvents);
    syncCalendarEvents(
      fullEvents.map((ev) => ({
        id: ev.id,
        dateStr: ev.dateStr,
        start: ev.start,
        dur: ev.dur,
        title: ev.title,
        cat: (["meeting", "focus", "personal", "strategy", "learning"].includes(ev.cat) ? ev.cat : "meeting") as any,
        time: ev.time,
        allDay: ev.allDay,
        meta: ev.meta || undefined,
        attendees: ev.attendees,
      }))
    );
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

    const realtimeChannel = supabase
      .channel("events_realtime_sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => {
        if (active) {
          supabase.auth.getUser().then(({ data }) => {
            if (data.user?.id) void loadEvents(data.user.id);
          });
        }
      })
      .subscribe();

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
      supabase.removeChannel(realtimeChannel);
    };
  }, [loadEvents]);

  useEffect(() => {
    const checkAlerts = () => {
      if (events.length === 0 || typeof window === "undefined") return;
      const now = new Date();
      const alertCandidates = [0, 1].flatMap((offset) => eventsForDate(events, formatDateStr(addDays(now, offset))));
      let sentValues: string[] = [];
      try {
        const stored = JSON.parse(window.localStorage.getItem("meridian_sent_alerts") || "[]");
        if (Array.isArray(stored)) sentValues = stored.filter((value): value is string => typeof value === "string");
      } catch {
        sentValues = [];
      }
      const sent = new Set<string>(sentValues);
      const newlyTriggered: NotificationItem[] = [];

      alertCandidates.forEach((event) => {
        if (event.allDay || !event.alerts?.length) return;
        const eventStart = new Date(`${event.dateStr}T00:00:00`);
        eventStart.setMinutes(event.start * 60);
        event.alerts.forEach((alert) => {
          const alertTime = new Date(eventStart.getTime() - alert.minutesBefore * 60000);
          const alertId = `${event.id}-${event.dateStr}-${alert.kind}`;
          if (now >= alertTime && now < new Date(eventStart.getTime() + 60000) && !sent.has(alertId)) {
            const label = alert.kind === "travel" ? `Leave for ${event.title}` : event.title;
            newlyTriggered.push({ id: alertId, title: label, time: alert.kind === "travel" ? `${alert.travelMinutes || alert.minutesBefore} min travel buffer` : `Reminder · ${event.time}`, read: false, type: "reminder" });
            sent.add(alertId);
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification(label, { body: alert.kind === "travel" ? "It is time to leave." : event.time });
            }
          }
        });
      });

      if (newlyTriggered.length > 0) {
        window.localStorage.setItem("meridian_sent_alerts", JSON.stringify(Array.from(sent).slice(-200)));
        setNotifications((current) => [...newlyTriggered, ...current].slice(0, 50));
      }
    };

    checkAlerts();
    const interval = window.setInterval(checkAlerts, 30000);
    return () => window.clearInterval(interval);
  }, [events]);

  const addEvent = useCallback(async (newEvent: Omit<CalendarEvent, "id">) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;

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
        all_day: newEvent.allDay,
        meta: newEvent.meta,
        attendees: newEvent.attendees,
        recurrence_rule: newEvent.recurrence || null,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Failed to add calendar event to Supabase:", error.message);
      return null;
    }
    const createdEvent = withEventExtras(fromDatabaseEvent(data as EventRow), [], [], []);
    setEvents((prev) => [...prev, createdEvent]);
    return createdEvent;
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
        all_day: updated.allDay,
        meta: updated.meta,
        attendees: updated.attendees,
        recurrence_rule: updated.recurrence || null,
      })
      .eq("id", id)
      .eq("user_id", userData.user.id);

    if (error) {
      console.error("Failed to update calendar event in Supabase:", error.message);
      return;
    }
    setEvents((prev) => prev.map((ev) => (ev.id === id ? { ...updated, id } : ev)));
  }, []);

  const saveEventExtras = useCallback(async (eventId: string, extras: EventExtrasInput) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { error: alertDeleteError } = await supabase.from("event_alerts").delete().eq("event_id", eventId);
    const { error: inviteeDeleteError } = await supabase.from("event_invitees").delete().eq("event_id", eventId);
    if (alertDeleteError || inviteeDeleteError) {
      console.error("Failed to replace event collaboration details:", alertDeleteError?.message || inviteeDeleteError?.message);
      return;
    }

    if (extras.alerts.length > 0) {
      const { error } = await supabase.from("event_alerts").insert(
        extras.alerts.map((alert) => ({
          event_id: eventId,
          user_id: userData.user.id,
          kind: alert.kind,
          minutes_before: alert.minutesBefore,
          travel_minutes: alert.travelMinutes ?? null,
        }))
      );
      if (error) console.error("Failed to save event alerts:", error.message);
    }

    const invitees = extras.invitees
      .map((invitee) => ({
        event_id: eventId,
        organizer_id: userData.user.id,
        email: invitee.email.trim().toLowerCase(),
        display_name: invitee.displayName?.trim() || null,
      }))
      .filter((invitee, index, all) => invitee.email && all.findIndex((item) => item.email === invitee.email) === index);

    if (invitees.length > 0) {
      const { error } = await supabase.from("event_invitees").insert(invitees);
      if (error) console.error("Failed to save event invitees:", error.message);
    }

    const { data: alertRows } = await supabase.from("event_alerts").select("*").eq("event_id", eventId);
    const { data: inviteeRows } = await supabase.from("event_invitees").select("*").eq("event_id", eventId);
    setEvents((prev) =>
      prev.map((event) =>
        event.id === eventId
          ? withEventExtras(event, (alertRows as EventAlertRow[]) || [], (inviteeRows as EventInviteeRow[]) || [], event.proposals ? event.proposals.map((proposal) => ({
              id: proposal.id,
              event_id: eventId,
              proposer_id: proposal.proposerId,
              proposed_date_str: proposal.proposedDateStr,
              proposed_start_hour: proposal.proposedStart,
              proposed_dur_hours: proposal.proposedDur,
              comment: proposal.comment || null,
              status: proposal.status,
              created_at: proposal.createdAt,
              responded_at: proposal.respondedAt || null,
            })) : [])
          : event
      )
    );
  }, []);

  const updateInvitee = useCallback(async (eventId: string, inviteeId: string, update: Partial<Pick<EventInvitee, "response" | "responseComment" | "availability">>) => {
    const payload = {
      ...(update.response ? { response: update.response } : {}),
      ...(update.responseComment !== undefined ? { response_comment: update.responseComment || null } : {}),
      ...(update.availability ? { availability: update.availability, availability_updated_at: new Date().toISOString() } : {}),
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("event_invitees").update(payload).eq("id", inviteeId).eq("event_id", eventId);
    if (error) {
      console.error("Failed to update invitee:", error.message);
      return;
    }
    setEvents((prev) => prev.map((event) => event.id !== eventId ? event : {
      ...event,
      invitees: event.invitees?.map((invitee) => invitee.id === inviteeId ? {
        ...invitee,
        ...update,
        availabilityUpdatedAt: update.availability ? new Date().toISOString() : invitee.availabilityUpdatedAt,
      } : invitee),
    }));
  }, []);

  const createProposal = useCallback(async (eventId: string, proposal: Omit<EventProposal, "id" | "proposerId" | "createdAt" | "respondedAt" | "status">) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { data, error } = await supabase.from("event_proposals").insert({
      event_id: eventId,
      proposer_id: userData.user.id,
      proposed_date_str: proposal.proposedDateStr,
      proposed_start_hour: proposal.proposedStart,
      proposed_dur_hours: proposal.proposedDur,
      comment: proposal.comment || null,
    }).select("*").single();
    if (error) {
      console.error("Failed to create time proposal:", error.message);
      return;
    }
    const created = data as EventProposalRow;
    setEvents((prev) => prev.map((event) => event.id !== eventId ? event : {
      ...event,
      proposals: [{
        id: created.id,
        proposerId: created.proposer_id,
        proposedDateStr: created.proposed_date_str,
        proposedStart: Number(created.proposed_start_hour),
        proposedDur: Number(created.proposed_dur_hours),
        comment: created.comment || undefined,
        status: created.status,
        createdAt: created.created_at,
      }, ...(event.proposals || [])],
    }));
  }, []);

  const respondToProposal = useCallback(async (eventId: string, proposalId: string, status: "accepted" | "declined") => {
    const { data: proposal, error: proposalError } = await supabase.from("event_proposals").select("*").eq("id", proposalId).eq("event_id", eventId).single();
    if (proposalError || !proposal) {
      console.error("Failed to load time proposal:", proposalError?.message);
      return;
    }

    const respondedAt = new Date().toISOString();
    const { error } = await supabase.from("event_proposals").update({ status, responded_at: respondedAt }).eq("id", proposalId).eq("event_id", eventId);
    if (error) {
      console.error("Failed to respond to time proposal:", error.message);
      return;
    }

    let eventUpdate: Partial<CalendarEvent> = {};
    if (status === "accepted") {
      const start = Number((proposal as EventProposalRow).proposed_start_hour);
      const dur = Number((proposal as EventProposalRow).proposed_dur_hours);
      const formatTime = (hour: number) => `${String(Math.floor(hour)).padStart(2, "0")}:${hour % 1 ? "30" : "00"}`;
      eventUpdate = {
        dateStr: (proposal as EventProposalRow).proposed_date_str,
        start,
        dur,
        time: `${formatTime(start)} — ${formatTime(start + dur)}`,
      };
      const { error: eventError } = await supabase.from("events").update({
        date_str: eventUpdate.dateStr,
        start_hour: eventUpdate.start,
        dur_hours: eventUpdate.dur,
        time_str: eventUpdate.time,
      }).eq("id", eventId);
      if (eventError) {
        console.error("Failed to apply accepted proposal:", eventError.message);
        return;
      }
    }

    setEvents((prev) => prev.map((event) => event.id !== eventId ? event : {
      ...event,
      ...eventUpdate,
      proposals: event.proposals?.map((item) => item.id === proposalId ? { ...item, status, respondedAt } : item),
    }));
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
        saveEventExtras,
        updateInvitee,
        createProposal,
        respondToProposal,
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
        isTeamInviteOpen,
        openTeamInvite: (calName?: string) => {
          if (calName) setActiveShareCalendar(calName);
          setIsTeamInviteOpen(true);
        },
        closeTeamInvite: () => setIsTeamInviteOpen(false),
        activeShareCalendar,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
};
