"use client";

import React from "react";
import { useCalendar, CalendarViewMode } from "@/context/CalendarContext";
import { useToast } from "@/context/ToastContext";

interface TopbarProps {
  onScrollToToday?: () => void;
}

const monthShortNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const monthFullNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export const Topbar: React.FC<TopbarProps> = ({ onScrollToToday }) => {
  const {
    selectedDate,
    setSelectedDate,
    currentView,
    setCurrentView,
    openSearch,
    openNotifications,
    openShare,
    openBotChat,
    openIntegrations,
    notifications,
  } = useCalendar();
  const { showToast } = useToast();

  const year = selectedDate.getFullYear();
  const monthName = monthFullNames[selectedDate.getMonth()];

  const monday = new Date(selectedDate);
  const dayOfWeek = (monday.getDay() + 6) % 7; // Mon = 0
  monday.setDate(monday.getDate() - dayOfWeek);

  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);

  const monMonthStr = monthShortNames[monday.getMonth()];
  const sunMonthStr = monthShortNames[sunday.getMonth()];
  const rangeStr =
    monMonthStr === sunMonthStr
      ? `${monMonthStr} ${monday.getDate()} — ${sunday.getDate()}`
      : `${monMonthStr} ${monday.getDate()} — ${sunMonthStr} ${sunday.getDate()}`;
  const weekNum = getWeekNumber(selectedDate);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleChangeWeek = (dir: number) => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + dir * (currentView === "day" ? 1 : 7));
    setSelectedDate(nextDate);
    showToast(dir > 0 ? "Jumped forward" : "Jumped backward");
  };

  const handleResetToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setSelectedDate(today);
    showToast("Scrolled to today");
    if (onScrollToToday) {
      onScrollToToday();
    }
  };

  const handleSwitchView = (view: CalendarViewMode) => {
    setCurrentView(view);
    showToast(`Switched to ${view} view`);
  };

  return (
    <header className="topbar fade-up fade-up-1">
      <div className="topbar-left">
        <h1 className="month-title">
          {monthName} <span className="year">{year}</span>
        </h1>
        <div className="week-range">
          {rangeStr} · WK {weekNum}
        </div>
      </div>

      <div className="topbar-nav">
        <button
          className="nav-btn"
          onClick={() => handleChangeWeek(-1)}
          title="Previous period"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <button className="today-btn" onClick={handleResetToday}>
          Today
        </button>
        <button
          className="nav-btn"
          onClick={() => handleChangeWeek(1)}
          title="Next period"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <div className="topbar-right">
        <div className="view-switcher">
          {(["day", "week", "month", "agenda"] as const).map((view) => (
            <button
              key={view}
              className={currentView === view ? "active" : ""}
              onClick={() => handleSwitchView(view)}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>
        <button className="icon-btn" title="AI Assistant (B)" onClick={openBotChat} style={{ color: "var(--accent)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="8" width="16" height="12" rx="2" />
            <path d="M12 8V4" />
            <circle cx="12" cy="3" r="1.5" />
            <circle cx="9.5" cy="13" r="1" fill="currentColor" stroke="none" />
            <circle cx="14.5" cy="13" r="1" fill="currentColor" stroke="none" />
            <path d="M9.5 17h5" />
          </svg>
        </button>
        <button className="icon-btn" title="App Integrations (Telegram/Caspian)" onClick={openIntegrations}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </button>
        <button className="icon-btn" title="Search (/)" onClick={openSearch}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </button>
        <button className="icon-btn" title="Notifications" onClick={openNotifications}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadCount > 0 && <span className="badge"></span>}
        </button>
        <button className="share-btn" onClick={openShare}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          Share
        </button>
      </div>
    </header>
  );
};
