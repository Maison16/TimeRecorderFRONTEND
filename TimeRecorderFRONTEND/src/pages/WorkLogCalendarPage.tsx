import React, { useEffect, useState} from "react";
import Timeline, { CustomMarker } from "react-calendar-timeline";
import "react-calendar-timeline/lib/Timeline.css";
import axios from "axios";
import { apiURL } from "../config";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import UserMultiSelect from "../components/UserMultiSelect";
import { UserDto, UserDtoWithRolesAndAuthStatus, ProjectDto } from "../interfaces/types";
import { Modal, Button, Form } from "react-bootstrap";
import { WorkLogType, WorkLogStatus } from "../enums/WorkLogEnums";
type WorkLogDto = {
  id: number;
  startTime: string;
  endTime?: string;
  status: number;
  type: number;
  userId: string;
  createdAt: string;
  duration?: number;
  userName?: string;
  userSurname?: string;
};

const mapToTimelineItems = (data: WorkLogDto[]) =>
  data.map((log) => {
    let background = "#22c55e";
    if (log.type === WorkLogType.Break) background = "#f87171";
    if (log.status === WorkLogStatus.RequiresAttention) background = "#fbbf24";
    console.log("Mapping work log:", log);
    return {
      id: log.id,
      group: log.userId,
      title: `${log.type === WorkLogType.Work ? "W" : "B"}`,
      start_time: new Date(log.startTime).getTime(),
      end_time: log.endTime
        ? new Date(log.endTime).getTime()
        : new Date().getTime(),
      type: log.type,
      status: log.status,
      userName: log.userName,
      userSurname: log.userSurname,
      createdAt: log.createdAt,
      duration: log.duration,
      itemProps: {
        style: {
          background,
          color: "#222",
          borderRadius: 6,
          fontWeight: "bold",
          border: "1px solid #000000ff",
        },
      },
    };
  });
const statusLabels: Record<number, string> = {
  [WorkLogStatus.Started]: "Started",
  [WorkLogStatus.RequiresAttention]: "Requires Attention",
  [WorkLogStatus.Finished]: "Finished",
};

