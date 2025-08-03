import React from "react";
import Select from "react-select";
import type { UserDto } from "../interfaces/types";

interface Props {
  users: UserDto[];
  selectedUser: UserDto | null;
  onChange: (user: UserDto | null) => void;
}

const UserSelect: React.FC<Props> = ({ users, selectedUser, onChange }) => (
  <Select<UserDto>
    options={users}
    getOptionLabel={(u) => `${u.email}`}
    getOptionValue={(u) => u.id}
    value={selectedUser}
    onChange={(u) => onChange(u || null)}
    placeholder="Select user..."  
    menuPortalTarget={document.body}
    styles={{
      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
      menu: (base) => ({
        ...base,
        maxHeight: 120, 
        overflowY: 'auto',
      }),
    }}
    menuPosition="fixed"
  />
);

export default UserSelect;
