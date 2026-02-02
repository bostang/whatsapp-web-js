// src/App.js
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Container, Alert, Spinner, Row, Col, Button, Form } from 'react-bootstrap';
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

    // 1. Gunakan Ref untuk menyimpan pesan tanpa memicu re-render fungsi
    const messageRef = useRef('');

    const handleMessageChange = (val) => {
        setCustomMessage(val);
        messageRef.current = val; // Update ref setiap kali state berubah
    };

    // State untuk Search
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

    // FILTERING
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

    // STABILKAN sendMessage: Gunakan fungsi murni yang tidak bergantung pada customMessage secara langsung di prop
    const handleSendToContact = useCallback(async (contact) => {
        setSending(prev => ({ ...prev, [contact.nomor]: true }));
        try {
            await api.sendMessage({ 
                nomor: contact.nomor, 
                nama: contact.nama, 
                gender: contact.gender, 
                message: messageRef.current // <--- Ambil dari Ref
            });
            showMsg(`Terkirim ke ${contact.nama}`, 'success');
        } catch (err) {
            showMsg('Gagal mengirim.', 'danger');
        } finally {
            setSending(prev => ({ ...prev, [contact.nomor]: false }));
        }
    }, []); 
    // AGAR TABEL TIDAK RENDER SAMA SEKALI, gunakan trik 'Ref' atau pisahkan pemanggilan pesan.

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
            {/* ... */}
            {/* 4. Gunakan handler baru di sini */}
            <MessageInput value={customMessage} onChange={handleMessageChange} />

            <Row>
                <Col md={6}>
                    {/* Gunakan Ref juga di CustomSender jika perlu, 
                        atau biarkan jika CustomSender memang perlu render ulang */}
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

            {/* ... Bagian Search Kontak ... */}
            <ContactTable 
                contacts={filteredContacts}
                selectedContacts={selectedContacts}
                handleSelectContact={handleSelectContact}
                handleSelectAll={handleSelectAll}
                sendMessage={handleSendToContact} // Sekarang referensi ini statis (tetap)
                sending={sending}
            />
        </Container>
    );
}
export default App;