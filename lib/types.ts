/* ------------------------------------------------------------------ */
/* Tipe data domain (selaras kontrak backend tabungan-haji-api).        */
/* Backend mengirim JSON camelCase; BigInt diserialisasi sebagai string.*/
/* ------------------------------------------------------------------ */

export type Role = "NASABAH" | "ADMIN";

/** Subset nasabah yang dikembalikan saat login (disimpan di sesi). */
export interface AuthNasabah {
  id: string;
  nama: string;
  email: string;
  role: Role;
}

/** Profil nasabah lengkap (mis. dari GET /auth/me). */
export interface Nasabah extends AuthNasabah {
  nik: string;
  nomorHp: string;
  createdAt: string;
  updatedAt: string;
  tokenRole?: string;
}

export interface TabunganHaji {
  id: string;
  nasabahId: string;
  nomorRekening: string;
  saldo: string; // BigInt diserialisasi sebagai string
  status: string;
  dibukaAt: string;
}

export interface Transaksi {
  id: string;
  tabunganId: string;
  jenis: string; // SETOR | TARIK
  nominal: string;
  saldoSebelum: string;
  saldoSesudah: string;
  referensi: string;
  metode: string | null;
  waktu: string;
}

/** Respons daftar berpaginasi yang dipakai berbagai endpoint koleksi. */
export interface ListResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface Estimasi {
  tabungan: {
    id: string;
    nomorRekening: string;
    saldo: string;
    status: string;
    nasabah: { id: string; nama: string; nik: string };
  };
  estimasi: {
    statusPorsi: "SUDAH_PORSI" | "BELUM_PORSI";
    sudahPorsi: boolean;
    kekuranganUntukPorsi: string;
    bulanUntukPorsi: number;
    sisaPelunasan: string;
    tahunDapatPorsi: number;
    tahunEstimasiBerangkat: number;
    waitingYears: number;
  };
  parameter: {
    setoranAwalBpih: string;
    bpihTotal: string;
    waitingYears: number;
    avgSetorBulananDigunakan: string;
    sumberRataSetor: string;
    jumlahTransaksiSetor6Bulan: number;
  };
}

export interface LoginSuccess {
  token: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: string;
  nasabah: AuthNasabah;
}

export interface RegisterPayload {
  nik: string;
  nama: string;
  email: string;
  nomorHp: string;
  password: string;
}

/* ------------------------------------------------------------------ */
/* Admin — manajemen nasabah                                            */
/* ------------------------------------------------------------------ */

/** Detail nasabah; backend dapat menyertakan rekening & mutasi terkait. */
export interface NasabahWithTabungan extends Nasabah {
  tabungan?: TabunganHaji[];
  transaksi?: Transaksi[];
}

/** Payload pembuatan nasabah oleh admin (mendukung penetapan role). */
export interface CreateNasabahPayload extends RegisterPayload {
  role: Role;
}

/** Payload pembaruan nasabah oleh admin (password opsional). */
export interface UpdateNasabahPayload {
  nama: string;
  email: string;
  nomorHp: string;
  role: Role;
  password?: string;
}
