# Maggot Farm Monitor

IoT-based real-time environment monitoring system for a maggot farming facility.

## Tech Stack
- **Hardware**: ESP32 with DHT11
- **Broker**: HiveMQ Cloud
- **Backend**: Node.js (Express, Socket.IO, MQTT)
- **Frontend**: Vanilla JS + HTML + CSS

## 🚀 Quickstart (Cara Setup Setelah Git Clone)

Karena alasan keamanan, file konfigurasi `.env` tidak ikut di-upload ke GitHub. Ikuti langkah ini untuk menjalankan project di komputer baru:

### 1. Menjalankan Backend
Buka terminal dan jalankan perintah berikut secara berurutan:
```bash
# Masuk ke folder backend
cd backend

# Install semua dependensi
npm install

# Buat file konfigurasi (Windows/Linux)
cp .env.example .env

# BUKA FILE .env DAN ISI USERNAME & PASSWORD HIVEMQ KAMU!
# ...

# Nyalakan server
npm run dev
```

### 2. Membuka Dashboard Frontend
1. Buka folder `frontend` di File Explorer.
2. Klik dua kali pada file `index.html` (atau klik kanan -> Open with Google Chrome).
3. Dashboard akan langsung terbuka dan terhubung ke backend secara otomatis!
