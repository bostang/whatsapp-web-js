import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Container, Alert, Spinner, Row, Col, Button } from 'react-bootstrap';
import * as api from '../api/api'; // Pastikan path ini sesuai dengan struktur folder Anda
import MessageInput from '../components/MessageInput';
import ContactTable from '../components/ContactTable';
import CustomSender from '../components/CustomSender';
import GroupSender from '../components/GroupSender';

function BroadcastPage() {
    // --- STATE MANAGEMENT ---
    const [contacts, setContacts] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });
    
    const [customMessage, setCustomMessage] = useState('');
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [sending, setSending] = useState({});

    const [searchContact, setSearchContact] = useState('');
    const [searchGroup, setSearchGroup] = useState('');

    // Menggunakan useRef untuk sinkronisasi pesan tanpa trigger re-render pada handler tertentu
    const messageRef = useRef('');

    // --- FETCH DATA ON MOUNT ---
    useEffect(() => {
        setLoading(true);
        Promise.all([api.fetchContacts(), api.fetchGroups()])
            .then(([resContacts, resGroups]) => {
                setContacts(resContacts.data);
                setGroups(resGroups.data);
            })
            .catch(() => showMsg('Gagal memuat data dari server.', 'danger'))
            .finally(() => setLoading(false));
    }, []);

    // --- HELPER FUNCTIONS ---
    const showMsg = (text, type) => setMessage({ text, type });

    const handleMessageChange = (val) => {
        setCustomMessage(val);
        messageRef.current = val;
    };

    // --- FILTERING LOGIC ---
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

    // --- SENDING HANDLERS ---
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
            showMsg(`Gagal mengirim ke ${contact.nama}.`, 'danger');
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
            showMsg(`Bulk Send Selesai untuk ${selectedContacts.length} kontak.`, 'info');
            setSelectedContacts([]);
        } catch (err) {
            showMsg('Terjadi kesalahan saat Bulk Send.', 'danger');
        } finally {
            setSending({});
        }
    };

    // --- RENDER LOADING ---
    if (loading) {
        return (
            <Container className="text-center mt-5">
                <Spinner animation="border" role="status" />
                <p className="mt-2">Memuat data kontak & grup...</p>
            </Container>
        );
    }

    // --- MAIN RENDER ---
    return (
        <Container className="mb-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>🚀 Broadcast Center</h1>
                <p className="text-muted">v2.2 - Terhubung ke Backend</p>
            </div>
            
            {message.text && (
                <Alert variant={message.type} onClose={() => showMsg('', '')} dismissible>
                    {message.text}
                </Alert>
            )}

            <Row>
                <Col lg={12} className="mb-4">
                    <MessageInput value={customMessage} onChange={handleMessageChange} />
                </Col>
            </Row>

            <Row className="mb-4">
                <Col md={6}>
                    <CustomSender 
                        customMessage={customMessage} 
                        onSuccess={(t) => showMsg(t, 'success')} 
                        onError={(t) => showMsg(t, 'danger')} 
                    />
                </Col>
                <Col md={6}>
                    <GroupSender 
                        groups={filteredGroups} 
                        customMessage={customMessage} 
                        onSuccess={(t) => showMsg(t, 'success')} 
                        onError={(t) => showMsg(t, 'danger')}
                        searchGroup={searchGroup}
                        setSearchGroup={setSearchGroup}
                    />
                </Col>
            </Row>

            <hr className="my-5" />

            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>📋 Daftar Kontak</h2>
                <Button 
                    variant="warning" 
                    onClick={sendBulkMessages} 
                    disabled={selectedContacts.length === 0}
                    className="fw-bold"
                >
                    Kirim ke Kontak Terpilih ({selectedContacts.length})
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

export default BroadcastPage;