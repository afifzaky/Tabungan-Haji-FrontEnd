const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

const HEALTH_URL = API_URL.replace("/api/v1", "/health");

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(HEALTH_URL);
    if (!res.ok) return false;
    return (await res.json())?.status == "ok";
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Tipe data (selaras kontrak backend tabungan-haji-api)               */
/* ------------------------------------------------------------------ */

export interface AuthNasabah {
  id: string;
  nama: string;
  email: string;
  role: "NASABAH" | "ADMIN";
}

export interface Profil extends AuthNasabah {
  nik: string;
  nomorHp: string;
  createdAt: string;
  updatedAt: string;
  tokenRole?: string;
}

export interface Tabungan {
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

export interface MutasiResult {
  data: Transaksi[];
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

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number; code?: string };

/* ------------------------------------------------------------------ */
/* Session (token JWT disimpan di localStorage)                        */
/* ------------------------------------------------------------------ */

const TOKEN_KEY = "th_token";
const NASABAH_KEY = "th_nasabah";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredNasabah(): AuthNasabah | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(NASABAH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthNasabah;
  } catch {
    return null;
  }
}

export function setSession(token: string, nasabah: AuthNasabah): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(NASABAH_KEY, JSON.stringify(nasabah));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(NASABAH_KEY);
}

/* ------------------------------------------------------------------ */
/* HTTP helpers                                                        */
/* ------------------------------------------------------------------ */

function messageFromBody(body: unknown, fallback: string): string {
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    if (typeof b.message === "string") return b.message;
    if (b.details && typeof b.details === "object") {
      const first = Object.values(b.details as Record<string, string[]>)[0];
      if (Array.isArray(first) && typeof first[0] === "string") return first[0];
    }
    if (typeof b.error === "string") return b.error;
  }
  return fallback;
}

async function authFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<ApiResult<T>> {
  const token = getToken();
  if (!token) {
    return { ok: false, status: 401, error: "Sesi tidak ditemukan." };
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(init.headers ?? {}),
      },
    });
  } catch {
    return {
      ok: false,
      status: 0,
      error: "Tidak dapat terhubung ke server.",
    };
  }

  if (res.status === 204) {
    return { ok: true, data: undefined as T };
  }

  const body = await res.json().catch(() => null);

  if (res.status === 401) {
    // Token kadaluwarsa / revoked / invalid → bersihkan sesi
    clearSession();
    return {
      ok: false,
      status: 401,
      code: (body as { error?: string })?.error,
      error: messageFromBody(body, "Sesi berakhir, silakan masuk kembali."),
    };
  }

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      code: (body as { error?: string })?.error,
      error: messageFromBody(body, "Terjadi kesalahan, silakan coba lagi."),
    };
  }

  return { ok: true, data: body as T };
}

/* ------------------------------------------------------------------ */
/* Auth & Nasabah                                                      */
/* ------------------------------------------------------------------ */

export interface LoginSuccess {
  token: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: string;
  nasabah: AuthNasabah;
}

export async function login(
  email: string,
  password: string
): Promise<ApiResult<LoginSuccess>> {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        code: (body as { error?: string })?.error,
        error: messageFromBody(body, "Email atau kata sandi salah."),
      };
    }
    return { ok: true, data: body as LoginSuccess };
  } catch {
    return {
      ok: false,
      status: 0,
      error: "Tidak dapat terhubung ke server. Silakan coba lagi.",
    };
  }
}

export interface RegisterPayload {
  nik: string;
  nama: string;
  email: string;
  nomorHp: string;
  password: string;
}

export async function register(
  payload: RegisterPayload
): Promise<ApiResult<{ id: string }>> {
  try {
    const res = await fetch(`${API_URL}/nasabah`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      // 409 dari unique constraint (NIK/email sudah dipakai) → pesan ramah
      const fallback =
        res.status === 409
          ? "NIK atau email sudah terdaftar."
          : "Pendaftaran gagal, periksa kembali data Anda.";
      return {
        ok: false,
        status: res.status,
        code: (body as { error?: string })?.error,
        error: messageFromBody(body, fallback),
      };
    }
    return { ok: true, data: body as { id: string } };
  } catch {
    return {
      ok: false,
      status: 0,
      error: "Tidak dapat terhubung ke server. Silakan coba lagi.",
    };
  }
}

export function me(): Promise<ApiResult<Profil>> {
  return authFetch<Profil>("/auth/me");
}

export async function logout(): Promise<void> {
  // Best-effort revoke di server; sesi lokal tetap dibersihkan
  try {
    await authFetch("/auth/logout", { method: "POST" });
  } finally {
    clearSession();
  }
}

/* ------------------------------------------------------------------ */
/* Tabungan Haji                                                       */
/* ------------------------------------------------------------------ */

export function listMyTabungan(): Promise<ApiResult<{ data: Tabungan[] }>> {
  return authFetch<{ data: Tabungan[] }>("/tabungan-haji");
}

export function openAccount(nasabahId: string): Promise<ApiResult<Tabungan>> {
  return authFetch<Tabungan>("/tabungan-haji", {
    method: "POST",
    body: JSON.stringify({ nasabahId }),
  });
}

export function getEstimasi(tabunganId: string): Promise<ApiResult<Estimasi>> {
  return authFetch<Estimasi>(`/tabungan-haji/${tabunganId}/estimasi-keberangkatan`);
}

export function getMutasi(
  tabunganId: string,
  limit = 10,
  offset = 0
): Promise<ApiResult<MutasiResult>> {
  return authFetch<MutasiResult>(
    `/tabungan-haji/${tabunganId}/mutasi?limit=${limit}&offset=${offset}`
  );
}

export function setor(
  tabunganId: string,
  nominal: number,
  metode: string | undefined,
  idempotencyKey: string
): Promise<ApiResult<Transaksi>> {
  return authFetch<Transaksi>(`/tabungan-haji/${tabunganId}/setor`, {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify({ nominal, ...(metode ? { metode } : {}) }),
  });
}
