import React, { useEffect, useState } from "react";
import axios from "axios";
import { apiURL } from "../../config";

interface UserDto {
    id: string;
    name: string;
    surname: string;
    email: string;
    projectId?: number;
}

interface ProjectDto {
    id: number;
    name: string;
}

const AdminUserProjectsPage: React.FC = () => {
    const [users, setUsers] = useState<UserDto[]>([]);
    const [projects, setProjects] = useState<ProjectDto[]>([]);
    const [selectedProject, setSelectedProject] = useState<{ [userId: string]: number }>({});
    const [userProjects, setUserProjects] = useState<{ [userId: string]: ProjectDto | null }>({});

    const fetchUsersAndProjects = async () => {
        try {
            const usersRes = await axios.get<UserDto[]>(`${apiURL}/api/User`, { withCredentials: true });
            setUsers(usersRes.data);
            const projectsRes = await axios.get<ProjectDto[]>(`${apiURL}/api/Project`, { withCredentials: true });
            setProjects(projectsRes.data);

            // Pobierz projekt dla każdego usera
            const userProjectsObj: { [userId: string]: ProjectDto | null } = {};
            await Promise.all(usersRes.data.map(async (u) => {
                try {
                    const projRes = await axios.get<ProjectDto>(`${apiURL}/api/User/${u.id}/project`, { withCredentials: true });
                    userProjectsObj[u.id] = projRes.data;
                } catch {
                    userProjectsObj[u.id] = null;
                }
            }));
            setUserProjects(userProjectsObj);
        } catch (err) {
            console.error("Error fetching users or projects:", err);
        }
    };

    useEffect(() => {
        fetchUsersAndProjects();
    }, []);

    const handleAssign = async (userId: string) => {
        const projectId = selectedProject[userId];
        if (!projectId) return;
        try {
            await axios.post(`${apiURL}/api/User/${userId}/assign-project/${projectId}`, {}, { withCredentials: true });
            // Pobierz tylko projekt dla tego usera
            try {
                const projRes = await axios.get<ProjectDto>(`${apiURL}/api/User/${userId}/project`, { withCredentials: true });
                setUserProjects(prev => ({ ...prev, [userId]: projRes.data }));
            } catch {
                setUserProjects(prev => ({ ...prev, [userId]: null }));
            }
            console.log(`Assigned user ${userId} to project ${projectId}`);
        } catch (err) {
            console.error("Assign error:", err);
        }
    };

    const handleUnassign = async (userId: string) => {
        try {
            await axios.post(`${apiURL}/api/User/${userId}/unassign-project`, {}, { withCredentials: true });
            setUserProjects(prev => ({ ...prev, [userId]: null }));
            console.log(`Unassigned project from user ${userId}`);
        } catch (err) {
            console.error("Unassign error:", err);
        }
    };

    return (
        <div className="container pt-5">
            <h2 className="mb-4 text-center">Assign Project to Users</h2>
            <table className="table table-bordered">
                <thead>
                    <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Current Project</th>
                        <th>Assign</th>
                        <th>Unassign</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.id}>
                            <td>{u.name} {u.surname}</td>
                            <td>{u.email}</td>
                            <td>
                                {userProjects[u.id]?.name || "None"}
                            </td>
                            <td>
                                <select
                                    className="form-select"
                                    value={selectedProject[u.id] ?? ""}
                                    onChange={e => setSelectedProject({ ...selectedProject, [u.id]: Number(e.target.value) })}
                                >
                                    <option value="">Select project</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                                <button className="btn btn-success btn-sm ms-2" onClick={() => handleAssign(u.id)}>Assign</button>
                            </td>
                            <td>
                                <button className="btn btn-danger btn-sm" onClick={() => handleUnassign(u.id)}>Unassign</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminUserProjectsPage;