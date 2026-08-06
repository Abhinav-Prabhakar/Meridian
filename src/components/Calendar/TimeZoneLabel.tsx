"use client";

import React, { useSyncExternalStore } from "react";
import { getLocalTimeZoneLabel } from "@/lib/dateUtils";

export const TimeZoneLabel: React.FC = () => {
  const label = useSyncExternalStore(
    () => () => {},
    getLocalTimeZoneLabel,
    () => "LOCAL"
  );

  return (
    <div className="time-corner" title="Your local calendar timezone">
      {label}
    </div>
  );
};