const WorkLogCalendarPage: React.FC<{ user: UserDtoWithRolesAndAuthStatus }> = ({ user }) => {
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [teamEvents, setTeamEvents] = useState<any[]>([]);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [teamCalendarDate, setTeamCalendarDate] = useState(new Date());
  const [, setLoading] = useState(true);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [, setSelectedUser] = useState<UserDto | null>(
    user && typeof user.name === "string" && user.name !== null && typeof user.surname === "string" && user.surname !== null
      ? {
        id: user.id,
        name: user.name ?? "",
        surname: user.surname ?? "",
        email: user.email ?? "",
      }
      : null
  );
  const [selectedUsers, setSelectedUsers] = useState<UserDto[]>([]);
  const [editWorkLog, setEditWorkLog] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<{ start: string; end: string; type: number; status: number }>({
    start: "",
    end: "",
    type: 0,
    status: 0,
  });
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectDto | null>(null);

  const isAdmin = user?.roles?.includes("Admin");


  useEffect(() => {
    if (!user?.id) return;
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const dateStr = calendarDate.toISOString().slice(0, 10);
        const url = `${apiURL}/api/WorkLog/filter?userId=${user.id}&date=${dateStr}`;
        const myRes = await axios.get(url, { withCredentials: true });
        setMyEvents(mapToTimelineItems(myRes.data));
        const usersRes = await axios.get(`${apiURL}/api/User`, { withCredentials: true });
        setUsers(usersRes.data);
      } catch (e) {
        setMyEvents([]);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [user?.id, calendarDate]);

  useEffect(() => {
    if (selectedUsers.length > 0) {
      fetchTeamLogs(selectedUsers.map(user => user.id), teamCalendarDate);
    }
  }, [selectedUsers, teamCalendarDate]);

  useEffect(() => {
    if (user && typeof user.name === "string" && user.name !== null && typeof user.surname === "string" && user.surname !== null) {
      setSelectedUser({
        id: user.id,
        name: user.name ?? "",
        surname: user.surname ?? "",
        email: user.email ?? "",
      });
    } else {
      setSelectedUser(null);
    }
  }, [user]);

  useEffect(() => {
    axios.get(`${apiURL}/api/Project`, { withCredentials: true })
      .then(res => setProjects(res.data))
      .catch(() => setProjects([]));
  }, []);

  const fetchTeamLogs = async (userIds: string[], date: Date) => {
    setLoading(true);
    try {
      const res = await axios.post(
        `${apiURL}/api/WorkLog/filter-multi`,
        userIds,
        {
          params: {
            startDay: date.toISOString().slice(0, 10),
          },
          withCredentials: true,
        }
      );
      setTeamEvents(mapToTimelineItems(res.data));
    } catch {
      setTeamEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (itemId: number) => {
    const event =
      myEvents.find(e => e.id === itemId) ||
      teamEvents.find(e => e.id === itemId);

    if (!event) {
      alert("Event not found!");
      return;
    }
    console.log("Selected worklog:", event);
    const toLocalInput = (timestamp: number) => {
      const date = new Date(timestamp);
      const pad = (n: number) => n.toString().padStart(2, "0");
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };
    console.log("Editing worklog:", event);
    setEditWorkLog(event);
    console.log(editWorkLog);
    setEditForm({
      start: toLocalInput(event.start_time),
      end: toLocalInput(event.end_time),
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
      if (selectedUsers.length > 0) fetchTeamLogs(selectedUsers.map(user => user.id), calendarDate);
      else {
        const dateStr = calendarDate.toISOString().slice(0, 10);
        const myRes = await axios.get(
          `${apiURL}/api/WorkLog/filter?userId=${user.id}&date=${dateStr}`,
          { withCredentials: true }
        );
        setMyEvents(mapToTimelineItems(myRes.data));
        setTeamEvents([]);
      }
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
      if (selectedUsers.length > 0) {
        await fetchTeamLogs(selectedUsers.map(user => user.id), calendarDate);
      } else {
        const dateStr = calendarDate.toISOString().slice(0, 10);
        const myRes = await axios.get(
          `${apiURL}/api/WorkLog/filter?userId=${user.id}&date=${dateStr}`,
          { withCredentials: true }
        );
        setMyEvents(mapToTimelineItems(myRes.data));
        setTeamEvents([]);
      }
    } catch {
      alert("Error deleting worklog");
    }
    setSaving(false);
  };

  const handleProjectSelect = async (projectId: string) => {
    setSelectedProject(projects.find(p => p.id.toString() === projectId) || null);
    if (projectId) {
      const res = await axios.get<UserDto[]>(`${apiURL}/api/User/by-project/${projectId}`, { withCredentials: true });
      setSelectedUsers(res.data);
    } else {
      setSelectedUsers([]);
    }
  };


  const dayStart = new Date(calendarDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(calendarDate);
  dayEnd.setHours(23, 59, 59, 999);

  const teamDayStart = new Date(teamCalendarDate);
  teamDayStart.setHours(0, 0, 0, 0);
  const teamDayEnd = new Date(teamCalendarDate);
  teamDayEnd.setHours(23, 59, 59, 999);

  useEffect(() => {
    if (!window.hubConnection) return;

    const handler = (data: any) => {

      if (
        [
          "break_ended",
          "auto_work_ended",
          "work_ended",
          "work_started",
          "break_started"
        ].includes(data.status)
      ) {
        if (selectedUsers.length > 0) {
          fetchTeamLogs(selectedUsers.map(user => user.id), teamCalendarDate);
        } else {
          const dateStr = calendarDate.toISOString().slice(0, 10);
          axios
            .get(`${apiURL}/api/WorkLog/filter?userId=${user.id}&date=${dateStr}`, { withCredentials: true })
            .then(res => {
              setMyEvents(mapToTimelineItems(res.data));
              setTeamEvents([]);
            });
        }
      }
    };

    window.hubConnection.on("WorkLogStatusChanged", handler);

    return () => {
      if (window.hubConnection) {
        window.hubConnection.off("WorkLogStatusChanged", handler);
      }
    };
  }, [selectedUsers, teamCalendarDate, calendarDate, user?.id]);

  return (
    <div className="container pt-5" style={{ maxWidth: 1400 }}>
      <h2 className="mb-4 text-center">WorkLog Timeline</h2>
      <Tabs>
        <TabList>
          <Tab>My WorkLogs</Tab>
          <Tab>Team WorkLogs</Tab>
        </TabList>
        <TabPanel>
          <div style={{ marginBottom: 16 }}>
            <Form.Label>Choose day:</Form.Label>
            <Form.Control
              type="date"
              value={calendarDate.toISOString().slice(0, 10)}
              onChange={e => {
                const value = e.target.value;
                if (!value) return;
                const date = new Date(value);
                setCalendarDate(isNaN(date.getTime()) ? new Date() : date);
              }}
              style={{ maxWidth: 200 }}
            />
          </div>
          <Timeline
            key={calendarDate.toISOString() + myEvents.length}
            groups={[{ id: user.id, title: `${user.name} ${user.surname}` }]}
            items={myEvents}
            visibleTimeStart={dayStart.getTime()}
            visibleTimeEnd={dayEnd.getTime()}
            onItemClick={handleEventClick}
            canMove={false}
            canResize={false}
            sidebarWidth={120}
            lineHeight={32}
            onTimeChange={(start) => {
              setCalendarDate(new Date(start));
            }}
          >
            <CustomMarker date={Date.now()}>
              {({ styles }) => (
                <div
                  style={{
                    ...styles,
                    background: "red",
                    width: "2px",
                    height: "100%",
                    zIndex: 10,
                  }}
                />
              )}
            </CustomMarker>
          </Timeline>
        </TabPanel>
        <TabPanel>
          <div style={{ marginBottom: 16 }}>
            <Form.Label>Select project:</Form.Label>
            <Form.Select
              value={selectedProject?.id?.toString() || ""}
              onChange={e => handleProjectSelect(e.target.value)}
              style={{ maxWidth: 300, marginBottom: 8 }}
            >
              <option value="">Not choosen</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Form.Select>
            <UserMultiSelect
              users={users}
              selectedUsers={selectedUsers}
              onChange={setSelectedUsers}
            />
            <Form.Label>Choose day:</Form.Label>
            <Form.Control
              type="date"
              value={teamCalendarDate.toISOString().slice(0, 10)}
              onChange={e => {
                const value = e.target.value;
                if (!value) return;
                const date = new Date(value);
                setTeamCalendarDate(isNaN(date.getTime()) ? new Date() : date);
              }}
              style={{ maxWidth: 200 }}
            />
          </div>
          <Timeline
            key={teamCalendarDate.toISOString() + teamEvents.length}
            groups={selectedUsers.map(u => ({
              id: u.id,
              title: `${u.name} ${u.surname}`,
            }))}
            items={teamEvents}
            visibleTimeStart={teamDayStart.getTime()}
            visibleTimeEnd={teamDayEnd.getTime()}
            onItemClick={handleEventClick}
            canMove={false}
            canResize={false}
            sidebarWidth={120}
            lineHeight={32}
            onTimeChange={(start) => {
              setTeamCalendarDate(new Date(start));
            }}
          >
            <CustomMarker date={Date.now()}>
              {({ styles }) => (
                <div
                  style={{
                    ...styles,
                    background: "red",
                    width: "2px",
                    height: "100%",
                    zIndex: 10,
                  }}
                />
              )}
            </CustomMarker>
          </Timeline>
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
            <Form.Group>
              <Form.Label>Status</Form.Label>
              <div style={{ fontWeight: "bold", marginBottom: 8 }}>
                {statusLabels[editForm.status] ?? editForm.status}
              </div>
              {editForm.status === WorkLogStatus.RequiresAttention && editWorkLog?.createdAt && (
                <div style={{ color: "#d97706", marginBottom: 8 }}>
                  Created at: {new Date(editWorkLog.createdAt).toLocaleString()}
                </div>
              )}
              {typeof editWorkLog?.duration === "number" && (
                <div style={{ color: "#2563eb", marginBottom: 8 }}>
                  {editWorkLog.duration === 0
                    ? "Still in progress"
                    : editWorkLog.duration >= 60
                      ? `Duration: ${Math.floor(editWorkLog.duration / 60)} h ${editWorkLog.duration % 60} min`
                      : `Duration: ${editWorkLog.duration} min`}
                </div>
              )}
              {editWorkLog?.createdAt && editWorkLog?.start_time && editWorkLog.status === WorkLogStatus.RequiresAttention && (() => {
                const created = new Date(editWorkLog.createdAt);
                const started = new Date(editWorkLog.start_time);
                const sameHourMinute =
                  created.getHours() === started.getHours() &&
                  created.getMinutes() === started.getMinutes();
                return sameHourMinute ? (
                  <div style={{ color: "#dc2626", fontWeight: "bold", marginBottom: 8 }}>
                    Overtime
                  </div>
                ) : (
                  <div style={{ color: "#ea580c", fontWeight: "bold", marginBottom: 8 }}>
                    Past start
                  </div>
                );
              })()}
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
          {isAdmin && editForm.status === WorkLogStatus.RequiresAttention && (
            <>
              <Button
                variant="success"
                onClick={async () => {
                  setSaving(true);
                  try {
                    await axios.post(
                      `${apiURL}/api/WorkLog/confirm-past/${editWorkLog.id}`,
                      {},
                      { withCredentials: true }
                    );
                    setEditWorkLog(null);
                    if (selectedUsers.length > 0) fetchTeamLogs(selectedUsers.map(user => user.id), calendarDate);
                    else {
                      const dateStr = calendarDate.toISOString().slice(0, 10);
                      const myRes = await axios.get(
                        `${apiURL}/api/WorkLog/filter?userId=${user.id}&date=${dateStr}`,
                        { withCredentials: true }
                      );
                      setMyEvents(mapToTimelineItems(myRes.data));
                      setTeamEvents([]);
                    }
                  } catch {
                    alert("Error confirming worklog");
                  }
                  setSaving(false);
                }}
                disabled={saving}
                style={{ marginRight: 8 }}
              >
                Confirm
              </Button>
              <Button
                variant="warning"
                onClick={async () => {
                  setSaving(true);
                  try {
                    await axios.post(
                      `${apiURL}/api/WorkLog/reject-past/${editWorkLog.id}`,
                      {},
                      { withCredentials: true }
                    );
                    setEditWorkLog(null);
                    if (selectedUsers.length > 0) fetchTeamLogs(selectedUsers.map(user => user.id), calendarDate);
                    else {
                      const dateStr = calendarDate.toISOString().slice(0, 10);
                      const myRes = await axios.get(
                        `${apiURL}/api/WorkLog/filter?userId=${user.id}&date=${dateStr}`,
                        { withCredentials: true }
                      );
                      setMyEvents(mapToTimelineItems(myRes.data));
                      setTeamEvents([]);
                    }
                  } catch {
                    alert("Error rejecting worklog");
                  }
                  setSaving(false);
                }}
                disabled={saving}
              >
                Reject
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