// frontend/src/App.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Table, Button, Alert, Spinner, Form, Card } from 'react-bootstrap';

function App() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState({});
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [selectedContacts, setSelectedContacts] = useState([]);
  
  const [customNomor, setCustomNomor] = useState('');
  const [customNama, setCustomNama] = useState('');
  const [customGender, setCustomGender] = useState('laki');
  const [customNomorSending, setCustomNomorSending] = useState(false);
  
  const [customMessage, setCustomMessage] = useState('');

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await axios.get('http://localhost:3003/api/contacts');
      setContacts(response.data);
    } catch (error) {
      console.error('Gagal mengambil data kontak:', error);
      setMessage('Gagal mengambil data kontak.');
      setMessageType('danger');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectContact = (contact) => {
    setSelectedContacts(prevSelected => {
      if (prevSelected.some(c => c.nomor === contact.nomor)) {
        return prevSelected.filter(c => c.nomor !== contact.nomor);
      } else {
        return [...prevSelected, contact];
      }
    });
  };

  const isContactSelected = (contact) => {
    return selectedContacts.some(c => c.nomor === contact.nomor);
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts([...contacts]);
    }
  };

  const sendMessage = async (contact) => {
    setSending(prev => ({ ...prev, [contact.nomor]: true }));
    setMessage('');
    try {
      await axios.post('http://localhost:3003/api/send-message', {
          nomor: contact.nomor,
          nama: contact.nama,
          gender: contact.gender,
          message: customMessage // Kirim pesan kustom dari textarea
      });
      setMessage(`Pesan berhasil dikirim ke ${contact.nama}.`);
      setMessageType('success');
    } catch (error) {
      console.error('Gagal mengirim pesan:', error);
      const errorMessage = error.response?.data?.message || 'Terjadi kesalahan saat mengirim pesan.';
      setMessage(errorMessage);
      setMessageType('danger');
    } finally {
      setSending(prev => ({ ...prev, [contact.nomor]: false }));
    }
  };

  const sendCustomMessage = async () => {
    setCustomNomorSending(true);
    setMessage('');
    const cleanNomor = customNomor.replace(/[^0-9]/g, '');
    if (!cleanNomor || !cleanNomor.startsWith('62') || cleanNomor.length < 10) {
      setMessage('Format nomor telepon tidak valid. Gunakan format 628xxxx.');
      setMessageType('danger');
      setCustomNomorSending(false);
      return;
    }
    
    try {
      await axios.post('http://localhost:3003/api/send-message', {
          customNomor: cleanNomor,
          customNama: customNama,
          customGender: customGender,
          message: customMessage // Kirim pesan kustom dari textarea
      });
      setMessage(`Pesan berhasil dikirim ke ${customNama || cleanNomor}.`);
      setMessageType('success');
    } catch (error) {
      console.error('Gagal mengirim pesan:', error);
      const errorMessage = error.response?.data?.message || 'Terjadi kesalahan saat mengirim pesan.';
      setMessage(errorMessage);
      setMessageType('danger');
    } finally {
      setCustomNomorSending(false);
    }
  };

  const sendBulkMessages = async () => {
    if (selectedContacts.length === 0) {
      setMessage('Pilih setidaknya satu kontak untuk mengirim pesan massal.');
      setMessageType('warning');
      return;
    }

    setSending(selectedContacts.reduce((acc, contact) => ({ ...acc, [contact.nomor]: true }), {}));
    setMessage('Memulai pengiriman pesan massal...');
    setMessageType('info');

    try {
      const response = await axios.post('http://localhost:3003/api/send-bulk', { 
        contacts: selectedContacts,
        message: customMessage // Kirim pesan kustom untuk bulk send
      });
      const { berhasil, gagal } = response.data;
      const berhasilMessage = berhasil.length > 0 ? `Berhasil dikirim ke: ${berhasil.join(', ')}.` : '';
      const gagalMessage = gagal.length > 0 ? `Gagal dikirim ke: ${gagal.join(', ')}.` : '';
      setMessage(`${berhasilMessage} ${gagalMessage}`);
      setMessageType(gagal.length > 0 ? 'warning' : 'success');
    } catch (error) {
      console.error('Gagal mengirim pesan massal:', error);
      setMessage('Terjadi kesalahan saat mengirim pesan massal.');
      setMessageType('danger');
    } finally {
      setSending({});
      setSelectedContacts([]);
    }
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" />
        <p className="mt-2">Memuat data kontak...</p>
      </Container>
    );
  }

  return (
    <Container className="mt-5">
      <h1 className="mb-4">Kirim Pesan WhatsApp</h1>

      {message && <Alert variant={messageType}>{message}</Alert>}
      
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Kirim ke Nomor Kustom</Card.Title>
          <Form.Group className="mb-3">
            <Form.Label>Nama Penerima</Form.Label>
            <Form.Control
              type="text"
              placeholder="Masukkan nama penerima"
              value={customNama}
              onChange={(e) => setCustomNama(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Gender</Form.Label>
            <Form.Select
              value={customGender}
              onChange={(e) => setCustomGender(e.target.value)}
            >
              <option value="laki">Laki-laki</option>
              <option value="perempuan">Perempuan</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Nomor Telepon Indonesia</Form.Label>
            <Form.Control
              type="text"
              placeholder="Contoh: 6281234567890"
              value={customNomor}
              onChange={(e) => setCustomNomor(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Isi Pesan Kustom</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Tulis pesan Anda di sini..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
            />
            <Form.Text className="text-muted">
              Gunakan `{'{nama}'}` dan `{'{sapaan}'}` untuk personalisasi.
            </Form.Text>
          </Form.Group>
          <Button
            variant="success"
            onClick={sendCustomMessage}
            disabled={customNomorSending}
          >
            {customNomorSending ? <Spinner as="span" animation="border" size="sm" /> : 'Kirim Pesan Kustom'}
          </Button>
        </Card.Body>
      </Card>
      
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Daftar Kontak</h2>
        <div>
          <Button 
            variant="warning" 
            onClick={sendBulkMessages} 
            className="me-2"
            disabled={selectedContacts.length === 0}
          >
            Kirim ({selectedContacts.length}) Pesan
          </Button>
          <Button variant="info" onClick={handleSelectAll}>
            {selectedContacts.length === contacts.length ? 'Batalkan Semua' : 'Pilih Semua'}
          </Button>
        </div>
      </div>
      
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th><Form.Check type="checkbox" onChange={handleSelectAll} checked={selectedContacts.length === contacts.length && contacts.length > 0} /></th>
            <th>No</th>
            <th>Nama</th>
            <th>Nomor</th>
            <th>Gender</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact, index) => (
            <tr key={index}>
              <td><Form.Check type="checkbox" onChange={() => handleSelectContact(contact)} checked={isContactSelected(contact)} /></td>
              <td>{index + 1}</td>
              <td>{contact.nama}</td>
              <td>{contact.nomor}</td>
              <td>{contact.gender}</td>
              <td>
                <Button 
                  variant="primary" 
                  onClick={() => sendMessage(contact)}
                  disabled={sending[contact.nomor]}
                >
                  {sending[contact.nomor] ? <Spinner as="span" animation="border" size="sm" /> : 'Kirim Pesan'}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
}

export default App;