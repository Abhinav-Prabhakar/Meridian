"use client";

import React, { useState } from "react";
import { useCalendar } from "@/context/CalendarContext";
import { useToast } from "@/context/ToastContext";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: "admin" | "edit" | "view";
  status: "online" | "idle" | "offline" | "pending";
  isYou?: boolean;
  pendingText?: string;
}

const initialMembers: TeamMember[] = [
  {
    id: "m1",
    name: "Elliot Alderson",
    email: "elliot@meridian.os",
    initials: "EA",
    role: "admin",
    status: "online",
    isYou: true,
  },
  {
    id: "m2",
    name: "Tyrell Wellick",
    email: "tyrell@ecorp.com",
    initials: "TS",
    role: "edit",
    status: "online",
  },
  {
    id: "m3",
    name: "Dominique DiPierro",
    email: "dom@fbi.gov",
    initials: "DM",
    role: "view",
    status: "offline",
  },
  {
    id: "m4",
    name: "Darlene Monroe",
    email: "darlene@fsociety.zip",
    initials: "DM",
    role: "edit",
    status: "pending",
    pendingText: "PENDING",
  },
];

export const TeamInviteModal: React.FC = () => {
  const { isTeamInviteOpen, closeTeamInvite, activeShareCalendar } = useCalendar();
  const { showToast } = useToast();

  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [inviteEmail, setInviteEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyAnimating, setCopyAnimating] = useState(false);

  if (!isTeamInviteOpen) return null;

  const handleRoleChange = (memberId: string, newRole: "admin" | "edit" | "view") => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === memberId && !m.isYou) {
          return { ...m, role: newRole };
        }
        return m;
      })
    );
    showToast(`Role updated`);
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    showToast(`Invitation sent to ${inviteEmail.trim()}`);
    setInviteEmail("");
  };

  const handleCopyLink = async () => {
    const link = `meridian.os/team/x7b2-9kf4`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(link);
      }
    } catch {
      // Fallback
    }

    setCopied(true);
    setCopyAnimating(true);
    showToast("Share link copied to clipboard!");

    setTimeout(() => {
      setCopyAnimating(false);
    }, 300);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const calendarName = activeShareCalendar || "Workspace";

  return (
    <div className="modal-overlay" onClick={closeTeamInvite} style={{ zIndex: 10000 }}>
      <div
        className="invite-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="panel-header fade-up-1">
          <div className="header-text">
            <h2 className="font-display">Team Access · {calendarName}</h2>
            <p>Manage roles, invitations, and workspace sync.</p>
          </div>
          <button className="close-btn" onClick={closeTeamInvite} title="Close Panel">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid fade-up-2">
          <div className="stat-item">
            <span className="label font-mono">Total Seats</span>
            <div className="stat-val font-mono">04</div>
          </div>
          <div className="stat-item">
            <span className="label font-mono">Active Now</span>
            <div className="stat-val accent font-mono">02</div>
          </div>
          <div className="stat-item">
            <span className="label font-mono">Pending</span>
            <div className="stat-val cyan font-mono">01</div>
          </div>
        </div>

        {/* Invite Input Form */}
        <form onSubmit={handleSendInvite} className="form-area fade-up-3">
          <label className="label" style={{ display: "block", marginBottom: "8px" }}>
            Invite by Email
          </label>
          <div className="input-group">
            <span className="input-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </span>
            <input
              type="email"
              className="email-input"
              placeholder="name@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <button type="submit" className="send-btn">
              Send Invite
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </form>

        {/* Roster List */}
        <div className="roster-area fade-up-4">
          <div className="roster-header">
            <span className="label">Active Roster</span>
            <span className="label font-mono" style={{ letterSpacing: "0.05em", color: "var(--fg-2)" }}>
              SORT: A-Z
            </span>
          </div>

          <div className="member-list">
            {members.map((m) => (
              <div key={m.id} className="member-row">
                <div className="avatar-wrap">
                  <div className={`avatar role-${m.role}`}>
                    {m.status === "pending" ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    ) : (
                      m.initials
                    )}
                  </div>
                  {m.status !== "pending" && (
                    <div className={`status-dot status-${m.status}`} />
                  )}
                </div>

                <div className="member-info">
                  <div className="member-name" style={{ color: m.status === "pending" ? "var(--fg-2)" : "var(--fg)" }}>
                    {m.name}
                    {m.isYou && <span className="you-tag font-mono">YOU</span>}
                  </div>
                  <div className="member-email">
                    {m.email}
                    {m.pendingText && <> · <span style={{ color: "var(--orange)" }}>{m.pendingText}</span></>}
                  </div>
                </div>

                <div className="permissions-control">
                  {m.isYou ? (
                    <button className="perm-btn active" data-role="admin">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      Admin
                    </button>
                  ) : (
                    <>
                      <button
                        className={`perm-btn ${m.role === "admin" ? "active" : ""}`}
                        data-role="admin"
                        onClick={() => handleRoleChange(m.id, "admin")}
                      >
                        Admin
                      </button>
                      <button
                        className={`perm-btn ${m.role === "edit" ? "active" : ""}`}
                        data-role="edit"
                        onClick={() => handleRoleChange(m.id, "edit")}
                      >
                        Editor
                      </button>
                      <button
                        className={`perm-btn ${m.role === "view" ? "active" : ""}`}
                        data-role="view"
                        onClick={() => handleRoleChange(m.id, "view")}
                      >
                        Viewer
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Magic Link Sharing */}
        <div className="link-area">
          <div className="link-content">
            <span className="label">Share Public Link</span>
            <span className="link-url">
              meridian.os/team/x7b2-9kf4... <span style={{ color: "var(--fg-3)" }}>(View Only)</span>
            </span>
          </div>
          <button
            className={`copy-btn ${copied ? "copied" : ""} ${copyAnimating ? "copy-bounce" : ""}`}
            onClick={handleCopyLink}
            style={{
              transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              transform: copyAnimating ? "scale(0.92)" : "scale(1)",
              ...(copied
                ? {
                    background: "var(--accent-dim)",
                    borderColor: "var(--accent)",
                    color: "var(--accent)",
                    boxShadow: "0 0 12px var(--accent-dim)",
                  }
                : {}),
            }}
          >
            {copied ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                COPIED!
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
