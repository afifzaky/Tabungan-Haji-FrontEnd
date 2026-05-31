"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ApiError,
  deleteNasabah,
  errorMessage,
  listNasabah,
} from "@/lib/api";
import type { ListResponse, Nasabah, Role } from "@/lib/types";

const LIMIT = 10;

type RoleFilter = "ALL" | Role;

function initials(nama: string): string {
  const parts = nama.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function tanggal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function RoleBadge({ role }: { role: Role }) {
  const admin = role === "ADMIN";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        admin
          ? "bg-tertiary-container text-on-tertiary-container"
          : "bg-secondary-fixed text-on-secondary-fixed"
      }`}
    >
      {role}
    </span>
  );
}

export function NasabahListView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ListResponse<Nasabah> | null>(null);
  const [offset, setOffset] = useState(0);

  // Filter sisi klien atas baris halaman aktif (API list belum punya filter).
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<RoleFilter>("ALL");

  // Modal konfirmasi hapus.
  const [target, setTarget] = useState<Nasabah | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function askDelete(n: Nasabah) {
    setDeleteError(null);
    setTarget(n);
  }

  function closeDelete() {
    if (deleting) return;
    setTarget(null);
    setDeleteError(null);
  }

  const load = useCallback(async (nextOffset: number) => {
    setLoading(true);
    try {
      const data = await listNasabah(LIMIT, nextOffset);
      setResult(data);
      setOffset(nextOffset);
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return;
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(0);
  }, [load]);

  const rows = useMemo(() => {
    const all = result?.data ?? [];
    const q = query.trim().toLowerCase();
    return all.filter((n) => {
      if (role !== "ALL" && n.role !== role) return false;
      if (!q) return true;
      return (
        n.nama.toLowerCase().includes(q) ||
        n.nik.toLowerCase().includes(q) ||
        n.email.toLowerCase().includes(q)
      );
    });
  }, [result, query, role]);

  const filterAktif = query.trim() !== "" || role !== "ALL";

  async function handleDelete() {
    if (!target) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteNasabah(target.id);
      setTarget(null);
      await load(offset);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return;
      // 409 = terblokir oleh data terkait (mis. rekening tabungan).
      const msg =
        err instanceof ApiError && err.status === 409
          ? err.message ||
            "Nasabah tidak dapat dihapus karena masih memiliki rekening tabungan terkait. Tutup rekeningnya terlebih dahulu."
          : errorMessage(err, "Gagal menghapus nasabah.");
      setDeleteError(msg);
    } finally {
      setDeleting(false);
    }
  }

  const total = result?.total ?? 0;
  const pageCount = result?.data.length ?? 0;
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + pageCount, total);

  return (
    <main className="mx-auto w-full max-w-[1280px] flex-1 p-6 md:p-8">
      {/* Header & aksi */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-headline-lg text-on-surface">Manajemen Nasabah</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Kelola data pendaftaran dan status nasabah Haji.
          </p>
        </div>
        <Link
          href="/admin/nasabah/baru"
          className="flex items-center gap-2 self-start rounded-lg bg-primary-container px-6 py-3 text-label-md font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary sm:self-auto"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Tambah Nasabah
        </Link>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-error-container px-4 py-3 text-on-error-container">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span className="text-label-md">{error}</span>
        </div>
      )}

      {/* Filter */}
      <div className="mb-6 flex flex-col items-center justify-between gap-4 rounded-xl border border-surface-variant/50 bg-surface-container-lowest p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] md:flex-row">
        <div className="relative w-full md:w-96">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari Nama, NIK, atau Email..."
            className="w-full rounded-lg border-none bg-surface-container-low py-2.5 pl-10 pr-4 text-body-md text-on-surface transition-all focus:ring-2 focus:ring-primary-container"
          />
        </div>
        <div className="flex w-full items-center gap-3 md:w-auto">
          <span className="whitespace-nowrap text-label-md text-on-surface-variant">
            Filter Role:
          </span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as RoleFilter)}
            className="w-full cursor-pointer rounded-lg border-none bg-surface-container-low px-4 py-2.5 text-body-md font-medium text-on-surface transition-all focus:ring-2 focus:ring-primary-container md:w-48"
          >
            <option value="ALL">Semua Role</option>
            <option value="NASABAH">NASABAH</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>
      </div>

      {/* Tabel */}
      <div className="overflow-hidden rounded-2xl border border-surface-variant/50 bg-surface-container-lowest shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-surface-variant/80 bg-surface-container-low">
                <th className="px-6 py-4 text-label-sm uppercase tracking-wider text-on-surface-variant">
                  Nama Lengkap
                </th>
                <th className="px-6 py-4 text-label-sm uppercase tracking-wider text-on-surface-variant">
                  NIK
                </th>
                <th className="px-6 py-4 text-label-sm uppercase tracking-wider text-on-surface-variant">
                  Email
                </th>
                <th className="px-6 py-4 text-label-sm uppercase tracking-wider text-on-surface-variant">
                  Role
                </th>
                <th className="px-6 py-4 text-label-sm uppercase tracking-wider text-on-surface-variant">
                  Tanggal Daftar
                </th>
                <th className="px-6 py-4 text-right text-label-sm uppercase tracking-wider text-on-surface-variant">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined animate-spin">
                      progress_activity
                    </span>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant">
                    {filterAktif
                      ? "Tidak ada nasabah yang cocok dengan filter di halaman ini."
                      : "Belum ada data nasabah."}
                  </td>
                </tr>
              ) : (
                rows.map((n) => (
                  <tr
                    key={n.id}
                    className="group transition-colors hover:bg-surface-container-low/50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {initials(n.nama)}
                        </div>
                        <span className="text-label-md text-on-surface">
                          {n.nama}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-body-md text-on-surface-variant">
                      {n.nik}
                    </td>
                    <td className="px-6 py-4 font-body-md text-on-surface-variant">
                      {n.email}
                    </td>
                    <td className="px-6 py-4">
                      <RoleBadge role={n.role} />
                    </td>
                    <td className="px-6 py-4 font-body-md text-on-surface-variant">
                      {tanggal(n.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/nasabah/${n.id}`}
                          title="Lihat detail"
                          className="rounded-md p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            visibility
                          </span>
                        </Link>
                        <Link
                          href={`/admin/nasabah/${n.id}/edit`}
                          title="Edit"
                          className="rounded-md p-1.5 text-primary-container transition-colors hover:bg-primary-container/10"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            edit
                          </span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => askDelete(n)}
                          title="Hapus"
                          className="rounded-md p-1.5 text-error transition-colors hover:bg-error-container"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-surface-variant/50 px-6 py-4">
          <span className="text-sm text-on-surface-variant">
            {filterAktif
              ? `Menampilkan ${rows.length} hasil di halaman ini`
              : `Menampilkan ${from}-${to} dari ${total} Nasabah`}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => load(Math.max(0, offset - LIMIT))}
              disabled={offset === 0 || loading}
              className="rounded-md p-1 text-on-surface-variant hover:bg-surface-container disabled:opacity-50"
              aria-label="Halaman sebelumnya"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button
              type="button"
              onClick={() => load(offset + LIMIT)}
              disabled={to >= total || loading}
              className="rounded-md p-1 text-on-surface-variant hover:bg-surface-container disabled:opacity-50"
              aria-label="Halaman berikutnya"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal konfirmasi hapus */}
      {target && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeDelete}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl bg-surface-container-lowest shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="mb-2 text-headline-md text-on-surface">
                Hapus Nasabah?
              </h3>
              <p className="text-body-md text-on-surface-variant">
                Apakah Anda yakin ingin menghapus data{" "}
                <span className="font-semibold text-on-surface">
                  {target.nama}
                </span>
                ? Tindakan ini tidak dapat dibatalkan.
              </p>
              {deleteError && (
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-error-container px-4 py-3 text-on-error-container">
                  <span className="material-symbols-outlined text-[20px]">
                    error
                  </span>
                  <span className="text-label-md">{deleteError}</span>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 bg-surface-container-low px-6 py-4">
              <button
                type="button"
                onClick={closeDelete}
                disabled={deleting}
                className="rounded-lg px-4 py-2 text-label-md text-on-surface-variant transition-colors hover:bg-surface-variant disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-error px-6 py-2 text-label-md text-on-error shadow-sm transition-colors hover:bg-error/90 disabled:opacity-50"
              >
                {deleting ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
