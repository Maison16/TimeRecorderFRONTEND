import React, { useEffect, useState } from "react";
import axios from "axios";
import { apiURL } from "../../config";

interface ProjectDto {
  id: number;
  name: string;
  description: string;
}

const AdminProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [editing, setEditing] = useState<ProjectDto | null>(null);
  const [newProject, setNewProject] = useState({ name: "", description: "" });

  const fetchProjects = async () => {
    const res = await axios.get<ProjectDto[]>(`${apiURL}/api/Project`, { withCredentials: true });
    setProjects(res.data);
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async () => {
    await axios.post(`${apiURL}/api/Project`, newProject, { withCredentials: true });
    setNewProject({ name: "", description: "" });
    fetchProjects();
  };

  const handleEdit = async () => {
    if (!editing) return;
    await axios.put(`${apiURL}/api/Project/${editing.id}`, editing, { withCredentials: true });
    setEditing(null);
    fetchProjects();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this project?")) return;
    await axios.delete(`${apiURL}/api/Project/${id}`, { withCredentials: true });
    fetchProjects();
  };

  return (
    <div className="container pt-5">
      <h2 className="mb-4 text-center">Project Management</h2>
      <div className="mb-4">
        <h5>Create new project</h5>
        <input className="form-control mb-2" placeholder="Name" value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} />
        <input className="form-control mb-2" placeholder="Description" value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} />
        <button className="btn btn-success" onClick={handleCreate}>Create</button>
      </div>
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>ID</th><th>Name</th><th>Description</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map(p => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>
                {editing?.id === p.id ? (
                  <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
                ) : p.name}
              </td>
              <td>
                {editing?.id === p.id ? (
                  <input value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} />
                ) : p.description}
              </td>
              <td>
                {editing?.id === p.id ? (
                  <button className="btn btn-primary btn-sm" onClick={handleEdit}>Save</button>
                ) : (
                  <>
                    <button className="btn btn-warning btn-sm me-2" onClick={() => setEditing(p)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Delete</button>
                  </>
                )}
                {editing?.id === p.id && (
                  <button className="btn btn-secondary btn-sm ms-2" onClick={() => setEditing(null)}>Cancel</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminProjectsPage;