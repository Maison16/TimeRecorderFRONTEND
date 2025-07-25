import React, { useState, useEffect } from "react";
import axios from "axios";
import { apiURL } from "../../config";
import UserSelect from "../../components/UserSelect";
import type { UserDto } from "../../interfaces/types";

type ProjectDto = { id: string; name: string };

type SummaryDto = {
  totalWorkTimeMinutes: number;
  totalBreakTimeMinutes: number;
  workLogCount: number;
  breakCount: number;
  dayOffRequestCount: number;
  executedDaysOff: number;
  approvedDaysOff: number;
  rejectedDaysOff: number;
  pendingDaysOff: number;
  cancelledDaysOff: number;
};

const SummaryAdminPage: React.FC = () => {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectDto | null>(null);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [summary, setSummary] = useState<SummaryDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState("today");

  useEffect(() => {
    const now = new Date();
    if (range === "today") {
      setDateFrom(now.toISOString().slice(0, 10));
      setDateTo(now.toISOString().slice(0, 10));
    } else if (range === "week") {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay() + 1);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      setDateFrom(start.toISOString().slice(0, 10));
      setDateTo(end.toISOString().slice(0, 10));
    } else if (range === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setDateFrom(start.toISOString().slice(0, 10));
      setDateTo(end.toISOString().slice(0, 10));
    }
  }, [range]);

  useEffect(() => {
    axios.get(`${apiURL}/api/User`, { withCredentials: true })
      .then(res => setUsers(res.data))
      .catch(() => setUsers([]));
    axios.get(`${apiURL}/api/Project`, { withCredentials: true })
      .then(res => setProjects(res.data))
      .catch(() => setProjects([]));
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (selectedUser) params.userId = selectedUser.id;
      if (selectedProject) params.projectId = selectedProject.id;

      const res = await axios.get(`${apiURL}/api/Summary`, {
        params,
        withCredentials: true,
      });
      setSummary(res.data);
    } catch {
      alert("Error fetching summary");
      setSummary(null);
    }
    setLoading(false);
  };

  return (
    <div className="container pt-5" style={{ maxWidth: 800 }}>
      <h2 className="mb-4 text-center">Team/Employee/Project Summary</h2>
      <div className="row mb-3">
        <div className="col-md-3">
          <label>Date from</label>
          <input
            type="date"
            className="form-control"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <label>Date to</label>
          <input
            type="date"
            className="form-control"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <label>User</label>
          <select
            className="form-select"
            value={selectedUser?.id || ""}
            onChange={e => {
              const user = users.find(u => u.id === e.target.value) || null;
              setSelectedUser(user);
            }}
          >
            <option value="">All users</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name} {u.surname}</option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <label>Project</label>
          <select
            className="form-select"
            value={selectedProject?.id?.toString() || ""}
            onChange={e => {
              const proj = projects.find(p => p.id.toString() === e.target.value) || null;
              setSelectedProject(proj);
            }}
          >
            <option value="">All projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mb-3">
        <label>Range</label>
        <select className="form-select mb-2" value={range} onChange={e => setRange(e.target.value)}>
          <option value="today">Today</option>
          <option value="week">This week</option>
          <option value="month">This month</option>
          <option value="custom">Custom range</option>
        </select>
        {range === "custom" && (
          <>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </>
        )}
      </div>
      <button className="btn btn-primary mb-4 me-2" onClick={handleSearch} disabled={loading}>
        {loading ? "Loading..." : "Show Summary"}
      </button>
      <button
        className="btn btn-outline-success mb-4"
        onClick={() => {
          const params = [];
          if (dateFrom) params.push(`from=${dateFrom}`);
          if (dateTo) params.push(`to=${dateTo}`);
          const url = `${apiURL}/api/Summary/csv?${params.join("&")}`;
          window.open(url, "_blank");
        }}
      >
        Export CSV For Selected Range
      </button>
      {summary && (
        <div className="card p-3">
          <h5>Work Summary</h5>
          <ul>
            <li>Total Work Time: <b>{Math.floor(summary.totalWorkTimeMinutes / 60)}h {summary.totalWorkTimeMinutes % 60}min</b></li>
            <li>Total Break Time: <b>{Math.floor(summary.totalBreakTimeMinutes / 60)}h {summary.totalBreakTimeMinutes % 60}min</b></li>
            <li>Work Log Count: <b>{summary.workLogCount}</b></li>
            <li>Break Count: <b>{summary.breakCount}</b></li>
          </ul>
          <h5 className="mt-3">Day Off Summary</h5>
          <ul>
            <li>Day Off Requests: <b>{summary.dayOffRequestCount}</b></li>
            <li>Executed Days Off: <b>{summary.executedDaysOff}</b></li>
            <li>Approved Days Off: <b>{summary.approvedDaysOff}</b></li>
            <li>Rejected Days Off: <b>{summary.rejectedDaysOff}</b></li>
            <li>Pending Days Off: <b>{summary.pendingDaysOff}</b></li>
            <li>Cancelled Days Off: <b>{summary.cancelledDaysOff}</b></li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default SummaryAdminPage;