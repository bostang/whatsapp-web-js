import React from 'react';
import { Card, Form } from 'react-bootstrap';

const MessageInput = React.memo(({ value, onChange }) => {
    // console.log("Rendering MessageInput..."); 
    return (
        <Card className="mb-4 border-primary shadow-sm">
            <Card.Body>
                <Form.Group>
                    <Form.Label><strong>Isi Pesan Utama</strong></Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        placeholder="Tulis pesan Anda di sini..."
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                    />
                    <Form.Text className="text-muted">
                        Gunakan {'{nama}'} dan {'{sapaan}'} untuk personalisasi.
                    </Form.Text>
                </Form.Group>
            </Card.Body>
        </Card>
    );
});

export default MessageInput;