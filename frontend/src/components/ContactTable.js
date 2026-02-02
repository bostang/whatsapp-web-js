import React from 'react';
import { Table, Button, Form, Spinner, InputGroup } from 'react-bootstrap';

const ContactTable = React.memo(({ 
    contacts, 
    selectedContacts, 
    handleSelectContact, 
    handleSelectAll, 
    sendMessage, 
    sending,
    searchTerm,    // Prop baru
    onSearchChange // Prop baru
}) => {
    return (
        <div className="contact-table-container">
            {/* Search Bar ditambahkan di atas tabel */}
            <InputGroup className="mb-3">
                <InputGroup.Text id="search-addon">🔍</InputGroup.Text>
                <Form.Control
                    placeholder="Cari nama atau nomor kontak..."
                    aria-label="Search"
                    aria-describedby="search-addon"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </InputGroup>

            <Table striped bordered hover responsive className="mt-2">
                <thead>
                    <tr>
                        <th>
                            <Form.Check 
                                type="checkbox" 
                                onChange={handleSelectAll} 
                                checked={selectedContacts.length === contacts.length && contacts.length > 0} 
                            />
                        </th>
                        <th>Nama</th>
                        <th>Nomor</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {contacts.length > 0 ? (
                        contacts.map((contact) => (
                            <tr key={contact.nomor}>
                                <td>
                                    <Form.Check 
                                        type="checkbox" 
                                        onChange={() => handleSelectContact(contact)} 
                                        checked={selectedContacts.some(c => c.nomor === contact.nomor)} 
                                    />
                                </td>
                                <td>{contact.nama}</td>
                                <td>{contact.nomor}</td>
                                <td>
                                    <Button 
                                        variant="primary" 
                                        size="sm" 
                                        onClick={() => sendMessage(contact)} 
                                        disabled={sending[contact.nomor]}
                                    >
                                        {sending[contact.nomor] ? <Spinner size="sm" /> : 'Kirim'}
                                    </Button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="4" className="text-center text-muted">Data tidak ditemukan.</td>
                        </tr>
                    )}
                </tbody>
            </Table>
        </div>
    );
});

export default ContactTable;