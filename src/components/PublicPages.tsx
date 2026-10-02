import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  PortalDesaDatabase,
  MenuPage,
  BeritaItem,
  DokumenItem,
  GaleriItem,
} from '../types/desa';
import { SmartImage } from './SmartImage';
import { DataDesaCharts } from './DataDesaCharts';
import { formatAngka, formatRupiah, formatTanggalIndo } from '../utils/formatters';
import {
  ArrowRight,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Clock,
  Download,
  ExternalLink,
  Play,
  FileText,
  ChevronRight,
} from 'lucide-react';

interface PublicPagesProps {
  activePage: MenuPage;
  db: PortalDesaDatabase;
  onNavigate: (page: MenuPage) => void;
  onOpenBerita: (berita: BeritaItem) => void;
  onOpenLightbox: (items: GaleriItem[], index: number) => void;
  onOpenDokumen: (doc: DokumenItem) => void;
}

export const PublicPages: React.FC<PublicPagesProps> = ({
  activePage,
  db,
  onNavigate,
  onOpenBerita,
  onOpenLightbox,
  onOpenDokumen,
}) => {
  // Filter states for dedicated pages
  const [beritaCategory, setBeritaCategory] = useState<string>('Semua');
  const [beritaPage, setBeritaPage] = useState<number>(1);
  const [galeriCategory, setGaleriCategory] = useState<string>('Semua');
  const [galeriPage, setGaleriPage] = useState<number>(1);
  const [potensiCategory, setPotensiCategory] = useState<string>('Semua');
  const [agendaFilter, setAgendaFilter] = useState<'Semua' | 'Akan Datang' | 'Selesai'>('Semua');
  const [dokumenCategory, setDokumenCategory] = useState<string>('Semua');
  const [pembangunanPhotoStage, setPembangunanPhotoStage] = useState<Record<string, 'sebelum' | 'proses' | 'selesai'>>({});

  // Contact form state
  const [wargaNama, setWargaNama] = useState('');
  const [wargaDusun, setWargaDusun] = useState('Dusun Krajan');
  const [wargaKeperluan, setWargaKeperluan] = useState('Permohonan Informasi / Surat Pengantar');
  const [wargaPesan, setWargaPesan] = useState('');
  const [pesanTerkirim, setPesanTerkirim] = useState(false);

  const publishedBerita = [...db.berita]
    .filter((b) => b.status === 'Terbit')
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  const sortedGaleri = [...db.galeri].sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  const sortedPemerintahan = [...db.pemerintahan].sort((a, b) => a.urutan - b.urutan);
  const sortedStatistik = [...db.dataDesa].sort((a, b) => a.urutan - b.urutan);
  const utamaStatistik = sortedStatistik.filter(
    (s) => s.kategori === 'Utama' || s.kategori === 'Wilayah'
  );

  // APBDes Calculations
  const totalPendapatanAnggaran = db.transparansi
    .filter((t) => t.jenis === 'Pendapatan')
    .reduce((acc, cur) => acc + Number(cur.anggaran || 0), 0);
  const totalPendapatanRealisasi = db.transparansi
    .filter((t) => t.jenis === 'Pendapatan')
    .reduce((acc, cur) => acc + Number(cur.realisasi || 0), 0);

  const totalBelanjaAnggaran = db.transparansi
    .filter((t) => t.jenis === 'Belanja')
    .reduce((acc, cur) => acc + Number(cur.anggaran || 0), 0);
  const totalBelanjaRealisasi = db.transparansi
    .filter((t) => t.jenis === 'Belanja')
    .reduce((acc, cur) => acc + Number(cur.realisasi || 0), 0);

  const getStagePhoto = (item: typeof db.pembangunan[0]) => {
    const stage = pembangunanPhotoStage[item.id] || 'selesai';
    if (stage === 'sebelum') return item.fotoSebelum;
    if (stage === 'proses') return item.fotoProses;
    return item.fotoSelesai;
  };

  const renderPageContent = () => {
  // ============================================================================
  // 1. HALAMAN BERANDA
  // ============================================================================
  if (activePage === 'BERANDA') {
    const activeAnnouncements = (db.settings.pengumuman || []).filter((p) => p.aktif);
    const leadBerita = publishedBerita[0];
    const secondaryBerita = publishedBerita.slice(1, 4);

    return (
      <div className="space-y-16 pb-16">
        {/* A. HERO SECTION */}
        <section className="relative overflow-hidden border-b border-stone-200 bg-stone-950">
          <div className="absolute inset-0">
            <SmartImage
              src={db.settings.heroFotoUrl}
              alt={`Panorama ${db.settings.namaDesa}`}
              className="h-full w-full object-cover opacity-65"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/95 via-stone-950/60 to-stone-950/30" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <div className="max-w-3xl">
              <p className="text-xs font-medium tracking-widest uppercase text-emerald-300">
                Portal Resmi Pemerintah {db.settings.namaDesa} · {db.settings.kecamatan} · {db.settings.kabupaten}
              </p>
              <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight text-white sm:text-5xl">
                {db.settings.namaDesa}: {db.settings.slogan}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-stone-200">
                {db.settings.deskripsiSingkat}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('PROFIL DESA')}
                  className="flex items-center gap-2 rounded-lg bg-emerald-800 px-5 py-3 text-xs font-semibold tracking-wide text-white transition-colors hover:bg-emerald-700 whitespace-nowrap"
                >
                  SELENGKAPNYA PROFIL DESA
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('TRANSPARANSI')}
                  className="rounded-lg border border-white/30 bg-white/10 px-5 py-3 text-xs font-semibold text-white backdrop-blur-xs transition-colors hover:bg-white/20 whitespace-nowrap"
                >
                  Transparansi APBDes 2026
                </button>
              </div>
            </div>
          </div>

          {/* Operational Utility Strip */}
          <div className="relative border-t border-white/15 bg-stone-950/85 backdrop-blur-xs">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 text-xs text-stone-300 sm:px-6 lg:px-8">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>Jam Layanan: {db.settings.jamPelayanan}</span>
                <span aria-hidden="true">·</span>
                <span>Telepon/WA: {db.settings.telepon}</span>
                <span aria-hidden="true">·</span>
                <span>Kode Pos: {db.settings.kodePos}</span>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('DOKUMEN')}
                className="font-medium text-emerald-300 hover:text-emerald-200 flex items-center gap-1 whitespace-nowrap"
              >
                Unduh Formulir & Produk Hukum Desa
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* J. PENGUMUMAN PENTING */}
        {activeAnnouncements.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-xl border border-stone-200 bg-white p-5 sm:p-6">
              <div className="flex flex-col justify-between gap-2 border-b border-stone-200 pb-3 sm:flex-row sm:items-center">
                <h2 className="font-serif text-lg font-semibold text-stone-900">
                  Pengumuman & Informasi Layanan Masyarakat
                </h2>
                <span className="text-xs text-stone-500">
                  Diperbarui langsung dari Dashboard Pemerintah Desa
                </span>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                {activeAnnouncements.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between border-l-2 border-emerald-800 pl-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-xs text-stone-500">
                        <span className="font-mono">{formatTanggalIndo(item.tanggal)}</span>
                        {item.penting && (
                          <>
                            <span>·</span>
                            <span className="font-semibold text-amber-800">Prioritas Utama</span>
                          </>
                        )}
                      </div>
                      <h3 className="mt-1 text-sm font-semibold text-stone-900">{item.judul}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-stone-600">{item.isi}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* C. STATISTIK DESA */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-2 border-b border-stone-200 pb-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-medium tracking-widest uppercase text-emerald-900">
                Demografi & Kewilayahan
              </p>
              <h2 className="mt-1 font-serif text-2xl font-semibold text-stone-900 sm:text-3xl">
                Data Statistik {db.settings.namaDesa}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('DATA DESA')}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900 hover:underline whitespace-nowrap"
            >
              Lihat Tabel Data Desa Lengkap
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
            {utamaStatistik.slice(0, 7).map((stat) => (
              <div
                key={stat.id}
                className="rounded-xl border border-stone-200 bg-white p-4 transition-colors hover:border-stone-300"
              >
                <p className="text-xs font-medium text-stone-500">{stat.label}</p>
                <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-stone-900">
                  {formatAngka(stat.nilai)}
                </p>
                <p className="mt-1 text-[11px] text-stone-500">
                  {stat.satuan} · {stat.keterangan}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* D. SAMBUTAN KEPALA DESA */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="border-b border-stone-200 bg-stone-100 lg:col-span-4 lg:border-r lg:border-b-0">
                <div className="aspect-square w-full overflow-hidden">
                  <SmartImage
                    src={db.profil.kepalaDesaFoto}
                    alt={db.profil.kepalaDesaNama}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="bg-white p-5">
                  <h3 className="font-serif text-lg font-semibold text-stone-900">
                    {db.profil.kepalaDesaNama}
                  </h3>
                  <p className="mt-0.5 text-xs text-stone-600">
                    {db.profil.kepalaDesaJabatan} · {db.profil.kepalaDesaPeriode}
                  </p>
                </div>
              </div>

              <div className="flex flex-col justify-between p-6 sm:p-10 lg:col-span-8">
                <div>
                  <p className="text-xs font-medium tracking-widest uppercase text-emerald-900">
                    Sambutan Resmi Kepala Desa
                  </p>
                  <h2 className="mt-2 font-serif text-2xl font-semibold text-stone-900 sm:text-3xl">
                    Membangun Desa dengan Keterbukaan Informasi & Semangat Gotong Royong
                  </h2>
                  <blockquote className="mt-5 border-l-2 border-emerald-900 pl-5 font-serif text-base italic leading-relaxed text-stone-700 sm:text-lg">
                    &ldquo;{db.profil.kepalaDesaSambutan}&rdquo;
                  </blockquote>
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-stone-200 pt-5">
                  <div className="text-xs text-stone-500">
                    Visi Utama: <span className="font-medium text-stone-800">{db.profil.visi}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('PEMERINTAHAN')}
                    className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900 hover:underline whitespace-nowrap"
                  >
                    Struktur Perangkat Desa
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* E. BERITA TERBARU (3-Tier Editorial Layout) */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-2 border-b border-stone-200 pb-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-medium tracking-widest uppercase text-emerald-900">
                Kabar & Warta Terkini
              </p>
              <h2 className="mt-1 font-serif text-2xl font-semibold text-stone-900 sm:text-3xl">
                Berita Terbaru {db.settings.namaDesa}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('BERITA')}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900 hover:underline whitespace-nowrap"
            >
              Indeks Seluruh Berita ({publishedBerita.length})
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {publishedBerita.length === 0 ? (
            <div className="mt-6 rounded-xl border border-stone-200 bg-white p-10 text-center">
              <p className="text-sm text-stone-600">Belum ada berita yang diterbitkan.</p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Lead Story */}
              {leadBerita && (
                <article
                  onClick={() => onOpenBerita(leadBerita)}
                  className="group cursor-pointer overflow-hidden rounded-xl border border-stone-200 bg-white transition-all hover:border-stone-300 lg:col-span-7"
                >
                  <div className="aspect-16/9 w-full overflow-hidden bg-stone-100">
                    <SmartImage
                      src={leadBerita.fotoUtama}
                      alt={leadBerita.judul}
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-103"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-xs text-stone-500">
                      <span className="font-semibold text-emerald-900">{leadBerita.kategori}</span>
                      <span>·</span>
                      <span className="font-mono">{formatTanggalIndo(leadBerita.tanggal)}</span>
                      <span>·</span>
                      <span>{leadBerita.penulis}</span>
                    </div>
                    <h3 className="mt-2 font-serif text-xl font-semibold leading-snug text-stone-900 group-hover:text-emerald-900 sm:text-2xl">
                      {leadBerita.judul}
                    </h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-stone-600">
                      {leadBerita.ringkasan}
                    </p>
                    <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
                      <span>Baca Selengkapnya</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </article>
              )}

              {/* Secondary Stories */}
              <div className="flex flex-col justify-between gap-4 lg:col-span-5">
                {secondaryBerita.map((item) => (
                  <article
                    key={item.id}
                    onClick={() => onOpenBerita(item)}
                    className="group flex cursor-pointer gap-4 overflow-hidden rounded-xl border border-stone-200 bg-white p-4 transition-all hover:border-stone-300"
                  >
                    <div className="h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                      <SmartImage
                        src={item.fotoUtama}
                        alt={item.judul}
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                          <span className="font-semibold text-emerald-900">{item.kategori}</span>
                          <span>·</span>
                          <span className="font-mono">{formatTanggalIndo(item.tanggal)}</span>
                        </div>
                        <h3 className="mt-1 line-clamp-2 font-serif text-sm font-semibold leading-snug text-stone-900 group-hover:text-emerald-900">
                          {item.judul}
                        </h3>
                      </div>
                      <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-900">
                        Baca Selengkapnya <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* F. AGENDA DESA & JADWAL KEGIATAN */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-2 border-b border-stone-200 pb-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-medium tracking-widest uppercase text-emerald-900">
                Kalender Kegiatan Masyarakat
              </p>
              <h2 className="mt-1 font-serif text-2xl font-semibold text-stone-900 sm:text-3xl">
                Agenda Kegiatan Desa
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('AGENDA')}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900 hover:underline whitespace-nowrap"
            >
              Lihat Semua Agenda & Arsip
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {db.agenda.slice(0, 4).map((ag) => (
              <div
                key={ag.id}
                className="flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-stone-500">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-emerald-900">
                        {formatTanggalIndo(ag.tanggal)}
                      </span>
                      <span>·</span>
                      <span className="font-mono">{ag.jam}</span>
                    </div>
                    <span className="font-medium text-stone-700">{ag.status}</span>
                  </div>
                  <h3 className="mt-2 font-serif text-base font-semibold text-stone-900">
                    {ag.namaKegiatan}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-stone-600">{ag.deskripsi}</p>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-stone-100 pt-3 text-xs text-stone-500">
                  <span>Lokasi: {ag.lokasi}</span>
                  <span>·</span>
                  <span>Penyelenggara: {ag.penyelenggara}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* I. PEMBANGUNAN DESA (DENGAN FOTO SEBELUM / PROSES / SELESAI) */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-2 border-b border-stone-200 pb-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-medium tracking-widest uppercase text-emerald-900">
                Keterbukaan Infrastruktur Fisik
              </p>
              <h2 className="mt-1 font-serif text-2xl font-semibold text-stone-900 sm:text-3xl">
                Realisasi Pembangunan Desa
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('PEMBANGUNAN')}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900 hover:underline whitespace-nowrap"
            >
              Detail Seluruh Proyek Pembangunan
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {db.pembangunan.slice(0, 3).map((proyek) => {
              const currentStage = pembangunanPhotoStage[proyek.id] || 'selesai';
              return (
                <div
                  key={proyek.id}
                  className="flex flex-col justify-between overflow-hidden rounded-xl border border-stone-200 bg-white"
                >
                  <div>
                    <div className="relative aspect-4/3 w-full bg-stone-100">
                      <SmartImage
                        src={getStagePhoto(proyek)}
                        alt={`${proyek.namaProyek} - ${currentStage}`}
                        className="h-full w-full object-cover"
                      />
                      {/* Interactive Stage Switcher */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-lg bg-stone-950/80 p-1 backdrop-blur-xs">
                        {(['sebelum', 'proses', 'selesai'] as const).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() =>
                              setPembangunanPhotoStage((prev) => ({ ...prev, [proyek.id]: st }))
                            }
                            className={`rounded-md px-2.5 py-1 text-[11px] font-medium capitalize transition-colors ${
                              currentStage === st
                                ? 'bg-emerald-800 text-white'
                                : 'text-stone-300 hover:text-white'
                            }`}
                          >
                            Foto {st}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="flex items-center gap-2 text-xs text-stone-500">
                        <span className="font-mono font-semibold text-emerald-900">
                          TA {proyek.tahun}
                        </span>
                        <span>·</span>
                        <span>{proyek.sumberDana}</span>
                      </div>
                      <h3 className="mt-1.5 font-serif text-base font-semibold text-stone-900">
                        {proyek.namaProyek}
                      </h3>
                      <p className="mt-1 text-xs text-stone-500">Lokasi: {proyek.lokasi}</p>
                      <p className="mt-2 text-xs leading-relaxed text-stone-600">
                        {proyek.keterangan}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-stone-100 bg-stone-50 p-5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-500">Anggaran:</span>
                      <span className="font-mono font-semibold tabular-nums text-stone-900">
                        {formatRupiah(proyek.nilaiAnggaran)}
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-stone-700">{proyek.status}</span>
                        <span className="font-mono font-semibold tabular-nums text-emerald-900">
                          {proyek.progres}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-stone-200">
                        <div
                          className="h-full rounded-full bg-emerald-800 transition-all"
                          style={{ width: `${Math.min(100, Math.max(0, proyek.progres))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* H. POTENSI DESA & UMKM */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-2 border-b border-stone-200 pb-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-medium tracking-widest uppercase text-emerald-900">
                Ekonomi Kerakyatan & Produk Unggulan
              </p>
              <h2 className="mt-1 font-serif text-2xl font-semibold text-stone-900 sm:text-3xl">
                Potensi Desa, Pertanian, Wisata & UMKM
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('POTENSI DESA')}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900 hover:underline whitespace-nowrap"
            >
              Jelajahi Semua Potensi Desa ({db.potensi.length})
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {db.potensi.slice(0, 3).map((pot) => (
              <div
                key={pot.id}
                className="flex flex-col justify-between overflow-hidden rounded-xl border border-stone-200 bg-white"
              >
                <div>
                  <div className="aspect-4/3 w-full overflow-hidden bg-stone-100">
                    <SmartImage
                      src={pot.fotoUrl}
                      alt={pot.nama}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-xs text-stone-500">
                      <span className="font-semibold text-emerald-900">{pot.kategori}</span>
                      <span>·</span>
                      <span>{pot.kisaranHarga}</span>
                    </div>
                    <h3 className="mt-1.5 font-serif text-base font-semibold text-stone-900">
                      {pot.nama}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-stone-600">{pot.deskripsi}</p>
                    <p className="mt-3 text-xs text-stone-500">
                      Pengelola: <span className="font-medium text-stone-800">{pot.pemilik}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-stone-100 bg-stone-50 px-5 py-3">
                  <a
                    href={`https://wa.me/${pot.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-emerald-900 hover:underline"
                  >
                    Hubungi WhatsApp UMKM
                  </a>
                  <a
                    href={pot.lokasiMaps}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900"
                  >
                    Lokasi Maps <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* G. GALERI TERBARU */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-2 border-b border-stone-200 pb-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-medium tracking-widest uppercase text-emerald-900">
                Dokumentasi Visual Kegiatan
              </p>
              <h2 className="mt-1 font-serif text-2xl font-semibold text-stone-900 sm:text-3xl">
                Galeri Foto Terbaru
              </h2>
            </div>
            <div className="flex items-center gap-4">
              {sortedGaleri.length > 0 && (
                <button
                  type="button"
                  onClick={() => onOpenLightbox(sortedGaleri, 0)}
                  className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-800 hover:bg-stone-100 whitespace-nowrap"
                >
                  <Play className="h-3.5 w-3.5" />
                  Buka Lightbox & Slideshow
                </button>
              )}
              <button
                type="button"
                onClick={() => onNavigate('GALERI')}
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900 hover:underline whitespace-nowrap"
              >
                Semua Galeri
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {sortedGaleri.slice(0, 4).map((item, idx) => (
              <div
                key={item.id}
                onClick={() => onOpenLightbox(sortedGaleri, idx)}
                className="group cursor-pointer overflow-hidden rounded-xl border border-stone-200 bg-white"
              >
                <div className="aspect-4/3 w-full overflow-hidden bg-stone-100">
                  <SmartImage
                    src={item.fotoUrl}
                    alt={item.judul}
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                    <span className="font-semibold text-emerald-900">{item.kategori}</span>
                    <span>·</span>
                    <span className="font-mono">{formatTanggalIndo(item.tanggal)}</span>
                  </div>
                  <h3 className="mt-1 line-clamp-2 text-xs font-semibold text-stone-900 group-hover:text-emerald-900">
                    {item.judul}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* K. KONTAK & PETA LOKASI DESA */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="p-6 sm:p-8 lg:col-span-5">
                <p className="text-xs font-medium tracking-widest uppercase text-emerald-900">
                  Hubungi Pemerintah Desa
                </p>
                <h2 className="mt-1 font-serif text-2xl font-semibold text-stone-900">
                  Kantor Pelayanan {db.settings.namaDesa}
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-stone-600">
                  {db.settings.alamatKantor}
                </p>

                <dl className="mt-6 space-y-3 border-t border-stone-200 pt-4 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <dt className="text-stone-500">Telepon / WhatsApp</dt>
                    <dd className="font-mono font-semibold text-stone-900">
                      {db.settings.telepon} / +{db.settings.whatsapp}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <dt className="text-stone-500">Surat Elektronik (Email)</dt>
                    <dd className="font-mono text-stone-900">{db.settings.email}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <dt className="text-stone-500">Jam Pelayanan</dt>
                    <dd className="text-right text-stone-800">{db.settings.jamPelayanan}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <dt className="text-stone-500">Titik Koordinat</dt>
                    <dd className="font-mono text-stone-800">{db.settings.koordinat}</dd>
                  </div>
                </dl>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <a
                    href={`https://wa.me/${db.settings.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-emerald-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-800"
                  >
                    Chat WhatsApp Layanan Desa
                  </a>
                  <button
                    type="button"
                    onClick={() => onNavigate('KONTAK')}
                    className="rounded-lg border border-stone-300 px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-100"
                  >
                    Buka Formulir Aspirasi Warga
                  </button>
                </div>
              </div>

              <div className="min-h-[300px] border-t border-stone-200 bg-stone-100 lg:col-span-7 lg:border-t-0 lg:border-l">
                <iframe
                  title={`Peta Lokasi ${db.settings.namaDesa}`}
                  src={db.settings.mapsEmbedUrl}
                  className="h-full min-h-[320px] w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ============================================================================
  // 2. HALAMAN PROFIL DESA
  // ============================================================================
  if (activePage === 'PROFIL DESA') {
    const sejarahParagraphs = db.profil.sejarah.split('\n').filter((p) => p.trim().length > 0);

    return (
      <div className="mx-auto max-w-7xl space-y-12 px-4 py-10 sm:px-6 lg:px-8">
        {/* Header Banner */}
        <div className="border-b border-stone-200 pb-6">
          <p className="text-xs font-medium tracking-widest uppercase text-emerald-900">
            Mengenal Lebih Dekat · {db.settings.kecamatan} · {db.settings.kabupaten}
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-stone-900 sm:text-4xl">
            Profil Lengkap {db.settings.namaDesa}
          </h1>
        </div>

        {/* Sejarah & Kepala Desa */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <div className="rounded-xl border border-stone-200 bg-white p-6 sm:p-8">
              <h2 className="font-serif text-2xl font-semibold text-stone-900">Sejarah Desa</h2>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-stone-700 sm:text-base">
                {sejarahParagraphs.map((p, idx) => (
                  <p
                    key={idx}
                    className={
                      idx === 0
                        ? 'first-letter:float-left first-letter:mr-3 first-letter:font-serif first-letter:text-4xl first-letter:font-bold first-letter:text-emerald-900'
                        : ''
                    }
                  >
                    {p}
                  </p>
                ))}
              </div>
            </div>

            {/* Visi & Misi */}
            <div className="rounded-xl border border-stone-200 bg-white p-6 sm:p-8">
              <h2 className="font-serif text-2xl font-semibold text-stone-900">Visi dan Misi</h2>
              <div className="mt-4 border-l-2 border-emerald-900 pl-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-900">
                  Visi Pembangunan Desa
                </p>
                <p className="mt-1 font-serif text-lg italic text-stone-900">
                  &ldquo;{db.profil.visi}&rdquo;
                </p>
              </div>

              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-900">
                  Misi Penyelenggaraan Pemerintahan & Pembangunan
                </p>
                <ol className="mt-3 space-y-2.5 text-sm text-stone-700">
                  {db.profil.misi.map((m, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="font-mono text-xs font-semibold text-emerald-900 mt-0.5">
                        0{idx + 1}.
                      </span>
                      <span className="leading-relaxed">{m}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>

          {/* Sidebar Kepala Desa & Wilayah */}
          <div className="space-y-6 lg:col-span-4">
            <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
              <div className="aspect-square w-full bg-stone-100">
                <SmartImage
                  src={db.profil.kepalaDesaFoto}
                  alt={db.profil.kepalaDesaNama}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-5">
                <p className="text-xs font-semibold text-emerald-900">{db.profil.kepalaDesaJabatan}</p>
                <h3 className="mt-0.5 font-serif text-lg font-semibold text-stone-900">
                  {db.profil.kepalaDesaNama}
                </h3>
                <p className="font-mono text-xs text-stone-500">{db.profil.kepalaDesaPeriode}</p>
                <p className="mt-3 text-xs leading-relaxed text-stone-600">
                  {db.profil.kepalaDesaSambutan}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-stone-200 bg-white p-6">
              <h3 className="font-serif text-lg font-semibold text-stone-900">
                Geografis & Batas Wilayah
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-stone-600">
                {db.profil.letakGeografis}
              </p>
              <dl className="mt-4 divide-y divide-stone-100 text-xs">
                <div className="flex justify-between py-2">
                  <dt className="text-stone-500">Luas Wilayah</dt>
                  <dd className="font-mono font-semibold text-stone-900">{db.profil.luasWilayah}</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-stone-500">Ketinggian</dt>
                  <dd className="font-mono text-stone-800">{db.profil.ketinggianMdpl}</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-stone-500">Batas Utara</dt>
                  <dd className="text-right font-medium text-stone-800">{db.profil.batasUtara}</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-stone-500">Batas Selatan</dt>
                  <dd className="text-right font-medium text-stone-800">{db.profil.batasSelatan}</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-stone-500">Batas Timur</dt>
                  <dd className="text-right font-medium text-stone-800">{db.profil.batasTimur}</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-stone-500">Batas Barat</dt>
                  <dd className="text-right font-medium text-stone-800">{db.profil.batasBarat}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Kondisi Desa & Ringkasan Perangkat */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 sm:p-8">
          <h2 className="font-serif text-2xl font-semibold text-stone-900">
            Kondisi Topografi, Lahan, dan Wilayah Dusun
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-stone-700">{db.profil.kondisiDesa}</p>
          <div className="mt-4 border-t border-stone-200 pt-4 text-xs text-stone-600">
            Pembagian Wilayah Administratif: <strong className="text-stone-900">{db.profil.jumlahDusun}</strong>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 3. HALAMAN PEMERINTAHAN DESA
  // ============================================================================
  if (activePage === 'PEMERINTAHAN') {
    return (
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        <div className="border-b border-stone-200 pb-6">
          <p className="text-xs font-medium tracking-widest uppercase text-emerald-900">
            Susunan Organisasi & Tata Kerja (SOTK)
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-stone-900 sm:text-4xl">
            Struktur Pemerintahan & Perangkat {db.settings.namaDesa}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-stone-600">
            {db.profil.strukturBaganCatatan}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {sortedPemerintahan.map((p) => (
            <div
              key={p.id}
              className="flex flex-col justify-between overflow-hidden rounded-xl border border-stone-200 bg-white"
            >
              <div>
                <div className="aspect-square w-full overflow-hidden bg-stone-100">
                  <SmartImage
                    src={p.fotoUrl}
                    alt={p.nama}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-1.5 text-xs text-stone-500">
                    <span className="font-semibold text-emerald-900">{p.kategori}</span>
                    <span>·</span>
                    <span className="font-mono">Urutan #{p.urutan}</span>
                  </div>
                  <h3 className="mt-1 font-serif text-base font-semibold text-stone-900">
                    {p.nama}
                  </h3>
                  <p className="text-xs font-semibold text-stone-700">{p.jabatan}</p>
                  <p className="mt-1 font-mono text-[11px] text-stone-500">{p.nip}</p>
                  <p className="mt-3 text-xs leading-relaxed text-stone-600">{p.deskripsi}</p>
                </div>
              </div>
              <div className="border-t border-stone-100 bg-stone-50 px-5 py-2.5 text-[11px] text-stone-500">
                Pendidikan: {p.pendidikan} · Masa Bakti: {p.periode}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ============================================================================
  // 4. HALAMAN BERITA DESA (DENGAN PAGINATION & FILTER)
  // ============================================================================
  if (activePage === 'BERITA') {
    const categories = [
      'Semua',
      'Pemerintahan',
      'Pembangunan',
      'Kemasyarakatan',
      'UMKM & Ekonomi',
      'Budaya',
      'Pengumuman',
      'Kesehatan',
    ];

    const filtered =
      beritaCategory === 'Semua'
        ? publishedBerita
        : publishedBerita.filter((b) => b.kategori === beritaCategory);

    const ITEMS_PER_PAGE = 6;
    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const paginated = filtered.slice(
      (beritaPage - 1) * ITEMS_PER_PAGE,
      beritaPage * ITEMS_PER_PAGE
    );

    return (
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="border-b border-stone-200 pb-6">
          <p className="text-xs font-medium tracking-widest uppercase text-emerald-900">
            Portal Berita Resmi Desa
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-stone-900 sm:text-4xl">
            Kabar & Berita {db.settings.namaDesa}
          </h1>
        </div>

        {/* Category Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-stone-200 bg-white p-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setBeritaCategory(cat);
                setBeritaPage(1);
              }}
              className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                beritaCategory === cat
                  ? 'bg-emerald-900 text-white'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {paginated.length === 0 ? (
          <div className="rounded-xl border border-stone-200 bg-white p-12 text-center">
            <p className="text-sm font-medium text-stone-700">
              Belum ada berita pada kategori &ldquo;{beritaCategory}&rdquo;.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {paginated.map((item) => (
              <article
                key={item.id}
                onClick={() => onOpenBerita(item)}
                className="group flex cursor-pointer flex-col justify-between overflow-hidden rounded-xl border border-stone-200 bg-white transition-all hover:border-stone-300"
              >
                <div>
                  <div className="aspect-4/3 w-full overflow-hidden bg-stone-100">
                    <SmartImage
                      src={item.fotoUtama}
                      alt={item.judul}
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-xs text-stone-500">
                      <span className="font-semibold text-emerald-900">{item.kategori}</span>
                      <span>·</span>
                      <span className="font-mono">{formatTanggalIndo(item.tanggal)}</span>
                    </div>
                    <h2 className="mt-2 font-serif text-lg font-semibold leading-snug text-stone-900 group-hover:text-emerald-900">
                      {item.judul}
                    </h2>
                    <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-stone-600">
                      {item.ringkasan}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-stone-100 bg-stone-50 px-5 py-3 text-xs">
                  <span className="text-stone-500">{item.penulis}</span>
                  <span className="flex items-center gap-1 font-semibold text-emerald-900">
                    Baca Selengkapnya <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setBeritaPage(page)}
                className={`h-9 w-9 rounded-lg font-mono text-xs font-semibold transition-colors ${
                  beritaPage === page
                    ? 'bg-emerald-900 text-white'
                    : 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // 5. HALAMAN AGENDA DESA
  // ============================================================================
  if (activePage === 'AGENDA') {
    const filteredAgenda =
      agendaFilter === 'Semua'
        ? db.agenda
        : db.agenda.filter((a) => a.status === agendaFilter);

    return (
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 border-b border-stone-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-emerald-900">
              Jadwal & Arsip Kegiatan
            </p>
            <h1 className="mt-1 font-serif text-3xl font-semibold text-stone-900 sm:text-4xl">
              Agenda Kegiatan {db.settings.namaDesa}
            </h1>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white p-1">
            {(['Semua', 'Akan Datang', 'Selesai'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setAgendaFilter(st)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  agendaFilter === st
                    ? 'bg-emerald-900 text-white'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {st === 'Selesai' ? 'Arsip Selesai' : st}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {filteredAgenda.map((ag) => (
            <div
              key={ag.id}
              className="flex flex-col justify-between overflow-hidden rounded-xl border border-stone-200 bg-white sm:flex-row"
            >
              <div className="aspect-16/9 w-full shrink-0 bg-stone-100 sm:w-48">
                <SmartImage
                  src={ag.fotoUrl}
                  alt={ag.namaKegiatan}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col justify-between p-5">
                <div>
                  <div className="flex items-center gap-2 text-xs text-stone-500">
                    <span className="font-mono font-semibold text-emerald-900">
                      {formatTanggalIndo(ag.tanggal)}
                    </span>
                    <span>·</span>
                    <span className="font-mono">{ag.jam}</span>
                    <span>·</span>
                    <span className="font-semibold text-stone-800">{ag.status}</span>
                  </div>
                  <h2 className="mt-1.5 font-serif text-lg font-semibold text-stone-900">
                    {ag.namaKegiatan}
                  </h2>
                  <p className="mt-1.5 text-xs leading-relaxed text-stone-600">{ag.deskripsi}</p>
                </div>
                <div className="mt-4 border-t border-stone-100 pt-3 text-xs text-stone-500">
                  Lokasi: <strong className="text-stone-800">{ag.lokasi}</strong> · Penyelenggara:{' '}
                  {ag.penyelenggara}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ============================================================================
  // 6. HALAMAN GALERI DESA
  // ============================================================================
  if (activePage === 'GALERI') {
    const galeriCategories = [
      'Semua',
      'Kegiatan Desa',
      'Pemerintahan',
      'Pembangunan',
      'Budaya',
      'Olahraga',
      'UMKM',
      'Pertanian',
      'Wisata',
      'Lainnya',
    ];

    const filteredGaleri =
      galeriCategory === 'Semua'
        ? sortedGaleri
        : sortedGaleri.filter((g) => g.kategori === galeriCategory);

    const ITEMS_PER_PAGE = 8;
    const totalPages = Math.max(1, Math.ceil(filteredGaleri.length / ITEMS_PER_PAGE));
    const paginatedGaleri = filteredGaleri.slice(
      (galeriPage - 1) * ITEMS_PER_PAGE,
      galeriPage * ITEMS_PER_PAGE
    );

    return (
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 border-b border-stone-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-emerald-900">
              Arsip Visual Terhubung Google Drive
            </p>
            <h1 className="mt-1 font-serif text-3xl font-semibold text-stone-900 sm:text-4xl">
              Galeri Dokumentasi {db.settings.namaDesa}
            </h1>
          </div>

          {filteredGaleri.length > 0 && (
            <button
              type="button"
              onClick={() => onOpenLightbox(filteredGaleri, 0)}
              className="flex items-center gap-2 rounded-lg bg-emerald-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-800 whitespace-nowrap"
            >
              <Play className="h-4 w-4" />
              Putar Slideshow ({filteredGaleri.length} Foto)
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-stone-200 bg-white p-2">
          {galeriCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setGaleriCategory(cat);
                setGaleriPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                galeriCategory === cat
                  ? 'bg-emerald-900 text-white'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {paginatedGaleri.map((item, idx) => (
            <div
              key={item.id}
              onClick={() =>
                onOpenLightbox(filteredGaleri, (galeriPage - 1) * ITEMS_PER_PAGE + idx)
              }
              className="group cursor-pointer overflow-hidden rounded-xl border border-stone-200 bg-white transition-all hover:border-stone-300"
            >
              <div className="aspect-4/3 w-full overflow-hidden bg-stone-100">
                <SmartImage
                  src={item.fotoUrl}
                  alt={item.judul}
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                  <span className="font-semibold text-emerald-900">{item.kategori}</span>
                  <span>·</span>
                  <span className="font-mono">{formatTanggalIndo(item.tanggal)}</span>
                </div>
                <h3 className="mt-1 font-serif text-sm font-semibold text-stone-900 group-hover:text-emerald-900">
                  {item.judul}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs text-stone-600">{item.keterangan}</p>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setGaleriPage(page)}
                className={`h-9 w-9 rounded-lg font-mono text-xs font-semibold ${
                  galeriPage === page
                    ? 'bg-emerald-900 text-white'
                    : 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // 7. HALAMAN POTENSI DESA
  // ============================================================================
  if (activePage === 'POTENSI DESA') {
    const potensiCategories = [
      'Semua',
      'Produk Unggulan',
      'UMKM',
      'Pertanian',
      'Peternakan',
      'Perikanan',
      'Wisata',
      'Kerajinan',
      'Kuliner',
    ];

    const filteredPotensi =
      potensiCategory === 'Semua'
        ? db.potensi
        : db.potensi.filter((p) => p.kategori === potensiCategory);

    return (
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="border-b border-stone-200 pb-6">
          <p className="text-xs font-medium tracking-widest uppercase text-emerald-900">
            Katalog Ekonomi & Direktori Usaha Warga
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-stone-900 sm:text-4xl">
            Potensi & Produk Unggulan {db.settings.namaDesa}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-stone-200 bg-white p-2">
          {potensiCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setPotensiCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                potensiCategory === cat
                  ? 'bg-emerald-900 text-white'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPotensi.map((pot) => (
            <div
              key={pot.id}
              className="flex flex-col justify-between overflow-hidden rounded-xl border border-stone-200 bg-white"
            >
              <div>
                <div className="aspect-4/3 w-full overflow-hidden bg-stone-100">
                  <SmartImage
                    src={pot.fotoUrl}
                    alt={pot.nama}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 text-xs text-stone-500">
                    <span className="font-semibold text-emerald-900">{pot.kategori}</span>
                    <span>·</span>
                    <span className="font-mono">{pot.kisaranHarga}</span>
                  </div>
                  <h2 className="mt-2 font-serif text-xl font-semibold text-stone-900">
                    {pot.nama}
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-stone-600">{pot.deskripsi}</p>

                  <dl className="mt-4 space-y-1.5 border-t border-stone-100 pt-3 text-xs">
                    <div className="flex justify-between gap-2">
                      <dt className="text-stone-500">Pengelola / Pemilik:</dt>
                      <dd className="text-right font-medium text-stone-900">{pot.pemilik}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-stone-500">Alamat:</dt>
                      <dd className="text-right text-stone-700">{pot.alamat}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-stone-500">Telepon:</dt>
                      <dd className="font-mono text-stone-800">{pot.kontak}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-stone-200 bg-stone-50 px-6 py-3.5">
                <a
                  href={`https://wa.me/${pot.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Halo ${pot.pemilik}, saya melihat informasi "${pot.nama}" di Portal Resmi ${db.settings.namaDesa}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-emerald-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
                >
                  Pesan via WhatsApp
                </a>
                <a
                  href={pot.lokasiMaps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-semibold text-stone-700 hover:text-emerald-900"
                >
                  Titik Google Maps <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ============================================================================
  // 8. HALAMAN DATA DESA (STATISTIK KEPENDUDUKAN & WILAYAH)
  // ============================================================================
  if (activePage === 'DATA DESA') {
    const totalPenduduk =
      sortedStatistik.find((s) => s.label.toLowerCase().includes('jumlah penduduk'))?.nilai || 4862;

    return (
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        <div className="border-b border-stone-200 pb-6">
          <p className="text-xs font-medium tracking-widest uppercase text-emerald-900">
            Basis Data Kependudukan & Monografi Desa
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-stone-900 sm:text-4xl">
            Statistik & Data {db.settings.namaDesa}
          </h1>
        </div>

        {/* Summary Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          {utamaStatistik.slice(0, 7).map((st) => (
            <div key={st.id} className="rounded-xl border border-stone-200 bg-white p-4">
              <p className="text-xs font-medium text-stone-500">{st.label}</p>
              <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-stone-900">
                {formatAngka(st.nilai)}{' '}
                <span className="text-xs font-normal text-stone-500">{st.satuan}</span>
              </p>
              <p className="mt-1 text-[11px] text-stone-500">{st.keterangan}</p>
            </div>
          ))}
        </div>

        {/* Dynamic Recharts Pie & Bar Visualizations */}
        <DataDesaCharts dataDesa={sortedStatistik} namaDesa={db.settings.namaDesa} />

        {/* Detailed Monografi Table */}
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
          <div className="border-b border-stone-200 px-6 py-4">
            <h2 className="font-serif text-lg font-semibold text-stone-900">
              Tabel Rincian Indikator Demografi, Pendidikan & Pekerjaan Warga
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-xs font-semibold text-stone-600">
                <tr>
                  <th className="px-6 py-3.5">No</th>
                  <th className="px-6 py-3.5">Kategori</th>
                  <th className="px-6 py-3.5">Indikator Data Desa</th>
                  <th className="px-6 py-3.5 text-right">Jumlah / Nilai</th>
                  <th className="px-6 py-3.5">Proporsi Visual</th>
                  <th className="px-6 py-3.5">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {sortedStatistik.map((row, idx) => {
                  const pct =
                    row.satuan === 'Jiwa'
                      ? Math.min(100, Math.round((row.nilai / totalPenduduk) * 100))
                      : 100;
                  return (
                    <tr key={row.id} className="hover:bg-stone-50">
                      <td className="px-6 py-3 font-mono text-xs text-stone-500">{idx + 1}</td>
                      <td className="px-6 py-3 text-xs font-semibold text-emerald-900">
                        {row.kategori}
                      </td>
                      <td className="px-6 py-3 font-medium text-stone-900">{row.label}</td>
                      <td className="px-6 py-3 text-right font-mono font-semibold tabular-nums text-stone-900">
                        {formatAngka(row.nilai)} {row.satuan}
                      </td>
                      <td className="px-6 py-3 w-44">
                        {row.satuan === 'Jiwa' ? (
                          <div className="flex items-center gap-2">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-200">
                              <div
                                className="h-full rounded-full bg-emerald-800"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="font-mono text-xs text-stone-500 w-9 text-right">
                              {pct}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-stone-400">Wilayah Administratif</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-xs text-stone-600">{row.keterangan}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 9. HALAMAN PEMBANGUNAN DESA
  // ============================================================================
  if (activePage === 'PEMBANGUNAN') {
    return (
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="border-b border-stone-200 pb-6">
          <p className="text-xs font-medium tracking-widest uppercase text-emerald-900">
            Laporan Fisik & Progres Proyek Desa
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-stone-900 sm:text-4xl">
            Transparansi Pembangunan {db.settings.namaDesa}
          </h1>
        </div>

        <div className="space-y-8">
          {db.pembangunan.map((proyek) => (
            <div
              key={proyek.id}
              className="overflow-hidden rounded-xl border border-stone-200 bg-white p-6 sm:p-8"
            >
              <div className="flex flex-col justify-between gap-4 border-b border-stone-200 pb-5 lg:flex-row lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                    <span className="font-mono font-semibold text-emerald-900">
                      Tahun Anggaran {proyek.tahun}
                    </span>
                    <span>·</span>
                    <span>Sumber Dana: {proyek.sumberDana}</span>
                    <span>·</span>
                    <span>Pelaksana: {proyek.pelaksana}</span>
                  </div>
                  <h2 className="mt-1.5 font-serif text-2xl font-semibold text-stone-900">
                    {proyek.namaProyek}
                  </h2>
                  <p className="mt-1 text-xs text-stone-600">Lokasi: {proyek.lokasi}</p>
                </div>

                <div className="text-left lg:text-right">
                  <p className="text-xs text-stone-500">Nilai Pagu Anggaran</p>
                  <p className="font-mono text-2xl font-bold tabular-nums text-emerald-900">
                    {formatRupiah(proyek.nilaiAnggaran)}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="my-5 rounded-lg bg-stone-50 p-4 border border-stone-200/70">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-semibold text-stone-900">Status: {proyek.status}</span>
                    <span className="mx-2 text-stone-400">·</span>
                    <span className="font-mono text-stone-600">
                      Waktu Pelaksanaan: {formatTanggalIndo(proyek.tanggalMulai)} s/d{' '}
                      {formatTanggalIndo(proyek.tanggalSelesai)}
                    </span>
                  </div>
                  <span className="font-mono text-sm font-bold tabular-nums text-emerald-900">
                    Progres Fisik: {proyek.progres}%
                  </span>
                </div>
                <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-stone-200">
                  <div
                    className="h-full rounded-full bg-emerald-800 transition-all"
                    style={{ width: `${proyek.progres}%` }}
                  />
                </div>
                <p className="mt-2.5 text-xs text-stone-600">{proyek.keterangan}</p>
              </div>

              {/* 3 Photo Stages: Sebelum (0%), Proses (50%), Selesai (100%) */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="overflow-hidden rounded-lg border border-stone-200">
                  <div className="aspect-4/3 w-full bg-stone-100">
                    <SmartImage
                      src={proyek.fotoSebelum}
                      alt={`Kondisi Sebelum - ${proyek.namaProyek}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="bg-stone-50 px-3 py-2 text-xs font-medium text-stone-700">
                    01. Dokumentasi Kondisi Sebelum (0%)
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-stone-200">
                  <div className="aspect-4/3 w-full bg-stone-100">
                    <SmartImage
                      src={proyek.fotoProses}
                      alt={`Proses Pengerjaan - ${proyek.namaProyek}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="bg-stone-50 px-3 py-2 text-xs font-medium text-stone-700">
                    02. Dokumentasi Proses Pengerjaan (50%)
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-stone-200">
                  <div className="aspect-4/3 w-full bg-stone-100">
                    <SmartImage
                      src={proyek.fotoSelesai}
                      alt={`Hasil Akhir - ${proyek.namaProyek}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="bg-stone-50 px-3 py-2 text-xs font-medium text-stone-700">
                    03. Dokumentasi Hasil Akhir ({proyek.progres}%)
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ============================================================================
  // 10. HALAMAN TRANSPARANSI APBDES
  // ============================================================================
  if (activePage === 'TRANSPARANSI') {
    const pctPendapatan =
      totalPendapatanAnggaran > 0
        ? ((totalPendapatanRealisasi / totalPendapatanAnggaran) * 100).toFixed(1)
        : '0';
    const pctBelanja =
      totalBelanjaAnggaran > 0
        ? ((totalBelanjaRealisasi / totalBelanjaAnggaran) * 100).toFixed(1)
        : '0';

    return (
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 border-b border-stone-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-emerald-900">
              Keterbukaan Keuangan Desa (Siskeudes)
            </p>
            <h1 className="mt-1 font-serif text-3xl font-semibold text-stone-900 sm:text-4xl">
              Transparansi APBDes & Realisasi Anggaran
            </h1>
          </div>

          <button
            type="button"
            onClick={() => {
              const apbDoc = db.dokumen[0];
              if (apbDoc) onOpenDokumen(apbDoc);
              else onNavigate('DOKUMEN');
            }}
            className="flex items-center gap-2 rounded-lg bg-emerald-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-800 whitespace-nowrap"
          >
            <Download className="h-4 w-4" />
            Unduh PDF Laporan APBDes Resmi
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="rounded-xl border border-stone-200 bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-900">
              Total Pendapatan Desa
            </p>
            <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-stone-900">
              {formatRupiah(totalPendapatanRealisasi)}
            </p>
            <p className="mt-1 font-mono text-xs text-stone-500">
              Target Pagu: {formatRupiah(totalPendapatanAnggaran)} ({pctPendapatan}%)
            </p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-stone-200">
              <div
                className="h-full rounded-full bg-emerald-800"
                style={{ width: `${Math.min(100, Number(pctPendapatan))}%` }}
              />
            </div>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">
              Total Belanja Desa
            </p>
            <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-stone-900">
              {formatRupiah(totalBelanjaRealisasi)}
            </p>
            <p className="mt-1 font-mono text-xs text-stone-500">
              Pagu Belanja: {formatRupiah(totalBelanjaAnggaran)} ({pctBelanja}%)
            </p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-stone-200">
              <div
                className="h-full rounded-full bg-amber-700"
                style={{ width: `${Math.min(100, Number(pctBelanja))}%` }}
              />
            </div>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-600">
              Surplus / Sisa Lebih Perhitungan (SiLPA Berjalan)
            </p>
            <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-emerald-900">
              {formatRupiah(totalPendapatanRealisasi - totalBelanjaRealisasi)}
            </p>
            <p className="mt-1 text-xs text-stone-500">
              Selisih Realisasi Pendapatan dikurangi Realisasi Belanja
            </p>
          </div>
        </div>

        {/* Itemized APBDes Table */}
        {(['Pendapatan', 'Belanja', 'Pembiayaan'] as const).map((jenis) => {
          const rows = db.transparansi.filter((t) => t.jenis === jenis);
          return (
            <div key={jenis} className="overflow-hidden rounded-xl border border-stone-200 bg-white">
              <div className="border-b border-stone-200 bg-stone-50 px-6 py-4">
                <h2 className="font-serif text-lg font-semibold text-stone-900">
                  Rincian {jenis} Desa Tahun Anggaran 2026
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-stone-200 text-xs font-semibold text-stone-600">
                    <tr>
                      <th className="px-6 py-3.5">Bidang / Kategori</th>
                      <th className="px-6 py-3.5">Uraian Kegiatan</th>
                      <th className="px-6 py-3.5 text-right">Anggaran (Pagu)</th>
                      <th className="px-6 py-3.5 text-right">Realisasi</th>
                      <th className="px-6 py-3.5 text-right">Capaian</th>
                      <th className="px-6 py-3.5">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {rows.map((item) => {
                      const pct =
                        item.anggaran > 0
                          ? ((item.realisasi / item.anggaran) * 100).toFixed(1)
                          : '0.0';
                      return (
                        <tr key={item.id} className="hover:bg-stone-50">
                          <td className="px-6 py-3.5 font-semibold text-stone-900">
                            {item.kategori}
                          </td>
                          <td className="px-6 py-3.5 text-xs text-stone-600">{item.uraian}</td>
                          <td className="px-6 py-3.5 text-right font-mono text-xs tabular-nums text-stone-700">
                            {formatRupiah(item.anggaran)}
                          </td>
                          <td className="px-6 py-3.5 text-right font-mono text-xs font-semibold tabular-nums text-emerald-900">
                            {formatRupiah(item.realisasi)}
                          </td>
                          <td className="px-6 py-3.5 text-right font-mono text-xs font-semibold tabular-nums text-stone-900">
                            {pct}%
                          </td>
                          <td className="px-6 py-3.5 text-xs text-stone-500">{item.keterangan}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ============================================================================
  // 11. HALAMAN DOKUMEN DESA
  // ============================================================================
  if (activePage === 'DOKUMEN') {
    const docCategories = [
      'Semua',
      'Peraturan Desa (Perdes)',
      'SK Kepala Desa',
      'APBDes & Keuangan',
      'RPJMDes & RKPDes',
      'Formulir Layanan Warga',
      'Laporan Keterangan (LKPPD)',
      'Lainnya',
    ];

    const filteredDocs =
      dokumenCategory === 'Semua'
        ? db.dokumen
        : db.dokumen.filter((d) => d.kategori === dokumenCategory);

    return (
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="border-b border-stone-200 pb-6">
          <p className="text-xs font-medium tracking-widest uppercase text-emerald-900">
            Pusat Unduhan Produk Hukum & Formulir Warga
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-stone-900 sm:text-4xl">
            Dokumen Publik {db.settings.namaDesa}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-stone-200 bg-white p-2">
          {docCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setDokumenCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                dokumenCategory === cat
                  ? 'bg-emerald-900 text-white'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="flex flex-col justify-between gap-4 p-6 transition-colors hover:bg-stone-50 sm:flex-row sm:items-center"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                  <span className="font-semibold text-emerald-900">{doc.kategori}</span>
                  <span>·</span>
                  <span className="font-mono">{doc.nomorDokumen}</span>
                  <span>·</span>
                  <span className="font-mono">{formatTanggalIndo(doc.tanggal)}</span>
                  <span>·</span>
                  <span className="font-mono">
                    {doc.tipeFile} ({doc.ukuranFile})
                  </span>
                </div>
                <h2 className="font-serif text-lg font-semibold text-stone-900">{doc.nama}</h2>
                <p className="text-xs leading-relaxed text-stone-600 max-w-3xl">{doc.deskripsi}</p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <span className="font-mono text-xs text-stone-500">
                  {doc.unduhan}x diunduh
                </span>
                <button
                  type="button"
                  onClick={() => onOpenDokumen(doc)}
                  className="flex items-center gap-2 rounded-lg bg-emerald-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-800 whitespace-nowrap"
                >
                  <FileText className="h-4 w-4" />
                  Lihat & Unduh
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ============================================================================
  // 12. HALAMAN KONTAK DESA & LAYANAN PENGADUAN / ASPIRASI
  // ============================================================================
  const handleSendWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    setPesanTerkirim(true);
    const text = `Halo Pemerintah ${db.settings.namaDesa},\n\nNama: ${wargaNama}\nWilayah: ${wargaDusun}\nKeperluan: ${wargaKeperluan}\nPesan/Aspirasi:\n${wargaPesan}`;
    const waUrl = `https://wa.me/${db.settings.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      <div className="border-b border-stone-200 pb-6">
        <p className="text-xs font-medium tracking-widest uppercase text-emerald-900">
          Layanan Pengaduan, Administrasi & Aspirasi Masyarakat
        </p>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-stone-900 sm:text-4xl">
          Kontak Resmi {db.settings.namaDesa}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Info Kontak */}
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-xl border border-stone-200 bg-white p-6">
            <h2 className="font-serif text-xl font-semibold text-stone-900">
              Alamat & Saluran Resmi
            </h2>
            <div className="mt-5 space-y-4 text-xs text-stone-700">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-900" />
                <div>
                  <p className="font-semibold text-stone-900">Alamat Balai Desa</p>
                  <p className="mt-0.5 leading-relaxed">{db.settings.alamatKantor}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-emerald-900" />
                <div>
                  <p className="font-semibold text-stone-900">Telepon & WhatsApp Layanan</p>
                  <p className="mt-0.5 font-mono">
                    {db.settings.telepon} · WA: +{db.settings.whatsapp}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-emerald-900" />
                <div>
                  <p className="font-semibold text-stone-900">Email Resmi Pemerintah Desa</p>
                  <p className="mt-0.5 font-mono">{db.settings.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-900" />
                <div>
                  <p className="font-semibold text-stone-900">Jam Operasional Pelayanan</p>
                  <p className="mt-0.5">{db.settings.jamPelayanan}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-stone-200 pt-4">
              <p className="text-xs font-semibold text-stone-900">Jejaring Media Sosial Resmi</p>
              <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs font-medium text-emerald-900">
                <a href={db.settings.facebook} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  Facebook Pemdes
                </a>
                <span>·</span>
                <a href={db.settings.instagram} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  Instagram Resmi
                </a>
                <span>·</span>
                <a href={db.settings.youtube} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  YouTube Desa TV
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Form Aspirasi / Layanan */}
        <div className="lg:col-span-7">
          <form
            onSubmit={handleSendWhatsApp}
            className="rounded-xl border border-stone-200 bg-white p-6 sm:p-8 space-y-4"
          >
            <h2 className="font-serif text-xl font-semibold text-stone-900">
              Kirim Permohonan Layanan / Aspirasi Warga
            </h2>
            <p className="text-xs text-stone-500">
              Pesan Anda akan diteruskan langsung ke WhatsApp Operator Pelayanan {db.settings.namaDesa}.
            </p>

            {pesanTerkirim && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
                Format pesan berhasil disiapkan dan diarahkan ke layanan WhatsApp Desa.
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-stone-700">Nama Lengkap Sesuai KTP</label>
                <input
                  type="text"
                  required
                  value={wargaNama}
                  onChange={(e) => setWargaNama(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-emerald-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Asal Dusun / RT / RW</label>
                <input
                  type="text"
                  required
                  value={wargaDusun}
                  onChange={(e) => setWargaDusun(e.target.value)}
                  placeholder="Contoh: Dusun Krajan RT 02 / RW 01"
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-emerald-800 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700">Jenis Keperluan</label>
              <select
                value={wargaKeperluan}
                onChange={(e) => setWargaKeperluan(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-emerald-800 focus:outline-none"
              >
                <option>Permohonan Informasi / Surat Pengantar</option>
                <option>Aspirasi Usulan Pembangunan Desa</option>
                <option>Pendaftaran Katalog Produk UMKM Desa</option>
                <option>Laporan Lingkungan / Infrastruktur</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700">Isi Pesan / Rincian Keperluan</label>
              <textarea
                rows={4}
                required
                value={wargaPesan}
                onChange={(e) => setWargaPesan(e.target.value)}
                placeholder="Tuliskan rincian permohonan surat atau aspirasi Anda..."
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-emerald-800 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="rounded-lg bg-emerald-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-800"
            >
              Kirim ke Pelayanan Desa via WhatsApp
            </button>
          </form>
        </div>
      </div>

      {/* Full Width Map */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <iframe
          title={`Peta Wilayah ${db.settings.namaDesa}`}
          src={db.settings.mapsEmbedUrl}
          className="h-96 w-full border-0"
          loading="lazy"
        />
      </div>
    </div>
  );
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activePage}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      >
        {renderPageContent()}
      </motion.div>
    </AnimatePresence>
  );
};
