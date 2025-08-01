import React, { useEffect, useState } from "react";
import axios from "axios";
import { apiURL } from "../config";
import { UserDtoWithRolesAndAuthStatus } from "../interfaces/types";

const UserProfilePage: React.FC<{ user: UserDtoWithRolesAndAuthStatus }> = ({ user }) => {
    const [profile, setProfile] = useState<any>(null);
    const [summary, setSummary] = useState<any>(null);
    const [project, setProject] = useState<any>(null);
    const [monthSummary, setMonthSummary] = useState<any>(null);
    const [yearSummary, setYearSummary] = useState<any>(null);
    useEffect(() => {
        setProfile(user);
        if (user?.id) {
            axios.get(`${apiURL}/api/User/${user.id}/project`, { withCredentials: true })
                .then(r => setProject(r.data))
                .catch(() => setProject(null));
            axios.get(`${apiURL}/api/Summary?userId=${user.id}`, { withCredentials: true })
                .then(r => {
                    setSummary(r.data);
                })
                .catch(() => setSummary(null));
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const dateFrom = firstDay.toISOString();
            const dateTo = now.toISOString();
            axios.get(`${apiURL}/api/Summary?userId=${user.id}&dateFrom=${dateFrom}&dateTo=${dateTo}`, { withCredentials: true })
                .then(r => setMonthSummary(r.data))
                .catch(() => setMonthSummary(null));
            const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();
            axios.get(`${apiURL}/api/Summary?userId=${user.id}&dateFrom=${yearStart}`, { withCredentials: true })
                .then(r => setYearSummary(r.data))
                .catch(() => setYearSummary(null));
        }
    }, [user]);

    return (
        <div className="container pt-5" style={{ maxWidth: 600 }}>
            <h2 className="mb-4 text-center">
                <i className="bi bi-person-circle me-2"></i>
                User Profile
            </h2>
            {!profile ? (
                <div>Loading...</div>
            ) : (
                <div className="card p-3">
                    <h5 className="mb-3">{profile.name} {profile.surname}</h5>
                    <p><strong>Email:</strong> {profile.email}</p>
                    <p><strong>Project:</strong> {project?.name || "None"}</p>
                    <hr />
                    <h6>Work Summary</h6>
                    <p>
                        <strong>Worked hours this month:</strong>{" "}
                        {monthSummary && typeof monthSummary.totalWorkTimeMinutes === "number"
                            ? `${Math.floor(monthSummary.totalWorkTimeMinutes / 60)} h ${monthSummary.totalWorkTimeMinutes % 60} min`
                            : "0 h 0 min"}
                    </p>
                    <p>
                        <strong>Worked hours total:</strong>{" "}
                        {summary && typeof summary.totalWorkTimeMinutes === "number"
                            ? `${Math.floor(summary.totalWorkTimeMinutes / 60)} h ${summary.totalWorkTimeMinutes % 60} min`
                            : "0 h 0 min"}
                    </p>
                    <hr />
                    <h6>Day Off Summary (this year)</h6>
                    <p><strong>Days off realized:</strong>  {yearSummary?.executedDaysOff ?? 0}</p>
                    <p><strong>Pending requests:</strong> {yearSummary?.pendingDaysOff ?? 0}</p>
                    <p><strong>Rejected requests:</strong> {yearSummary?.rejectedDaysOff ?? 0}</p>
                    <p><strong>Approved requests:</strong> {yearSummary?.approvedDaysOff ?? 0}</p>
                    <hr />
                    <h6>Day Off Summary</h6>
                    <p><strong>Days off realized:</strong>  {summary?.executedDaysOff ?? 0}</p>
                    <p><strong>Pending requests:</strong> {summary?.pendingDaysOff ?? 0}</p>
                    <p><strong>Rejected requests:</strong> {summary?.rejectedDaysOff ?? 0}</p>
                    <p><strong>Approved requests:</strong> {summary?.approvedDaysOff ?? 0}</p>
                </div>
            )}
        </div>
    );
};

export default UserProfilePage;