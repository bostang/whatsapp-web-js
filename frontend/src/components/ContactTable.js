import React from 'react';
import { Table, Button, Form, Spinner } from 'react-bootstrap';

const ContactTable = React.memo(({ 
    contacts, 
    selectedContacts, 
    handleSelectContact, 
    handleSelectAll, 
    sendMessage, 
    sending 
}) => {
    // console.log("Rendering Table..."); // Untuk cek optimasi
    return (
        <Table striped bordered hover responsive className="mt-3">
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
                {contacts.map((contact, index) => (
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
                ))}
            </tbody>
        </Table>
    );
});

export default ContactTable;