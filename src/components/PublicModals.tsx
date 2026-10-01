import React, { useState, useEffect } from 'react';
import { BeritaItem, GaleriItem, DokumenItem, DesaSettings } from '../types/desa';
import { SmartImage } from './SmartImage';
import { formatTanggalIndo } from '../utils/formatters';
import { X, ChevronLeft, ChevronRight, Play, Pause, Download, Printer } from 'lucide-react';

interface BeritaDetailModalProps {
  berita: BeritaItem | null;
  onClose: () => void;
}

export const BeritaDetailModal: React.FC<BeritaDetailModalProps> = ({ berita, onClose }) => {
  if (!berita) return null;

  const paragraphs = berita.isi.split('\n').filter((p) => p.trim().length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/75 p-4 backdrop-blur-xs">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-stone-200 bg-[#FBF9F5] shadow-2xl">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-stone-200 bg-white px-6 py-4">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span className="font-semibold text-emerald-900">{berita.kategori}</span>
            <span>·</span>
            <span className="font-mono">{formatTanggalIndo(berita.tanggal)}</span>
            <span>·</span>
            <span className="font-mono">{berita.views} kali dibaca</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100"
            >
              <Printer className="h-3.5 w-3.5" />
              Cetak
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Article Content */}
        <div className="flex-1 overflow-y-auto px-6 py-8 sm:px-10">
          <article className="mx-auto max-w-2xl">
            <h1 className="font-serif text-2xl font-semibold leading-snug text-stone-900 sm:text-3xl">
              {berita.judul}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 border-b border-stone-200 pb-5 text-xs text-stone-500">
              <span>Oleh: {berita.penulis}</span>
              <span>·</span>
              <span>Diterbitkan {formatTanggalIndo(berita.tanggal)}</span>
              {berita.isDemo && (
                <>
                  <span>·</span>
                  <span className="text-amber-700">Data Demo (Dapat dihapus di Admin)</span>
                </>
              )}
            </div>

            <div className="my-6 overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
              <div className="aspect-16/9 w-full">
                <SmartImage
                  src={berita.fotoUtama}
                  alt={berita.judul}
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="border-t border-stone-200 bg-white px-4 py-2.5 font-serif text-xs italic text-stone-500">
                Dokumentasi Pemerintah Desa — {berita.judul}
              </p>
            </div>

            <div className="space-y-4 text-base leading-relaxed text-stone-800">
              {paragraphs.map((para, idx) => (
                <p
                  key={idx}
                  className={
                    idx === 0
                      ? 'first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:font-serif first-letter:text-4xl first-letter:font-bold first-letter:text-emerald-950'
                      : ''
                  }
                >
                  {para}
                </p>
              ))}
            </div>

            {/* Galeri Foto Tambahan Berita */}
            {berita.galeriFoto && berita.galeriFoto.length > 0 && (
              <div className="mt-8 border-t border-stone-200 pt-6">
                <h3 className="font-serif text-base font-semibold text-stone-900">
                  Lampiran Galeri Dokumentasi ({berita.galeriFoto.length} Foto)
                </h3>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {berita.galeriFoto.map((foto, i) => (
                    <div
                      key={i}
                      className="aspect-4/3 overflow-hidden rounded-lg border border-stone-200 bg-stone-100"
                    >
                      <SmartImage
                        src={foto}
                        alt={`${berita.judul} - Foto ${i + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>
        </div>
      </div>
    </div>
  );
};

interface GaleriLightboxModalProps {
  items: GaleriItem[];
  activeIndex: number | null;
  onClose: () => void;
  onChangeIndex: (newIndex: number) => void;
}

export const GaleriLightboxModal: React.FC<GaleriLightboxModalProps> = ({
  items,
  activeIndex,
  onClose,
  onChangeIndex,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (activeIndex === null || !isPlaying || items.length <= 1) return;
    const timer = setInterval(() => {
      onChangeIndex((activeIndex + 1) % items.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [activeIndex, isPlaying, items.length, onChangeIndex]);

  if (activeIndex === null || !items[activeIndex]) return null;

  const current = items[activeIndex];

  const handlePrev = () => {
    onChangeIndex((activeIndex - 1 + items.length) % items.length);
  };

  const handleNext = () => {
    onChangeIndex((activeIndex + 1) % items.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-stone-950/95 p-4 text-white backdrop-blur-xs">
      {/* Top Controls */}
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between py-2">
        <div className="flex items-center gap-3 text-xs text-stone-300">
          <span className="font-mono">
            {activeIndex + 1} / {items.length}
          </span>
          <span>·</span>
          <span className="font-medium text-emerald-400">{current.kategori}</span>
          <span>·</span>
          <span className="font-mono">{formatTanggalIndo(current.tanggal)}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 rounded-lg border border-stone-700 bg-stone-900 px-3 py-1.5 text-xs font-medium text-stone-200 hover:bg-stone-800"
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {isPlaying ? 'Jeda Slideshow' : 'Putar Slideshow'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              onClose();
            }}
            className="rounded-lg border border-stone-700 bg-stone-900 p-1.5 text-stone-300 hover:bg-stone-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Image Viewport */}
      <div className="relative mx-auto flex flex-1 w-full max-w-5xl items-center justify-center overflow-hidden my-2">
        {items.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2 z-10 rounded-full border border-stone-700 bg-stone-900/80 p-2.5 text-white hover:bg-stone-800"
            aria-label="Foto sebelumnya"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        <div className="max-h-[72vh] w-full overflow-hidden rounded-xl border border-stone-800 bg-stone-900">
          <SmartImage
            src={current.fotoUrl}
            alt={current.judul}
            className="mx-auto max-h-[70vh] w-auto object-contain"
          />
        </div>

        {items.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2 z-10 rounded-full border border-stone-700 bg-stone-900/80 p-2.5 text-white hover:bg-stone-800"
            aria-label="Foto berikutnya"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Caption Bar */}
      <div className="mx-auto w-full max-w-3xl text-center pb-2">
        <h3 className="font-serif text-lg font-medium text-white">{current.judul}</h3>
        <p className="mt-1 text-xs text-stone-300">{current.keterangan}</p>
      </div>
    </div>
  );
};

interface DokumenPreviewModalProps {
  dokumen: DokumenItem | null;
  settings: DesaSettings;
  onClose: () => void;
  onTriggerDownload: (doc: DokumenItem) => void;
}

export const DokumenPreviewModal: React.FC<DokumenPreviewModalProps> = ({
  dokumen,
  settings,
  onClose,
  onTriggerDownload,
}) => {
  if (!dokumen) return null;

  const handleDownloadFile = () => {
    onTriggerDownload(dokumen);
    // Generate clean downloadable text/document summary if URL is virtual demo
    if (dokumen.fileUrl.startsWith('#')) {
      const content = [
        `PEMERINTAH ${settings.kabupaten.toUpperCase()}`,
        `${settings.kecamatan.toUpperCase()}`,
        `KEPALA ${settings.namaDesa.toUpperCase()}`,
        `Alamat: ${settings.alamatKantor}`,
        `====================================================================`,
        ``,
        `NAMA DOKUMEN   : ${dokumen.nama}`,
        `NOMOR DOKUMEN  : ${dokumen.nomorDokumen}`,
        `KATEGORI       : ${dokumen.kategori}`,
        `TANGGAL TERBIT : ${dokumen.tanggal}`,
        `TIPE FILE      : ${dokumen.tipeFile} (${dokumen.ukuranFile})`,
        ``,
        `RINGKASAN SUBSTANSI DOKUMEN:`,
        `${dokumen.deskripsi}`,
        ``,
        `Dokumen ini diunduh secara sah melalui Portal Informasi Resmi ${settings.namaDesa}.`,
      ].join('\n');

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dokumen.nomorDokumen.replace(/[^a-zA-Z0-9]/g, '_')}_${dokumen.nama.slice(0, 30).replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      window.open(dokumen.fileUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/75 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
          <div>
            <span className="text-xs font-semibold text-emerald-900">{dokumen.kategori}</span>
            <h3 className="font-serif text-base font-semibold text-stone-900">
              Pratinjau Dokumen Resmi Desa
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Official Village Letterhead (Kop Surat) */}
          <div className="rounded-xl border border-stone-300 bg-[#FBF9F5] p-6">
            <div className="border-b-2 border-stone-900 pb-4 text-center">
              <p className="text-xs font-semibold tracking-wider uppercase text-stone-700">
                Pemerintah {settings.kabupaten} · {settings.kecamatan}
              </p>
              <h4 className="font-serif text-xl font-bold uppercase text-stone-900 mt-0.5">
                Pemerintah {settings.namaDesa}
              </h4>
              <p className="mt-1 text-[11px] text-stone-600">{settings.alamatKantor}</p>
            </div>

            <div className="mt-5 space-y-3 text-sm text-stone-800">
              <div className="grid grid-cols-3 gap-2 border-b border-stone-200 pb-2">
                <span className="text-xs font-medium text-stone-500">Nomor Dokumen</span>
                <span className="col-span-2 font-mono text-xs font-semibold text-stone-900">
                  {dokumen.nomorDokumen}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-stone-200 pb-2">
                <span className="text-xs font-medium text-stone-500">Judul Dokumen</span>
                <span className="col-span-2 font-semibold text-stone-900">{dokumen.nama}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-stone-200 pb-2">
                <span className="text-xs font-medium text-stone-500">Tanggal Penetapan</span>
                <span className="col-span-2 font-mono text-xs text-stone-800">
                  {formatTanggalIndo(dokumen.tanggal)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-stone-200 pb-2">
                <span className="text-xs font-medium text-stone-500">Format & Ukuran</span>
                <span className="col-span-2 font-mono text-xs text-stone-800">
                  {dokumen.tipeFile} · {dokumen.ukuranFile} ({dokumen.unduhan}x diunduh)
                </span>
              </div>
              <div className="pt-2">
                <span className="block text-xs font-medium text-stone-500">Ringkasan Isi:</span>
                <p className="mt-1.5 leading-relaxed text-stone-700">{dokumen.deskripsi}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-stone-200 bg-stone-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handleDownloadFile}
            className="flex items-center gap-2 rounded-lg bg-emerald-900 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
          >
            <Download className="h-4 w-4" />
            Unduh Salinan Dokumen ({dokumen.tipeFile})
          </button>
        </div>
      </div>
    </div>
  );
};
