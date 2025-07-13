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
  // Stan do zarządzania trybem edycji
  const [isEditing, setIsEditing] = useState(false);

  // Stany dla formularza edycji
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [editError, setEditError] = useState<string | null>(null);

  // Ustawianie początkowych wartości formularza po zmianie eventu lub wejściu w tryb edycji
  useEffect(() => {
    if (event) {
      setStartDate(event.start ? dayjs(event.start).format('YYYY-MM-DD') : '');
      // Data końca w modalu jest pokazywana jako 'end - 1 dzień', więc do edycji
      // musimy to skorygować i dodać ten 1 dzień z powrotem.
      setEndDate(event.end ? dayjs(event.end).format('YYYY-MM-DD') : '');
      setReason(typeof event.title === "string" ? event.title : '');
      setEditError(null); // Resetuj błąd przy otwieraniu/zmianie zdarzenia
    }
  }, [event]);

  if (!event) return null;

  // Funkcja do obsługi zapisu zmian
  const handleSaveEdit = async () => {
    setEditError(null);
    try {
      const newStartDateObj = dayjs(startDate).toDate();
      // Ważna uwaga: Backend oczekuje daty KOŃCA jako WŁĄCZNIE z tym dniem.
      // Front-endowy kalendarz często traktuje `end` jako "dzień po zakończeniu".
      // Musimy wysłać datę końcową tak, jak backend jej oczekuje.
      // Twoje `new Date(event.end.getTime() - 1).toLocaleDateString()` sugeruje,
      // że `event.end` jest już o jeden dzień za późno, więc możemy wysłać `dayjs(endDate).toDate()`
      // Jeśli backend oczekuje, że `newEndDate` jest faktycznym OSTATNIM DNIEM urlopu,
      // a `event.end` z `react-big-calendar` to `ostatni dzień + 1`,
      // to `dayjs(endDate).toDate()` będzie poprawne.
      const newEndDateObj = dayjs(endDate).toDate();

      // Walidacja dat po stronie klienta
      if (newEndDateObj < newStartDateObj) {
        setEditError("End date cannot be before start date.");
        return;
      }

      const success = await onEdit(event.id as number, newStartDateObj, newEndDateObj, reason);
      if (success) {
        setIsEditing(false); // Wyjdź z trybu edycji po sukcesie
        onClose(); // Zamknij modal
      } else {
        // Błąd zostanie obsłużony w onEdit i przekazany jako false
        // (lub poprzez rzucenie wyjątku, jeśli onEdit go rzuca)
        setEditError("Failed to save changes. Please try again.");
      }
    } catch (err: any) {
      // Wyłapywanie błędów z API
      setEditError(err.message || "An unexpected error occurred during save.");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false); // Wyjdź z trybu edycji bez zapisywania
    // Przywróć oryginalne wartości formularza
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
          {/* Użyj dangerouslySetInnerHTML tylko jeśli masz pewność, że dane są bezpieczne */}
          <p><strong>Reason:</strong> <span dangerouslySetInnerHTML={{ __html: typeof event.title === "string" ? event.title.replace(/\n/g, "<br />") : "no title" }} /></p>
          
          <div style={{ display: "flex", gap: "10px" }}>
            {/* Wyświetl przycisk "Edit" tylko jeśli status nie jest 'Cancelled' lub 'Rejected' */}
            {event.status !== DayOffStatus.Cancelled && event.status !== DayOffStatus.Rejected && (
              <button onClick={() => setIsEditing(true)}>Edit</button>
            )}
            
            {/* Przycisk "Cancel Request" powinien być dostępny tylko dla odpowiednich statusów */}
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