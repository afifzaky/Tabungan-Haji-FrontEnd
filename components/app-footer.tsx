const LINKS = [
  "Pusat Bantuan",
  "Kebijakan Privasi",
  "Syarat & Ketentuan",
  "Lokasi Cabang",
];

export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-outline-variant bg-surface-container-low">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center justify-between gap-8 px-5 py-12 md:flex-row md:px-16">
        <div className="flex flex-col items-center gap-2 text-center md:items-start md:text-left">
          <span className="text-headline-md text-on-surface">
            BSI Tabungan Haji
          </span>
          <p className="max-w-lg text-body-md text-on-surface-variant">
            © 2026 PT Bank Syariah Indonesia Tbk. Berizin dan Diawasi oleh
            Otoritas Jasa Keuangan. Peserta Penjaminan LPS.
          </p>
        </div>
        <div className="inline-flex flex-wrap items-center justify-center gap-4">
          {LINKS.map((l) => (
            <a
              key={l}
              href="#"
              className="text-label-sm text-on-surface-variant underline transition-all hover:text-primary"
            >
              {l}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
