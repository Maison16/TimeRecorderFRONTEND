import React, { useEffect, useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import type { Event as RBCEvent } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { pl } from "date-fns/locale";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { apiURL } from '../config'

const locales = { pl };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

// Typ statusu z backendu
type DayOffStatus = "Pending" | "Approved" | "Rejected" | "Cancelled";

interface DayOffRequestDto {
  id: number;
  dateStart: string;
  dateEnd: string;
  reason?: string;
  status: DayOffStatus;
}

interface CalendarEvent extends RBCEvent {
  status: DayOffStatus;
}

const DayOffCalendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [dateStart, setDateStart] = useState<Date>(new Date());
  const [dateEnd, setDateEnd] = useState<Date>(new Date());
  const [reason, setReason] = useState<string>("");

  const token = localStorage.getItem("access_token"); 
  const apiUrlFull = `${apiURL}/api/DayOff`; 

  const fetchEvents = async () => {
    try {
      const res = await axios.get<DayOffRequestDto[]>(apiUrlFull, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const mapped: CalendarEvent[] = res.data.map((entry) => ({
        title: `${entry.reason ?? "Urlop"} (${entry.status})`,
        start: new Date(entry.dateStart),
        end: new Date(entry.dateEnd),
        allDay: true,
        status: entry.status,
      }));

      setEvents(mapped);
    } catch (err) {
      console.error("Error during fetch:", err);
    }
  };

  const submitRequest = async () => {
    if (!userId) {
      alert("What is your userId");
      return;
    }

    try {
      await axios.post(
        apiUrlFull,
        null,
        {
          params: {
            userId,
            dateStart: dateStart.toISOString(),
            dateEnd: dateEnd.toISOString(),
            reason,
          },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      await fetchEvents();
    } catch (err) {
      alert("Error during sending dayoff request.");
      console.error(err);
    }
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = "#d1d5db"; // domyślnie szary

    if (event.status === "Approved") backgroundColor = "#4ade80"; // zielony
    else if (event.status === "Pending") backgroundColor = "#facc15"; // żółty
    else backgroundColor = "#f87171"; // czerwony (Rejected/Cancelled)

    return {
      style: {
        backgroundColor,
        borderRadius: "6px",
        opacity: 0.9,
        color: "black",
        border: "none",
        padding: "2px 6px",
      },
    };
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div className="p-6 max-w-screen-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Kalendarz urlopów</h1>

      <div className="flex flex-wrap gap-4 items-center mb-6">
        <input
          type="text"
          placeholder="User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="border p-2 rounded w-48"
        />
        <DatePicker
          selected={dateStart}
          onChange={(date) => date && setDateStart(date)}
          className="border p-2 rounded"
        />
        <DatePicker
          selected={dateEnd}
          onChange={(date) => date && setDateEnd(date)}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Powód"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="border p-2 rounded w-48"
        />
        <button
          onClick={submitRequest}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Zgłoś urlop
        </button>
      </div>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        views={["month", "week"]}
        style={{ height: 600 }}
        eventPropGetter={eventStyleGetter}
        messages={{
          next: "Dalej",
          previous: "Wstecz",
          today: "Dziś",
          month: "Miesiąc",
          week: "Tydzień",
          day: "Dzień",
          agenda: "Agenda",
          date: "Data",
          time: "Czas",
          event: "Wydarzenie",
          noEventsInRange: "Brak wydarzeń w tym zakresie",
        }}
      />
    </div>
  );
};

export default DayOffCalendar;
