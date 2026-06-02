# BSI Tabungan Haji — Frontend

Aplikasi web untuk membuka & memantau rekening **Tabungan Haji**: dashboard
saldo, riwayat mutasi, estimasi keberangkatan, halaman **status sistem**, serta
area **admin** untuk manajemen nasabah.

Dibangun dengan **Next.js 16** (App Router) · **React 19** · **TypeScript** ·
**Tailwind CSS v4**.

---

## Daftar Isi

1. [Fitur](#fitur)
2. [Prasyarat](#prasyarat)
3. [Cara Menjalankan (dari hasil clone)](#cara-menjalankan-dari-hasil-clone)
4. [Konfigurasi Environment](#konfigurasi-environment)
5. [Perintah yang Tersedia](#perintah-yang-tersedia)
6. [Struktur Proyek](#struktur-proyek)
7. [Daftar Halaman & Hak Akses](#daftar-halaman--hak-akses)
8. [Alur Login & Role](#alur-login--role)
9. [Cara Frontend Bicara ke Backend](#cara-frontend-bicara-ke-backend)
10. [Troubleshooting](#troubleshooting)

---

## Fitur

- **Autentikasi** — login, registrasi nasabah, logout, sesi berbasis token JWT
  (disimpan di `localStorage`).
- **Dashboard nasabah** — ringkasan saldo, progres porsi Haji, setoran (top up),
  indikator kesehatan API.
- **Mutasi** — tabel riwayat transaksi dengan pencarian, filter, dan pagination.
- **Estimasi keberangkatan** — target porsi, peta perjalanan Haji, analisis
  tabungan, estimasi pelunasan BPIH.
- **Area Admin** — manajemen nasabah (list, cari, tambah, edit, detail, hapus).
- **Status Sistem** (`/health`) — memantau ketersediaan & latensi API secara
  langsung dari browser.
- **Proteksi berbasis role** — halaman nasabah & admin saling terpisah; akses
  yang salah otomatis dialihkan. Token kedaluwarsa → auto-logout.

---

## Prasyarat

| Kebutuhan | Versi | Cek |
| --- | --- | --- |
| Node.js | 20 atau lebih baru | `node -v` |
| npm | bawaan Node | `npm -v` |
| Backend `tabungan-haji-api` | berjalan di `http://localhost:3000` | — |

> Frontend ini hanya tampilan; sebagian besar halaman butuh **backend menyala**
> agar datanya muncul. Halaman `/login`, `/register`, dan `/health` tetap bisa
> dibuka meski backend mati (hanya saja request-nya akan gagal/menampilkan
> status offline).

---

## Cara Menjalankan (dari hasil clone)

```bash
# 1. Clone repository & masuk ke foldernya
git clone <url-repo-github> Tabungan-Haji-FrontEnd
cd Tabungan-Haji-FrontEnd

# 2. Pasang seluruh dependensi (otomatis dibaca dari package-lock.json)
npm install

# 3. (Opsional) atur alamat backend — lihat bagian Konfigurasi Environment
#    Jika backend sudah di http://localhost:3000, langkah ini boleh dilewati.

# 4. Jalankan server pengembangan
npm run dev
```

Buka **<http://localhost:3001>** di browser.

> 🔌 **Port 3001** dipakai sengaja (berbeda dari backend di 3000) dan sudah
> dikonfigurasi di `package.json` (`next dev -p 3001`). Tidak perlu diubah.

Untuk berhenti, tekan `Ctrl + C` di terminal.

---

## Konfigurasi Environment

Frontend memanggil backend lewat variabel **`NEXT_PUBLIC_API_URL`**.

- Bila **tidak diset**, default-nya: `http://localhost:3000/api/v1`.
- Untuk mengubahnya, buat file **`.env.local`** di root proyek:

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

Setelah mengubah `.env.local`, **hentikan lalu jalankan ulang** `npm run dev`.

> File `.env*` sudah masuk `.gitignore`, jadi aman menaruh konfigurasi lokal di
> sini — tidak akan ikut ter-commit ke GitHub.

---

## Perintah yang Tersedia

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Menjalankan server pengembangan di port 3001 (hot reload). |
| `npm run build` | Membuat build produksi yang teroptimasi. |
| `npm run start` | Menjalankan hasil `build` (jalankan `build` dulu). |
| `npm run lint` | Memeriksa kualitas kode dengan ESLint. |

---

## Struktur Proyek

```
.
├─ app/                      # Routing (Next.js App Router) — tiap folder = 1 rute
│  ├─ layout.tsx             # Layout root (font, <html>, metadata global)
│  ├─ page.tsx               # "/" — pengalih berdasarkan login & role
│  ├─ login/  register/      # Halaman tamu (auto-redirect bila sudah login)
│  ├─ dashboard/             # Beranda nasabah
│  ├─ mutasi/  estimasi/     # Halaman nasabah lainnya
│  ├─ health/                # Status sistem (publik, berdiri sendiri)
│  └─ admin/                 # Area admin (layout sidebar + guard role ADMIN)
│     ├─ layout.tsx          # Shell admin: sidebar + topbar + AdminGuard
│     └─ nasabah/            # List, tambah (baru), [id] detail, [id]/edit
│
├─ components/               # Komponen UI yang dipakai halaman-halaman di atas
│  ├─ auth-guard.tsx         # Proteksi halaman privat (opsional gating per-role)
│  ├─ guest-guard.tsx        # Kebalikannya: usir yang sudah login dari /login
│  ├─ admin-guard.tsx        # Proteksi area admin (token + role ADMIN)
│  ├─ app-nav / app-footer   # Header & footer area nasabah
│  ├─ admin-sidebar / -topbar# Navigasi area admin
│  ├─ *-view.tsx             # Isi tiap halaman (dashboard, mutasi, estimasi, …)
│  ├─ *-form.tsx             # Form login & register
│  └─ setor-modal.tsx        # Dialog setoran (top up)
│
├─ lib/                      # Logika non-UI
│  ├─ api.ts                 # Klien API: fetch wrapper, ApiError, auth, endpoint
│  ├─ types.ts               # Tipe data (Nasabah, TabunganHaji, Transaksi, …)
│  └─ format.ts              # Helper format (rupiah, tanggal, persentase)
│
├─ public/                   # Aset statis
├─ referensi/                # Mockup HTML desain (acuan, tidak dijalankan)
├─ CATATAN-BACKEND.md        # Kontrak API yang diharapkan frontend ⚠️ baca ini
└─ README.md
```

---

## Daftar Halaman & Hak Akses

| Rute | Keterangan | Akses |
| --- | --- | --- |
| `/` | Pengalih otomatis sesuai status login & role | Publik |
| `/login` | Masuk | Tamu (belum login) |
| `/register` | Pendaftaran nasabah baru | Tamu |
| `/dashboard` | Ringkasan rekening & estimasi | Login · **NASABAH** |
| `/mutasi` | Riwayat transaksi + filter & pagination | Login · **NASABAH** |
| `/estimasi` | Estimasi keberangkatan & analisis tabungan | Login · **NASABAH** |
| `/admin/nasabah` | Manajemen nasabah (list, cari, hapus) | Login · **ADMIN** |
| `/admin/nasabah/baru` | Form tambah nasabah | Login · **ADMIN** |
| `/admin/nasabah/[id]` | Detail nasabah & rekening | Login · **ADMIN** |
| `/admin/nasabah/[id]/edit` | Form edit nasabah | Login · **ADMIN** |
| `/health` | Status & latensi API (berdiri sendiri) | Publik |

---

## Alur Login & Role

1. Nasabah/admin login di `/login`. Token + data sesi disimpan di `localStorage`.
2. Pengalihan setelah login berdasarkan `role`:
   - **ADMIN** → `/admin/nasabah`
   - **NASABAH** → `/dashboard`
3. Proteksi halaman:
   - Halaman nasabah pakai `AuthGuard role="NASABAH"` — admin yang membukanya
     dialihkan ke berandanya.
   - Area `/admin/*` pakai `AdminGuard` — non-admin dialihkan ke `/dashboard`,
     tamu ke `/login`.
   - Halaman `/login` & `/register` pakai `GuestGuard` — yang sudah login
     dialihkan ke beranda masing-masing.
4. Bila token kedaluwarsa (server membalas **401**), sesi dibersihkan dan
   pengguna otomatis diarahkan ke `/login`.

---

## Cara Frontend Bicara ke Backend

Seluruh komunikasi API terpusat di **`lib/api.ts`**:

- **`api.get/post/put/delete`** — pembungkus `fetch` yang otomatis melampirkan
  header `Authorization: Bearer <token>`, mengubah body ke JSON, dan menangani
  respons `204 No Content`.
- **`ApiError`** — error terstruktur berisi `status`, `code`, dan `details`
  (pesan validasi per-field, untuk ditampilkan di bawah input form).
- **Auto-logout** — respons `401` pada request bertoken → hapus sesi + redirect
  ke `/login`.
- **`checkHealth()`** — dipakai halaman `/health` dan indikator status.

> ⚠️ **Penting bila menyambungkan ke backend:** beberapa endpoint admin
> (manajemen nasabah, detail rekening, hapus nasabah) memakai asumsi kontrak
> REST standar. Detail lengkap, format JSON yang diharapkan, dan kendala yang
> sudah diketahui ada di **[`CATATAN-BACKEND.md`](./CATATAN-BACKEND.md)** —
> baca dokumen itu agar backend & frontend selaras. Jika path/format backend
> berbeda, cukup sesuaikan fungsi-fungsi di `lib/api.ts`.

---

## Troubleshooting

| Masalah | Penyebab & Solusi |
| --- | --- |
| `npm run dev` gagal: **port 3001 in use** | Ada proses lain memakai port itu. Hentikan proses tersebut, atau ubah `-p 3001` pada skrip `dev` di `package.json`. |
| Halaman terus berputar / kembali ke `/login` | Backend mati atau `NEXT_PUBLIC_API_URL` salah → token tidak bisa divalidasi. Pastikan backend menyala. |
| Status `/health` **"Tidak Tersedia"** | Backend belum jalan, atau `NEXT_PUBLIC_API_URL` tidak menunjuk ke alamat yang benar. |
| Data admin/nasabah tidak muncul padahal sudah login | Endpoint backend belum sesuai. Lihat [`CATATAN-BACKEND.md`](./CATATAN-BACKEND.md). |
| Perubahan `.env.local` tidak terbaca | Restart `npm run dev` setelah mengubah file environment. |
| `npm install` error versi Node | Pastikan Node.js **20+** (`node -v`). |

---

Dibuat dengan Next.js. Untuk referensi App Router, lihat
[dokumentasi resmi Next.js](https://nextjs.org/docs).
