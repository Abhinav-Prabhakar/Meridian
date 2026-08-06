"use client";

import React, { useState } from "react";
import { useCalendar } from "@/context/CalendarContext";
import { useToast } from "@/context/ToastContext";

export const ShareModal: React.FC = () => {
  const { isShareOpen, closeShare, events } = useCalendar();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!isShareOpen) return null;

  const shareUrl = typeof window !== "undefined" ? window.location.href : "https://meridian.app/cal/alex-kovac";

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
    }
    setCopied(true);
    showToast("Share link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadICS = () => {
    let icsContent = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Meridian Calendar OS//EN\r\n";
    events.forEach((ev) => {
      const dateParts = ev.dateStr.replace(/-/g, "");
      if (ev.allDay) {
        const date = new Date(`${ev.dateStr}T00:00:00`);
        date.setDate(date.getDate() + 1);
        const nextDate = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
        icsContent += "BEGIN:VEVENT\r\n";
        icsContent += `SUMMARY:${ev.title}\r\n`;
        icsContent += `DTSTART;VALUE=DATE:${dateParts}\r\n`;
        icsContent += `DTEND;VALUE=DATE:${nextDate}\r\n`;
        if (ev.meta) icsContent += `LOCATION:${ev.meta}\r\n`;
        icsContent += "END:VEVENT\r\n";
        return;
      }
      const startH = Math.floor(ev.start);
      const startM = ev.start % 1 === 0.5 ? "30" : "00";
      const endH = Math.floor(ev.start + ev.dur);
      const endM = (ev.start + ev.dur) % 1 === 0.5 ? "30" : "00";

      const dtStart = `${dateParts}T${String(startH).padStart(2, "0")}${startM}00`;
      const dtEnd = `${dateParts}T${String(endH).padStart(2, "0")}${endM}00`;

      icsContent += "BEGIN:VEVENT\r\n";
      icsContent += `SUMMARY:${ev.title}\r\n`;
      icsContent += `DTSTART:${dtStart}\r\n`;
      icsContent += `DTEND:${dtEnd}\r\n`;
      if (ev.meta) icsContent += `LOCATION:${ev.meta}\r\n`;
      icsContent += "END:VEVENT\r\n";
    });
    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "meridian_calendar.ics");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Downloaded meridian_calendar.ics");
  };

  const handleDownloadJSON = () => {
    const jsonStr = JSON.stringify(events, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "meridian_events.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Downloaded meridian_events.json");
  };

  return (
    <div className="modal-overlay" onClick={closeShare}>
      <div
        className="modal-content"
        style={{ maxWidth: "440px", padding: "24px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header" style={{ marginBottom: "16px" }}>
          <h2 className="modal-title" style={{ fontSize: "18px" }}>
            Share & Export
          </h2>
          <button className="modal-close" onClick={closeShare}>
            ✕
          </button>
        </div>

        <div className="form-group" style={{ marginBottom: "20px" }}>
          <label className="form-label">Calendar Share Link</label>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              className="form-input"
              style={{ flex: 1, fontFamily: "JetBrains Mono, monospace", fontSize: "11px" }}
              value={shareUrl}
              readOnly
            />
            <button type="button" className="btn-submit" onClick={handleCopyLink}>
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
          <label className="form-label" style={{ marginBottom: "10px" }}>
            Export Calendar Data
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              type="button"
              className="btn-cancel"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
              onClick={handleDownloadICS}
            >
              📅 Export as iCal (.ics)
            </button>
            <button
              type="button"
              className="btn-cancel"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
              onClick={handleDownloadJSON}
            >
              💾 Export as JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
