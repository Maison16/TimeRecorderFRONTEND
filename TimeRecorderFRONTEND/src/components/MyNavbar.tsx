import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import type { AccountInfo } from '@azure/msal-browser';

interface NavBarProps {
  accounts: AccountInfo[];
  onLogin: () => void;
  onLogout: () => void;
}

const NavBar: React.FC<NavBarProps> = ({ accounts, onLogin, onLogout }) => {
  return (
    <Navbar bg="dark" variant="dark" expand="lg" fixed="top">
      <Container fluid>
        <Navbar.Brand href="#">TimeRecorder</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {/* Tutaj będę dodawał linki*/}
          </Nav>
          <Nav className="ms-auto">
            {accounts.length > 0 ? (
              <>
                <Navbar.Text className="me-3">
                  Welcome, {accounts[0].name}!
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
