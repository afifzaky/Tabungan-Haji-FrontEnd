import type {
  AuthNasabah,
  CreateNasabahPayload,
  Estimasi,
  ListResponse,
  LoginSuccess,
  Nasabah,
  NasabahWithTabungan,
  RegisterPayload,
  TabunganHaji,
  Transaksi,
  UpdateNasabahPayload,
} from "@/lib/types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

const HEALTH_URL = API_URL.replace("/api/v1", "/health");

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
/* ApiError — error terstruktur dengan detail validasi per-field       */
/* ------------------------------------------------------------------ */

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  /** Detail validasi per-field dari backend, mis. { nik: ["NIK harus 16 digit"] }. */
  readonly details?: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    opts: { code?: string; details?: Record<string, string[]> } = {}
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = opts.code;
    this.details = opts.details;
  }
}

/** Ambil pesan paling relevan dari body error backend. */
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

function fallbackFor(status: number): string {
  if (status === 401) return "Sesi berakhir, silakan masuk kembali.";
  if (status === 0) return "Tidak dapat terhubung ke server.";
  return "Terjadi kesalahan, silakan coba lagi.";
}

/* ------------------------------------------------------------------ */
/* Fetch wrapper + api client                                          */
/* ------------------------------------------------------------------ */

interface RequestOptions {
  /** Lampirkan Bearer token dari sesi (default: true). */
  auth?: boolean;
  headers?: Record<string, string>;
  /** Body request; otomatis di-JSON.stringify dan diberi Content-Type. */
  body?: unknown;
}

async function request<T>(
  method: string,
  path: string,
  opts: RequestOptions = {}
): Promise<T> {
  const { auth = true, headers = {}, body } = opts;
  const token = auth ? getToken() : null;

  const finalHeaders: Record<string, string> = { ...headers };
  if (body !== undefined) finalHeaders["Content-Type"] = "application/json";
  if (token) finalHeaders["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(fallbackFor(0), 0);
  }

  // 204 No Content → tidak ada body untuk diparse.
  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);

  if (res.ok) return data as T;

  const code = (data as { error?: string } | null)?.error;
  const details = (data as { details?: Record<string, string[]> } | null)
    ?.details;

  // Auto-logout: 401 saat ada token = sesi kedaluwarsa/dicabut.
  // (401 tanpa token, mis. login gagal, tidak memicu redirect.)
  if (res.status === 401 && token) {
    clearSession();
    if (typeof window !== "undefined") window.location.assign("/login");
  }

  throw new ApiError(messageFromBody(data, fallbackFor(res.status)), res.status, {
    code,
    details,
  });
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) =>
    request<T>("GET", path, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("POST", path, { ...opts, body }),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("PUT", path, { ...opts, body }),
  delete: <T>(path: string, opts?: RequestOptions) =>
    request<T>("DELETE", path, opts),
};

/* ------------------------------------------------------------------ */
/* Helper konsumen: pemetaan error untuk UI                            */
/* ------------------------------------------------------------------ */

/** Ambil pesan validasi pertama per-field dari ApiError (untuk ditaruh di bawah input). */
export function getFieldErrors(err: unknown): Record<string, string> {
  if (err instanceof ApiError && err.details) {
    const out: Record<string, string> = {};
    for (const [field, msgs] of Object.entries(err.details)) {
      if (Array.isArray(msgs) && typeof msgs[0] === "string") {
        out[field] = msgs[0];
      }
    }
    return out;
  }
  return {};
}

/** Pesan ramah untuk ditampilkan; generik bila error bukan ApiError. */
export function errorMessage(
  err: unknown,
  fallback = "Terjadi kesalahan, silakan coba lagi."
): string {
  return err instanceof ApiError ? err.message : fallback;
}

/* ------------------------------------------------------------------ */
/* Health check                                                        */
/* ------------------------------------------------------------------ */

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(HEALTH_URL);
    if (!res.ok) return false;
    return (await res.json())?.status === "ok";
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Auth & Nasabah                                                      */
/* ------------------------------------------------------------------ */

