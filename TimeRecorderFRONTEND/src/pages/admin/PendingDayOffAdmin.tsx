import React, { useEffect, useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, startOfDay } from "date-fns";
import { enUS } from "date-fns/locale";
import axios from "axios";
import qs from "qs";
import { CalendarEvent, DayOffRequestDto } from "../../interfaces/types";
import { DayOffStatus } from "../../enums/DayOffStatus";
import { apiURL } from "../../config";
import Legend from "../../components/Legend";

import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const PendingDayOffAdmin: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const api = axios.create({
    baseURL: apiURL,
    withCredentials: true,
  });

  useEffect(() => {
    fetchPendingEvents();
  }, []);

  const stripTimeZone = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  };

  const mapToEvents = (data: DayOffRequestDto[]): CalendarEvent[] =>
    data.map((e) => {
      const start = stripTimeZone(e.dateStart);
      const end = stripTimeZone(e.dateEnd);
      const fixedEnd = new Date(end.getTime() + 24 * 60 * 60 * 1000);
      return {
        title: `${e.reason ?? "Day off"}`,
        start,
        end: fixedEnd,
        allDay: true,
        status: e.status,
        id: e.id,
        userName: e.userName,
        userSurname: e.userSurname,
      };
    });

  const fetchPendingEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get<DayOffRequestDto[]>("api/DayOff/filter", {
        params: {
          statuses: [DayOffStatus.Pending],
        },
        paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "repeat" }),
      });
      setEvents(mapToEvents(res.data));
    } catch (e) {
      alert("Error fetching pending requests.");
    }
    setLoading(false);
  };

  const handleDecision = async (decision: DayOffStatus) => {
    if (!selectedEvent) return;
    try {
      await api.post(`api/DayOff/decision/${selectedEvent.id}`, null, {
        params: { decision },
      });
      setSelectedEvent(null);
      fetchPendingEvents();
    } catch (e) {
      alert("Error updating request.");
    }
  };

  const eventStyleGetter = (ev: CalendarEvent) => ({
    style: {
      backgroundColor: "#facc15", 
      borderRadius: "6px",
      color: "#000",
      padding: "2px 4px",
    },
  });

  return (
    <div className="container d-flex flex-column align-items-center justify-content-center pt-5" style={{ minHeight: "100vh" }}>
      <h2 className="text-center mb-4">Pending Day Off Requests</h2>
      <Legend />
      <div style={{ width: "100%", maxWidth: "1400px", margin: "0 auto" }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          views={["month"]}
          view="month"
          style={{ height: 600, width: 900 }}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={(event) => setSelectedEvent(event as CalendarEvent)}
          date={calendarDate}
          onNavigate={(date) => setCalendarDate(date)}
        />
      </div>
      {selectedEvent && (
        <div className="modal show d-block" tabIndex={-1} style={{ background: "rgba(0,0,0,0.3)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Day Off Request</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedEvent(null)} />
              </div>
              <div className="modal-body">
                <p><strong>User:</strong> {selectedEvent.userName} {selectedEvent.userSurname}</p>
                <p><strong>Reason:</strong> {selectedEvent.title}</p>
                <p><strong>Start:</strong> {selectedEvent.start?.toLocaleDateString()}</p>
                <p><strong>End:</strong> {selectedEvent.end?.toLocaleDateString()}</p>
                <p><strong>Status:</strong> {selectedEvent.status==0? "Pending": "Unknown"}</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-success" onClick={() => handleDecision(DayOffStatus.Approved)}>Approve</button>
                <button className="btn btn-danger" onClick={() => handleDecision(DayOffStatus.Rejected)}>Reject</button>
                <button className="btn btn-secondary" onClick={() => setSelectedEvent(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {loading && <div className="mt-3">Loading...</div>}
    </div>
  );
};

export default PendingDayOffAdmin;