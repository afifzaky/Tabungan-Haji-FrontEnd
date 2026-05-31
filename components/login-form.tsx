"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { errorMessage, login, setSession } from "@/lib/api";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const data = await login(email, password);
      // Simpan token & profil untuk dipakai request berikutnya
      setSession(data.token, data.nasabah);
      // Admin diarahkan ke manajemen nasabah; nasabah ke dashboard.
      router.push(
        data.nasabah.role === "ADMIN" ? "/admin/nasabah" : "/dashboard"
      );
    } catch (err) {
      setError(errorMessage(err, "Email atau kata sandi salah."));
      setSubmitting(false);
    }
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg bg-error-container px-4 py-3 text-on-error-container"
        >
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span className="text-label-md">{error}</span>
        </div>
      )}

      {/* Email */}
      <div className="flex flex-col gap-2">
        <label className="text-label-md text-on-surface" htmlFor="email">
          Email Address
        </label>
        <div className="relative flex items-center">
          <span className="material-symbols-outlined pointer-events-none absolute left-4 text-outline-variant">
            mail
          </span>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            className="w-full rounded-lg border-2 border-transparent bg-surface-container-low py-3 pl-12 pr-4 text-body-md text-on-surface outline-none transition-all duration-200 placeholder:text-outline focus:border-primary-container focus:bg-surface-container-lowest"
          />
        </div>
      </div>

      {/* Password */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-label-md text-on-surface" htmlFor="password">
            Kata Sandi
          </label>
          <a
            href="#"
            className="text-label-md text-primary-container transition-colors hover:text-primary hover:underline"
          >
            Lupa sandi?
          </a>
        </div>
        <div className="relative flex items-center">
          <span className="material-symbols-outlined pointer-events-none absolute left-4 text-outline-variant">
            lock
          </span>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border-2 border-transparent bg-surface-container-low py-3 pl-12 pr-12 text-body-md text-on-surface outline-none transition-all duration-200 placeholder:text-outline focus:border-primary-container focus:bg-surface-container-lowest"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
            className="absolute right-4 text-outline-variant transition-colors hover:text-on-surface-variant"
          >
            <span className="material-symbols-outlined">
              {showPassword ? "visibility" : "visibility_off"}
            </span>
          </button>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-primary-container px-6 py-3.5 text-label-md text-white shadow-[0_4px_12px_rgba(0,169,157,0.2)] transition-all duration-200 hover:bg-primary hover:shadow-[0_6px_16px_rgba(0,169,157,0.3)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Memproses..." : "Masuk"}
        <span className="material-symbols-outlined text-[18px]">
          {submitting ? "progress_activity" : "arrow_forward"}
        </span>
      </button>
    </form>
  );
}
