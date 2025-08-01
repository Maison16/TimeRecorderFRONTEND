import React, { useEffect, useState } from "react";
import axios from "axios";
import { apiURL } from "../../config";
import { UserDtoWithProject, ProjectDto, UserDtoWithRolesAndAuthStatus } from "../../interfaces/types";

const PAGE_SIZE = 10;

const AdminUserProjectsPage: React.FC<{ user: UserDtoWithRolesAndAuthStatus }> = ({ user }) => {
    const [usersWithProjects, setUsersWithProjects] = useState<UserDtoWithProject[]>([]);
    const [projects, setProjects] = useState<ProjectDto[]>([]);
    const [selectedProject, setSelectedProject] = useState<{ [userId: string]: number }>({});
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const fetchData = async () => {
        const params: any = {
            pageNumber: page,
            pageSize: PAGE_SIZE,
        };
        if (search) params.search = search;
        const usersRes = await axios.get<UserDtoWithProject[]>(
            `${apiURL}/api/User/with-projects`,
            { params, withCredentials: true }
        );
        setUsersWithProjects(usersRes.data);

        if (projects.length === 0) {
            const projectsRes = await axios.get<ProjectDto[]>(`${apiURL}/api/Project`, { withCredentials: true });
            setProjects(projectsRes.data);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line
    }, [page, search]);

    const handleAssign = async (userId: string) => {
        const projectId = selectedProject[userId];
        if (!projectId) return;
        await axios.post(`${apiURL}/api/User/${userId}/assign-project/${projectId}`, {}, { withCredentials: true });
        fetchData();
    };

    const handleUnassign = async (userId: string) => {
        await axios.post(`${apiURL}/api/User/${userId}/unassign-project`, {}, { withCredentials: true });
        fetchData();
    };

    return (
        <div className="container pt-5">
            <h2 className="mb-4 text-center">Assign Project to Users</h2>
            <div className="mb-3 d-flex">
                <input
                    className="form-control me-2"
                    style={{ maxWidth: 300 }}
                    placeholder="Search user by name, surname or email..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                />
                <button className="btn btn-outline-secondary" onClick={() => setSearch("")}>Clear</button>
            </div>
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
                    {usersWithProjects.map(u => (
                        <tr key={u.id}>
                            <td>{u.name} {u.surname}</td>
                            <td>{u.email}</td>
                            <td>
                                {u.project
                                    ? u.project.name
                                    : <span style={{ color: "#dc2626", fontWeight: "bold" }}>None</span>
                                }
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
            <div className="d-flex justify-content-between align-items-center mt-3">
                <button className="btn btn-outline-primary" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
                <span>Page {page}</span>
                <button className="btn btn-outline-primary" disabled={usersWithProjects.length < PAGE_SIZE} onClick={() => setPage(page + 1)}>Next</button>
            </div>
        </div>
    );
};

export default AdminUserProjectsPage;