# Deployment Guide

Aplikasi ini sudah mendukung deployment menggunakan Docker. Ini memudahkan instalasi karena tidak perlu setup FFmpeg manual di server (sudah include di dalam container).

## Prerequisite
- Server VPS (Ubuntu/Debian recommended)
- Docker & Docker Compose terinstall.

## Quick Start (Single Instance)

1.  **Clone Repo / Upload Code** ke VPS.
2.  **Buat file `.env`** (atau gunakan docker-compose environment variables):
    ```bash
    cp .env.example .env
    # Edit DATABASE_URL dan NEXTAUTH_SECRET sesuai kebutuhan
    ```
    > **Tip:** Anda bisa generate secret random dengan perintah: `openssl rand -base64 32`

    *Catatan: Secara default `docker-compose.yml` sudah mengatur `DATABASE_URL` ke SQLite di dalam volume.*

3.  **Jalankan Container**:
    ```bash
    docker-compose up -d --build
    ```

4.  Akses di browser: `http://ip-vps:3000`

## Multi-Instance Deployment (Satu VPS banyak App)

Jika Anda ingin menjalankan banyak dashboard di satu VPS (misal untuk client berbeda), Anda bisa menduplikasi folder project atau menggunakan docker-compose override.

### Cara Mudah (Multiple Folders)

1.  Buat folder berbeda, misal `client-a` dan `client-b`.
2.  Copy source code ke masing-masing folder.
3.  Edit `docker-compose.yml` di folder `client-b` agar port-nya tidak bentrok.

    **Folder `client-a/docker-compose.yml`**:
    ```yaml
    ports:
      - "3000:3000"
    ```

    **Folder `client-b/docker-compose.yml`**:
    ```yaml
    ports:
      - "3001:3000"  # Akses Client B di port 3001
    ```

4.  Jalankan `docker-compose up -d` di masing-masing folder.

### Persistent Data
Data penting disimpan menggunakan **Docker Volumes** agar tidak hilang saat container dihapus/update:
- **Database**: Folder `./prisma` (file `dev.db` disimpan di sini).
- **Video Uploads**: Folder `./public/uploads`.

Pastikan folder-folder ini tetap ada di VPS Anda.

## Setup Nginx Reserve Proxy (Domain)

Untuk mengakses aplikasi menggunakan domain (contoh: `app1.com`) dan bukan IP:Port, gunakan Nginx.

1.  **Install Nginx**:
    ```bash
    sudo apt install nginx
    ```

2.  **Buat Config Block**:
    Buat file config baru di `/etc/nginx/sites-available/app1.com`

    ```nginx
    server {
        listen 80;
        server_name app1.com; # Ganti domain anda

        location / {
            proxy_pass http://localhost:3000; # Port container docker
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```

    Untuk app kedua (`app2.com`) yang berjalan di port 3001, buat config serupa tapi ubah `proxy_pass http://localhost:3001`.

3.  **Aktifkan Config**:
    ```bash
    sudo ln -s /etc/nginx/sites-available/app1.com /etc/nginx/sites-enabled/
    sudo nginx -t # Cek error
    sudo systemctl restart nginx
    ```

