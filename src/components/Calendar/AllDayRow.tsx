"use client";

import React from "react";

export const AllDayRow: React.FC = () => {
  return (
    <div className="allday-row">
      <div className="allday-label">All day</div>
      <div className="allday-cell"></div>
      <div className="allday-cell">
        <div className="allday-event">Marcus OOO (AM)</div>
      </div>
      <div className="allday-cell"></div>
      <div className="allday-cell"></div>
      <div className="allday-cell">
        <div className="allday-event">Company Off-site</div>
      </div>
      <div className="allday-cell"></div>
      <div className="allday-cell"></div>
    </div>
  );
};
