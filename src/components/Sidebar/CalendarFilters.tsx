"use client";

import React, { useState, useRef, useEffect } from "react";
import { useCalendarFilter, CustomCalendar } from "@/context/CalendarFilterContext";
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
  const { calendars, activeCategories, toggleCategory, addCustomCalendar, removeCalendar } = useCalendarFilter();
  const { events, openTeamInvite } = useCalendar();
  const { showToast } = useToast();

  const [isCreatingInline, setIsCreatingInline] = useState(false);
  const [newCalName, setNewCalName] = useState("");
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Right click context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    calendar: CustomCalendar;
  } | null>(null);

  useEffect(() => {
    if (isCreatingInline) {
      inputRef.current?.focus();
    }
  }, [isCreatingInline]);

  // Close context menu on outside click
  useEffect(() => {
    const handleOutsideClick = () => setContextMenu(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const handleToggle = (item: CustomCalendar) => {
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

  const handleContextMenu = (e: React.MouseEvent, item: CustomCalendar) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      calendar: item,
    });
  };

  const handleDeleteCalendar = (key: string, name: string) => {
    removeCalendar(key);
    setContextMenu(null);
    showToast(`Deleted calendar "${name}"`);
  };

  return (
    <div style={{ position: "relative" }}>
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
            onContextMenu={(e) => handleContextMenu(e, item)}
            title="Click to toggle, Right-click to delete"
          >
            <div
              className={`cal-check ${isChecked ? "checked" : ""}`}
              style={{
                backgroundColor: isChecked ? item.colorVar : "var(--bg-2)",
                borderColor: isChecked ? item.colorVar : "var(--border-bright)",
                "--cal-color": item.colorVar,
              } as React.CSSProperties}
            ></div>
            <div className="cal-name">{item.name}</div>
            <div className="cal-count">{countFormatted}</div>
          </div>
        );
      })}

      {/* Context Menu Popup for Right-Click Delete */}
      {contextMenu && (
        <div
          style={{
            position: "fixed",
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
            zIndex: 9999,
            background: "var(--bg-2)",
            border: "1px solid var(--border-bright)",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6)",
            padding: "4px",
            minWidth: "140px",
            borderRadius: "4px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              padding: "6px 10px",
              fontSize: "11px",
              color: "var(--fg-3)",
              borderBottom: "1px solid var(--border)",
              fontWeight: 600,
            }}
          >
            {contextMenu.calendar.name}
          </div>
          <button
            type="button"
            onClick={() => {
              openTeamInvite(contextMenu.calendar.name);
              setContextMenu(null);
            }}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "8px 10px",
              background: "none",
              border: "none",
              color: "var(--accent)",
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: 600,
            }}
          >
            👥 Share & Team Access
          </button>
          <button
            type="button"
            onClick={() => handleToggle(contextMenu.calendar)}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "8px 10px",
              background: "none",
              border: "none",
              color: "var(--fg)",
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            👁️ Toggle Visibility
          </button>
          <button
            type="button"
            onClick={() => handleDeleteCalendar(contextMenu.calendar.key, contextMenu.calendar.name)}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "8px 10px",
              background: "none",
              border: "none",
              color: "var(--red)",
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            🗑️ Delete Calendar
          </button>
        </div>
      )}
    </div>
  );
};
