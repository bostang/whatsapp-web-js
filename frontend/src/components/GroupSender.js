import React, { useState } from 'react';
import { Card, Form, Button, Spinner } from 'react-bootstrap';
import * as api from '../api';

// Tambahkan searchGroup dan setSearchGroup di sini
const GroupSender = ({ groups, customMessage, onSuccess, onError, searchGroup, setSearchGroup }) => {
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSend = async () => {
        if (!selectedGroupId) return;
        
        setIsSending(true);
        try {
            await api.sendGroup({
                groupId: selectedGroupId,
                message: customMessage
            });
            onSuccess('Pesan grup berhasil dikirim!');
        } catch (err) {
            onError('Gagal mengirim ke grup. Cek koneksi atau ID grup.');
        } finally {
            setIsSending(false);
        }
    };

return (
        <Card className="mb-4 shadow-sm h-100 text-white bg-dark">
            <Card.Body>
                <Card.Title>👥 Kirim ke Grup WhatsApp</Card.Title>
                
                {/* Search Bar untuk Grup */}
                <Form.Control 
                    size="sm"
                    className="mb-2 bg-secondary text-white border-0"
                    placeholder="Cari nama grup..."
                    value={searchGroup}
                    onChange={(e) => setSearchGroup(e.target.value)}
                />

                <Form.Group className="mb-3">
                    <Form.Select 
                        value={selectedGroupId} 
                        onChange={(e) => setSelectedGroupId(e.target.value)}
                        className="bg-secondary text-white border-0"
                    >
                        <option value="">-- Pilih Grup ({groups.length}) --</option>
                        {groups.map((g, idx) => (
                            <option key={idx} value={g.id}>{g.nama}</option>
                        ))}
                    </Form.Select>
                </Form.Group>
                
                <Button 
                    variant="outline-light" 
                    onClick={handleSend} 
                    disabled={isSending || !selectedGroupId} 
                    className="w-100"
                >
                    {isSending ? <Spinner size="sm" /> : '🚀 Boom ke Grup'}
                </Button>
            </Card.Body>
        </Card>
    );
};

export default GroupSender;