export function login(email: string, password: string): Promise<LoginSuccess> {
  return api.post<LoginSuccess>(
    "/auth/login",
    { email, password },
    { auth: false }
  );
}

export function register(payload: RegisterPayload): Promise<{ id: string }> {
  return api.post<{ id: string }>("/nasabah", payload, { auth: false });
}

export function me(): Promise<Nasabah> {
  return api.get<Nasabah>("/auth/me");
}

export async function logout(): Promise<void> {
  // Best-effort revoke di server; sesi lokal tetap dibersihkan.
  try {
    await api.post("/auth/logout");
  } catch {
    // Abaikan: tujuan utama logout adalah membersihkan sesi lokal.
  } finally {
    clearSession();
  }
}

/* ------------------------------------------------------------------ */
/* Tabungan Haji                                                       */
/* ------------------------------------------------------------------ */

export function listMyTabungan(): Promise<{ data: TabunganHaji[] }> {
  return api.get<{ data: TabunganHaji[] }>("/tabungan-haji");
}

export function openAccount(nasabahId: string): Promise<TabunganHaji> {
  return api.post<TabunganHaji>("/tabungan-haji", { nasabahId });
}

export function getEstimasi(tabunganId: string): Promise<Estimasi> {
  return api.get<Estimasi>(
    `/tabungan-haji/${tabunganId}/estimasi-keberangkatan`
  );
}

export function getMutasi(
  tabunganId: string,
  limit = 10,
  offset = 0
): Promise<ListResponse<Transaksi>> {
  return api.get<ListResponse<Transaksi>>(
    `/tabungan-haji/${tabunganId}/mutasi?limit=${limit}&offset=${offset}`
  );
}

export function setor(
  tabunganId: string,
  nominal: number,
  metode: string | undefined,
  idempotencyKey: string
): Promise<Transaksi> {
  return api.post<Transaksi>(
    `/tabungan-haji/${tabunganId}/setor`,
    { nominal, ...(metode ? { metode } : {}) },
    { headers: { "Idempotency-Key": idempotencyKey } }
  );
}

/* ------------------------------------------------------------------ */
/* Admin — manajemen nasabah                                           */
/* Catatan: endpoint mengikuti konvensi REST standar. Sesuaikan path   */
/* di sini bila kontrak backend berbeda.                               */
/* ------------------------------------------------------------------ */

export function listNasabah(
  limit = 10,
  offset = 0
): Promise<ListResponse<Nasabah>> {
  return api.get<ListResponse<Nasabah>>(
    `/nasabah?limit=${limit}&offset=${offset}`
  );
}

export function getNasabah(id: string): Promise<NasabahWithTabungan> {
  return api.get<NasabahWithTabungan>(`/nasabah/${id}`);
}

export function createNasabah(
  payload: CreateNasabahPayload
): Promise<{ id: string }> {
  return api.post<{ id: string }>("/nasabah", payload);
}

export function updateNasabah(
  id: string,
  payload: UpdateNasabahPayload
): Promise<Nasabah> {
  return api.put<Nasabah>(`/nasabah/${id}`, payload);
}

export function deleteNasabah(id: string): Promise<void> {
  return api.delete<void>(`/nasabah/${id}`);
}

/** Daftar rekening tabungan milik seorang nasabah (akses admin). */
export function adminGetTabunganByNasabah(
  nasabahId: string
): Promise<{ data: TabunganHaji[] }> {
  return api.get<{ data: TabunganHaji[] }>(
    `/tabungan-haji?nasabahId=${nasabahId}`
  );
}

/** Mutasi sebuah rekening (akses admin) — alias getMutasi untuk kejelasan. */
export function adminGetMutasi(
  tabunganId: string,
  limit = 5,
  offset = 0
): Promise<ListResponse<Transaksi>> {
  return getMutasi(tabunganId, limit, offset);
}
