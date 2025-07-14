import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import { CalendarEvent } from "../interfaces/types";
import { DayOffStatus } from "../enums/DayOffStatus";

// Importuj Dayjs (jeśli już go używasz lub zainstaluj: npm install dayjs)
import dayjs from 'dayjs';
import 'dayjs/locale/pl'; // Jeśli potrzebujesz polskiego locale
dayjs.locale('pl'); // Ustaw lokalizację dla dayjs

interface Props {
  event: CalendarEvent | null;
  onClose: () => void;
  onCancel: (event: CalendarEvent) => void;
  // Nowa prop: funkcja do obsługi edycji
  onEdit: (id: number, newStartDate: Date, newEndDate: Date, newReason: string) => Promise<boolean>;
}

const EventDetailsModal: React.FC<Props> = ({ event, onClose, onCancel, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    if (event) {
      setStartDate(event.start ? dayjs(event.start).format('YYYY-MM-DD') : '');
      setEndDate(
        event.end
          ? dayjs(event.end).subtract(1, 'day').format('YYYY-MM-DD')
          : ''
      );
      setReason(typeof event.title === "string" ? event.title : '');
      setEditError(null);
    }
  }, [event]);

  if (!event) return null;

  const handleSaveEdit = async () => {
    setEditError(null);
    try {
      const newStartDateObj = dayjs(startDate).toDate();
      const newEndDateObj = dayjs(endDate).toDate();

      // Walidacja dat po stronie klienta
      if (newEndDateObj < newStartDateObj) {
        setEditError("End date cannot be before start date.");
        return;
      }

      const success = await onEdit(event.id as number, newStartDateObj, newEndDateObj, reason);
      if (success) {
        setIsEditing(false);
        onClose();
      } else {
        setEditError("Failed to save changes. Please try again.");
      }
    } catch (err: any) {
      // Wyłapywanie błędów z API
      setEditError(err.message || "An unexpected error occurred during save.");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (event) {
      setStartDate(event.start ? dayjs(event.start).format('YYYY-MM-DD') : '');
      setEndDate(event.end ? dayjs(event.end).format('YYYY-MM-DD') : '');
      setReason(typeof event.title === "string" ? event.title : '');
    }
  };

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
      <h2>{isEditing ? "Edit Request" : "Request Details"}</h2>

      {editError && <p style={{ color: 'red' }}>{editError}</p>}

      {isEditing ? (
        <>
          <label>
            Start Date:
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="modal-input" // Dodaj klasy CSS do ostylowania
            />
          </label>
          <label>
            End Date:
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="modal-input"
            />
          </label>
          <label>
            Reason:
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="modal-textarea"
            />
          </label>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={handleSaveEdit}>Save</button>
            <button onClick={handleCancelEdit}>Cancel Edit</button>
          </div>
        </>
      ) : (
        <>
          <p><strong>From:</strong> {event.start?.toLocaleDateString() ?? "no date"}</p>
          <p><strong>To:</strong> {event.end ? dayjs(event.end).subtract(1, 'day').toDate().toLocaleDateString() : "no date"}</p>
          <p><strong>Status:</strong> {DayOffStatus[event.status]}</p>
          <p><strong>Reason:</strong> <span dangerouslySetInnerHTML={{ __html: typeof event.title === "string" ? event.title.replace(/\n/g, "<br />") : "no title" }} /></p>

          <div style={{ display: "flex", gap: "10px" }}>
            {event.status !== DayOffStatus.Cancelled && event.status !== DayOffStatus.Rejected && (
              <button onClick={() => setIsEditing(true)}>Edit</button>
            )}
            {(event.status === DayOffStatus.Pending || event.status === DayOffStatus.Approved) && (
              <button onClick={() => onCancel(event)}>Cancel Request</button>
            )}
            <button onClick={onClose}>Close</button>
          </div>
        </>
      )}
    </Modal>
  );
};

export default EventDetailsModal;