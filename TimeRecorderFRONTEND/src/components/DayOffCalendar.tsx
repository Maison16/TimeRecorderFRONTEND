import React, { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import type { Event as RBCEvent } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import axios from "axios";
import DatePicker from "react-datepicker";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import Select from "react-select";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-datepicker/dist/react-datepicker.css";
import "react-tabs/style/react-tabs.css";
import { apiURL } from "../config";

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

  const [tabIndex, setTabIndex] = useState(0);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);
  const [myEvents, setMyEvents] = useState<CalendarEvent[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [dateStart, setDateStart] = useState(new Date());
  const [dateEnd, setDateEnd] = useState(new Date());
  const [reason, setReason] = useState("");

  useEffect(() => {
    api.get<UserDto[]>("/User").then((r) => setUsers(r.data));
    fetchMyEvents();
  }, []);

  function mapToEvents(data: DayOffRequestDto[]): CalendarEvent[] {
    return data.map((e) => ({
      title: `${e.reason ?? "Day off"} (${e.status})`,
      start: new Date(e.dateStart),
      end: new Date(e.dateEnd),
      allDay: true,
      status: e.status,
    }));
  }

  const fetchMyEvents = () =>
    api
      .get<DayOffRequestDto[]>("/DayOff/user")
      .then((r) => setMyEvents(mapToEvents(r.data)));

  const fetchEventsFor = (userId: string) =>
    api
      .get<DayOffRequestDto[]>("/DayOff/user", { params: { userId } })
      .then((r) => setEvents(mapToEvents(r.data)));

  const submit = async () => {
    await api.post(
      "/DayOff",
      null,
      {
        params: {
          dateStart: dateStart.toISOString(),
          dateEnd: dateEnd.toISOString(),
          reason,
        },
      }
    );
    setReason("");
    setDateStart(new Date());
    setDateEnd(new Date());
    fetchMyEvents();
  };

  const eventStyleGetter = (ev: CalendarEvent) => {
    let bg = "#ddd";
    if (ev.status === "Approved") bg = "#4ade80";
    else if (ev.status === "Pending") bg = "#facc15";
    else bg = "#f87171";
    return {
      style: {
        backgroundColor: bg,
        borderRadius: "6px",
        color: "#000",
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
        <div className="controls">
          <DatePicker
            selected={dateStart}
            onChange={(d) => d && setDateStart(d)}
            popperPlacement="top-start"
          />
          <DatePicker
            selected={dateEnd}
            onChange={(d) => d && setDateEnd(d)}
            popperPlacement="top-start"
          />
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason"
          />
          <button onClick={submit}>Request Day Off</button>
        </div>
        <Calendar
          localizer={localizer}
          events={myEvents}
          startAccessor="start"
          endAccessor="end"
          views={["month"]}
          defaultView="month"
          style={{ height: 600 }}
          eventPropGetter={eventStyleGetter}
        />
      </TabPanel>

      <TabPanel>
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
        />
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          views={["month"]}
          defaultView="month"
          style={{ height: 600 }}
          eventPropGetter={eventStyleGetter}
        />
      </TabPanel>
    </Tabs>
  );
};

export default DayOffCalendar;
