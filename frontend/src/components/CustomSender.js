import React, { useState } from 'react';
import { Card, Form, Button, Spinner } from 'react-bootstrap';
import * as api from '../api/api';

const CustomSender = ({ customMessage, onSuccess, onError }) => {
    const [data, setData] = useState({ nama: '', nomor: '', gender: 'laki' });
    const [isSending, setIsSending] = useState(false);

    const handleSend = async () => {
        const cleanNomor = data.nomor.replace(/[^0-9]/g, '');
        if (cleanNomor.length < 10) return onError('Nomor tidak valid');

        setIsSending(true);
        try {
            await api.sendMessage({
                customNomor: cleanNomor,
                customNama: data.nama,
                customGender: data.gender,
                message: customMessage
            });
            onSuccess(`Berhasil dikirim ke ${data.nama || cleanNomor}`);
            setData({ ...data, nomor: '', nama: '' }); // Reset form
        } catch (err) {
            onError(err.response?.data?.message || 'Gagal mengirim pesan kustom');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Card className="mb-4 shadow-sm h-100">
            <Card.Body>
                <Card.Title>👤 Kirim ke Nomor Personal</Card.Title>
                <Form.Control 
                    className="mb-2" 
                    placeholder="Nama Penerima" 
                    value={data.nama} 
                    onChange={e => setData({...data, nama: e.target.value})} 
                />
                <Form.Select 
                    className="mb-2" 
                    value={data.gender} 
                    onChange={e => setData({...data, gender: e.target.value})}
                >
                    <option value="laki">Laki-laki (Mas)</option>
                    <option value="perempuan">Perempuan (Mbak)</option>
                </Form.Select>
                <Form.Control 
                    className="mb-2" 
                    placeholder="Contoh: 62812345xxx" 
                    value={data.nomor} 
                    onChange={e => setData({...data, nomor: e.target.value})} 
                />
                <Button 
                    variant="success" 
                    onClick={handleSend} 
                    className="w-100 mt-2" 
                    disabled={isSending || !data.nomor}
                >
                    {isSending ? <Spinner size="sm" /> : 'Kirim Sekarang'}
                </Button>
            </Card.Body>
        </Card>
    );
};

export default CustomSender;