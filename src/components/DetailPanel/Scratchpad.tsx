"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/context/ToastContext";

const STORAGE_KEY = "meridian_scratchpad_v1";

export const Scratchpad: React.FC = () => {
  const { showToast } = useToast();
  const [note, setNote] = useState<string>(
    "• Prep slides for Series B sync\n• Review Q1 roadmap with Sarah\n• Send calendar invite for 1:1"
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        setNote(saved);
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNote(val);
    try {
      localStorage.setItem(STORAGE_KEY, val);
    } catch {
      // Ignore
    }
  };

  const handleClear = () => {
    setNote("");
    try {
      localStorage.setItem(STORAGE_KEY, "");
    } catch {
      // Ignore
    }
    showToast("Scratchpad cleared");
  };

  return (
    <div className="detail-section">
      <div className="section-header">
        <span className="label">Scratchpad</span>
        <button className="link-btn" onClick={handleClear}>
          CLEAR
        </button>
      </div>

      <textarea
        className="form-input"
        style={{
          width: "100%",
          height: "90px",
          resize: "none",
          fontSize: "11px",
          fontFamily: "JetBrains Mono, monospace",
          lineHeight: 1.4,
          padding: "8px 10px",
          background: "var(--bg-2)",
          borderColor: "var(--border)",
        }}
        placeholder="Type quick meeting notes or to-dos..."
        value={note}
        onChange={handleChange}
      />
    </div>
  );
};
