import React, { useEffect, useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import axios from "axios";
import { apiURL } from "../config";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-tabs/style/react-tabs.css";
import UserSelect from "../components/UserSelect";
import { UserDto } from "../interfaces/types";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

type WorkLogDto = {
  id: number;
  startTime: string;
  endTime?: string;
  status: number;
  type: number;
  userId: string;
  duration?: number;
  userName?: string;
  userSurname?: string;
};

type CalendarEvent = {
  id: number;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  type: number;
  status: number;
  userName?: string;
  userSurname?: string;
};

const eventStyleGetter = (event: CalendarEvent) => {
  let bg = "#60a5fa"; // niebieski
  if (event.type === 5) bg = "#facc15"; // break - żółty
  if (event.type === 0) bg = "#22c55e"; // finished - zielony
  if (event.status === 5) bg = "#f87171"; // requires attention - czerwony
  return {
    style: {
      backgroundColor: bg,
      borderRadius: "6px",
      color: "#222",
      padding: "2px 4px",
      fontWeight: "bold",
    },
  };
};

const mapToEvents = (data: WorkLogDto[]): CalendarEvent[] =>
  data.map((log) => ({
    id: log.id,
    title: `${log.type === 0 ? "Work" : "Break"}${log.userName ? " - " + log.userName : ""}`,
    start: new Date(log.startTime),
    end: log.endTime ? new Date(log.endTime) : new Date(log.startTime),
    type: log.type,
    status: log.status,
    userName: log.userName,
    userSurname: log.userSurname,
  }));

const WorkLogCalendarPage: React.FC = () => {
  const [myEvents, setMyEvents] = useState<CalendarEvent[]>([]);
  const [teamEvents, setTeamEvents] = useState<CalendarEvent[]>([]);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const myRes = await axios.get(`${apiURL}/api/WorkLog/filter`, { withCredentials: true });
        setMyEvents(mapToEvents(myRes.data));
        const usersRes = await axios.get(`${apiURL}/api/User`, { withCredentials: true });
        setUsers(usersRes.data);
        setTeamEvents([]);
      } catch (e) {
        setMyEvents([]);  
        setTeamEvents([]);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);
  const fetchTeamLogs = async (userId: string) => {
    setLoading(true);
    try {
      const res = await axios.get(`${apiURL}/api/WorkLog/filter?userId=${userId}`, { withCredentials: true });
      setTeamEvents(mapToEvents(res.data));
    } catch {
      setTeamEvents([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container pt-5" style={{ maxWidth: 1400 }}>
      <h2 className="mb-4 text-center">WorkLog Calendar</h2>
      <Tabs>
        <TabList>
          <Tab>My WorkLogs</Tab>
          <Tab>Team WorkLogs</Tab>
        </TabList>
        <TabPanel>
          <Calendar
            localizer={localizer}
            events={myEvents}
            startAccessor="start"
            endAccessor="end"
            views={["day"]}
            view="day"
            date={calendarDate}
            onNavigate={setCalendarDate}
            style={{ height: 600, width: 900 }}
            eventPropGetter={eventStyleGetter}
            step={30}
            timeslots={2}
          />
        </TabPanel>
        <TabPanel>
          <div style={{ marginBottom: 16 }}>
            <UserSelect
              users={users}
              selectedUser={selectedUser}
              onChange={user => {
                setSelectedUser(user);
                if (user) fetchTeamLogs(user.id);
                else setTeamEvents([]);
              }}
            />
          </div>
          <Calendar
            localizer={localizer}
            events={teamEvents}
            startAccessor="start"
            endAccessor="end"
            views={["day"]}
            view="day"
            date={calendarDate}
            onNavigate={setCalendarDate}
            style={{ height: 600, width: 900 }}
            eventPropGetter={eventStyleGetter}
            step={30}
            timeslots={2}
          />
        </TabPanel>
      </Tabs>
    </div>
  );
};

export default WorkLogCalendarPage;