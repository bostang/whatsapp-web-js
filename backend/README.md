# Backend - Server WhatsApp

Server backend ini dibangun dengan **Node.js** dan framework **Express.js**. Ia bertanggung jawab untuk mengelola koneksi WhatsApp, membaca data kontak, dan mengirim pesan melalui API.

## Dependensi

- `express`: Framework web untuk Node.js.
- `cors`: Middleware untuk mengaktifkan Cross-Origin Resource Sharing.
- `whatsapp-web.js`: Library untuk mengotomatisasi WhatsApp Web.
- `qrcode-terminal`: Untuk menampilkan QR code di terminal.

---

## API Documentation

Server ini mengekspos beberapa endpoint REST API untuk berinteraksi dengan fungsionalitas pengiriman pesan WhatsApp.

### 1. GET /api/contacts

Mengambil daftar kontak dari file `data/contact.json`.

- **URL**: `/api/contacts`
- **Method**: `GET`
- **URL Params**: Tidak ada.
- **Success Response**:
  - **Code**: `200 OK`
  - **Content**: `application/json`
  - **Contoh Body**:

        ```json
        [
          {
            "nama": "John Doe",
            "nomor": "6281234567890",
            "gender": "laki"
          },
          {
            "nama": "Jane Doe",
            "nomor": "6281298765432",
            "gender": "perempuan"
          }
        ]
        ```

- **Error Response**:
  - **Code**: `500 Internal Server Error`
  - **Content**: `application/json`
  - **Contoh Body**:

        ```json
        {
          "error": "Gagal membaca file kontak."
        }
        ```

### 2. POST /api/send-message

Mengirim pesan ke satu nomor. Endpoint ini mendukung pengiriman ke kontak dari daftar atau nomor kustom.

- **URL**: `/api/send-message`
- **Method**: `POST`
- **Headers**:
  - `Content-Type: application/json`
- **Body Request**:
  - **Untuk Kontak dari Daftar:**

        ```json
        {
          "nomor": "6281234567890",
          "nama": "John Doe",
          "gender": "laki",
          "message": "Halo {sapaan} {nama}! Ini adalah pesan kustom."
        }
        ```

  - **Untuk Nomor Kustom:**

        ```json
        {
          "customNomor": "6289876543210",
          "customNama": "Penerima Kustom",
          "customGender": "perempuan",
          "message": "Hai {sapaan}, bagaimana kabarmu?"
        }
        ```

- **Success Response**:
  - **Code**: `200 OK`
  - **Contoh Body**:

        ```json
        {
          "success": true,
          "message": "Pesan berhasil dikirim ke John Doe."
        }
        ```

- **Error Responses**:
  - **Code**: `400 Bad Request`
    - **Message**: `Nomor tidak boleh kosong.`
    - **Message**: `Nomor [nomor] tidak terdaftar di WhatsApp.`
  - **Code**: `500 Internal Server Error`
    - **Message**: `Gagal mengirim pesan.`

### 3. POST /api/send-bulk

Mengirim pesan ke beberapa kontak yang dipilih.

- **URL**: `/api/send-bulk`
- **Method**: `POST`
- **Headers**:
  - `Content-Type: application/json`
- **Body Request**:

    ```json
    {
      "contacts": [
        {
          "nama": "John Doe",
          "nomor": "6281234567890",
          "gender": "laki"
        },
        {
          "nama": "Jane Doe",
          "nomor": "6281298765432",
          "gender": "perempuan"
        }
      ],
      "message": "Halo {sapaan} {nama}, ini adalah pesan massal."
    }
    ```

- **Success Response**:
  - **Code**: `200 OK`
  - **Contoh Body**:

        ```json
        {
          "success": true,
          "berhasil": ["John Doe"],
          "gagal": ["Jane Doe"],
          "message": "Proses pengiriman pesan massal selesai."
        }
        ```

- **Error Responses**:
  - **Code**: `500 Internal Server Error`
    - **Message**: `Terjadi kesalahan saat mengirim pesan massal.`

## File Penting

- `server.js`: Kode sumber utama server backend.
- `./data/contact.json`: File yang berisi data kontak dalam format JSON.
