"use client";

import React from "react";
import { Brand } from "./Brand";
import { MiniCalendar } from "./MiniCalendar";
import { CalendarFilters } from "./CalendarFilters";
import { UserCard } from "./UserCard";
import { useCalendar } from "@/context/CalendarContext";

export const Sidebar: React.FC = () => {
  const { openNewEventModal } = useCalendar();

  return (
    <aside className="sidebar fade-up">
      <Brand />

      <button
        className="new-event-btn"
        onClick={() => openNewEventModal()}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span>New Event</span>
        <kbd>N</kbd>
      </button>

      <MiniCalendar />
      <CalendarFilters />
      <UserCard />
    </aside>
  );
};
