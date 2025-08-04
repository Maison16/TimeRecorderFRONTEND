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

const statusText = (status: number) => {
    switch (status) {
        case DayOffStatus.Pending: return "Pending";
        case DayOffStatus.Approved: return "Approved";
        case DayOffStatus.Rejected: return "Rejected";
        case DayOffStatus.Cancelled: return "Cancelled";
        case DayOffStatus.Executed: return "Executed";
        default: return "Unknown";
    }
};

const DeleteDayOffAdmin: React.FC = () => {
    const [requests, setRequests] = useState<DayOffRequestDto[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [status, setStatus] = useState<string>("");
    const [userId, setUserId] = useState<string>("");
    const [name, setName] = useState<string>("");
    const [surname, setSurname] = useState<string>("");
    const [dateStart, setDateStart] = useState<string>("");
    const [dateEnd, setDateEnd] = useState<string>("");
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [, setTotalCount] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<"delete" | "restore">("delete");

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
            params.isdDeleted = view === "restore";
            params.pageNumber = pageNumber;
            params.pageSize = pageSize;

            const res = await axios.get<DayOffRequestDto[]>(`${apiURL}/api/DayOff/filter`, {
                params,
                paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "repeat" }),
                withCredentials: true,
            });
            setRequests(res.data);

            const totalCountHeader = res.headers['x-total-count'];
            if (totalCountHeader) {
                setTotalCount(parseInt(totalCountHeader));
            } else {
                if (res.data.length === pageSize) {
                    setTotalCount((pageNumber * pageSize) + 1);
                } else {
                    setTotalCount((pageNumber - 1) * pageSize + res.data.length);
                }
            }
        } catch {
            alert("Error fetching requests");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchRequests();
        // eslint-disable-next-line
    }, [view, pageNumber, pageSize]);

    const handlePageChange = (newPage: number) => {
        setPageNumber(newPage);
        setSelectedIds([]);
    };

    const handlePageSizeChange = (newPageSize: number) => {
        setPageSize(newPageSize);
        setPageNumber(1);
        setSelectedIds([]);
    };

    const hasNextPage = requests.length === pageSize;
    const hasPrevPage = pageNumber > 1;

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

    const handleRestore = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm("Are you sure you want to restore selected requests?")) return;
        setLoading(true);
        try {
            await Promise.all(
                selectedIds.map((id) =>
                    axios.post(`${apiURL}/api/DayOff/restore/${id}`, {}, { withCredentials: true })
                )
            );
            setSelectedIds([]);
            fetchRequests();
        } catch {
            alert("Error restoring requests");
        }
        setLoading(false);
    };

    return (
        <div className="container pt-5" style={{ minHeight: "100vh" }}>
            <h2 className="mb-4 text-center">
                {view === "delete" ? "Delete Day Off Requests" : "Restore Deleted Day Off Requests"}
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
                <button className="btn btn-secondary" onClick={() => {
                    setPageNumber(1);
                    fetchRequests();
                }}>Search</button>
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
                        <th>Name</th>         
                        <th>Surname</th>      
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
                            <td>{req.userName ?? "-"}</td>
                            <td>{req.userSurname ?? "-"}</td>
                            <td>{req.reason}</td>
                            <td>{statusText(req.status)}</td>
                            <td>{new Date(req.dateStart).toLocaleDateString()}</td>
                            <td>{new Date(req.dateEnd).toLocaleDateString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="d-flex justify-content-between align-items-center mt-4">
                <div className="d-flex align-items-center gap-2">
                    <span>Rows per page:</span>
                    <select 
                        className="form-select form-select-sm" 
                        style={{ width: "auto" }}
                        value={pageSize} 
                        onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>
                <div className="d-flex align-items-center gap-3">
                    <span>
                        {requests.length > 0 
                            ? `${(pageNumber - 1) * pageSize + 1}-${(pageNumber - 1) * pageSize + requests.length}`
                            : "No records"
                        }
                    </span>
                    <div className="btn-group">
                        <button 
                            className="btn btn-outline-secondary btn-sm" 
                            onClick={() => handlePageChange(pageNumber - 1)}
                            disabled={!hasPrevPage || loading}
                        >
                            Previous
                        </button>
                        <span className="btn btn-outline-secondary btn-sm disabled">
                            Page {pageNumber}
                        </span>
                        <button 
                            className="btn btn-outline-secondary btn-sm" 
                            onClick={() => handlePageChange(pageNumber + 1)}
                            disabled={!hasNextPage || loading}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteDayOffAdmin;