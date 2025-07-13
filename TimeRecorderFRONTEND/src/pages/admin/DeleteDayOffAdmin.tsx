import React, { useEffect, useState } from "react";
import axios from "axios";
import qs from "qs";
import { apiURL } from "../../config";
import { DayOffStatus } from "../../enums/DayOffStatus";
import { DayOffRequestDto } from "../../interfaces/types";

const statusOptions = [
    { value: "", label: "All" },
    { value: DayOffStatus.Pending, label: "Pending" },
    { value: DayOffStatus.Approved, label: "Approved" },
    { value: DayOffStatus.Rejected, label: "Rejected" },
    { value: DayOffStatus.Cancelled, label: "Cancelled" },
    { value: DayOffStatus.Executed, label: "Executed" },
];

const DeleteDayOffAdmin: React.FC = () => {
    const [requests, setRequests] = useState<DayOffRequestDto[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [status, setStatus] = useState<string>("");
    const [userId, setUserId] = useState<string>("");
    const [name, setName] = useState<string>("");
    const [surname, setSurname] = useState<string>("");
    const [dateStart, setDateStart] = useState<string>("");
    const [dateEnd, setDateEnd] = useState<string>("");
    const [loading, setLoading] = useState(false);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (userId) params.userId = userId;
            if (name) params.Name = name;
            if (surname) params.Surname = surname;
            if (status) params.statuses = [status];
            if (dateStart) params.dateStart = dateStart;
            if (dateEnd) params.dateEnd = dateEnd;

            const res = await axios.get<DayOffRequestDto[]>(`${apiURL}/api/DayOff/filter`, {
                params,
                paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "repeat" }),
                withCredentials: true,
            });
            setRequests(res.data);
        } catch {
            alert("Error fetching requests");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchRequests();
        // eslint-disable-next-line
    }, []);

    const handleSelect = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const handleDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm("Are you sure you want to delete selected requests?")) return;
        setLoading(true);
        try {
            await Promise.all(
                selectedIds.map((id) =>
                    axios.delete(`${apiURL}/api/DayOff/${id}`, { withCredentials: true })
                )
            );
            setSelectedIds([]);
            fetchRequests();
        } catch {
            alert("Error deleting requests");
        }
        setLoading(false);
    };

    return (
    <div className="container pt-5" style={{ minHeight: "100vh" }}>
        <h2 className="mb-4 text-center">Delete Day Off Requests</h2>
        <div className="d-flex justify-content-center mb-4 gap-3">
            <button className="btn btn-primary" onClick={fetchRequests}>Search</button>
            <button className="btn btn-danger" onClick={handleDelete} disabled={selectedIds.length === 0 || loading}>
                Delete Selected
            </button>
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
                    value={dateStart}
                    onChange={(e) => setDateStart(e.target.value)}
                />
            </div>
            <div className="col-md-2">
                <input
                    type="date"
                    className="form-control"
                    value={dateEnd}
                    onChange={(e) => setDateEnd(e.target.value)}
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
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Start</th>
                    <th>End</th>
                </tr>
            </thead>
            <tbody>
                {requests.map((req) => (
                    <tr key={req.id}>
                        <td>
                            <input
                                type="checkbox"
                                checked={selectedIds.includes(req.id)}
                                onChange={() => handleSelect(req.id)}
                            />
                        </td>
                        <td>{req.id}</td>
                        <td>{req.userId}</td>
                        <td>{req.reason}</td>
                        <td>{req.status}</td>
                        <td>{new Date(req.dateStart).toLocaleDateString()}</td>
                        <td>{new Date(req.dateEnd).toLocaleDateString()}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);
};

export default DeleteDayOffAdmin;