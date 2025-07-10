import React from "react";
import Modal from "react-modal";
import { CalendarEvent } from "../types"; 
import {DayOffStatus} from "../enums/DayOffStatus";
interface Props {
  event: CalendarEvent | null;
  onClose: () => void;
  onCancel: (event: CalendarEvent) => void;
}

const EventDetailsModal: React.FC<Props> = ({ event, onClose, onCancel }) => {
  if (!event) return null;

  return (
    <Modal
      isOpen={!!event}
      onRequestClose={onClose}
      contentLabel="Event Details"
      ariaHideApp={false}
      style={{
        overlay: { backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1000 },
        content: {
          top: "50%", left: "50%", right: "auto", bottom: "auto",
          marginRight: "-50%", transform: "translate(-50%, -50%)",
          padding: "2rem", borderRadius: "8px", border: "1px solid #ccc",
          boxShadow: "0 5px 15px rgba(0,0,0,0.3)", maxWidth: "400px",
          width: "90%", display: "flex", flexDirection: "column",
          gap: "1rem", alignItems: "center",
        },
      }}
    >
      <h2>Details</h2>
      <p><strong>From:</strong> {event.start?.toLocaleDateString() ?? "no date"}</p>
      <p><strong>To:</strong> {event.end ? new Date(event.end.getTime() - 1).toLocaleDateString() : "no date"}</p>
      <p><strong>Status:</strong> {DayOffStatus[event.status]}</p>
      <p><strong>Reason:</strong> {typeof event.title === "string" ? event.title.replace(/\n/g, "<br />") : "no title"}</p>
      <button onClick={() => onCancel(event)}>Cancel Request</button>
      <button onClick={onClose}>Close</button>
    </Modal>
  );
};

export default EventDetailsModal;
