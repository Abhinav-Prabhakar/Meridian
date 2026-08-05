"use client";

import React from "react";
import { useTheme, themePresets } from "@/context/ThemeContext";
import { useToast } from "@/context/ToastContext";

export const ThemeCustomizerModal: React.FC = () => {
  const { accentColor, setAccentColor, isThemeModalOpen, closeThemeModal } = useTheme();
  const { showToast } = useToast();

  if (!isThemeModalOpen) return null;

  const handleSelectPreset = (color: string, name: string) => {
    setAccentColor(color);
    showToast(`Theme updated to ${name}`);
  };

  return (
    <div className="modal-overlay" onClick={closeThemeModal}>
      <div
        className="modal-content"
        style={{ maxWidth: "400px", padding: "24px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header" style={{ marginBottom: "16px" }}>
          <h2 className="modal-title" style={{ fontSize: "18px" }}>
            Theme Customizer
          </h2>
          <button className="modal-close" onClick={closeThemeModal}>
            ✕
          </button>
        </div>

        <div className="form-group" style={{ marginBottom: "20px" }}>
          <label className="form-label" style={{ marginBottom: "10px" }}>
            Accent Color Presets
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {themePresets.map((preset) => {
              const isSelected = accentColor === preset.color;
              return (
                <button
                  key={preset.color}
                  type="button"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px 12px",
                    background: isSelected ? "var(--bg-3)" : "var(--bg-2)",
                    border: isSelected ? `1.5px solid ${preset.color}` : "1px solid var(--border)",
                    color: "var(--fg)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    fontFamily: "inherit",
                    fontSize: "12px",
                  }}
                  onClick={() => handleSelectPreset(preset.color, preset.name)}
                >
                  <span
                    style={{
                      width: "14px",
                      height: "14px",
                      borderRadius: "50%",
                      background: preset.color,
                      flexShrink: 0,
                    }}
                  ></span>
                  <span>{preset.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Custom Hex Color</label>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="color"
              style={{
                width: "40px",
                height: "36px",
                padding: 0,
                border: "none",
                background: "none",
                cursor: "pointer",
              }}
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
            />
            <input
              type="text"
              className="form-input"
              style={{ flex: 1, fontFamily: "JetBrains Mono, monospace" }}
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
