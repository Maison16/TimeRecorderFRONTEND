import React, { useEffect, useState } from "react";
import axios from "axios";
import qs from "qs";
import { apiURL } from "../../config";
import { WorkLogType, WorkLogStatus } from "../../enums/WorkLogEnums";
import { WorkLogDto } from "../../interfaces/types";

const typeOptions = [
    { value: "", label: "All" },
    { value: WorkLogType.Work, label: "Work" },
    { value: WorkLogType.Break, label: "Break" },
];

const statusOptions = [
    { value: "", label: "All" },
    { value: WorkLogStatus.Started, label: "Started" },
    { value: WorkLogStatus.RequiresAttention, label: "Requires Attention" },
    { value: WorkLogStatus.Finished, label: "Finished" },
];

const typeText = (type: number) => {
    switch (type) {
        case WorkLogType.Work: return "Work";
        case WorkLogType.Break: return "Break";
        default: return "Unknown";
    }
};

const statusText = (status: number) => {
    switch (status) {
        case WorkLogStatus.Started: return "Started";
        case WorkLogStatus.RequiresAttention: return "Requires Attention";
        case WorkLogStatus.Finished: return "Finished";
        default: return "Unknown";
    }
};

const DeleteWorkLogAdmin: React.FC = () => {
    const [logs, setLogs] = useState<WorkLogDto[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [userId, setUserId] = useState<string>("");
    const [name, setName] = useState<string>("");        
    const [surname, setSurname] = useState<string>("");  
    const [type, setType] = useState<string>("");
    const [status, setStatus] = useState<string>("");
    const [startDay, setStartDay] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<"delete" | "restore">("delete");

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (userId) params.userId = userId;
            if (name) params.Name = name;         
            if (surname) params.Surname = surname;
            if (type !== "") params.type = type;
            if (status !== "") params.status = status;
            if (startDay) params.startDay = startDay;
            params.isDeleted = view === "restore";

            const res = await axios.get<WorkLogDto[]>(`${apiURL}/api/WorkLog/filter`, {
                params,
                paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "repeat" }),
                withCredentials: true,
            });
            setLogs(res.data);
        } catch {
            alert("Error fetching work logs");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchLogs();
    }, [view]);

    const handleSelect = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const handleDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm("Are you sure you want to delete selected work logs?")) return;
        setLoading(true);
        try {
            await Promise.all(
                selectedIds.map((id) =>
                    axios.delete(`${apiURL}/api/WorkLog/${id}`, { withCredentials: true })
                )
            );
            setSelectedIds([]);
            fetchLogs();
        } catch {
            alert("Error deleting work logs");
        }
        setLoading(false);
    };

    const handleRestore = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm("Are you sure you want to restore selected work logs?")) return;
        setLoading(true);
        try {
            await Promise.all(
                selectedIds.map((id) =>
                    axios.post(`${apiURL}/api/WorkLog/restore/${id}`, {}, { withCredentials: true })
                )
            );
            setSelectedIds([]);
            fetchLogs();
        } catch {
            alert("Error restoring work logs");
        }
        setLoading(false);
    };

    return (
        <div className="container pt-5" style={{ minHeight: "100vh" }}>
            <h2 className="mb-4 text-center">
                {view === "delete" ? "Delete Work Logs" : "Restore Deleted Work Logs"}
            </h2>
            <div className="d-flex justify-content-center mb-4 gap-3">
                <button
                    className={`btn ${view === "delete" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => setView("delete")}
                >
                    Delete
                </button>
                <button
                    className={`btn ${view === "restore" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => setView("restore")}
                >
                    Restore
                </button>
                <button className="btn btn-secondary" onClick={fetchLogs}>Search</button>
                {view === "delete" ? (
                    <button className="btn btn-danger" onClick={handleDelete} disabled={selectedIds.length === 0 || loading}>
                        Delete Selected
                    </button>
                ) : (
                    <button className="btn btn-success" onClick={handleRestore} disabled={selectedIds.length === 0 || loading}>
                        Restore Selected
                    </button>
                )}
            </div>
            <div className="mb-3 row">
                <div className="col-md-2">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="User ID"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                    />
                </div>
                <div className="col-md-2">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>
                <div className="col-md-2">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Surname"
                        value={surname}
                        onChange={(e) => setSurname(e.target.value)}
                    />
                </div>
                <div className="col-md-2">
                    <select
                        className="form-select"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                    >
                        {typeOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
                <div className="col-md-2">
                    <select
                        className="form-select"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                    >
                        {statusOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
                <div className="col-md-2">
                    <input
                        type="date"
                        className="form-control"
                        value={startDay}
                        onChange={(e) => setStartDay(e.target.value)}
                    />
                </div>
            </div>
            {loading && <div>Loading...</div>}
            <table className="table table-bordered table-hover">
                <thead>
                    <tr>
                        <th></th>
                        <th>ID</th>
                        <th>User ID</th>
                        <th>User Name</th>
                        <th>User Surname</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Start</th>
                        <th>End</th>
                        <th>Duration</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map((log) => (
                        <tr key={log.id}>
                            <td>
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(log.id)}
                                    onChange={() => handleSelect(log.id)}
                                />
                            </td>
                            <td>{log.id}</td>
                            <td>{log.userId}</td>
                            <td>{log.userName ?? "-"}</td>
                            <td>{log.userSurname ?? "-"}</td>
                            <td>{typeText(log.type)}</td>
                            <td>{statusText(log.status)}</td>
                            <td>{new Date(log.startTime).toLocaleString()}</td>
                            <td>{log.endTime ? new Date(log.endTime).toLocaleString() : "-"}</td>
                            <td>{log.duration ?? "-"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DeleteWorkLogAdmin;