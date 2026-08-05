"use client";

import React from "react";
import { useCalendar } from "@/context/CalendarContext";
import { useToast } from "@/context/ToastContext";

export const NotificationsModal: React.FC = () => {
  const {
    isNotificationsOpen,
    closeNotifications,
    notifications,
    markNotificationsRead,
    clearNotifications,
  } = useCalendar();
  const { showToast } = useToast();

  if (!isNotificationsOpen) return null;

  const handleMarkAllRead = () => {
    markNotificationsRead();
    showToast("Notifications marked as read");
  };

  const handleClearAll = () => {
    clearNotifications();
    showToast("Notifications cleared");
  };

  return (
    <div className="modal-overlay" onClick={closeNotifications}>
      <div
        className="modal-content"
        style={{ maxWidth: "420px", padding: "20px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header" style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h2 className="modal-title" style={{ fontSize: "16px" }}>
              Notifications
            </h2>
            {notifications.some((n) => !n.read) && (
              <span
                style={{
                  fontSize: "10px",
                  background: "var(--orange-dim)",
                  color: "var(--orange)",
                  padding: "2px 6px",
                  fontWeight: 600,
                }}
              >
                UNREAD
              </span>
            )}
          </div>
          <button className="modal-close" onClick={closeNotifications}>
            ✕
          </button>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <button
            className="link-btn"
            style={{ fontSize: "10px" }}
            onClick={handleMarkAllRead}
          >
            MARK ALL AS READ
          </button>
          <button
            className="link-btn"
            style={{ fontSize: "10px", color: "var(--fg-3)" }}
            onClick={handleClearAll}
          >
            CLEAR ALL
          </button>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            maxHeight: "300px",
            overflowY: "auto",
          }}
        >
          {notifications.length === 0 ? (
            <div
              style={{
                padding: "24px",
                textAlign: "center",
                color: "var(--fg-3)",
                fontSize: "12px",
                fontFamily: "JetBrains Mono, monospace",
              }}
            >
              No new notifications.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: "10px 12px",
                  background: n.read ? "var(--bg-1)" : "var(--bg-2)",
                  border: "1px solid var(--border)",
                  borderLeft: n.read ? "1px solid var(--border)" : "3px solid var(--accent)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: n.read ? 400 : 600,
                      color: n.read ? "var(--fg-2)" : "var(--fg)",
                      marginBottom: "4px",
                    }}
                  >
                    {n.title}
                  </div>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "var(--fg-3)",
                      fontFamily: "JetBrains Mono, monospace",
                    }}
                  >
                    {n.time}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
