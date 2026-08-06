"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export const UserCard: React.FC = () => {
  const router = useRouter();
  const [userName, setUserName] = useState("Alex Kovac");
  const [userInitials, setUserInitials] = useState("AK");

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
          <div className="user-status">Available · PST</div>
        </div>
      </div>
      <button
        style={{
          background: "none",
          border: "none",
          color: "var(--text-muted)",
          fontSize: "11px",
          cursor: "pointer",
        }}
        title="Sign Out"
      >
        🚪
      </button>
    </div>
  );
};
