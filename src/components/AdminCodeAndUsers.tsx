import React, { useState } from 'react';
import { PortalDesaDatabase, MediaItem, AdminUser } from '../types/desa';
import { GAS_PROJECT_FILES, INSTALLATION_GUIDE_STEPS } from '../data/gasTemplates';
import { SmartImage } from './SmartImage';
import { Copy, Check, Plus, Trash2, Upload, Folder, Code, BookOpen } from 'lucide-react';

interface AdminExtraModulesProps {
  activeTab: 'MEDIA' | 'PENGGUNA' | 'GAS_KODE';
  db: PortalDesaDatabase;
  onSaveSection: (section: keyof PortalDesaDatabase, data: unknown) => Promise<void>;
  onOpenMediaPicker: (
    category: MediaItem['kategori'],
    callback: (url: string, item?: MediaItem) => void
  ) => void;
  onManageUser: (
    action: 'save' | 'delete',
    user: Partial<AdminUser> & { newPassword?: string }
  ) => Promise<void>;
}

export const AdminExtraModules: React.FC<AdminExtraModulesProps> = ({
  activeTab,
  db,
  onSaveSection,
  onOpenMediaPicker,
  onManageUser,
}) => {
  const [selectedGasFile, setSelectedGasFile] = useState(GAS_PROJECT_FILES[0].filename);
  const [copiedFile, setCopiedFile] = useState('');
  const [folderFilter, setFolderFilter] = useState('SEMUA');

  // Admin User Form State
  const [editingUser, setEditingUser] = useState<Partial<AdminUser> & { newPassword?: string }>({
    username: '',
    namaLengkap: '',
    jabatan: '',
    role: 'Operator',
    newPassword: '',
  });

  if (activeTab === 'MEDIA') {
    const folders = ['SEMUA', 'BERITA', 'GALERI', 'BANNER', 'PROFIL', 'PEMERINTAHAN', 'PEMBANGUNAN', 'POTENSI', 'DOKUMEN'];
    const filteredMedia =
      folderFilter === 'SEMUA'
        ? db.media
        : db.media.filter((m) => m.kategori === folderFilter);

    const handleDeleteMedia = async (id: string) => {
      const next = db.media.filter((m) => m.id !== id);
      await onSaveSection('media', next);
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 rounded-xl border border-stone-200 bg-white p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-serif text-xl font-semibold text-stone-900">
              12. Manajemen Media & Direktori Google Drive Desa
            </h2>
            <p className="mt-1 text-xs text-stone-500">
              Struktur Otomatis: PORTAL DESA / [BERITA, GALERI, BANNER, PROFIL, PEMERINTAHAN, PEMBANGUNAN, POTENSI, DOKUMEN]
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              onOpenMediaPicker('GALERI', () => {
                // Media automatically saved via modal
              })
            }
            className="flex items-center gap-2 rounded-lg bg-emerald-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-800 whitespace-nowrap"
          >
            <Upload className="h-4 w-4" />
            + Upload File / Tautkan Google Drive
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {folders.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFolderFilter(f)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                folderFilter === f
                  ? 'border-emerald-900 bg-emerald-900 text-white'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
              }`}
            >
              <Folder className="h-3.5 w-3.5" />
              {f}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between overflow-hidden rounded-xl border border-stone-200 bg-white"
            >
              <div>
                <div className="aspect-4/3 w-full bg-stone-100">
                  <SmartImage src={item.url} alt={item.namaFile} className="h-full w-full object-cover" />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                    <span className="font-semibold text-emerald-900">{item.kategori}</span>
                    <span>·</span>
                    <span className="font-mono">{item.tanggalUpload}</span>
                    <span>·</span>
                    <span className="font-mono">{item.ukuran}</span>
                  </div>
                  <p className="mt-1 truncate text-xs font-semibold text-stone-900">{item.namaFile}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-stone-600">{item.keterangan}</p>
                  <p className="mt-1.5 truncate font-mono text-[10px] text-stone-400">
                    Drive ID: {item.fileId}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-stone-100 bg-stone-50 px-4 py-2.5">
                <span className="text-[11px] text-stone-500">{item.folderDrive}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteMedia(item.id)}
                  className="text-xs font-medium text-red-600 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === 'PENGGUNA') {
    const handleSaveUser = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingUser.username || !editingUser.namaLengkap) return;
      await onManageUser('save', editingUser);
      setEditingUser({
        username: '',
        namaLengkap: '',
        jabatan: '',
        role: 'Operator',
        newPassword: '',
      });
    };

    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="font-serif text-xl font-semibold text-stone-900">
            13. Manajemen Pengguna Admin & Hak Akses
          </h2>
          <p className="mt-1 text-xs text-stone-500">
            Password admin dienkripsi menggunakan SHA-256 di sisi server (tidak pernah disimpan di dalam kode HTML).
          </p>

          <form onSubmit={handleSaveUser} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <input
              type="text"
              required
              value={editingUser.username || ''}
              onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
              placeholder="Username (cth: operator2)"
              className="rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900"
            />
            <input
              type="text"
              required
              value={editingUser.namaLengkap || ''}
              onChange={(e) => setEditingUser({ ...editingUser, namaLengkap: e.target.value })}
              placeholder="Nama Lengkap Pejabat"
              className="rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900"
            />
            <input
              type="text"
              required
              value={editingUser.jabatan || ''}
              onChange={(e) => setEditingUser({ ...editingUser, jabatan: e.target.value })}
              placeholder="Jabatan di Desa"
              className="rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900"
            />
            <input
              type="password"
              value={editingUser.newPassword || ''}
              onChange={(e) => setEditingUser({ ...editingUser, newPassword: e.target.value })}
              placeholder={editingUser.id ? 'Password baru (opsional)' : 'Password akun'}
              className="rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900"
            />
            <button
              type="submit"
              className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-900 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
            >
              <Plus className="h-4 w-4" />
              {editingUser.id ? 'Update Admin' : 'Tambah Admin'}
            </button>
          </form>
        </div>

        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-stone-200 bg-stone-50 font-semibold text-stone-600">
              <tr>
                <th className="px-5 py-3.5">ID</th>
                <th className="px-5 py-3.5">Username</th>
                <th className="px-5 py-3.5">Nama Lengkap</th>
                <th className="px-5 py-3.5">Jabatan</th>
                <th className="px-5 py-3.5">Level Akses</th>
                <th className="px-5 py-3.5">Login Terakhir</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {db.adminUsers.map((u) => (
                <tr key={u.id} className="hover:bg-stone-50">
                  <td className="px-5 py-3.5 font-mono text-stone-500">{u.id}</td>
                  <td className="px-5 py-3.5 font-mono font-semibold text-stone-900">{u.username}</td>
                  <td className="px-5 py-3.5 font-medium text-stone-900">{u.namaLengkap}</td>
                  <td className="px-5 py-3.5 text-stone-600">{u.jabatan}</td>
                  <td className="px-5 py-3.5 font-semibold text-emerald-900">{u.role}</td>
                  <td className="px-5 py-3.5 font-mono text-stone-500">{u.terakhirLogin}</td>
                  <td className="px-5 py-3.5 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => setEditingUser({ ...u, newPassword: '' })}
                      className="font-semibold text-emerald-900 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onManageUser('delete', u)}
                      className="font-semibold text-red-600 hover:underline"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // GAS_KODE Tab
  const activeGasObj =
    GAS_PROJECT_FILES.find((f) => f.filename === selectedGasFile) || GAS_PROJECT_FILES[0];

  const handleCopyCode = (code: string, name: string) => {
    navigator.clipboard.writeText(code);
    setCopiedFile(name);
    setTimeout(() => setCopiedFile(''), 2000);
  };

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-900">
          <Code className="h-4 w-4" />
          Kode Lengkap Backend Google Apps Script + Google Sheets + Google Drive
        </div>
        <h2 className="mt-1 font-serif text-2xl font-semibold text-stone-900">
          Paket File Project Google Apps Script & Panduan Instalasi 16 Langkah
        </h2>
        <p className="mt-1 text-xs text-stone-600">
          Salin seluruh file di bawah ini apabila Anda juga ingin men-deploy sendiri backend ke akun Google Spreadsheet & Google Drive Desa.
        </p>

        {/* File Selector Tabs */}
        <div className="mt-5 flex flex-wrap items-center gap-1.5 border-b border-stone-200 pb-4">
          {GAS_PROJECT_FILES.map((file) => (
            <button
              key={file.filename}
              type="button"
              onClick={() => setSelectedGasFile(file.filename)}
              className={`rounded-lg px-3 py-1.5 font-mono text-xs font-semibold transition-colors ${
                selectedGasFile === file.filename
                  ? 'bg-emerald-900 text-white'
                  : 'border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
              }`}
            >
              {file.filename}
            </button>
          ))}
        </div>

        {/* Code Viewer */}
        <div className="mt-4 overflow-hidden rounded-xl border border-stone-800 bg-stone-950 text-stone-100">
          <div className="flex items-center justify-between border-b border-stone-800 bg-stone-900 px-4 py-3">
            <div>
              <span className="font-mono text-xs font-bold text-emerald-400">
                NAMA FILE: {activeGasObj.filename}
              </span>
              <p className="text-[11px] text-stone-400">{activeGasObj.description}</p>
            </div>
            <button
              type="button"
              onClick={() => handleCopyCode(activeGasObj.code, activeGasObj.filename)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              {copiedFile === activeGasObj.filename ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Tersalin!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Salin Kode {activeGasObj.filename}
                </>
              )}
            </button>
          </div>
          <pre className="max-h-[420px] overflow-auto p-4 font-mono text-xs leading-relaxed text-stone-200">
            <code>{activeGasObj.code}</code>
          </pre>
        </div>
      </div>

      {/* 16-Step Installation Guide */}
      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-900">
          <BookOpen className="h-4 w-4" />
          Panduan Resmi Implementasi Desa
        </div>
        <h3 className="mt-1 font-serif text-xl font-semibold text-stone-900">
          16 Langkah Instalasi Google Spreadsheet, Google Drive & Deploy Web App
        </h3>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          {INSTALLATION_GUIDE_STEPS.map((item) => (
            <div key={item.step} className="rounded-xl border border-stone-200 bg-stone-50/70 p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-900 font-mono text-xs font-bold text-white">
                  {item.step}
                </span>
                <h4 className="text-xs font-bold text-stone-900">{item.title}</h4>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-stone-600">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
