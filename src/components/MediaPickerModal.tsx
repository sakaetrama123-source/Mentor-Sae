import React, { useState, useRef } from 'react';
import { MediaItem } from '../types/desa';
import { SmartImage } from './SmartImage';
import { Upload, Folder, Check, Trash2, X, Link as LinkIcon, Search } from 'lucide-react';

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaList: MediaItem[];
  onSelect: (url: string, mediaItem?: MediaItem) => void;
  onUploadMedia: (newItem: MediaItem) => Promise<void>;
  onDeleteMedia?: (id: string) => Promise<void>;
  defaultCategory?: MediaItem['kategori'];
  title?: string;
}

const DRIVE_FOLDERS: MediaItem['kategori'][] = [
  'BERITA',
  'GALERI',
  'BANNER',
  'PROFIL',
  'PEMERINTAHAN',
  'PEMBANGUNAN',
  'POTENSI',
  'DOKUMEN',
];

export function convertGoogleDriveUrl(input: string): { url: string; fileId: string } {
  const trimmed = input.trim();
  // Match /d/FILE_ID or id=FILE_ID
  const matchD = trimmed.match(/\/d\/([a-zA-Z0-9_-]{15,})/);
  const matchId = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{15,})/);
  const fileId = matchD ? matchD[1] : matchId ? matchId[1] : '';

  if (fileId) {
    return {
      fileId,
      url: `https://lh3.googleusercontent.com/d/${fileId}`,
    };
  }
  return {
    fileId: 'DRV-' + Date.now().toString().slice(-6),
    url: trimmed,
  };
}

