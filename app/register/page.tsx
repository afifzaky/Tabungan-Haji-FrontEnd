import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/register-form";

export const metadata: Metadata = {
  title: "Daftar — BSI Tabungan Haji",
};

const SIDE_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCiUh7UmzR-ykb8lQnZspDz5ez1lq_lECxPHz8tvB2HGCAHRGzgGARj7P62Tw7yMxli3IfYBav72nEbfVj0-3sUl3dVL1kJpyCG7zuWOS93IB0NiYmKUpO9hL9iXZVM3d6T4ejJGu5naWw_X2-LmsmuVNEJdDxeHlBz2Pls5SfYb1Rqxk07Xdoq48hzfzrrGYtsuIOMNBvtN7tZrF8-fUi_vjYiIZLSSAUkXzSpAQc5mmRDO2bipoeP1io4BBRhh1gxK3mKIpHgRBU";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen w-full text-on-surface">
      {/* Panel gambar (desktop) */}
      <div
        className="relative hidden overflow-hidden bg-surface-container-low lg:flex lg:w-1/2"
        style={{
          backgroundImage: `url('${SIDE_IMAGE}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px]" />
        <div className="relative z-10 flex h-full w-full flex-col justify-between p-12 text-on-primary">
          <div>
            <h2 className="text-headline-lg text-surface-container-lowest">
              BSI Tabungan Haji
            </h2>
            <p className="mt-4 max-w-md text-body-lg text-surface-container-lowest opacity-90">
              Langkah awal menuju baitullah dengan perencanaan yang transparan
              dan amanah.
            </p>
          </div>
        </div>
      </div>

      {/* Panel form */}
      <div className="flex w-full items-center justify-center bg-surface-container-lowest p-6 sm:p-12 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Header mobile */}
          <div className="mb-8 text-center lg:hidden">
            <h1 className="text-headline-lg text-primary">BSI Tabungan Haji</h1>
            <p className="mt-2 text-body-md text-on-surface-variant">
              Daftar sekarang untuk mulai merencanakan ibadah Haji Anda.
            </p>
          </div>
          {/* Header desktop */}
          <div className="mb-8 hidden lg:block">
            <h1 className="text-headline-lg text-on-surface">Buat Akun</h1>
            <p className="mt-2 text-body-md text-on-surface-variant">
              Silakan lengkapi data diri Anda di bawah ini.
            </p>
          </div>

          <RegisterForm />

          <div className="mt-8 text-center">
            <p className="text-body-md text-on-surface-variant">
              Sudah punya akun?{" "}
              <Link
                href="/login"
                className="font-semibold text-primary-container transition-colors hover:text-surface-tint hover:underline"
              >
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
