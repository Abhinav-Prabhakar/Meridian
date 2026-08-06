"use client";

import React, { useState, useRef, useEffect } from "react";
import { useCalendarFilter } from "@/context/CalendarFilterContext";
import { useCalendar } from "@/context/CalendarContext";
import { useToast } from "@/context/ToastContext";

const PALETTE = [
  { name: "Accent Lime", value: "var(--accent)", hex: "#d4ff3d" },
  { name: "Orange", value: "var(--orange)", hex: "#ff9248" },
  { name: "Cyan", value: "var(--cyan)", hex: "#5dd9d4" },
  { name: "Pink", value: "var(--pink)", hex: "#ff7ab0" },
  { name: "Yellow", value: "var(--yellow)", hex: "#ffd23f" },
  { name: "Purple", value: "#a855f7", hex: "#a855f7" },
  { name: "Blue", value: "#3b82f6", hex: "#3b82f6" },
];

export const CalendarFilters: React.FC = () => {
  const { calendars, activeCategories, toggleCategory, addCustomCalendar } = useCalendarFilter();
  const { events } = useCalendar();
  const { showToast } = useToast();

  const [isCreatingInline, setIsCreatingInline] = useState(false);
  const [newCalName, setNewCalName] = useState("");
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreatingInline) {
      inputRef.current?.focus();
    }
  }, [isCreatingInline]);

  const handleToggle = (item: { key: string; name: string }) => {
    const isVisible = toggleCategory(item.key);
    showToast(`${isVisible ? "Showing" : "Hiding"} ${item.name} calendar`);
  };

  const handleSaveInline = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCalName.trim();
    if (!trimmed) {
      setIsCreatingInline(false);
      return;
    }

    const selectedColor = PALETTE[selectedColorIndex].value;
    addCustomCalendar(trimmed, selectedColor);
    showToast(`Created calendar "${trimmed}"`);

    setNewCalName("");
    setIsCreatingInline(false);
  };

  const cycleColor = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedColorIndex((prev) => (prev + 1) % PALETTE.length);
  };

  return (
    <div>
      <div className="section-label">
        <span>My Calendars</span>
        <button
          className="add-btn"
          title="Add calendar inline"
          onClick={() => setIsCreatingInline(true)}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      {/* Inline Calendar Creation Row */}
      {isCreatingInline && (
        <form
          onSubmit={handleSaveInline}
          className="cal-item"
          style={{
            background: "var(--bg-2)",
            border: "1px solid var(--accent)",
            padding: "6px 10px",
            gap: "8px",
            marginBottom: "6px",
          }}
        >
          <button
            type="button"
            onClick={cycleColor}
            title={`Color: ${PALETTE[selectedColorIndex].name} (Click to change color)`}
            style={{
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              background: PALETTE[selectedColorIndex].hex,
              border: "1px solid rgba(255,255,255,0.4)",
              cursor: "pointer",
              flexShrink: 0,
            }}
          />
          <input
            ref={inputRef}
            type="text"
            className="form-input"
            style={{
              padding: "2px 6px",
              fontSize: "12px",
              height: "26px",
              flex: 1,
              background: "var(--bg-1)",
            }}
            placeholder="Calendar name..."
            value={newCalName}
            onChange={(e) => setNewCalName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setIsCreatingInline(false);
            }}
          />
          <button
            type="submit"
            style={{
              background: "none",
              border: "none",
              color: "var(--accent)",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "bold",
              padding: "0 2px",
            }}
            title="Save calendar"
          >
            ✓
          </button>
          <button
            type="button"
            onClick={() => setIsCreatingInline(false)}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: "12px",
              padding: "0 2px",
            }}
            title="Cancel"
          >
            ✕
          </button>
        </form>
      )}

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
