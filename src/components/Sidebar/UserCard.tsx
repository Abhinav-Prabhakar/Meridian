"use client";

import React from "react";

export const UserCard: React.FC = () => {
  return (
    <div className="user-card">
      <div className="avatar">AK</div>
      <div className="user-info">
        <div className="user-name">Alex Kovac</div>
        <div className="user-status">Available · PST</div>
      </div>
    </div>
  );
};
