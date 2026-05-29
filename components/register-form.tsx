"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { register } from "@/lib/api";

const FIELD =
  "w-full rounded-lg border-transparent bg-[#F1F3F5] py-3 pl-10 pr-4 text-body-md text-on-surface placeholder:text-outline-variant transition-colors focus:border-primary-container focus:ring-1 focus:ring-primary-container";

function validate(v: {
  nik: string;
  nama: string;
  email: string;
  nomorHp: string;
  password: string;
  terms: boolean;
}): string | null {
  if (!/^\d{16}$/.test(v.nik)) return "NIK harus tepat 16 digit angka.";
  if (v.nama.trim().length < 3) return "Nama minimal 3 karakter.";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email))
    return "Format email tidak valid.";
  if (!/^08\d{8,11}$/.test(v.nomorHp))
    return "Nomor HP harus format 08xxxxxxxxxx (10-13 digit).";
  if (v.password.length < 8) return "Password minimal 8 karakter.";
  if (v.password.length > 72) return "Password maksimal 72 karakter.";
  if (!v.terms) return "Anda harus menyetujui Syarat & Ketentuan.";
  return null;
}

export function RegisterForm() {
  const router = useRouter();
  const [nik, setNik] = useState("");
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [nomorHp, setNomorHp] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const v = { nik, nama, email, nomorHp, password, terms };
    const localError = validate(v);
    if (localError) {
      setError(localError);
      return;
    }

    setSubmitting(true);
    const result = await register({ nik, nama, email, nomorHp, password });
    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }
    router.push("/login?registered=1");
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg bg-error-container px-4 py-3 text-on-error-container"
        >
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span className="text-label-md">{error}</span>
        </div>
      )}

      <Field label="NIK (Nomor Induk Kependudukan)" htmlFor="nik" icon="badge">
        <input
          id="nik"
          inputMode="numeric"
          maxLength={16}
          value={nik}
          onChange={(e) => setNik(e.target.value.replace(/\D/g, ""))}
          placeholder="Masukkan 16 digit NIK"
          className={FIELD}
        />
      </Field>

      <Field label="Nama Lengkap (Sesuai KTP)" htmlFor="nama" icon="person">
        <input
          id="nama"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          placeholder="Masukkan nama lengkap"
          className={FIELD}
        />
      </Field>

      <Field label="Email" htmlFor="email" icon="mail">
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="alamat@email.com"
          className={FIELD}
        />
      </Field>

      <Field label="Nomor HP" htmlFor="phone" icon="phone_iphone">
        <input
          id="phone"
          type="tel"
          inputMode="numeric"
          value={nomorHp}
          onChange={(e) => setNomorHp(e.target.value.replace(/\D/g, ""))}
          placeholder="08xxxxxxxxxx"
          className={FIELD}
        />
      </Field>

      <Field label="Password" htmlFor="password" icon="lock">
        <input
          id="password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Buat password (min. 8 karakter)"
          className={`${FIELD} pr-10`}
        />
        <button
          type="button"
          onClick={() => setShowPassword((s) => !s)}
          aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-outline transition-colors hover:text-primary"
        >
          <span className="material-symbols-outlined">
            {showPassword ? "visibility" : "visibility_off"}
          </span>
        </button>
      </Field>

      <div className="mt-6 flex items-start">
        <div className="flex h-5 items-center">
          <input
            id="terms"
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="h-4 w-4 rounded border-outline-variant text-primary-container focus:ring-2 focus:ring-primary-container"
          />
        </div>
        <label htmlFor="terms" className="ml-3 text-body-md text-on-surface-variant">
          Saya menyetujui{" "}
          <a href="#" className="font-semibold text-primary-container hover:underline">
            Syarat &amp; Ketentuan
          </a>{" "}
          serta{" "}
          <a href="#" className="font-semibold text-primary-container hover:underline">
            Kebijakan Privasi
          </a>{" "}
          BSI Tabungan Haji.
        </label>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full justify-center rounded-lg bg-primary-container px-4 py-3 text-label-md font-semibold text-on-primary shadow-sm transition-colors hover:bg-surface-tint focus:outline-none focus:ring-2 focus:ring-primary-container focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Memproses..." : "Daftar"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  icon,
  children,
}: {
  label: string;
  htmlFor: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-label-md text-on-surface-variant"
      >
        {label}
      </label>
      <div className="relative">
        <span className="material-symbols-outlined pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-outline">
          {icon}
        </span>
        {children}
      </div>
    </div>
  );
}
