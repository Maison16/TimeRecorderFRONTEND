import React, { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import type { Event as RBCEvent } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, startOfDay } from "date-fns";
import { enUS } from "date-fns/locale";
import axios from "axios";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import Select from "react-select";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-datepicker/dist/react-datepicker.css";
import "react-tabs/style/react-tabs.css";
import { apiURL } from "../config";
import { DayOffStatus } from "../enums/DayOffStatus";
import Modal from "react-modal";
import qs from "qs";

interface DayOffRequestDto {
  id: number;
  dateStart: string;
  dateEnd: string;
  reason?: string;
  status: DayOffStatus;
}
interface CalendarEvent extends RBCEvent {
  id: number;
  status: DayOffStatus;
}
interface UserDto {
  id: string;
  name: string;
  surname: string;
  email: string;
}
const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const DayOffCalendar = () => {
  const token = localStorage.getItem("access_token");
  const api = axios.create({
    baseURL: apiURL,
    headers: { Authorization: `Bearer ${token}` },
  });
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);
  const [myEvents, setMyEvents] = useState<CalendarEvent[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date } | null>(null);
  const [reason, setReason] = useState("");

  const Legend = () => (
    <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", justifyContent: "center" }}>
      <LegendItem color="#4ade80" label="Approved" />
      <LegendItem color="#facc15" label="Pending" />
      <LegendItem color="#f87171" label="Rejected" />
      <LegendItem color="#6b7280" label="Executed" />
      <LegendItem color="#000000" label="Cancelled" />
    </div>
  );

  const LegendItem = ({ color, label }: { color: string; label: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <div style={{ width: 16, height: 16, backgroundColor: color, borderRadius: 4 }} />
      <span>{label}</span>
    </div>
  );

  useEffect(() => {
    api.get<UserDto[]>("api/User").then((r) => setUsers(r.data));
    fetchMyEvents();
  }, []);
  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    const today = startOfDay(new Date());
    if (start < today) {
      alert("You cannot select a date in the past.");
      return;
    }
    setSelectedRange({ start, end });
  };




  function stripTimeZone(dateStr: string): Date {
    const date = new Date(dateStr);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function mapToEvents(data: DayOffRequestDto[]): CalendarEvent[] {
    return data.map((e) => {
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
      };
    });
  }
  const cancelEvent = async (event: CalendarEvent) => {
    try {
      await api.post(`api/DayOff/cancel/${event.id}`);
      setSelectedEvent(null);
      if (tabIndex === 0) {
        fetchMyEvents();
      } else if (tabIndex === 1 && selectedUser) {
        fetchEventsFor(selectedUser.id);
      }
    } catch (e) {
      alert("Błąd podczas anulowania zgłoszenia.");
    }
  };
  const fetchMyEvents = () =>
    api
      .get<DayOffRequestDto[]>("api/DayOff/user")
      .then((r) => setMyEvents(mapToEvents(r.data)));

  const fetchEventsFor = (userId: string) =>
    api.get<DayOffRequestDto[]>("api/DayOff/filter", {
      params: {
        userId,
        statuses: [DayOffStatus.Approved, DayOffStatus.Executed],
      },
      paramsSerializer: (params) =>
        qs.stringify(params, { arrayFormat: "repeat" }),
    }).then((r) => setEvents(mapToEvents(r.data)));

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };
  const submitSelectedRange = async () => {
    if (!selectedRange) return;
    await api.post("api/DayOff", null, {
      params: {
        dateStart: formatDate(selectedRange.start),
        dateEnd: formatDate(new Date(selectedRange.end.getTime() - 1)),
        reason,
      },
    });

    setReason("");
    setSelectedRange(null);
    fetchMyEvents();
  };



  const eventStyleGetter = (ev: CalendarEvent) => {
    let bg = "#ddd";
    if (ev.status === DayOffStatus.Approved) bg = "#4ade80";
    else if (ev.status === DayOffStatus.Pending) bg = "#facc15";
    else if (ev.status === DayOffStatus.Rejected) bg = "#f87171";
    else if (ev.status === DayOffStatus.Executed) bg = "#6b7280";
    else if (ev.status === DayOffStatus.Cancelled) bg = "#000000";

    return {
      style: {
        backgroundColor: bg,
        borderRadius: "6px",
        color: ev.status === DayOffStatus.Cancelled ? "#fff" : "#000",
        padding: "2px 4px",
      },
    };
  };



  return (
    <Tabs selectedIndex={tabIndex} onSelect={(i) => setTabIndex(i)}>
      <TabList>
        <Tab>My Calendar</Tab>
        <Tab>Team Calendar</Tab>
      </TabList>

      <TabPanel>
        <div style={{ width: "100%", maxWidth: "1400px", margin: "0 auto" }}>
          <Legend />
          <Calendar
            selectable
            onSelectSlot={handleSelectSlot}
            localizer={localizer}
            events={myEvents}
            startAccessor="start"
            endAccessor="end"
            views={["month"]}
            view="month"
            date={calendarDate}
            onNavigate={(date) => setCalendarDate(date)}
            style={{ height: 600, width: 900 }}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={(event) => {
              const today = new Date();
              const ev = event as CalendarEvent;

              if (ev.end && ev.end > startOfDay(today)) {
                setSelectedEvent(ev);
              }
            }}
          />
        </div>
      </TabPanel>

      <Modal
        isOpen={!!selectedRange}
        onRequestClose={() => setSelectedRange(null)}
        contentLabel="Day Off Reason"
        ariaHideApp={false}
        style={{
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 1000,
          },
          content: {
            top: "50%",
            left: "50%",
            right: "auto",
            bottom: "auto",
            marginRight: "-50%",
            transform: "translate(-50%, -50%)",
            padding: "2rem",
            borderRadius: "8px",
            border: "1px solid #ccc",
            boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
            maxWidth: "fit-content",
            width: "90%",

            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
          },
        }}
      >
        <h2 style={{ whiteSpace: "nowrap", textAlign: "center" }}>
          Reason for day off (optional):
        </h2>

        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter reason"
          style={{ width: "100%", maxWidth: "300px", textAlign: "center" }}
        />

        <div style={{ display: "flex", gap: "1rem" }}>
          <button onClick={submitSelectedRange}>Submit</button>
          <button onClick={() => setSelectedRange(null)}>Close</button>
        </div>
      </Modal>



      <TabPanel>
        <div style={{ width: "100%", maxWidth: "1400px", margin: "0 auto" }}>
          <div style={{ marginBottom: "1rem" }}>
            <Select<UserDto>
              options={users}
              getOptionLabel={(u) => `${u.name} ${u.surname}`}
              getOptionValue={(u) => u.id}
              value={selectedUser}
              onChange={(u) => {
                setSelectedUser(u || null);
                u && fetchEventsFor(u.id);
              }}
              placeholder="Select user..."
              menuPortalTarget={document.body}
              styles={{
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              }}
              menuPosition="fixed"
            />
          </div>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            views={["month"]}
            view="month"
            date={calendarDate}
            onNavigate={(date) => setCalendarDate(date)}
            style={{ height: 600, width: 900 }}
            eventPropGetter={eventStyleGetter}
          />
        </div>
      </TabPanel>
      <Modal
        isOpen={!!selectedEvent}
        onRequestClose={() => setSelectedEvent(null)}
        contentLabel="Szczegóły zgłoszenia"
        ariaHideApp={false}
        style={{
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 1000,
          },
          content: {
            top: "50%",
            left: "50%",
            right: "auto",
            bottom: "auto",
            marginRight: "-50%",
            transform: "translate(-50%, -50%)",
            padding: "2rem",
            borderRadius: "8px",
            border: "1px solid #ccc",
            boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
            maxWidth: "400px",
            width: "90%",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            alignItems: "center",
          },
        }}
      >
        {selectedEvent && (
          <>
            <h2>Details</h2>
            <p><strong>From:</strong> {selectedEvent.start ? selectedEvent.start.toLocaleDateString() : "no date"}</p>
            <p><strong>To:</strong> {selectedEvent.end ? new Date(selectedEvent.end.getTime() - 1).toLocaleDateString() : "no date"}</p>
            <p><strong>Status:</strong> {selectedEvent.status ?? "no status"}</p>
            <p><strong>Reason:</strong> {typeof selectedEvent.title === "string" ? selectedEvent.title.replace(/\n/g, "<br />") : "no title"}</p>
            <button onClick={() => cancelEvent(selectedEvent)}>Cancel Request</button>
            <button onClick={() => setSelectedEvent(null)}>Close</button>
          </>
        )}

      </Modal>
    </Tabs>

  );
};

export default DayOffCalendar;
