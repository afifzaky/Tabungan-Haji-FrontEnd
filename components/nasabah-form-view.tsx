"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ApiError,
  createNasabah,
  errorMessage,
  getFieldErrors,
  getNasabah,
  updateNasabah,
} from "@/lib/api";
import type { Role } from "@/lib/types";

const FIELD =
  "h-12 rounded-lg border-0 bg-surface-container-low px-4 font-body-md text-body-md text-on-surface transition-all placeholder:text-on-surface-variant/50 focus:border-2 focus:border-primary focus:bg-surface-container-lowest focus:ring-0";

type Mode = "create" | "edit";

export function NasabahFormView({ mode, id }: { mode: Mode; id?: string }) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const [loading, setLoading] = useState(isEdit);
  const [nama, setNama] = useState("");
  const [nik, setNik] = useState("");
  const [email, setEmail] = useState("");
  const [nomorHp, setNomorHp] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("NASABAH");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const loadExisting = useCallback(async () => {
    if (!isEdit || !id) return;
    try {
      const n = await getNasabah(id);
      setNama(n.nama);
      setNik(n.nik);
      setEmail(n.email);
      setNomorHp(n.nomorHp);
      setRole(n.role);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return;
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [isEdit, id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadExisting();
  }, [loadExisting]);

  /** Validasi lokal ringan sebelum kirim ke server. */
  function localValidate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (nama.trim().length < 3) e.nama = "Nama minimal 3 karakter.";
    if (!isEdit && !/^\d{16}$/.test(nik)) e.nik = "NIK harus tepat 16 digit angka.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      e.email = "Format email tidak valid.";
    if (!/^08\d{8,11}$/.test(nomorHp))
      e.nomorHp = "Nomor HP harus format 08xxxxxxxxxx.";
    // Create: password wajib. Edit: opsional, tapi bila diisi min 8.
    if (!isEdit && password.length < 8)
      e.password = "Password minimal 8 karakter.";
    if (isEdit && password.length > 0 && password.length < 8)
      e.password = "Password minimal 8 karakter.";
    return e;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const local = localValidate();
    if (Object.keys(local).length > 0) {
      setFieldErrors(local);
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit && id) {
        await updateNasabah(id, {
          nama,
          email,
          nomorHp,
          role,
          ...(password ? { password } : {}),
        });
        router.push(`/admin/nasabah/${id}`);
      } else {
        await createNasabah({ nama, nik, email, nomorHp, password, role });
        router.push("/admin/nasabah");
      }
    } catch (err) {
      const fields = getFieldErrors(err);
      if (Object.keys(fields).length > 0) {
        setFieldErrors(fields);
      } else {
        setError(errorMessage(err, "Gagal menyimpan data nasabah."));
      }
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1280px] flex-1 p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={isEdit && id ? `/admin/nasabah/${id}` : "/admin/nasabah"}
          className="mb-2 flex items-center gap-2 text-label-md text-on-surface-variant transition-colors hover:text-primary"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Kembali
        </Link>
        <h1 className="text-headline-lg text-on-surface">
          {isEdit ? "Edit Nasabah" : "Tambah Nasabah"}
        </h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Lengkapi informasi detail nasabah untuk{" "}
          {isEdit ? "pembaruan data" : "pendaftaran baru"}.
        </p>
      </div>

      {/* Form card */}
      <div className="overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-lowest shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-8 p-6 md:p-8">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-error-container px-4 py-3 text-on-error-container">
                <span className="material-symbols-outlined text-[20px]">error</span>
                <span className="text-label-md">{error}</span>
              </div>
            )}

            {/* Data pribadi */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField label="Nama Lengkap" htmlFor="namaLengkap" error={fieldErrors.nama}>
                <input
                  id="namaLengkap"
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Nama sesuai KTP"
                  className={FIELD}
                />
              </FormField>

              <FormField
                label="Nomor Induk Kependudukan (NIK)"
                htmlFor="nik"
                error={fieldErrors.nik}
                hint={isEdit ? "NIK tidak dapat diubah." : undefined}
              >
                <input
                  id="nik"
                  inputMode="numeric"
                  maxLength={16}
                  value={nik}
                  disabled={isEdit}
                  onChange={(e) => setNik(e.target.value.replace(/\D/g, ""))}
                  placeholder="16 digit NIK"
                  className={`${FIELD} disabled:cursor-not-allowed disabled:opacity-60`}
                />
              </FormField>

              <FormField label="Email Aktif" htmlFor="email" error={fieldErrors.email}>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contoh@email.com"
                  className={FIELD}
                />
              </FormField>

              <FormField label="Nomor Handphone" htmlFor="noHp" error={fieldErrors.nomorHp}>
                <input
                  id="noHp"
                  type="tel"
                  inputMode="numeric"
                  value={nomorHp}
                  onChange={(e) => setNomorHp(e.target.value.replace(/\D/g, ""))}
                  placeholder="08xxxxxxxxxx"
                  className={FIELD}
                />
              </FormField>
            </div>

            <hr className="border-outline-variant/20" />

            {/* Keamanan & role */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                label={isEdit ? "Password Baru (opsional)" : "Password Akses"}
                htmlFor="password"
                error={fieldErrors.password}
                hint={
                  isEdit
                    ? "Kosongkan bila tidak ingin mengubah password."
                    : "Minimal 8 karakter."
                }
              >
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isEdit ? "••••••••" : "Buat password"}
                    className={`${FIELD} w-full pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:text-primary"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </FormField>

              <div className="flex flex-col gap-3">
                <span className="text-label-md text-on-surface">
                  Peran Akses (Role)
                </span>
                <div className="flex gap-4">
                  <RoleOption
                    label="Nasabah"
                    value="NASABAH"
                    selected={role === "NASABAH"}
                    onSelect={() => setRole("NASABAH")}
                  />
                  <RoleOption
                    label="Admin BSI"
                    value="ADMIN"
                    selected={role === "ADMIN"}
                    onSelect={() => setRole("ADMIN")}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action footer */}
          <div className="flex items-center justify-end gap-4 border-t border-outline-variant/10 bg-surface-container-low p-6">
            <Link
              href={isEdit && id ? `/admin/nasabah/${id}` : "/admin/nasabah"}
              className="rounded-lg border-2 border-outline-variant px-6 py-2.5 text-label-md text-on-surface transition-colors hover:bg-surface-container-highest"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-label-md text-on-primary transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[20px]">save</span>
              {submitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function FormField({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-label-md text-on-surface">
        {label}
      </label>
      {children}
      {error ? (
        <p className="flex items-center gap-1 text-label-sm text-error">
          <span className="material-symbols-outlined text-[16px]">error</span>
          {error}
        </p>
      ) : hint ? (
        <p className="text-label-sm text-on-surface-variant/70">{hint}</p>
      ) : null}
    </div>
  );
}

function RoleOption({
  label,
  value,
  selected,
  onSelect,
}: {
  label: string;
  value: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <label className="flex-1 cursor-pointer">
      <input
        type="radio"
        name="role"
        value={value}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      <div
        className={`flex items-center gap-3 rounded-lg border-2 p-4 transition-all ${
          selected
            ? "border-primary bg-primary-container/10"
            : "border-outline-variant hover:bg-surface-container-low"
        }`}
      >
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
            selected ? "border-primary" : "border-outline-variant"
          }`}
        >
          <span
            className={`h-2.5 w-2.5 rounded-full bg-primary transition-opacity ${
              selected ? "opacity-100" : "opacity-0"
            }`}
          />
        </span>
        <span className="text-label-md text-on-surface">{label}</span>
      </div>
    </label>
  );
}
