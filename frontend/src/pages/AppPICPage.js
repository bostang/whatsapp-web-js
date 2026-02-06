import React, { useState } from 'react';
import { Container, Card, Form, Button, Row, Col, Table, Badge, Spinner, Alert } from 'react-bootstrap';
import * as api from '../api/api';

function AppPICPage() {
    const [appInput, setAppInput] = useState('');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sending, setSending] = useState({});

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.getAppPicInfo(appInput.toUpperCase());
            setData(res.data);
        } catch (err) {
            setError('Aplikasi tidak ditemukan.');
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    // Fungsi Kirim Pesan (Individu atau Bulk)
    const sendToPics = async (pics, label) => {
        // Pastikan link tersedia
        const wrLink = data.warroom_link;
        if (!wrLink) {
            alert(`⚠️ Link Warroom untuk ${data.app.application_id} tidak ditemukan di database.`);
            return;
        }

        const isBulk = pics.length > 1;
        const confirmMsg = isBulk 
            ? `Kirim undangan ke semua PIC di ${label}?` 
            : `Kirim undangan ke ${pics[0].nama}?`;

        if (!window.confirm(confirmMsg)) return;

        const newStatus = {};
        pics.forEach(p => newStatus[p.npp] = true);
        setSending(prev => ({ ...prev, ...newStatus }));

        try {
            // MERAKIT PESAN SESUAI REQUEST
            const messageText = 
`🚨 *UNDANGAN WARROOM*

Aplikasi: *${data.app.application_id} - ${data.app.nama_aplikasi}*
Mohon segera bergabung melalui link berikut:

${wrLink}

_pesan ini dikirim secara otomatis melalui Dashboard WA Sender_`;
            
            if (isBulk) {
                await api.sendBulk({ 
                    contacts: pics.map(p => ({ nomor: p.phone, nama: p.nama })), 
                    message: messageText 
                });
            } else {
                await api.sendMessage({
                    nomor: pics[0].phone,
                    nama: pics[0].nama,
                    message: messageText
                });
            }
            alert(`Berhasil mengirim undangan ke ${label}`);
        } catch (err) {
            alert('Gagal mengirim pesan.');
        } finally {
            const resetStatus = {};
            pics.forEach(p => resetStatus[p.npp] = false);
            setSending(prev => ({ ...prev, ...resetStatus }));
        }
    };

    const layersOrder = ['L1', 'L2', 'L3', 'Bisnis', 'Surrounding', 'Others'];

    return (
        <Container className="pb-5">
            <h2 className="mb-4">🛡️ App PIC Gateway</h2>
            
            <Card className="p-4 mb-4 shadow-sm border-primary">
                <Form onSubmit={handleSearch}>
                    <Row className="align-items-end">
                        <Col md={9}>
                            <Form.Label className="fw-bold">Masukkan Kode Aplikasi (App ID)</Form.Label>
                            <Form.Control 
                                placeholder="Contoh: WONDR, BIFAST, BRIDG" 
                                value={appInput}
                                onChange={(e) => setAppInput(e.target.value)}
                                className="form-control-lg"
                            />
                        </Col>
                        <Col md={3}>
                            <Button variant="primary" type="submit" className="w-100 btn-lg" disabled={loading}>
                                {loading ? <Spinner size="sm" /> : 'Cek PIC'}
                            </Button>
                        </Col>
                    </Row>
                </Form>
            </Card>

            {error && <Alert variant="danger">{error}</Alert>}

            {data && (
                <div>
                    <Alert variant="info" className="d-flex justify-content-between align-items-center">
                        <div>
                            <h4 className="mb-1">{data.app.nama_aplikasi}</h4>
                            <span>Owner: <strong>{data.app.business_owner || '-'}</strong></span>
                        </div>
                        <Badge bg="dark" className="p-2">{data.app.application_id}</Badge>
                    </Alert>

                    {layersOrder.map(layerName => {
                        const picsInLayer = data.pics.filter(p => p.layer === layerName);
                        if (picsInLayer.length === 0) return null;

                        return (
                            <Card key={layerName} className="mb-4 shadow-sm border-0">
                                <Card.Header className="bg-secondary text-white d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0">Layer {layerName}</h5>
                                    <Button 
                                        variant="warning" 
                                        size="sm" 
                                        className="fw-bold"
                                        onClick={() => sendToPics(picsInLayer, `Layer ${layerName}`)}
                                    >
                                        📢 Blast Layer {layerName}
                                    </Button>
                                </Card.Header>
                                <Table responsive hover className="mb-0 border">
                                    <thead className="table-light">
                                        <tr>
                                            <th>PIC Name</th>
                                            <th>Division</th>
                                            <th>Phone</th>
                                            <th className="text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {picsInLayer.map((pic) => (
                                            <tr key={pic.npp}>
                                                <td>
                                                    <strong>{pic.nama}</strong>
                                                    <div className="text-muted small">{pic.posisi}</div>
                                                </td>
                                                <td>{pic.division}</td>
                                                <td>{pic.phone}</td>
                                                <td className="text-center">
                                                    <Button 
                                                        variant="success" 
                                                        size="sm"
                                                        onClick={() => sendToPics([pic], pic.nama)}
                                                        disabled={sending[pic.npp]}
                                                    >
                                                        {sending[pic.npp] ? <Spinner size="sm"/> : 'Kirim WA'}
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Card>
                        );
                    })}
                </div>
            )}
        </Container>
    );
}

export default AppPICPage;