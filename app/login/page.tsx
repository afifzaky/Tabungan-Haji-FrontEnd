import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/login-form";
import { SystemStatus } from "@/components/system-status";
import { GuestGuard } from "@/components/guest-guard";

export const metadata: Metadata = {
  title: "Masuk — BSI Tabungan Haji",
};

const HERO_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCM10RLcxEPuOX9yTU6LrOB332Ww8ZJcb_WxqLEBiJkgQegzvPfSSdn3w3FDcvdQeqYLLpvOqKjyjV66gZXMIvGNekdr6Q5EsMqqIGr2Mze45ej-A2LCwwsJ3VEgR10z2SjDlcsChhEwTmysuoxIHkJxA7SQGy3o9MO0GoJ2QLVU3Tgiou6Sot1pjvmecYAVVS-PaqFdhcW4LrKD25bgMP0OQnkYg5Ljp2Vc9G8_AcHcR3p-e6pn5YwZ_skOY_5TT6BRRzsDM9a4tI";

export default function LoginPage() {
  return (
    <GuestGuard>
    <div className="flex h-screen w-full flex-col overflow-hidden bg-surface text-on-surface md:flex-row">
      {/* Pane kiri/atas: branding & imagery */}
      <div className="relative z-0 flex h-[307px] w-full flex-col justify-between overflow-hidden bg-primary-container p-6 md:h-full md:w-[45%] md:p-12 lg:w-[55%]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt="Masjidil Haram"
          src={HERO_IMAGE}
          className="absolute inset-0 h-full w-full object-cover opacity-80 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary-container/80 to-transparent md:hidden" />

        {/* Header brand */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-lowest shadow-sm">
            <span className="material-symbols-outlined fill-icon text-primary-container">
              mosque
            </span>
          </div>
          <h1 className="text-headline-md tracking-tight text-white">
            BSI Tabungan Haji
          </h1>
        </div>

        {/* Kutipan inspiratif */}
        <div className="relative z-10 mb-8 hidden max-w-lg sm:block">
          <h2 className="mb-4 text-display-lg-mobile leading-tight text-white md:text-display-lg">
            Mewujudkan Niat Suci ke Baitullah
          </h2>
          <p className="text-body-lg text-white/90">
            Rencanakan dan pantau perjalanan finansial ibadah Haji Anda dengan
            aman, transparan, dan penuh keberkahan bersama layanan prioritas
            kami.
          </p>
        </div>
      </div>

      {/* Pane kanan/bawah: form login */}
      <div className="relative z-10 flex h-[716px] w-full flex-col items-center justify-center overflow-y-auto rounded-t-3xl bg-surface-container-lowest p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] sm:p-12 md:h-full md:w-[55%] md:rounded-none md:shadow-none lg:w-[45%] lg:p-24">
        <div className="flex w-full max-w-[400px] animate-fade-in flex-col gap-10">
          {/* Header mobile */}
          <div className="flex flex-col gap-2 md:hidden">
            <h1 className="text-headline-md text-on-surface">Selamat Datang</h1>
            <p className="text-body-md text-on-surface-variant">
              Silakan masuk untuk melanjutkan persiapan Haji Anda.
            </p>
          </div>

          {/* Header desktop */}
          <div className="hidden flex-col gap-3 md:flex">
            <h2 className="text-headline-lg text-on-surface">Masuk ke Akun</h2>
            <p className="text-body-md text-on-surface-variant">
              Silakan masukkan email dan kata sandi Anda untuk mengakses
              dashboard tabungan.
            </p>
          </div>

          <LoginForm />

          {/* Link registrasi */}
          <div className="flex items-center justify-center gap-1 border-t border-surface-container-highest pt-4 text-body-md">
            <span className="text-on-surface-variant">
              Belum memiliki akun Tabungan Haji?
            </span>
            <Link
              href="/register"
              className="font-semibold text-primary-container transition-colors hover:text-primary hover:underline"
            >
              Daftar di sini
            </Link>
          </div>
        </div>

        {/* Status kesehatan API */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center">
          <SystemStatus />
        </div>
      </div>
    </div>
    </GuestGuard>
  );
}