export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
  isOpen,
  onClose,
  mediaList,
  onSelect,
  onUploadMedia,
  onDeleteMedia,
  defaultCategory = 'GALERI',
  title = 'Repositori Media & Google Drive Desa',
}) => {
  const [selectedFolder, setSelectedFolder] = useState<string>('SEMUA');
  const [uploadCategory, setUploadCategory] = useState<MediaItem['kategori']>(defaultCategory);
  const [keterangan, setKeterangan] = useState('');
  const [driveInputUrl, setDriveInputUrl] = useState('');
  const [driveFileName, setDriveFileName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'library' | 'upload' | 'driveLink'>('library');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const filteredMedia = mediaList.filter((m) => {
    const matchFolder = selectedFolder === 'SEMUA' || m.kategori === selectedFolder;
    const matchQuery =
      !searchQuery.trim() ||
      m.namaFile.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.keterangan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.fileId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFolder && matchQuery;
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const dataUrl = await readAndCompressImage(file);
        const sizeKb = Math.round(file.size / 1024);
        const newMedia: MediaItem = {
          id: 'MED-' + Date.now() + '-' + i,
          namaFile: file.name,
          tanggalUpload: new Date().toISOString().split('T')[0],
          kategori: uploadCategory,
          folderDrive: `PORTAL DESA / ${uploadCategory}`,
          url: dataUrl,
          fileId: '1Drive_' + Math.random().toString(36).substring(2, 11),
          keterangan: keterangan.trim() || `Upload foto ${uploadCategory.toLowerCase()} - ${file.name}`,
          ukuran: sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`,
          isDemo: false,
        };
        await onUploadMedia(newMedia);
        if (files.length === 1) {
          onSelect(newMedia.url, newMedia);
          onClose();
          return;
        }
      }
      setKeterangan('');
      setActiveTab('library');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddDriveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driveInputUrl.trim()) return;
    setIsUploading(true);
    try {
      const { url, fileId } = convertGoogleDriveUrl(driveInputUrl);
      const newMedia: MediaItem = {
        id: 'MED-' + Date.now(),
        namaFile: driveFileName.trim() || `drive_${fileId.slice(0, 8)}.jpg`,
        tanggalUpload: new Date().toISOString().split('T')[0],
        kategori: uploadCategory,
        folderDrive: `PORTAL DESA / ${uploadCategory}`,
        url,
        fileId,
        keterangan: keterangan.trim() || 'Tautan file Google Drive Desa',
        ukuran: 'Cloud Drive',
        isDemo: false,
      };
      await onUploadMedia(newMedia);
      onSelect(newMedia.url, newMedia);
      setDriveInputUrl('');
      setDriveFileName('');
      setKeterangan('');
      onClose();
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
          <div>
            <h3 className="font-serif text-lg font-semibold text-stone-900">{title}</h3>
            <p className="text-xs text-stone-500">
              Struktur Direktori Otomatis: PORTAL DESA / {uploadCategory}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-stone-50 px-6 py-3">
          <div className="flex items-center gap-1 rounded-lg bg-stone-200/80 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('library')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'library'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Pilih dari Folder Drive ({mediaList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'upload'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              + Upload Foto Baru
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('driveLink')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'driveLink'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Tautkan File ID Google Drive
            </button>
          </div>

          {activeTab === 'library' && (
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama file atau ket..."
                className="w-full rounded-lg border border-stone-300 bg-white py-1.5 pr-3 pl-9 text-xs text-stone-800 focus:border-emerald-800 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'library' && (
            <div className="space-y-5">
              {/* Folder Filter Bar */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedFolder('SEMUA')}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    selectedFolder === 'SEMUA'
                      ? 'border-emerald-900 bg-emerald-900 text-white'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <Folder className="h-3.5 w-3.5" />
                  Semua Folder
                </button>
                {DRIVE_FOLDERS.map((folder) => (
                  <button
                    key={folder}
                    type="button"
                    onClick={() => setSelectedFolder(folder)}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                      selectedFolder === folder
                        ? 'border-emerald-900 bg-emerald-900 text-white'
                        : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <Folder className="h-3.5 w-3.5" />
                    {folder}
                  </button>
                ))}
              </div>

              {filteredMedia.length === 0 ? (
                <div className="rounded-xl border border-dashed border-stone-300 p-12 text-center">
                  <p className="text-sm font-medium text-stone-700">Belum ada foto di folder ini.</p>
                  <p className="mt-1 text-xs text-stone-500">
                    Klik tombol &ldquo;+ Upload Foto Baru&rdquo; di atas untuk mengunggah gambar.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {filteredMedia.map((item) => (
                    <div
                      key={item.id}
                      className="group flex flex-col justify-between overflow-hidden rounded-xl border border-stone-200 bg-white transition-all hover:border-emerald-800"
                    >
                      <div>
                        <div className="relative aspect-4/3 w-full overflow-hidden bg-stone-100">
                          <SmartImage
                            src={item.url}
                            alt={item.keterangan || item.namaFile}
                            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                          />
                        </div>
                        <div className="p-3">
                          <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                            <span className="font-semibold text-emerald-900">{item.kategori}</span>
                            <span>·</span>
                            <span className="font-mono">{item.tanggalUpload}</span>
                            <span>·</span>
                            <span className="font-mono">{item.ukuran}</span>
                          </div>
                          <p className="mt-1 truncate text-xs font-semibold text-stone-900" title={item.namaFile}>
                            {item.namaFile}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-stone-600">{item.keterangan}</p>
                          <p className="mt-1 truncate font-mono text-[10px] text-stone-400">
                            ID: {item.fileId}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-stone-100 bg-stone-50 px-3 py-2">
                        <button
                          type="button"
                          onClick={() => {
                            onSelect(item.url, item);
                            onClose();
                          }}
                          className="flex items-center gap-1.5 rounded-lg bg-emerald-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-800"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Gunakan Foto Ini
                        </button>

                        {onDeleteMedia && (
                          <button
                            type="button"
                            onClick={() => onDeleteMedia(item.id)}
                            className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600"
                            title="Hapus file dari repositori"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="mx-auto max-w-xl space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700">
                  Target Sub-Folder Google Drive (PORTAL DESA / ...)
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as MediaItem['kategori'])}
                  className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-emerald-800 focus:outline-none"
                >
                  {DRIVE_FOLDERS.map((f) => (
                    <option key={f} value={f}>
                      PORTAL DESA / {f}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">
                  Keterangan / Alt Text Foto
                </label>
                <input
                  type="text"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Contoh: Dokumentasi Musrenbangdes Tahun 2026 di Pendopo Desa"
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-emerald-800 focus:outline-none"
                />
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer rounded-xl border-2 border-dashed border-emerald-800/40 bg-emerald-50/40 p-8 text-center transition-colors hover:bg-emerald-50"
              >
                <Upload className="mx-auto h-10 w-10 text-emerald-900" />
                <p className="mt-3 text-sm font-semibold text-stone-900">
                  {isUploading ? 'Sedang Mengunggah & Mengoptimalkan Foto...' : 'Klik untuk Memilih Foto dari HP / Komputer'}
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  Mendukung upload satu atau banyak foto sekaligus (JPG, PNG, WEBP). Otomatis dikompresi agar cepat dimuat.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {activeTab === 'driveLink' && (
            <form onSubmit={handleAddDriveLink} className="mx-auto max-w-xl space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700">
                  Kategori Folder Google Drive
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as MediaItem['kategori'])}
                  className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
                >
                  {DRIVE_FOLDERS.map((f) => (
                    <option key={f} value={f}>
                      PORTAL DESA / {f}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">
                  URL Share Google Drive / File ID / URL Gambar Langsung
                </label>
                <input
                  type="text"
                  required
                  value={driveInputUrl}
                  onChange={(e) => setDriveInputUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/1BxiMVs0XRA5.../view"
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900"
                />
                <p className="mt-1 text-[11px] text-stone-500">
                  Sistem otomatis mengekstrak File ID Google Drive dan mengubahnya menjadi tautan CDN gambar langsung.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Nama File</label>
                <input
                  type="text"
                  value={driveFileName}
                  onChange={(e) => setDriveFileName(e.target.value)}
                  placeholder="Contoh: foto_kegiatan_posyandu.jpg"
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Keterangan Foto</label>
                <input
                  type="text"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Deskripsi singkat foto..."
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900"
                />
              </div>

              <button
                type="submit"
                disabled={isUploading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                <LinkIcon className="h-4 w-4" />
                Simpan ke Database & Gunakan Foto
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

function readAndCompressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1280;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = () => resolve(event.target?.result as string);
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
