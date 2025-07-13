// components/MyNavbar.tsx (lub NavBar.tsx, w zależności od Twojej nazwy pliku)
import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import type { AccountInfo } from '@azure/msal-browser';
import { NavLink } from 'react-router-dom';

interface NavBarProps {
  accounts: AccountInfo[];
  onLogin: () => void;
  onLogout: () => void;
  userRoles: string[]; // <-- Dodajemy nowe prop: tablicę ról
}

const MyNavbar: React.FC<NavBarProps> = ({ accounts, onLogin, onLogout, userRoles }) => {
  const user = accounts[0]; 
  
  // Rola admina będzie teraz pochodzić z props.userRoles
  const isAdmin = userRoles.includes("Admin"); 
  const isLoggedIn = accounts.length > 0;
  // Do celów debugowania (możesz usunąć po upewnieniu się, że działa)
  console.log("MyNavbar - Current user roles:", userRoles);
  console.log("MyNavbar - Is Admin:", isAdmin);

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
                  Welcome, {user?.name || "User"}! 
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