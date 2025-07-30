// components/MyNavbar.tsx (lub NavBar.tsx, w zależności od Twojej nazwy pliku)
import React from 'react';
import { Navbar, Nav, Container, Button, NavDropdown } from 'react-bootstrap';
import type { AccountInfo } from '@azure/msal-browser';
import { NavLink } from 'react-router-dom';
import "bootstrap-icons/font/bootstrap-icons.css";
import NotificationBell from "./NotificationBell";

interface NavBarProps {
  accounts: AccountInfo[];
  onLogin: () => void;
  onLogout: () => void;
  userRoles: string[];
  user?: import("../interfaces/types").UserDtoWithRolesAndAuthStatus | null;
}

const MyNavbar: React.FC<NavBarProps> = ({ accounts, onLogin, onLogout, userRoles }) => {
  const user = accounts[0];

  const isAdmin = userRoles.includes("Admin");
  const isLoggedIn = accounts.length > 0;

  return (
    <Navbar bg="dark" variant="dark" expand="lg" fixed="top">
      <Container fluid>
        {isLoggedIn && (
          <Navbar.Brand as={NavLink} to="/dashboard">
            TimeRecorder
          </Navbar.Brand>
        )}
        {!isLoggedIn && (
          <Navbar.Brand as={NavLink} to="/">
            TimeRecorder
          </Navbar.Brand>
        )}
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {isLoggedIn && (
              <NavLink
                to="/dayoff"
                className={({ isActive }) => `nav-link ${isActive ? 'active text-white' : ''}`}
              >
                Day Off Calendar
              </NavLink>
            )}
            {isLoggedIn && (
              <NavLink
                to="/worklogs"
                className={({ isActive }) => `nav-link ${isActive ? 'active text-white' : ''}`}
              >
                Work Logs
              </NavLink>
            )}
            {isAdmin && (
              <NavDropdown title="Admin Panel" id="admin-panel-dropdown">
                <NavDropdown.Item as={NavLink} to="/admin/pendingAdmin">
                  Pending DayOffs
                </NavDropdown.Item>
                <NavDropdown.Item as={NavLink} to="/admin/deleteDayOff">
                  Delete DayOffs
                </NavDropdown.Item>
                <NavDropdown.Item as={NavLink} to="/admin/deleteWorkLog">
                  Delete WorkLogs
                </NavDropdown.Item>
                <NavDropdown.Item as={NavLink} to="/admin/projects">
                  Manage Projects
                </NavDropdown.Item>
                <NavDropdown.Item as={NavLink} to="/admin/user-projects">
                  Manage User Projects
                </NavDropdown.Item>
                <NavDropdown.Item as={NavLink} to="/admin/summary">
                  Summary
                </NavDropdown.Item>
                <NavDropdown.Item as={NavLink} to="/admin/settings">
                  Settings and Sync
                </NavDropdown.Item>
              </NavDropdown>
            )}
          </Nav>
          <Nav className="ms-auto">
            {accounts.length > 0 ? (
              <>
                <Navbar.Text className="me-3 d-flex align-items-center">
                  Welcome, {user?.name || "User"}!
                  <NavLink to="/profile" style={{ marginLeft: 8 }}>
                    <i
                      className="bi bi-person-circle"
                      style={{
                        fontSize: "1rem",
                        verticalAlign: "middle",
                        cursor: "pointer"
                      }}
                      title="Go to profile"
                    ></i>
                  </NavLink>
                  {/* Dzwonek powiadomień obok imienia */}
                  <span style={{ marginLeft: 16 }}>
                    <NotificationBell bellColor="#fff" />
                  </span>
                </Navbar.Text>
                <Button variant="outline-light" onClick={onLogout}>Logout</Button>
              </>
            ) : (
              <Button variant="outline-light" onClick={onLogin}>Login</Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default MyNavbar;