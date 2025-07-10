import React from "react";

const LegendItem = ({ color, label }: { color: string; label: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
    <div style={{ width: 16, height: 16, backgroundColor: color, borderRadius: 4 }} />
    <span>{label}</span>
  </div>
);

const Legend = () => (
  <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", justifyContent: "center" }}>
    <LegendItem color="#4ade80" label="Approved" />
    <LegendItem color="#facc15" label="Pending" />
    <LegendItem color="#f87171" label="Rejected" />
    <LegendItem color="#6b7280" label="Executed" />
    <LegendItem color="#000000" label="Cancelled" />
  </div>
);

export default Legend;
