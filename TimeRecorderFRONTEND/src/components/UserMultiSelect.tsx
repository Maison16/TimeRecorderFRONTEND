import React, { useState } from "react";
import type { UserDto } from "../interfaces/types";
import { Form, InputGroup, Button, ListGroup } from "react-bootstrap";

interface Props {
  users: UserDto[];
  selectedUsers: UserDto[];
  onChange: (users: UserDto[]) => void;
}

const UserMultiSelect: React.FC<Props> = ({ users, selectedUsers, onChange }) => {
  const [search, setSearch] = useState("");

  // Filtruj użytkowników po emailu, pomijając już wybranych
  const filtered = users.filter(
    u =>
      u.email?.toLowerCase().includes(search.toLowerCase()) &&
      !selectedUsers.some(su => su.id === u.id)
  );

  const handleAdd = (user: UserDto) => {
    onChange([...selectedUsers, user]);
    setSearch("");
  };

  const handleRemove = (id: string) => {
    onChange(selectedUsers.filter(u => u.id !== id));
  };

  return (
    <div>
      <Form.Label>Search user by email:</Form.Label>
      <InputGroup className="mb-2">
        <Form.Control
          type="text"
          placeholder="Type email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </InputGroup>
      {search && (
        <ListGroup style={{ maxHeight: 150, overflowY: "auto", marginBottom: 8 }}>
          {filtered.length === 0 && (
            <ListGroup.Item disabled>No users found</ListGroup.Item>
          )}
          {filtered.map(u => (
            <ListGroup.Item
              key={u.id}
              action
              onClick={() => handleAdd(u)}
              style={{ cursor: "pointer" }}
            >
              {u.email} <span style={{ color: "#888" }}>({u.name} {u.surname})</span>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
      <Form.Label>Selected users:</Form.Label>
      <ListGroup>
        {selectedUsers.length === 0 && (
          <ListGroup.Item disabled>No users selected</ListGroup.Item>
        )}
        {selectedUsers.map(u => (
          <ListGroup.Item key={u.id} className="d-flex justify-content-between align-items-center">
            <span>
              {u.email} <span style={{ color: "#888" }}>({u.name} {u.surname})</span>
            </span>
            <Button variant="outline-danger" size="sm" onClick={() => handleRemove(u.id)}>
              ×
            </Button>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </div>
  );
};

export default UserMultiSelect;