"use client";

import React from "react";
import { useCalendarFilter } from "@/context/CalendarFilterContext";
import { useCalendar } from "@/context/CalendarContext";
import { useToast } from "@/context/ToastContext";

export const CalendarFilters: React.FC = () => {
  const { calendars, activeCategories, toggleCategory, openAddCalendarModal } = useCalendarFilter();
  const { events } = useCalendar();
  const { showToast } = useToast();

  const handleToggle = (item: { key: string; name: string }) => {
    const isVisible = toggleCategory(item.key);
    showToast(`${isVisible ? "Showing" : "Hiding"} ${item.name} calendar`);
  };

  return (
    <div>
      <div className="section-label">
        <span>My Calendars</span>
        <button
          className="add-btn"
          title="Add new calendar"
          onClick={openAddCalendarModal}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
      {calendars.map((item) => {
        const isChecked = activeCategories[item.key] !== false;
        const count = events.filter((e) => e.cat === item.key).length;
        const countFormatted = String(count).padStart(2, "0");

        return (
          <div
            key={item.key}
            className="cal-item"
            data-cal={item.key}
            onClick={() => handleToggle(item)}
          >
            <div
              className={`cal-check ${isChecked ? "checked" : ""}`}
              style={{ "--cal-color": item.colorVar } as React.CSSProperties}
            ></div>
            <div className="cal-name">{item.name}</div>
            <div className="cal-count">{countFormatted}</div>
          </div>
        );
      })}
    </div>
  );
};
