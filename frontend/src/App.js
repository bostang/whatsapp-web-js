import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Navbar, Nav, Container } from 'react-bootstrap';
import BroadcastPage from './pages/BroadcastPage';
import AppPICPage from './pages/AppPICPage'; // Halaman baru nanti

function App() {
    return (
        <Router>
            <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
                <Container>
                    <Navbar.Brand as={Link} to="/">🚀 WA Sender</Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="me-auto">
                            <Nav.Link as={Link} to="/">Broadcast</Nav.Link>
                            <Nav.Link as={Link} to="/app-pic">PIC Management</Nav.Link>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            <Routes>
                <Route path="/" element={<BroadcastPage />} />
                <Route path="/app-pic" element={<AppPICPage />} />
            </Routes>
        </Router>
    );
}

export default App;