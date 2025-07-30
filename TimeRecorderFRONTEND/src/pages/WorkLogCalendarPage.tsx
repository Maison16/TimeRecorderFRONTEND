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
import { UserDto, UserDtoWithRolesAndAuthStatus } from "../interfaces/types";
import { Modal, Button, Form } from "react-bootstrap";

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
  let bg = "#60a5fa";
  if (event.type === 5) bg = "#facc15";
  if (event.type === 0) bg = "#22c55e";
  if (event.status === 5) bg = "#f87171";
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

const WorkLogCalendarPage: React.FC<{ user: UserDtoWithRolesAndAuthStatus }> = ({ user }) => {
  const [myEvents, setMyEvents] = useState<CalendarEvent[]>([]);
  const [teamEvents, setTeamEvents] = useState<CalendarEvent[]>([]);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);
  const [editWorkLog, setEditWorkLog] = useState<CalendarEvent | null>(null);
  const [editForm, setEditForm] = useState<{ start: string; end: string; type: number; status: number }>({
    start: "",
    end: "",
    type: 0,
    status: 0,
  });
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Ustaw isAdmin na podstawie user.roles
  const isAdmin = user?.roles?.includes("Admin");

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

  const handleEventClick = (event: CalendarEvent) => {
    const toLocalInput = (date: Date) => {
      const pad = (n: number) => n.toString().padStart(2, "0");
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    setEditWorkLog(event);
    setEditForm({
      start: toLocalInput(event.start),
      end: toLocalInput(event.end),
      type: event.type,
      status: event.status,
    });
  };

  const handleSaveEdit = async () => {
    if (!editWorkLog) return;
    setSaving(true);
    try {
      await axios.put(`${apiURL}/api/WorkLog/${editWorkLog.id}`, {
        id: editWorkLog.id,
        startTime: editForm.start,
        endTime: editForm.end,
        type: editForm.type
      }, { withCredentials: true });
      setEditWorkLog(null);
      if (selectedUser) fetchTeamLogs(selectedUser.id);
      else setTeamEvents([]);
    } catch {
      alert("Error updating worklog");
    }
    setSaving(false);
  };

const handleDeleteWorkLog = async () => {
  if (!editWorkLog) return;
  setSaving(true);
  try {
    await axios.delete(`${apiURL}/api/WorkLog/${editWorkLog.id}`, { withCredentials: true });
    setEditWorkLog(null);
    setShowDeleteConfirm(false);
    if (selectedUser) {
      await fetchTeamLogs(selectedUser.id);
    } else {
      const myRes = await axios.get(`${apiURL}/api/WorkLog/filter`, { withCredentials: true });
      setMyEvents(mapToEvents(myRes.data));
      setTeamEvents([]);
    }
  } catch {
    alert("Error deleting worklog");
  }
  setSaving(false);
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
            onSelectEvent={handleEventClick}
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
            onSelectEvent={handleEventClick}
          />
        </TabPanel>
      </Tabs>

      {/* Modal do edycji workloga */}
      <Modal show={!!editWorkLog} onHide={() => setEditWorkLog(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit WorkLog</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Start</Form.Label>
              <Form.Control
                type="datetime-local"
                value={editForm.start}
                onChange={e => setEditForm(f => ({ ...f, start: e.target.value }))}
                disabled={!isAdmin}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>End</Form.Label>
              <Form.Control
                type="datetime-local"
                value={editForm.end}
                onChange={e => setEditForm(f => ({ ...f, end: e.target.value }))}
                disabled={!isAdmin}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Type</Form.Label>
              <Form.Select
                value={editForm.type}
                onChange={e => setEditForm(f => ({ ...f, type: Number(e.target.value) }))}
                disabled={!isAdmin}
              >
                <option value={0}>Work</option>
                <option value={5}>Break</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          {isAdmin && (
            <>
              <Button variant="danger" onClick={() => setShowDeleteConfirm(true)} disabled={saving}>
                Delete
              </Button>
              <Button variant="primary" onClick={handleSaveEdit} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </>
          )}
          <Button variant="secondary" onClick={() => setEditWorkLog(null)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal potwierdzenia usuwania */}
      <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this worklog?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
            Cancel
             </Button>
          <Button variant="danger" onClick={handleDeleteWorkLog} disabled={saving}>
            {saving ? "Deleting..." : "Delete"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default WorkLogCalendarPage;