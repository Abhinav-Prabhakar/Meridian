"use client";

import React, { useState } from "react";
import { useCalendar } from "@/context/CalendarContext";
import { useToast } from "@/context/ToastContext";
import { eventsForDate } from "@/lib/dateUtils";

const categoryColors: Record<string, { bg: string; color: string; label: string }> = {
  strategy: { bg: "var(--accent-dim)", color: "var(--accent)", label: "STRATEGY" },
  meeting: { bg: "var(--orange-dim)", color: "var(--orange)", label: "MEETING" },
  focus: { bg: "var(--cyan-dim)", color: "var(--cyan)", label: "FOCUS" },
  personal: { bg: "var(--pink-dim)", color: "var(--pink)", label: "PERSONAL" },
  travel: { bg: "var(--yellow-dim)", color: "var(--yellow)", label: "TRAVEL" },
};

export const EventDetailModal: React.FC = () => {
  const {
    viewingEvent,
    events,
    closeEventDetails,
    deleteEvent,
    openNewEventModal,
    updateInvitee,
    createProposal,
    respondToProposal,
  } = useCalendar();
  const { showToast } = useToast();
  const [proposalDate, setProposalDate] = useState("");
  const [proposalStart, setProposalStart] = useState(9);
  const [proposalDur, setProposalDur] = useState(1);
  const [proposalComment, setProposalComment] = useState("");

  if (!viewingEvent) return null;
  const event = events.find((candidate) => candidate.id === viewingEvent.id) || viewingEvent;

  const catStyle = categoryColors[event.cat] || {
    bg: "var(--accent-dim)",
    color: "var(--accent)",
    label: event.cat.toUpperCase(),
  };

  const handleDelete = () => {
    deleteEvent(event.id);
    showToast(`Deleted event: ${event.title}`);
    closeEventDetails();
  };

  const handleEdit = () => {
    const evToEdit = { ...event };
    closeEventDetails();
    openNewEventModal({
      id: evToEdit.id,
      dateStr: evToEdit.dateStr,
      startHour: evToEdit.start,
      dur: evToEdit.dur,
      allDay: evToEdit.allDay,
      title: evToEdit.title,
      cat: evToEdit.cat,
      meta: evToEdit.meta,
      recurrence: evToEdit.recurrence,
      alerts: evToEdit.alerts,
      invitees: evToEdit.invitees,
    });
  };

  const addProposal = async () => {
    if (!proposalDate) {
      showToast("Choose a proposed date");
      return;
    }
    await createProposal(event.id, {
      proposedDateStr: proposalDate,
      proposedStart: proposalStart,
      proposedDur: proposalDur,
      comment: proposalComment.trim() || undefined,
    });
    setProposalComment("");
    showToast("New time proposed");
  };

  const conflictingEvents = eventsForDate(events, event.dateStr).filter((candidate) =>
    candidate.id !== event.id &&
    candidate.dateStr === event.dateStr &&
    (event.allDay || candidate.allDay || (event.start < candidate.start + candidate.dur && event.start + event.dur > candidate.start))
  );

  return (
    <div className="modal-overlay" onClick={closeEventDetails}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              className="next-event-tag"
              style={{
                background: catStyle.bg,
                color: catStyle.color,
                margin: 0,
              }}
            >
              {catStyle.label}
            </span>
          </div>
          <button className="modal-close" onClick={closeEventDetails}>
            ✕
          </button>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <h2 className="modal-title" style={{ fontSize: "22px", marginBottom: "8px" }}>
            {event.title}
          </h2>
          <div className="next-event-time" style={{ fontSize: "14px" }}>
            {event.allDay ? "All day" : <>{event.time} <span className="duration">· {Math.round(event.dur * 60)}m</span></>}
          </div>
          <div style={{ fontSize: "11px", color: "var(--fg-3)", fontFamily: "JetBrains Mono, monospace" }}>
            Date: {event.dateStr}
          </div>
        </div>

        {event.meta && (
          <div
            style={{
              background: "var(--bg-2)",
              padding: "10px 12px",
              border: "1px solid var(--border)",
              fontSize: "12px",
              color: "var(--fg-2)",
              marginBottom: "16px",
            }}
          >
            📍 {event.meta}
          </div>
        )}

        {event.invitees && event.invitees.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <div className="form-label" style={{ marginBottom: "8px" }}>
              Invitees · RSVP & availability
            </div>
            <div className="invitee-detail-list">
              {event.invitees.map((invitee) => (
                <div key={invitee.id} className="invitee-detail-row">
                  <div className="invitee-detail-name"><strong>{invitee.displayName || invitee.email}</strong><span>{invitee.displayName ? invitee.email : "Invitee"}</span></div>
                  <select className="form-select invitee-status-select" value={invitee.response} onChange={(e) => updateInvitee(event.id, invitee.id, { response: e.target.value as "pending" | "going" | "maybe" | "declined" })} aria-label={`RSVP for ${invitee.email}`}>
                    <option value="pending">Pending</option><option value="going">Going</option><option value="maybe">Maybe</option><option value="declined">Declined</option>
                  </select>
                  <select className="form-select invitee-status-select" value={invitee.availability} onChange={(e) => updateInvitee(event.id, invitee.id, { availability: e.target.value as "unknown" | "free" | "busy" })} aria-label={`Availability for ${invitee.email}`}>
                    <option value="unknown">Unknown</option><option value="free">Free</option><option value="busy">Busy</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="availability-card">
          <div className="form-label">Free / busy check</div>
          <div className={`availability-status ${conflictingEvents.length > 0 ? "busy" : "free"}`}>
            <span className="availability-dot" />
            {conflictingEvents.length > 0 ? `Busy — overlaps ${conflictingEvents.map((candidate) => candidate.title).join(", ")}` : "Free — no overlapping events"}
          </div>
          {event.invitees?.map((invitee) => <div key={invitee.id} className="availability-row"><span>{invitee.displayName || invitee.email}</span><span className={`availability-value ${invitee.availability}`}>{invitee.availability}</span></div>)}
        </div>

        <div className="proposal-section">
          <div className="form-label">Propose a new time</div>
          <div className="form-row">
            <input className="form-input" type="date" value={proposalDate} onChange={(e) => setProposalDate(e.target.value)} />
            <select className="form-select" value={proposalStart} onChange={(e) => setProposalStart(Number(e.target.value))}>{Array.from({ length: 48 }, (_, index) => index / 2).map((hour) => <option key={hour} value={hour}>{String(Math.floor(hour)).padStart(2, "0")}:{hour % 1 ? "30" : "00"}</option>)}</select>
          </div>
          <div className="form-row">
            <select className="form-select" value={proposalDur} onChange={(e) => setProposalDur(Number(e.target.value))}><option value={0.5}>30 minutes</option><option value={1}>1 hour</option><option value={1.5}>90 minutes</option><option value={2}>2 hours</option></select>
            <input className="form-input" placeholder="Optional note" value={proposalComment} onChange={(e) => setProposalComment(e.target.value)} />
          </div>
          <button type="button" className="btn-cancel" onClick={addProposal}>Suggest this time</button>
          {(event.proposals || []).map((proposal) => <div key={proposal.id} className="proposal-row"><div><strong>{proposal.proposedDateStr} · {String(Math.floor(proposal.proposedStart)).padStart(2, "0")}:{proposal.proposedStart % 1 ? "30" : "00"}</strong><span>{proposal.comment || "No note"}</span></div><div className="proposal-actions"><span className={`proposal-state ${proposal.status}`}>{proposal.status}</span>{proposal.status === "pending" && <><button type="button" onClick={() => respondToProposal(event.id, proposal.id, "accepted")}>Accept</button><button type="button" onClick={() => respondToProposal(event.id, proposal.id, "declined")}>Decline</button></>}</div></div>)}
        </div>

        <div className="event-capability-summary">
          <span>{event.recurrence ? `Repeats ${event.recurrence.frequency}` : "One-time event"}</span>
          <span>{event.alerts?.length || 0} alert{event.alerts?.length === 1 ? "" : "s"}</span>
        </div>

        <div className="modal-actions" style={{ justifyContent: "space-between", marginTop: "24px" }}>
          <button
            type="button"
            className="btn-cancel"
            style={{ color: "var(--red)", borderColor: "rgba(255, 77, 77, 0.3)" }}
            onClick={handleDelete}
          >
            Delete Event
          </button>
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="button" className="btn-cancel" onClick={closeEventDetails}>
              Close
            </button>
            <button type="button" className="btn-submit" onClick={handleEdit}>
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
