"use client";

import { useState, type FormEvent } from "react";
import { errorMessage, setor } from "@/lib/api";
import { toRupiah } from "@/lib/format";

const MIN_SETOR = 100_000;
const METODE = ["Transfer", "Teller", "Virtual Account", "Auto-Debet"];

export function SetorModal({
  tabunganId,
  onClose,
  onSuccess,
}: {
  tabunganId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [nominal, setNominal] = useState("");
  const [metode, setMetode] = useState(METODE[0]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Idempotency-Key stabil untuk satu kali transaksi (aman dari double-submit/retry)
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const numeric = Number(nominal);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!Number.isFinite(numeric) || numeric < MIN_SETOR) {
      setError(`Nominal setor minimum ${toRupiah(MIN_SETOR)}.`);
      return;
    }

    setSubmitting(true);
    try {
      await setor(tabunganId, numeric, metode, idempotencyKey);
      onSuccess();
    } catch (err) {
      setError(errorMessage(err, "Setoran gagal, silakan coba lagi."));
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-headline-md text-on-surface">Setoran Tabungan</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg bg-error-container px-4 py-3 text-on-error-container"
            >
              <span className="material-symbols-outlined text-[20px]">error</span>
              <span className="text-label-md">{error}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="nominal"
              className="mb-2 block text-label-md text-on-surface-variant"
            >
              Nominal Setoran
            </label>
            <input
              id="nominal"
              inputMode="numeric"
              autoFocus
              value={nominal}
              onChange={(e) => setNominal(e.target.value.replace(/\D/g, ""))}
              placeholder="Contoh: 1000000"
              className="w-full rounded-lg border-transparent bg-[#F1F3F5] px-4 py-3 text-body-md text-on-surface placeholder:text-outline-variant focus:border-primary-container focus:ring-1 focus:ring-primary-container"
            />
            <p className="mt-1 text-label-sm text-on-surface-variant">
              {numeric >= MIN_SETOR
                ? toRupiah(numeric)
                : `Minimum ${toRupiah(MIN_SETOR)}`}
            </p>
          </div>

          <div>
            <label
              htmlFor="metode"
              className="mb-2 block text-label-md text-on-surface-variant"
            >
              Metode
            </label>
            <select
              id="metode"
              value={metode}
              onChange={(e) => setMetode(e.target.value)}
              className="w-full rounded-lg border-transparent bg-[#F1F3F5] px-4 py-3 text-body-md text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container"
            >
              {METODE.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-outline-variant px-4 py-3 text-label-md text-on-surface-variant transition-colors hover:bg-surface-container"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-primary-container px-4 py-3 text-label-md font-semibold text-on-primary transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Memproses..." : "Setor Sekarang"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
