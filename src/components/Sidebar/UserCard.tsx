"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export const UserCard: React.FC = () => {
  const router = useRouter();
  const [userName, setUserName] = useState("Alex Kovac");
  const [userInitials, setUserInitials] = useState("AK");
  const [liveTime, setLiveTime] = useState("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, "0");
      const m = String(now.getMinutes()).padStart(2, "0");
      const s = String(now.getSeconds()).padStart(2, "0");
      setLiveTime(`${h}:${m}:${s}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        const name = user.user_metadata?.full_name || user.email.split("@")[0];
        setUserName(name);
        setUserInitials(name.slice(0, 2).toUpperCase());
      } else {
        const local = localStorage.getItem("meridian_user_session");
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (parsed.name) {
              setUserName(parsed.name);
              setUserInitials(parsed.name.slice(0, 2).toUpperCase());
            }
          } catch {
            // Ignore
          }
        }
      }
    });
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore
    }
    localStorage.removeItem("meridian_user_session");
    router.push("/login");
  };

  return (
    <div
      className="user-card"
      style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}
      onClick={handleSignOut}
      title="Click to Sign Out"
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div className="avatar">{userInitials}</div>
        <div className="user-info">
          <div className="user-name">{userName}</div>
          <div className="user-status">
            <span className="status-label">LOCAL</span>
            <span className="status-value">{liveTime || "--:--:--"}</span>
          </div>
        </div>
      </div>
      <button
        className="user-signout-btn"
        style={{ background: "none", border: "none", cursor: "pointer" }}
        title="Sign Out"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </button>
    </div>
  );
};
