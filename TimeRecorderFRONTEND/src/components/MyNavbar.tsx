import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import type { AccountInfo } from '@azure/msal-browser';
import { NavLink } from 'react-router-dom';

interface NavBarProps {
  accounts: AccountInfo[];
  onLogin: () => void;
  onLogout: () => void;
}

const NavBar: React.FC<NavBarProps> = ({ accounts, onLogin, onLogout }) => {
  const user = accounts[0];
  const roles = user?.idTokenClaims?.roles || [];

  const isAdmin = roles.includes("Admin"); 
  console.log("User roles:", roles);
  return (
    <Navbar bg="dark" variant="dark" expand="lg" fixed="top">
      <Container fluid>
        <Navbar.Brand href="/dashboard">TimeRecorder</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <NavLink
              to="/dayoff"
              className={({ isActive }) => `nav-link ${isActive ? 'active text-white' : ''}`}
            >
              Day Off Calendar
            </NavLink>

            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) => `nav-link ${isActive ? 'active text-white' : ''}`}
              >
                Admin Panel
              </NavLink>
            )}
          </Nav>
          <Nav className="ms-auto">
            {accounts.length > 0 ? (
              <>
                <Navbar.Text className="me-3">
                  Welcome, {user.name}!
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

export default NavBar;
