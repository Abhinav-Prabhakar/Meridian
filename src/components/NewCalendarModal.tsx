"use client";

import React, { useState } from "react";
import { useCalendarFilter } from "@/context/CalendarFilterContext";
import { useToast } from "@/context/ToastContext";

const colorPresets = [
  { name: "Lime Accent", value: "var(--accent)" },
  { name: "Neon Orange", value: "var(--orange)" },
  { name: "Cyber Cyan", value: "var(--cyan)" },
  { name: "Hot Pink", value: "var(--pink)" },
  { name: "Electric Gold", value: "var(--yellow)" },
  { name: "Purple", value: "#a855f7" },
  { name: "Emerald Green", value: "#10b981" },
];

export const NewCalendarModal: React.FC = () => {
  const { isAddCalendarOpen, closeAddCalendarModal, addCustomCalendar } = useCalendarFilter();
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState("var(--accent)");

  if (!isAddCalendarOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Please enter a calendar name");
      return;
    }
    addCustomCalendar(name.trim(), selectedColor);
    showToast(`Created new calendar: ${name.trim()}`);
    setName("");
    closeAddCalendarModal();
  };

  return (
    <div className="modal-overlay" onClick={closeAddCalendarModal}>
      <div
        className="modal-content"
        style={{ maxWidth: "400px", padding: "24px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header" style={{ marginBottom: "16px" }}>
          <h2 className="modal-title" style={{ fontSize: "18px" }}>
            Add New Calendar
          </h2>
          <button className="modal-close" onClick={closeAddCalendarModal}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Calendar Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Side Projects, Fitness, Family"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Calendar Color</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
              {colorPresets.map((preset) => {
                const isSelected = selectedColor === preset.value;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    style={{
                      height: "32px",
                      background: "var(--bg-2)",
                      border: isSelected ? `2px solid var(--fg)` : "1px solid var(--border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                    onClick={() => setSelectedColor(preset.value)}
                  >
                    <span
                      style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        background: preset.value,
                      }}
                    ></span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="modal-actions" style={{ marginTop: "16px" }}>
            <button type="button" className="btn-cancel" onClick={closeAddCalendarModal}>
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              Create Calendar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
