import { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, startOfDay } from "date-fns";
import { enUS } from "date-fns/locale";
import axios from "axios";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import qs from "qs";
import { CalendarEvent, DayOffRequestDto, UserDto, UserDtoWithRolesAndAuthStatus } from "../interfaces/types";
import { DayOffStatus } from "../enums/DayOffStatus";
import { apiURL } from "../config";
import Legend from "./Legend";
import DayOffModal from "./DayOffModal";
import EventDetailsModal from "./EventDetailsModal";
import UserSelect from "./UserSelect";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-datepicker/dist/react-datepicker.css";
import "react-tabs/style/react-tabs.css";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const DayOffCalendar: React.FC<{ user: UserDtoWithRolesAndAuthStatus }> = ({ user }) => {
  const api = axios.create({
    baseURL: apiURL,
    withCredentials: true,
  });
  // Stan
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);
  const [myEvents, setMyEvents] = useState<CalendarEvent[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date } | null>(null);
  const [reason, setReason] = useState("");
  useEffect(() => {
    api.get<UserDto[]>("api/User").then((r) => setUsers(r.data));
    fetchMyEvents();
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
        title: e.reason && e.reason.trim() ? e.reason : "-No reason-",
        start,
        end: fixedEnd,
        allDay: true,
        status: e.status,
        id: e.id,
      };
    });
  const fetchMyEvents = () =>
    api
      .get<DayOffRequestDto[]>("api/DayOff/user",
      )
      .then((r) => setMyEvents(mapToEvents(r.data)));

  const fetchEventsFor = (userId: string) =>
    api
      .get<DayOffRequestDto[]>("api/DayOff/filter", {
        params: {
          userId,
          statuses: [DayOffStatus.Approved, DayOffStatus.Executed],
        },
        paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "repeat" }),
      })
      .then((r) => setEvents(mapToEvents(r.data)));

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    const today = startOfDay(new Date());
    if (start < today) {
      alert("You cannot select a date in the past.");
      return;
    }
    setSelectedRange({ start, end });
  };

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const submitSelectedRange = async () => {
    if (!selectedRange) return;
    try {

      await api.post("api/DayOff", {
        dateStart: formatDate(selectedRange.start),
        dateEnd: formatDate(new Date(selectedRange.end.getTime() - 1)),
        reason
      });
    } catch (e: any) {
      let errorMessage = "Error during request.";
      if (e.response) {
        console.log('Validation error response:', e.response);
      }
      if (e.response && e.response.data) {
        const data = e.response.data;
        if (Array.isArray(data.errors)) {
          errorMessage = data.errors.join("\n");
        } else if (typeof data === "string") {
          errorMessage = data;
        } else if (data.errors) {
          errorMessage = Object.values(data.errors).flat().join("\n");
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.detail) {
          errorMessage = data.detail;
        }
      } else if (e.message) {
        errorMessage = e.message;
      }
      alert(errorMessage);
      return;
    }
    setReason("");
    setSelectedRange(null);
    fetchMyEvents();
  };

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
      alert("Error during canel.");
    }
  };
  const editEvent = async (id: number, newStartDate: Date, newEndDate: Date, newReason: string): Promise<boolean> => {
    try {
      const response = await api.put(`api/DayOff/${id}`, null, {
        params: {
          newStartDate: formatDate(newStartDate),
          newEndDate: formatDate(newEndDate),
          newReason: newReason,
        },
      });

      if (response.status === 200) {
        alert("Day off request edited successfully!");
        setSelectedEvent(null);
        if (tabIndex === 0) {
          fetchMyEvents();
        } else if (tabIndex === 1 && selectedUser) {
          fetchEventsFor(selectedUser.id);
        }
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Error editing day off request:", error.response?.data || error.message);
      const errorMessage = error.response?.data?.error || "Failed to edit request. Please check your dates and reason.";
      alert(errorMessage);
      return false;
    }
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

  const isAdmin = user?.roles?.includes("Admin");

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
            onNavigate={setCalendarDate}
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

      <TabPanel>
        <div style={{ width: "100%", maxWidth: "1400px", margin: "0 auto" }}>
          <div style={{ marginBottom: "1rem" }}>
            <UserSelect
              users={users}
              selectedUser={selectedUser}
              onChange={(user) => {
                setSelectedUser(user);
                user && fetchEventsFor(user.id);
              }}
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
            onNavigate={setCalendarDate}
            style={{ height: 600, width: 900 }}
            eventPropGetter={eventStyleGetter}
          />
        </div>
      </TabPanel>

      <DayOffModal
        isOpen={!!selectedRange}
        reason={reason}
        setReason={setReason}
        onSubmit={submitSelectedRange}
        onClose={() => {
          setSelectedRange(null); 
          setReason("");         
        }}
      />

      <EventDetailsModal
        event={selectedEvent}
        onClose={() => {
          setSelectedEvent(null);
        }}
        onCancel={cancelEvent}
        onEdit={editEvent}

      />
    </Tabs>
  );
};

export default DayOffCalendar;
