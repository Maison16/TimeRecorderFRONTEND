import React, { useState, useEffect } from "react";
import axios from "axios";
import { apiURL } from "../../config";

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
  const [userId, setUserId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [names, setNames] = useState<string[]>([]);
  const [surnames, setSurnames] = useState<string[]>([]);
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

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (userId) params.userId = userId;
      if (projectId) params.projectId = projectId;
      if (names.length > 0) params.names = names;
      if (surnames.length > 0) params.surnames = surnames;

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
          <label>User ID</label>
          <input
            type="text"
            className="form-control"
            value={userId}
            onChange={e => setUserId(e.target.value)}
            placeholder="User ID"
          />
        </div>
        <div className="col-md-3">
          <label>Project ID</label>
          <input
            type="text"
            className="form-control"
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
            placeholder="Project ID"
          />
        </div>
      </div>
      <div className="row mb-3">
        <div className="col-md-6">
          <label>Names (comma separated)</label>
          <input
            type="text"
            className="form-control"
            value={names.join(",")}
            onChange={e => setNames(e.target.value.split(",").map(n => n.trim()).filter(Boolean))}
            placeholder="e.g. Jan,Anna"
          />
        </div>
        <div className="col-md-6">
          <label>Surnames (comma separated)</label>
          <input
            type="text"
            className="form-control"
            value={surnames.join(",")}
            onChange={e => setSurnames(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
            placeholder="e.g. Kowalski,Nowak"
          />
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
      <button className="btn btn-primary mb-4" onClick={handleSearch} disabled={loading}>
        {loading ? "Loading..." : "Show Summary"}
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