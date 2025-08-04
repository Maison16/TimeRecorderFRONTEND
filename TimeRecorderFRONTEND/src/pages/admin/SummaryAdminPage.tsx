import React, { useState, useEffect } from "react";
import axios from "axios";
import qs from "qs";
import { apiURL } from "../../config";
import UserMultiSelect from "../../components/UserMultiSelect";
import type { SummaryListDto, SummaryDto, UserDto } from "../../interfaces/types";

type ProjectDto = { id: string; name: string };

const ALL_USERS_OPTION: UserDto = {
  id: "",
  name: "Wszyscy",
  email: "",
  surname: "",
};

const SummaryAdminPage: React.FC = () => {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [users, setUsers] = useState<UserDto[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectDto | null>(null);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [summary, ] = useState<SummaryDto | null>(null);
  const [dailySummaries, setDailySummaries] = useState<SummaryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState("today");
  const [selectedUsers, setSelectedUsers] = useState<UserDto[]>([]);

  function formatDateLocal(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  useEffect(() => {
    const now = new Date();
    if (range === "today") {
      setDateFrom(formatDateLocal(now));
      setDateTo(formatDateLocal(now));
    } else if (range === "week") {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay() + 1);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      setDateFrom(formatDateLocal(start));
      setDateTo(formatDateLocal(end));
    } else if (range === "month") {
      const year = now.getFullYear();
      const month = now.getMonth();
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      setDateFrom(formatDateLocal(start));
      setDateTo(formatDateLocal(end));
    }
  }, [range]);

  useEffect(() => {
    axios.get(`${apiURL}/api/User`, { withCredentials: true })
      .then(res => setUsers([ALL_USERS_OPTION, ...res.data]))
      .catch(() => setUsers([ALL_USERS_OPTION]));
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
      if (selectedUsers.length > 0) params.usersId = selectedUsers.map(u => u.id); 
      if (selectedProject) params.projectId = selectedProject.id;
      console.log("Fetching summary with params:", params);
      const res = await axios.get<SummaryListDto>(`${apiURL}/api/Summary/daily`, {
        params,
        paramsSerializer: params => qs.stringify(params, { arrayFormat: "repeat" }),
        withCredentials: true,
      });
      setDailySummaries(res.data.summaries);
    } catch {
      alert("Error fetching summary");
      setDailySummaries([]);
    }
    setLoading(false);
  };

  const groupedSummaries = dailySummaries.reduce((acc, curr) => {
    const key = curr.userEmail ?? "";
    if (!acc[key]) acc[key] = [];
    acc[key].push(curr);
    return acc;
  }, {} as Record<string, SummaryDto[]>);

  const getUserTotalWork = (summaries: SummaryDto[]) =>
    summaries.reduce((sum, s) => sum + s.totalWorkTimeMinutes, 0);

  const getUserTotalBreak = (summaries: SummaryDto[]) =>
    summaries.reduce((sum, s) => sum + s.totalBreakTimeMinutes, 0);

  return (
    <div className="container pt-5" style={{ maxWidth: 1100 }}>
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
          <label>Users</label>
          <UserMultiSelect
            users={users}
            selectedUsers={selectedUsers}
            onChange={setSelectedUsers}
            noUsersSelectedText="All users selected"
          />
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
      {dailySummaries.length > 0 && (
        <div className="card p-3 mt-3">
          <h5>Daily Work Summary</h5>
          <div style={{ overflowX: "auto" }}>
            <table className="table table-bordered table-sm">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>User</th>
                  <th>Email</th>
                  <th>Work Time</th>
                  <th>Break Time</th>
                  <th>Work Logs</th>
                  <th>Breaks</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedSummaries).map(([email, group]) => (
                  <React.Fragment key={email}>
                    <tr style={{ background: "#f3f4f6", fontWeight: "bold" }}>
                      <td colSpan={1}></td>
                      <td>
                        {group[0].userName} {group[0].userSurname}
                      </td>
                      <td>{email}</td>
                      <td>
                        {Math.floor(getUserTotalWork(group) / 60)}h {getUserTotalWork(group) % 60}min
                      </td>
                      <td>
                        {Math.floor(getUserTotalBreak(group) / 60)}h {getUserTotalBreak(group) % 60}min
                      </td>
                      <td colSpan={2}>Total</td>
                    </tr>
                    {group.map(s => (
                      <tr key={s.date + email}>
                        <td>{new Date(s.date).toLocaleDateString()}</td>
                        <td>{s.userName} {s.userSurname}</td>
                        <td>{s.userEmail}</td>
                        <td>{Math.floor(s.totalWorkTimeMinutes / 60)}h {s.totalWorkTimeMinutes % 60}min</td>
                        <td>{Math.floor(s.totalBreakTimeMinutes / 60)}h {s.totalBreakTimeMinutes % 60}min</td>
                        <td>{s.workLogCount}</td>
                        <td>{s.breakCount}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryAdminPage;