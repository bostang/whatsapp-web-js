import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Container, Alert, Spinner, Row, Col, Button } from 'react-bootstrap'; // Form dihapus karena tidak dipakai langsung di sini
import * as api from './api';
import MessageInput from './components/MessageInput';
import ContactTable from './components/ContactTable';
import CustomSender from './components/CustomSender';
import GroupSender from './components/GroupSender';

function App() {
    const [contacts, setContacts] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });
    
    const [customMessage, setCustomMessage] = useState('');
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [sending, setSending] = useState({});

    const messageRef = useRef('');

    const handleMessageChange = (val) => {
        setCustomMessage(val);
        messageRef.current = val;
    };

    const [searchContact, setSearchContact] = useState('');
    const [searchGroup, setSearchGroup] = useState('');

    useEffect(() => {
        Promise.all([api.fetchContacts(), api.fetchGroups()])
            .then(([resContacts, resGroups]) => {
                setContacts(resContacts.data);
                setGroups(resGroups.data);
            })
            .catch(() => showMsg('Gagal memuat data.', 'danger'))
            .finally(() => setLoading(false));
    }, []);

    const showMsg = (text, type) => setMessage({ text, type });

    const filteredContacts = useMemo(() => {
        return contacts.filter(c => 
            c.nama.toLowerCase().includes(searchContact.toLowerCase()) || 
            c.nomor.includes(searchContact)
        );
    }, [contacts, searchContact]);

    const filteredGroups = useMemo(() => {
        return groups.filter(g => 
            g.nama.toLowerCase().includes(searchGroup.toLowerCase())
        );
    }, [groups, searchGroup]);

    const handleSendToContact = useCallback(async (contact) => {
        setSending(prev => ({ ...prev, [contact.nomor]: true }));
        try {
            await api.sendMessage({ 
                nomor: contact.nomor, 
                nama: contact.nama, 
                gender: contact.gender, 
                message: messageRef.current 
            });
            showMsg(`Terkirim ke ${contact.nama}`, 'success');
        } catch (err) {
            showMsg('Gagal mengirim.', 'danger');
        } finally {
            setSending(prev => ({ ...prev, [contact.nomor]: false }));
        }
    }, []); 

    const handleSelectContact = useCallback((contact) => {
        setSelectedContacts(prev => 
            prev.some(c => c.nomor === contact.nomor)
                ? prev.filter(c => c.nomor !== contact.nomor)
                : [...prev, contact]
        );
    }, []);

    const handleSelectAll = useCallback(() => {
        setSelectedContacts(prev => (prev.length === filteredContacts.length ? [] : [...filteredContacts]));
    }, [filteredContacts]);

    const sendBulkMessages = async () => {
        if (selectedContacts.length === 0) return;
        const newSendingStatus = selectedContacts.reduce((acc, c) => ({ ...acc, [c.nomor]: true }), {});
        setSending(prev => ({ ...prev, ...newSendingStatus }));
        try {
            await api.sendBulk({ contacts: selectedContacts, message: customMessage });
            showMsg('Bulk Send Selesai', 'info');
            setSelectedContacts([]);
        } catch (err) {
            showMsg('Gagal Bulk Send', 'danger');
        } finally {
            setSending({});
        }
    };

    if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;

    return (
        <Container className="mt-5 mb-5">
            <h1 className="mb-4">🚀 WA Sender v2.2</h1>
            
            {/* Menggunakan 'message' agar tidak error unused-vars */}
            {message.text && (
                <Alert variant={message.type} onClose={() => showMsg('', '')} dismissible>
                    {message.text}
                </Alert>
            )}

            <MessageInput value={customMessage} onChange={handleMessageChange} />

            <Row className="mb-4">
                <Col md={6}>
                    <CustomSender 
                        customMessage={customMessage} 
                        onSuccess={showMsg} 
                        onError={(t) => showMsg(t, 'danger')} 
                    />
                </Col>
                <Col md={6}>
                    <GroupSender 
                        groups={filteredGroups} 
                        customMessage={customMessage} 
                        onSuccess={showMsg} 
                        onError={(t) => showMsg(t, 'danger')}
                        searchGroup={searchGroup}
                        setSearchGroup={setSearchGroup}
                    />
                </Col>
            </Row>

            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>📋 Daftar Kontak</h2>
                {/* Menggunakan 'sendBulkMessages' agar tidak error unused-vars */}
                <Button 
                    variant="warning" 
                    onClick={sendBulkMessages} 
                    disabled={selectedContacts.length === 0}
                >
                    Kirim Terpilih ({selectedContacts.length})
                </Button>
            </div>

            <ContactTable 
                contacts={filteredContacts}
                selectedContacts={selectedContacts}
                handleSelectContact={handleSelectContact}
                handleSelectAll={handleSelectAll}
                sendMessage={handleSendToContact}
                sending={sending}
                searchTerm={searchContact}        
                onSearchChange={setSearchContact} 
            />
        </Container>
    );
}

export default App;