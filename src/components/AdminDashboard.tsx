import React, { useState } from 'react';
import {
  PortalDesaDatabase,
  AdminUser,
  BeritaItem,
  GaleriItem,
  AgendaItem,
  PerangkatDesa,
  StatistikItem,
  PotensiItem,
  PembangunanItem,
  TransparansiItem,
  DokumenItem,
  MediaItem,
  MenuPage,
} from '../types/desa';
import { SmartImage } from './SmartImage';
import { MediaPickerModal } from './MediaPickerModal';
import { AdminExtraModules } from './AdminCodeAndUsers';
import { formatAngka, formatRupiah } from '../utils/formatters';
import {
  Lock,
  LogOut,
  Plus,
  Trash2,
  Edit3,
  Image as ImageIcon,
  Save,
  Menu,
  X,
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';

type AdminMenuTab =
  | 'RINGKASAN'
  | 'PENGATURAN'
  | 'BERITA'
  | 'GALERI'
  | 'AGENDA'
  | 'PROFIL'
  | 'PEMERINTAHAN'
  | 'DATA_DESA'
  | 'POTENSI'
  | 'PEMBANGUNAN'
  | 'TRANSPARANSI'
  | 'DOKUMEN'
  | 'MEDIA'
  | 'PENGGUNA'
  | 'GAS_KODE';

interface AdminDashboardProps {
  db: PortalDesaDatabase;
  adminToken: string | null;
  currentAdmin: AdminUser | null;
  onLoginSuccess: (token: string, user: AdminUser) => void;
  onLogout: () => void;
  onSaveSection: (section: keyof PortalDesaDatabase, data: unknown) => Promise<void>;
  onClearDemo: () => Promise<void>;
  onResetDemo: () => Promise<void>;
  onManageUser: (
    action: 'save' | 'delete',
    user: Partial<AdminUser> & { newPassword?: string }
  ) => Promise<void>;
  onBackToPublic: (page?: MenuPage) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  db,
  adminToken,
  currentAdmin,
  onLoginSuccess,
  onLogout,
  onSaveSection,
  onClearDemo,
  onResetDemo,
  onManageUser,
  onBackToPublic,
}) => {
  const [activeTab, setActiveTab] = useState<AdminMenuTab>('RINGKASAN');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Login State
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('desa123');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Media Picker Modal State
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [mediaModalCat, setMediaModalCat] = useState<MediaItem['kategori']>('GALERI');
  const [mediaCallback, setMediaCallback] = useState<((url: string, item?: MediaItem) => void) | null>(null);

  // Form states for Settings & Profil
  const [settingsForm, setSettingsForm] = useState(db.settings);
  const [profilForm, setProfilForm] = useState(db.profil);

  // Editing item states
  const [editingBerita, setEditingBerita] = useState<Partial<BeritaItem> | null>(null);
  const [editingGaleri, setEditingGaleri] = useState<Partial<GaleriItem> | null>(null);
  const [editingAgenda, setEditingAgenda] = useState<Partial<AgendaItem> | null>(null);
  const [editingPerangkat, setEditingPerangkat] = useState<Partial<PerangkatDesa> | null>(null);
  const [editingStat, setEditingStat] = useState<Partial<StatistikItem> | null>(null);
  const [editingPotensi, setEditingPotensi] = useState<Partial<PotensiItem> | null>(null);
  const [editingPembangunan, setEditingPembangunan] = useState<Partial<PembangunanItem> | null>(null);
  const [editingTransparansi, setEditingTransparansi] = useState<Partial<TransparansiItem> | null>(null);
  const [editingDokumen, setEditingDokumen] = useState<Partial<DokumenItem> | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3200);
  };

  const openMediaPicker = (
    cat: MediaItem['kategori'],
    cb: (url: string, item?: MediaItem) => void
  ) => {
    setMediaModalCat(cat);
    setMediaCallback(() => cb);
    setMediaModalOpen(true);
  };

  const handleUploadMediaToDb = async (newMedia: MediaItem) => {
    const nextMedia = [newMedia, ...db.media];
    await onSaveSection('media', nextMedia);
    showToast(`File "${newMedia.namaFile}" berhasil disimpan ke Google Drive / Repositori Media!`);
  };

  // ============================================================================
  // LOGIN VIEW (IF NOT AUTHENTICATED)
  // ============================================================================
  if (!adminToken || !currentAdmin) {
    const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoginError('');
      setIsLoggingIn(true);
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        if (!res.ok || data.status !== 'success') {
          setLoginError(data.message || 'Login gagal. Periksa username dan password.');
        } else {
          onLoginSuccess(data.token, data.user);
        }
      } catch {
        setLoginError('Gagal menghubungi server autentikasi.');
      } finally {
        setIsLoggingIn(false);
      }
    };

    return (
      <div className="mx-auto flex min-h-[82vh] max-w-md flex-col justify-center px-4 py-12">
        <div className="rounded-xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-900">
            <Lock className="h-4 w-4" />
            Otentikasi Keamanan Backend
          </div>
          <h1 className="mt-2 font-serif text-2xl font-semibold text-stone-900">
            Login Dashboard Admin Desa
          </h1>
          <p className="mt-1 text-xs text-stone-500">
            Masuk untuk memperbarui berita, galeri foto Google Drive, statistik penduduk, APBDes, dan pengaturan portal tanpa menyentuh kode.
          </p>

          {loginError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700">Username Admin</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3.5 py-2 text-sm text-stone-900 focus:border-emerald-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3.5 py-2 text-sm text-stone-900 focus:border-emerald-800 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full rounded-lg bg-emerald-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-800"
            >
              {isLoggingIn ? 'Memverifikasi Sesi...' : 'Masuk ke Dashboard Admin'}
            </button>
          </form>

          <div className="mt-5 rounded-lg border border-stone-200 bg-stone-50 p-3 text-xs text-stone-600">
            <p className="font-semibold text-stone-800">Akun Demo Default (Terenkripsi SHA-256 di Server):</p>
            <p className="mt-0.5 font-mono">Username: <strong>admin</strong> · Password: <strong>desa123</strong></p>
          </div>

          <button
            type="button"
            onClick={() => onBackToPublic('BERANDA')}
            className="mt-4 flex w-full items-center justify-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Halaman Publik Desa
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // AUTHENTICATED ADMIN DASHBOARD
  // ============================================================================
  const menuItems: { id: AdminMenuTab; label: string }[] = [
    { id: 'RINGKASAN', label: '0. Ringkasan Dashboard' },
    { id: 'PENGATURAN', label: '1. Pengaturan Website' },
    { id: 'BERITA', label: `2. Berita (${db.berita.length})` },
    { id: 'GALERI', label: `3. Galeri (${db.galeri.length})` },
    { id: 'AGENDA', label: `4. Agenda (${db.agenda.length})` },
    { id: 'PROFIL', label: '5. Profil Desa' },
    { id: 'PEMERINTAHAN', label: `6. Pemerintahan (${db.pemerintahan.length})` },
    { id: 'DATA_DESA', label: `7. Data Desa (${db.dataDesa.length})` },
    { id: 'POTENSI', label: `8. Potensi Desa (${db.potensi.length})` },
    { id: 'PEMBANGUNAN', label: `9. Pembangunan (${db.pembangunan.length})` },
    { id: 'TRANSPARANSI', label: `10. Transparansi (${db.transparansi.length})` },
    { id: 'DOKUMEN', label: `11. Dokumen (${db.dokumen.length})` },
    { id: 'MEDIA', label: `12. Media / Drive (${db.media.length})` },
    { id: 'PENGGUNA', label: `13. Pengguna Admin (${db.adminUsers.length})` },
    { id: 'GAS_KODE', label: '14. Kode Apps Script & Panduan' },
  ];

  const demoCount =
    db.berita.filter((i) => i.isDemo).length +
    db.galeri.filter((i) => i.isDemo).length +
    db.agenda.filter((i) => i.isDemo).length +
    db.potensi.filter((i) => i.isDemo).length +
    db.pembangunan.filter((i) => i.isDemo).length;

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Top Admin Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="rounded-lg border border-stone-200 p-2 text-stone-700 lg:hidden"
          >
            {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div>
            <h1 className="font-serif text-base font-semibold text-stone-900 sm:text-lg">
              CMS Dashboard Admin — {db.settings.namaDesa}
            </h1>
            <p className="text-[11px] text-stone-500">
              Login sebagai: <strong>{currentAdmin.namaLengkap}</strong> ({currentAdmin.role})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onBackToPublic('BERANDA')}
            className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 whitespace-nowrap"
          >
            Lihat Website Publik
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-800 whitespace-nowrap"
          >
            <LogOut className="h-3.5 w-3.5" />
            Keluar
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl border border-emerald-800 bg-emerald-950 px-4 py-3 text-xs font-semibold text-white shadow-xl">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="mx-auto flex max-w-7xl">
        {/* Sidebar Navigation */}
        <aside
          className={`${
            mobileSidebarOpen ? 'fixed inset-y-0 left-0 z-40 block w-64 pt-16' : 'hidden'
          } border-r border-stone-200 bg-white p-4 lg:static lg:block lg:w-64 lg:shrink-0`}
        >
          <nav className="space-y-1">
            {menuItems.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setActiveTab(m.id);
                  setMobileSidebarOpen(false);
                }}
                className={`w-full rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors whitespace-nowrap truncate ${
                  activeTab === m.id
                    ? 'bg-emerald-900 text-white font-semibold'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                {m.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {/* 0. RINGKASAN DASHBOARD */}
          {activeTab === 'RINGKASAN' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-stone-200 bg-white p-6">
                <h2 className="font-serif text-2xl font-semibold text-stone-900">
                  Selamat Datang di CMS Tanpa Edit Kode ({db.settings.namaDesa})
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-stone-600">
                  Seluruh perubahan yang Anda simpan pada dashboard ini akan langsung memperbarui tampilan halaman publik secara otomatis.
                </p>

                {/* Stat Cards */}
                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  {[
                    { label: 'Total Berita', val: db.berita.length, tab: 'BERITA' as AdminMenuTab },
                    { label: 'Total Galeri', val: db.galeri.length, tab: 'GALERI' as AdminMenuTab },
                    { label: 'Total Agenda', val: db.agenda.length, tab: 'AGENDA' as AdminMenuTab },
                    { label: 'Total Dokumen', val: db.dokumen.length, tab: 'DOKUMEN' as AdminMenuTab },
                    { label: 'Total Potensi', val: db.potensi.length, tab: 'POTENSI' as AdminMenuTab },
                    { label: 'Pembangunan', val: db.pembangunan.length, tab: 'PEMBANGUNAN' as AdminMenuTab },
                  ].map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => setActiveTab(s.tab)}
                      className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-left transition-colors hover:border-emerald-800 hover:bg-white"
                    >
                      <p className="text-xs text-stone-500">{s.label}</p>
                      <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-stone-900">
                        {s.val}
                      </p>
                      <span className="mt-1 inline-block text-[11px] font-semibold text-emerald-900">
                        Kelola Data →
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Demo Data Management Banner */}
              <div className="flex flex-col justify-between gap-4 rounded-xl border border-amber-300 bg-amber-50/70 p-5 sm:flex-row sm:items-center">
                <div>
                  <h3 className="font-serif text-base font-semibold text-stone-900">
                    Pengelolaan Data Contoh (Data Demo: {demoCount} Item Aktif)
                  </h3>
                  <p className="mt-0.5 text-xs text-stone-600">
                    Sesuai spesifikasi, data awal bertanda DATA DEMO agar website langsung hidup. Anda dapat menghapus semua data demo dengan 1 klik atau meresetnya kembali kapan saja.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {demoCount > 0 && (
                    <button
                      type="button"
                      onClick={async () => {
                        await onClearDemo();
                        showToast('Seluruh data demo berhasil dibersihkan!');
                      }}
                      className="flex items-center gap-1.5 rounded-lg bg-red-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-red-800"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Hapus Semua Data Demo
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      await onResetDemo();
                      showToast('Database berhasil dikembalikan ke Data Demo Awal!');
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-100"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset ke Data Demo Awal
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 1. PENGATURAN WEBSITE */}
          {activeTab === 'PENGATURAN' && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await onSaveSection('settings', settingsForm);
                showToast('Pengaturan Website & Banner Desa berhasil diperbarui!');
              }}
              className="space-y-6 rounded-xl border border-stone-200 bg-white p-6"
            >
              <div className="flex items-center justify-between border-b border-stone-200 pb-4">
                <div>
                  <h2 className="font-serif text-xl font-semibold text-stone-900">
                    1. Pengaturan Identitas Website, Banner & Kontak Desa
                  </h2>
                  <p className="text-xs text-stone-500">
                    Ubah nama desa, foto hero banner, warna utama, kontak, dan koneksi Google Sheets/Drive.
                  </p>
                </div>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-900 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
                >
                  <Save className="h-4 w-4" />
                  Simpan Pengaturan
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Nama Desa</label>
                  <input
                    type="text"
                    value={settingsForm.namaDesa}
                    onChange={(e) => setSettingsForm({ ...settingsForm, namaDesa: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Kecamatan</label>
                  <input
                    type="text"
                    value={settingsForm.kecamatan}
                    onChange={(e) => setSettingsForm({ ...settingsForm, kecamatan: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Kabupaten</label>
                  <input
                    type="text"
                    value={settingsForm.kabupaten}
                    onChange={(e) => setSettingsForm({ ...settingsForm, kabupaten: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Provinsi</label>
                  <input
                    type="text"
                    value={settingsForm.provinsi}
                    onChange={(e) => setSettingsForm({ ...settingsForm, provinsi: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Kode Pos</label>
                  <input
                    type="text"
                    value={settingsForm.kodePos}
                    onChange={(e) => setSettingsForm({ ...settingsForm, kodePos: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Warna Utama Tema</label>
                  <input
                    type="color"
                    value={settingsForm.warnaUtama}
                    onChange={(e) => setSettingsForm({ ...settingsForm, warnaUtama: e.target.value })}
                    className="mt-1 h-9 w-full cursor-pointer rounded-lg border border-stone-300 p-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Slogan Desa</label>
                <input
                  type="text"
                  value={settingsForm.slogan}
                  onChange={(e) => setSettingsForm({ ...settingsForm, slogan: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Deskripsi Singkat Hero</label>
                <textarea
                  rows={2}
                  value={settingsForm.deskripsiSingkat}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, deskripsiSingkat: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                />
              </div>

              {/* Hero Banner Image Picker */}
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <label className="block text-xs font-semibold text-stone-900">
                      Foto Hero / Banner Utama Halaman Beranda
                    </label>
                    <p className="text-[11px] text-stone-500">
                      Ganti foto melalui Google Drive Media tanpa mengubah kode.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      openMediaPicker('BANNER', (url) =>
                        setSettingsForm((prev) => ({ ...prev, heroFotoUrl: url }))
                      )
                    }
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 whitespace-nowrap"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Ganti Foto Banner dari Google Drive
                  </button>
                </div>
                <div className="mt-3 aspect-16/9 max-h-48 overflow-hidden rounded-lg border border-stone-200 bg-white">
                  <SmartImage src={settingsForm.heroFotoUrl} alt="Banner Preview" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Telepon Kantor</label>
                  <input
                    type="text"
                    value={settingsForm.telepon}
                    onChange={(e) => setSettingsForm({ ...settingsForm, telepon: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Nomor WhatsApp (628...)</label>
                  <input
                    type="text"
                    value={settingsForm.whatsapp}
                    onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Email Resmi Desa</label>
                  <input
                    type="text"
                    value={settingsForm.email}
                    onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Alamat Lengkap Kantor Desa</label>
                <input
                  type="text"
                  value={settingsForm.alamatKantor}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, alamatKantor: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                />
              </div>
            </form>
          )}

          {/* 2. BERITA DESA */}
          {activeTab === 'BERITA' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-5">
                <div>
                  <h2 className="font-serif text-xl font-semibold text-stone-900">
                    2. Manajemen Berita Desa
                  </h2>
                  <p className="text-xs text-stone-500">
                    Tambah berita baru, pilih foto dari Google Drive, atur status Draft atau Terbit.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditingBerita({
                      id: '',
                      judul: '',
                      kategori: 'Kemasyarakatan',
                      tanggal: new Date().toISOString().split('T')[0],
                      penulis: currentAdmin.namaLengkap,
                      fotoUtama: db.settings.heroFotoUrl,
                      ringkasan: '',
                      isi: '',
                      galeriFoto: [],
                      status: 'Terbit',
                      views: 0,
                      isDemo: false,
                    })
                  }
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-900 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
                >
                  <Plus className="h-4 w-4" />
                  Tambah Berita Baru
                </button>
              </div>

              {editingBerita && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const item: BeritaItem = {
                      id: editingBerita.id || 'BRT-' + Date.now(),
                      judul: editingBerita.judul || 'Berita Desa',
                      kategori: (editingBerita.kategori as BeritaItem['kategori']) || 'Kemasyarakatan',
                      tanggal: editingBerita.tanggal || new Date().toISOString().split('T')[0],
                      penulis: editingBerita.penulis || currentAdmin.namaLengkap,
                      fotoUtama: editingBerita.fotoUtama || db.settings.heroFotoUrl,
                      ringkasan: editingBerita.ringkasan || '',
                      isi: editingBerita.isi || '',
                      galeriFoto: editingBerita.galeriFoto || [],
                      status: (editingBerita.status as 'Terbit' | 'Draft') || 'Terbit',
                      views: editingBerita.views || 0,
                      isDemo: false,
                    };
                    const exists = db.berita.some((b) => b.id === item.id);
                    const nextList = exists
                      ? db.berita.map((b) => (b.id === item.id ? item : b))
                      : [item, ...db.berita];
                    await onSaveSection('berita', nextList);
                    setEditingBerita(null);
                    showToast(`Berita "${item.judul}" berhasil disimpan (${item.status})!`);
                  }}
                  className="space-y-4 rounded-xl border border-emerald-800/30 bg-white p-6"
                >
                  <h3 className="font-serif text-lg font-semibold text-stone-900">
                    {editingBerita.id ? 'Edit Berita Desa' : 'Tambah Berita Baru'}
                  </h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-stone-700">Judul Berita</label>
                      <input
                        type="text"
                        required
                        value={editingBerita.judul || ''}
                        onChange={(e) =>
                          setEditingBerita({ ...editingBerita, judul: e.target.value })
                        }
                        placeholder="Contoh: Gotong Royong Desa Sukamaju"
                        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700">Kategori</label>
                      <select
                        value={editingBerita.kategori || 'Kemasyarakatan'}
                        onChange={(e) =>
                          setEditingBerita({
                            ...editingBerita,
                            kategori: e.target.value as BeritaItem['kategori'],
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs"
                      >
                        <option>Pemerintahan</option>
                        <option>Pembangunan</option>
                        <option>Kemasyarakatan</option>
                        <option>UMKM & Ekonomi</option>
                        <option>Budaya</option>
                        <option>Pengumuman</option>
                        <option>Kesehatan</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700">Tanggal</label>
                      <input
                        type="date"
                        value={editingBerita.tanggal || ''}
                        onChange={(e) =>
                          setEditingBerita({ ...editingBerita, tanggal: e.target.value })
                        }
                        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700">Penulis</label>
                      <input
                        type="text"
                        value={editingBerita.penulis || ''}
                        onChange={(e) =>
                          setEditingBerita({ ...editingBerita, penulis: e.target.value })
                        }
                        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700">Status Publikasi</label>
                      <select
                        value={editingBerita.status || 'Terbit'}
                        onChange={(e) =>
                          setEditingBerita({
                            ...editingBerita,
                            status: e.target.value as 'Terbit' | 'Draft',
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold"
                      >
                        <option value="Terbit">Terbit (Tampil di Publik)</option>
                        <option value="Draft">Draft (Sembunyikan)</option>
                      </select>
                    </div>
                  </div>

                  {/* Foto Utama & Galeri Foto */}
                  <div className="flex flex-wrap items-center gap-3 rounded-lg border border-stone-200 bg-stone-50 p-3">
                    <div className="h-16 w-24 overflow-hidden rounded border border-stone-200 bg-white">
                      <SmartImage src={editingBerita.fotoUtama} alt="Foto Utama" />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        openMediaPicker('BERITA', (url) =>
                          setEditingBerita((prev) => ({ ...prev, fotoUtama: url }))
                        )
                      }
                      className="rounded-lg bg-emerald-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
                    >
                      Pilih / Upload Foto Utama
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        openMediaPicker('BERITA', (url) =>
                          setEditingBerita((prev) => ({
                            ...prev,
                            galeriFoto: [...(prev?.galeriFoto || []), url],
                          }))
                        )
                      }
                      className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100"
                    >
                      + Tambah Lampiran Galeri ({editingBerita.galeriFoto?.length || 0} Foto)
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700">Ringkasan Singkat</label>
                    <textarea
                      rows={2}
                      required
                      value={editingBerita.ringkasan || ''}
                      onChange={(e) =>
                        setEditingBerita({ ...editingBerita, ringkasan: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700">Isi Berita Lengkap</label>
                    <textarea
                      rows={6}
                      required
                      value={editingBerita.isi || ''}
                      onChange={(e) =>
                        setEditingBerita({ ...editingBerita, isi: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingBerita(null)}
                      className="rounded-lg border border-stone-300 px-4 py-2 text-xs font-medium text-stone-700"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-emerald-900 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
                    >
                      Simpan & Publikasikan Berita
                    </button>
                  </div>
                </form>
              )}

              {/* Berita List */}
              <div className="divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white">
                {db.berita.map((b) => (
                  <div
                    key={b.id}
                    className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                        <SmartImage src={b.fotoUtama} alt={b.judul} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-[11px] text-stone-500">
                          <span className="font-semibold text-emerald-900">{b.kategori}</span>
                          <span>·</span>
                          <span className="font-mono">{b.tanggal}</span>
                          <span>·</span>
                          <span className={b.status === 'Terbit' ? 'font-bold text-emerald-800' : 'font-bold text-amber-700'}>
                            {b.status}
                          </span>
                        </div>
                        <h4 className="truncate font-serif text-sm font-semibold text-stone-900">
                          {b.judul}
                        </h4>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingBerita(b)}
                        className="flex items-center gap-1 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100"
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await onSaveSection(
                            'berita',
                            db.berita.filter((x) => x.id !== b.id)
                          );
                          showToast('Berita berhasil dihapus.');
                        }}
                        className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. GALERI DESA */}
          {activeTab === 'GALERI' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-5">
                <div>
                  <h2 className="font-serif text-xl font-semibold text-stone-900">
                    3. Manajemen Galeri Foto Desa
                  </h2>
                  <p className="text-xs text-stone-500">
                    Foto terbaru otomatis tampil di urutan atas halaman Galeri dan Beranda.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditingGaleri({
                      id: '',
                      judul: '',
                      kategori: 'Kegiatan Desa',
                      tanggal: new Date().toISOString().split('T')[0],
                      fotoUrl: db.settings.heroFotoUrl,
                      fileId: 'DRV-' + Date.now(),
                      keterangan: '',
                    })
                  }
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-900 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
                >
                  <Plus className="h-4 w-4" />
                  Tambah Foto Galeri
                </button>
              </div>

              {editingGaleri && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const item: GaleriItem = {
                      id: editingGaleri.id || 'GLR-' + Date.now(),
                      judul: editingGaleri.judul || 'Dokumentasi Kegiatan',
                      kategori: (editingGaleri.kategori as GaleriItem['kategori']) || 'Kegiatan Desa',
                      tanggal: editingGaleri.tanggal || new Date().toISOString().split('T')[0],
                      fotoUrl: editingGaleri.fotoUrl || db.settings.heroFotoUrl,
                      fileId: editingGaleri.fileId || 'DRV-' + Date.now(),
                      keterangan: editingGaleri.keterangan || '',
                      isDemo: false,
                    };
                    const exists = db.galeri.some((g) => g.id === item.id);
                    const next = exists
                      ? db.galeri.map((g) => (g.id === item.id ? item : g))
                      : [item, ...db.galeri];
                    await onSaveSection('galeri', next);
                    setEditingGaleri(null);
                    showToast('Foto galeri berhasil disimpan!');
                  }}
                  className="space-y-4 rounded-xl border border-stone-200 bg-white p-6"
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700">Judul Foto</label>
                      <input
                        type="text"
                        required
                        value={editingGaleri.judul || ''}
                        onChange={(e) => setEditingGaleri({ ...editingGaleri, judul: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700">Kategori</label>
                      <select
                        value={editingGaleri.kategori || 'Kegiatan Desa'}
                        onChange={(e) =>
                          setEditingGaleri({
                            ...editingGaleri,
                            kategori: e.target.value as GaleriItem['kategori'],
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs"
                      >
                        <option>Kegiatan Desa</option>
                        <option>Pemerintahan</option>
                        <option>Pembangunan</option>
                        <option>Budaya</option>
                        <option>Olahraga</option>
                        <option>UMKM</option>
                        <option>Pertanian</option>
                        <option>Wisata</option>
                        <option>Lainnya</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700">Tanggal Kegiatan</label>
                      <input
                        type="date"
                        value={editingGaleri.tanggal || ''}
                        onChange={(e) => setEditingGaleri({ ...editingGaleri, tanggal: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="h-20 w-28 overflow-hidden rounded-lg border border-stone-200">
                      <SmartImage src={editingGaleri.fotoUrl} alt="Preview" />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        openMediaPicker('GALERI', (url, mediaItem) =>
                          setEditingGaleri((prev) => ({
                            ...prev,
                            fotoUrl: url,
                            fileId: mediaItem?.fileId || prev?.fileId || 'DRV-FILE',
                          }))
                        )
                      }
                      className="rounded-lg bg-emerald-900 px-3.5 py-2 text-xs font-semibold text-white"
                    >
                      Pilih / Upload Foto dari Google Drive
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700">Keterangan Foto</label>
                    <input
                      type="text"
                      value={editingGaleri.keterangan || ''}
                      onChange={(e) =>
                        setEditingGaleri({ ...editingGaleri, keterangan: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingGaleri(null)}
                      className="rounded-lg border border-stone-300 px-4 py-2 text-xs"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-emerald-900 px-4 py-2 text-xs font-semibold text-white"
                    >
                      Simpan ke Galeri
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {db.galeri.map((g) => (
                  <div
                    key={g.id}
                    className="flex flex-col justify-between overflow-hidden rounded-xl border border-stone-200 bg-white"
                  >
                    <div>
                      <div className="aspect-4/3 w-full bg-stone-100">
                        <SmartImage src={g.fotoUrl} alt={g.judul} />
                      </div>
                      <div className="p-4">
                        <p className="text-[11px] font-semibold text-emerald-900">
                          {g.kategori} · {g.tanggal}
                        </p>
                        <h4 className="mt-1 font-serif text-sm font-semibold text-stone-900">
                          {g.judul}
                        </h4>
                        <p className="mt-1 text-xs text-stone-600">{g.keterangan}</p>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 border-t border-stone-100 bg-stone-50 px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => setEditingGaleri(g)}
                        className="text-xs font-semibold text-emerald-900 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await onSaveSection(
                            'galeri',
                            db.galeri.filter((x) => x.id !== g.id)
                          );
                          showToast('Foto galeri dihapus.');
                        }}
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. AGENDA DESA */}
          {activeTab === 'AGENDA' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-5">
                <h2 className="font-serif text-xl font-semibold text-stone-900">
                  4. Manajemen Agenda Kegiatan Desa
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    setEditingAgenda({
                      id: '',
                      namaKegiatan: '',
                      tanggal: new Date().toISOString().split('T')[0],
                      jam: '08.30 WIB',
                      lokasi: 'Balai Desa',
                      penyelenggara: 'Pemerintah Desa',
                      deskripsi: '',
                      fotoUrl: db.settings.heroFotoUrl,
                      status: 'Akan Datang',
                    })
                  }
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-900 px-4 py-2 text-xs font-semibold text-white"
                >
                  <Plus className="h-4 w-4" /> Tambah Agenda
                </button>
              </div>

              {editingAgenda && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const item: AgendaItem = {
                      id: editingAgenda.id || 'AGD-' + Date.now(),
                      namaKegiatan: editingAgenda.namaKegiatan || '',
                      tanggal: editingAgenda.tanggal || '',
                      jam: editingAgenda.jam || '',
                      lokasi: editingAgenda.lokasi || '',
                      penyelenggara: editingAgenda.penyelenggara || 'Pemerintah Desa',
                      deskripsi: editingAgenda.deskripsi || '',
                      fotoUrl: editingAgenda.fotoUrl || db.settings.heroFotoUrl,
                      status: (editingAgenda.status as AgendaItem['status']) || 'Akan Datang',
                      isDemo: false,
                    };
                    const exists = db.agenda.some((a) => a.id === item.id);
                    const next = exists
                      ? db.agenda.map((a) => (a.id === item.id ? item : a))
                      : [item, ...db.agenda];
                    await onSaveSection('agenda', next);
                    setEditingAgenda(null);
                    showToast('Agenda kegiatan disimpan!');
                  }}
                  className="space-y-4 rounded-xl border border-stone-200 bg-white p-6"
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700">Nama Kegiatan</label>
                      <input
                        type="text"
                        required
                        value={editingAgenda.namaKegiatan || ''}
                        onChange={(e) =>
                          setEditingAgenda({ ...editingAgenda, namaKegiatan: e.target.value })
                        }
                        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700">Lokasi</label>
                      <input
                        type="text"
                        required
                        value={editingAgenda.lokasi || ''}
                        onChange={(e) =>
                          setEditingAgenda({ ...editingAgenda, lokasi: e.target.value })
                        }
                        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700">Tanggal</label>
                      <input
                        type="date"
                        value={editingAgenda.tanggal || ''}
                        onChange={(e) =>
                          setEditingAgenda({ ...editingAgenda, tanggal: e.target.value })
                        }
                        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700">Jam & Status</label>
                      <div className="mt-1 flex gap-2">
                        <input
                          type="text"
                          value={editingAgenda.jam || ''}
                          onChange={(e) =>
                            setEditingAgenda({ ...editingAgenda, jam: e.target.value })
                          }
                          className="w-1/2 rounded-lg border border-stone-300 px-3 py-2 text-xs"
                        />
                        <select
                          value={editingAgenda.status || 'Akan Datang'}
                          onChange={(e) =>
                            setEditingAgenda({
                              ...editingAgenda,
                              status: e.target.value as AgendaItem['status'],
                            })
                          }
                          className="w-1/2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs"
                        >
                          <option>Akan Datang</option>
                          <option>Berlangsung</option>
                          <option>Selesai</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700">Deskripsi</label>
                    <textarea
                      rows={2}
                      value={editingAgenda.deskripsi || ''}
                      onChange={(e) =>
                        setEditingAgenda({ ...editingAgenda, deskripsi: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingAgenda(null)}
                      className="rounded-lg border border-stone-300 px-4 py-2 text-xs"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-emerald-900 px-4 py-2 text-xs font-semibold text-white"
                    >
                      Simpan Agenda
                    </button>
                  </div>
                </form>
              )}

              <div className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
                {db.agenda.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-xs font-mono text-emerald-900">
                        {a.tanggal} · {a.jam} · {a.status}
                      </p>
                      <h4 className="font-serif text-sm font-semibold text-stone-900">
                        {a.namaKegiatan}
                      </h4>
                      <p className="text-xs text-stone-500">{a.lokasi}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingAgenda(a)}
                        className="text-xs font-semibold text-emerald-900 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await onSaveSection(
                            'agenda',
                            db.agenda.filter((x) => x.id !== a.id)
                          );
                          showToast('Agenda dihapus.');
                        }}
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. PROFIL DESA & SAMBUTAN KEPALA DESA */}
          {activeTab === 'PROFIL' && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await onSaveSection('profil', profilForm);
                showToast('Profil Desa & Sambutan Kepala Desa berhasil diperbarui!');
              }}
              className="space-y-5 rounded-xl border border-stone-200 bg-white p-6"
            >
              <div className="flex items-center justify-between border-b border-stone-200 pb-4">
                <h2 className="font-serif text-xl font-semibold text-stone-900">
                  5. Edit Profil Desa, Sejarah, Visi Misi & Sambutan Kepala Desa
                </h2>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-900 px-4 py-2 text-xs font-semibold text-white"
                >
                  <Save className="h-4 w-4" /> Simpan Profil Desa
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Nama Kepala Desa</label>
                  <input
                    type="text"
                    value={profilForm.kepalaDesaNama}
                    onChange={(e) =>
                      setProfilForm({ ...profilForm, kepalaDesaNama: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Jabatan</label>
                  <input
                    type="text"
                    value={profilForm.kepalaDesaJabatan}
                    onChange={(e) =>
                      setProfilForm({ ...profilForm, kepalaDesaJabatan: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Periode</label>
                  <input
                    type="text"
                    value={profilForm.kepalaDesaPeriode}
                    onChange={(e) =>
                      setProfilForm({ ...profilForm, kepalaDesaPeriode: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-lg border border-stone-200 bg-stone-50 p-3">
                <div className="h-16 w-16 overflow-hidden rounded-lg border border-stone-200 bg-white">
                  <SmartImage src={profilForm.kepalaDesaFoto} alt="Foto Kepala Desa" />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    openMediaPicker('PROFIL', (url) =>
                      setProfilForm((prev) => ({ ...prev, kepalaDesaFoto: url }))
                    )
                  }
                  className="rounded-lg bg-emerald-900 px-3.5 py-2 text-xs font-semibold text-white"
                >
                  Ganti Foto Kepala Desa dari Google Drive
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Teks Sambutan Kepala Desa</label>
                <textarea
                  rows={3}
                  value={profilForm.kepalaDesaSambutan}
                  onChange={(e) =>
                    setProfilForm({ ...profilForm, kepalaDesaSambutan: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Sejarah Desa</label>
                <textarea
                  rows={4}
                  value={profilForm.sejarah}
                  onChange={(e) => setProfilForm({ ...profilForm, sejarah: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Visi Desa</label>
                <input
                  type="text"
                  value={profilForm.visi}
                  onChange={(e) => setProfilForm({ ...profilForm, visi: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                />
              </div>
            </form>
          )}

          {/* 6. PEMERINTAHAN DESA */}
          {activeTab === 'PEMERINTAHAN' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-5">
                <h2 className="font-serif text-xl font-semibold text-stone-900">
                  6. Struktur Pemerintahan & Perangkat Desa
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    setEditingPerangkat({
                      id: '',
                      nama: '',
                      jabatan: '',
                      nip: '',
                      kategori: 'Kasi',
                      pendidikan: 'S1',
                      periode: 'Aktif',
                      fotoUrl: db.profil.kepalaDesaFoto,
                      deskripsi: '',
                      urutan: db.pemerintahan.length + 1,
                    })
                  }
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-900 px-4 py-2 text-xs font-semibold text-white"
                >
                  <Plus className="h-4 w-4" /> Tambah Perangkat Desa
                </button>
              </div>

              {editingPerangkat && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const item: PerangkatDesa = {
                      id: editingPerangkat.id || 'PRG-' + Date.now(),
                      nama: editingPerangkat.nama || '',
                      jabatan: editingPerangkat.jabatan || '',
                      nip: editingPerangkat.nip || '-',
                      kategori: (editingPerangkat.kategori as PerangkatDesa['kategori']) || 'Kasi',
                      pendidikan: editingPerangkat.pendidikan || 'S1',
                      periode: editingPerangkat.periode || 'Aktif',
                      fotoUrl: editingPerangkat.fotoUrl || db.profil.kepalaDesaFoto,
                      deskripsi: editingPerangkat.deskripsi || '',
                      urutan: Number(editingPerangkat.urutan || 1),
                      isDemo: false,
                    };
                    const exists = db.pemerintahan.some((p) => p.id === item.id);
                    const next = exists
                      ? db.pemerintahan.map((p) => (p.id === item.id ? item : p))
                      : [...db.pemerintahan, item];
                    await onSaveSection('pemerintahan', next);
                    setEditingPerangkat(null);
                    showToast('Data perangkat desa disimpan!');
                  }}
                  className="space-y-4 rounded-xl border border-stone-200 bg-white p-6"
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700">Nama Lengkap</label>
                      <input
                        type="text"
                        required
                        value={editingPerangkat.nama || ''}
                        onChange={(e) =>
                          setEditingPerangkat({ ...editingPerangkat, nama: e.target.value })
                        }
                        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700">Jabatan</label>
                      <input
                        type="text"
                        required
                        value={editingPerangkat.jabatan || ''}
                        onChange={(e) =>
                          setEditingPerangkat({ ...editingPerangkat, jabatan: e.target.value })
                        }
                        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700">Nomor Urut Tampil</label>
                      <input
                        type="number"
                        value={editingPerangkat.urutan || 1}
                        onChange={(e) =>
                          setEditingPerangkat({
                            ...editingPerangkat,
                            urutan: Number(e.target.value),
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 overflow-hidden rounded-lg border border-stone-200">
                      <SmartImage src={editingPerangkat.fotoUrl} alt="Foto Perangkat" />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        openMediaPicker('PEMERINTAHAN', (url) =>
                          setEditingPerangkat((prev) => ({ ...prev, fotoUrl: url }))
                        )
                      }
                      className="rounded-lg bg-emerald-900 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Pilih Foto dari Google Drive
                    </button>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingPerangkat(null)}
                      className="rounded-lg border border-stone-300 px-4 py-2 text-xs"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-emerald-900 px-4 py-2 text-xs font-semibold text-white"
                    >
                      Simpan Perangkat
                    </button>
                  </div>
                </form>
              )}

              <div className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
                {db.pemerintahan.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded-lg bg-stone-100">
                        <SmartImage src={p.fotoUrl} alt={p.nama} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-emerald-900">
                          #{p.urutan} · {p.jabatan}
                        </p>
                        <h4 className="font-serif text-sm font-semibold text-stone-900">{p.nama}</h4>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingPerangkat(p)}
                        className="text-xs font-semibold text-emerald-900 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await onSaveSection(
                            'pemerintahan',
                            db.pemerintahan.filter((x) => x.id !== p.id)
                          );
                          showToast('Perangkat dihapus.');
                        }}
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. DATA STATISTIK DESA */}
          {activeTab === 'DATA_DESA' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-5">
                <div>
                  <h2 className="font-serif text-xl font-semibold text-stone-900">
                    7. Statistik & Data Monografi Desa
                  </h2>
                  <p className="text-xs text-stone-500">
                    Klik Edit pada indikator untuk memperbarui angka Jumlah Penduduk, KK, Dusun, RT, RW secara instan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditingStat({
                      id: '',
                      kategori: 'Utama',
                      label: '',
                      nilai: 0,
                      satuan: 'Jiwa',
                      keterangan: 'Data Terbaru',
                      urutan: db.dataDesa.length + 1,
                    })
                  }
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-900 px-4 py-2 text-xs font-semibold text-white"
                >
                  <Plus className="h-4 w-4" /> Tambah Indikator
                </button>
              </div>

              {editingStat && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const item: StatistikItem = {
                      id: editingStat.id || 'STAT-' + Date.now(),
                      kategori: (editingStat.kategori as StatistikItem['kategori']) || 'Utama',
                      label: editingStat.label || '',
                      nilai: Number(editingStat.nilai || 0),
                      satuan: editingStat.satuan || 'Jiwa',
                      keterangan: editingStat.keterangan || '',
                      urutan: Number(editingStat.urutan || 1),
                      isDemo: false,
                    };
                    const exists = db.dataDesa.some((s) => s.id === item.id);
                    const next = exists
                      ? db.dataDesa.map((s) => (s.id === item.id ? item : s))
                      : [...db.dataDesa, item];
                    await onSaveSection('dataDesa', next);
                    setEditingStat(null);
                    showToast(`Data "${item.label}" berhasil diperbarui menjadi ${item.nilai}!`);
                  }}
                  className="grid grid-cols-1 gap-4 rounded-xl border border-stone-200 bg-white p-5 sm:grid-cols-4"
                >
                  <input
                    type="text"
                    required
                    value={editingStat.label || ''}
                    onChange={(e) => setEditingStat({ ...editingStat, label: e.target.value })}
                    placeholder="Label (cth: Jumlah Penduduk)"
                    className="rounded-lg border border-stone-300 px-3 py-2 text-xs"
                  />
                  <input
                    type="number"
                    required
                    value={editingStat.nilai ?? 0}
                    onChange={(e) =>
                      setEditingStat({ ...editingStat, nilai: Number(e.target.value) })
                    }
                    placeholder="Nilai Angka"
                    className="rounded-lg border border-stone-300 px-3 py-2 font-mono text-xs"
                  />
                  <input
                    type="text"
                    value={editingStat.satuan || ''}
                    onChange={(e) => setEditingStat({ ...editingStat, satuan: e.target.value })}
                    placeholder="Satuan (Jiwa / KK / RT)"
                    className="rounded-lg border border-stone-300 px-3 py-2 text-xs"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-emerald-900 px-4 py-2 text-xs font-semibold text-white"
                  >
                    Simpan Angka Statistik
                  </button>
                </form>
              )}

              <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-stone-200 bg-stone-50 font-semibold text-stone-600">
                    <tr>
                      <th className="px-5 py-3">Kategori</th>
                      <th className="px-5 py-3">Label Statistik</th>
                      <th className="px-5 py-3 text-right">Nilai</th>
                      <th className="px-5 py-3">Keterangan</th>
                      <th className="px-5 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {db.dataDesa.map((st) => (
                      <tr key={st.id}>
                        <td className="px-5 py-3 font-semibold text-emerald-900">{st.kategori}</td>
                        <td className="px-5 py-3 font-medium text-stone-900">{st.label}</td>
                        <td className="px-5 py-3 text-right font-mono font-bold tabular-nums text-stone-900">
                          {formatAngka(st.nilai)} {st.satuan}
                        </td>
                        <td className="px-5 py-3 text-stone-500">{st.keterangan}</td>
                        <td className="px-5 py-3 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => setEditingStat(st)}
                            className="font-semibold text-emerald-900 hover:underline"
                          >
                            Edit Angka
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 8. POTENSI DESA */}
          {activeTab === 'POTENSI' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-5">
                <h2 className="font-serif text-xl font-semibold text-stone-900">
                  8. Database Potensi Desa & UMKM
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    setEditingPotensi({
                      id: '',
                      nama: '',
                      kategori: 'UMKM',
                      deskripsi: '',
                      fotoUrl: db.settings.heroFotoUrl,
                      pemilik: '',
                      alamat: 'Desa Sukamaju',
                      kontak: '',
                      whatsapp: db.settings.whatsapp,
                      lokasiMaps: 'https://maps.google.com',
                      kisaranHarga: 'Rp 25.000',
                    })
                  }
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-900 px-4 py-2 text-xs font-semibold text-white"
                >
                  <Plus className="h-4 w-4" /> Tambah Potensi / UMKM
                </button>
              </div>

              {editingPotensi && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const item: PotensiItem = {
                      id: editingPotensi.id || 'POT-' + Date.now(),
                      nama: editingPotensi.nama || '',
                      kategori: (editingPotensi.kategori as PotensiItem['kategori']) || 'UMKM',
                      deskripsi: editingPotensi.deskripsi || '',
                      fotoUrl: editingPotensi.fotoUrl || db.settings.heroFotoUrl,
                      pemilik: editingPotensi.pemilik || '',
                      alamat: editingPotensi.alamat || '',
                      kontak: editingPotensi.kontak || '',
                      whatsapp: editingPotensi.whatsapp || '',
                      lokasiMaps: editingPotensi.lokasiMaps || 'https://maps.google.com',
                      kisaranHarga: editingPotensi.kisaranHarga || '',
                      isDemo: false,
                    };
                    const exists = db.potensi.some((p) => p.id === item.id);
                    const next = exists
                      ? db.potensi.map((p) => (p.id === item.id ? item : p))
                      : [item, ...db.potensi];
                    await onSaveSection('potensi', next);
                    setEditingPotensi(null);
                    showToast('Data potensi desa disimpan!');
                  }}
                  className="space-y-4 rounded-xl border border-stone-200 bg-white p-6"
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700">Nama Produk / Potensi</label>
                      <input
                        type="text"
                        required
                        value={editingPotensi.nama || ''}
                        onChange={(e) => setEditingPotensi({ ...editingPotensi, nama: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700">Kategori</label>
                      <select
                        value={editingPotensi.kategori || 'UMKM'}
                        onChange={(e) =>
                          setEditingPotensi({
                            ...editingPotensi,
                            kategori: e.target.value as PotensiItem['kategori'],
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs"
                      >
                        <option>Produk Unggulan</option>
                        <option>UMKM</option>
                        <option>Pertanian</option>
                        <option>Peternakan</option>
                        <option>Perikanan</option>
                        <option>Wisata</option>
                        <option>Kerajinan</option>
                        <option>Kuliner</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700">WhatsApp (628...)</label>
                      <input
                        type="text"
                        value={editingPotensi.whatsapp || ''}
                        onChange={(e) =>
                          setEditingPotensi({ ...editingPotensi, whatsapp: e.target.value })
                        }
                        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-20 overflow-hidden rounded border border-stone-200">
                      <SmartImage src={editingPotensi.fotoUrl} alt="Foto Potensi" />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        openMediaPicker('POTENSI', (url) =>
                          setEditingPotensi((prev) => ({ ...prev, fotoUrl: url }))
                        )
                      }
                      className="rounded-lg bg-emerald-900 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Pilih Foto dari Google Drive
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Deskripsi produk/potensi..."
                    value={editingPotensi.deskripsi || ''}
                    onChange={(e) =>
                      setEditingPotensi({ ...editingPotensi, deskripsi: e.target.value })
                    }
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingPotensi(null)}
                      className="rounded-lg border border-stone-300 px-4 py-2 text-xs"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-emerald-900 px-4 py-2 text-xs font-semibold text-white"
                    >
                      Simpan Potensi
                    </button>
                  </div>
                </form>
              )}

              <div className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
                {db.potensi.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-4">
                    <div>
                      <span className="text-xs font-semibold text-emerald-900">{p.kategori}</span>
                      <h4 className="font-serif text-sm font-semibold text-stone-900">{p.nama}</h4>
                      <p className="text-xs text-stone-500">{p.pemilik} · {p.alamat}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingPotensi(p)}
                        className="text-xs font-semibold text-emerald-900 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await onSaveSection(
                            'potensi',
                            db.potensi.filter((x) => x.id !== p.id)
                          );
                          showToast('Potensi dihapus.');
                        }}
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 9. PEMBANGUNAN DESA */}
          {activeTab === 'PEMBANGUNAN' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-5">
                <h2 className="font-serif text-xl font-semibold text-stone-900">
                  9. Transparansi Proyek Pembangunan Desa
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    setEditingPembangunan({
                      id: '',
                      namaProyek: '',
                      lokasi: 'Dusun Krajan',
                      tahun: 2026,
                      sumberDana: 'Dana Desa (DD) TA 2026',
                      nilaiAnggaran: 150000000,
                      pelaksana: 'TPK Desa Sukamaju',
                      tanggalMulai: '2026-07-01',
                      tanggalSelesai: '2026-10-30',
                      status: 'Proses Pengerjaan',
                      progres: 50,
                      fotoSebelum: db.settings.heroFotoUrl,
                      fotoProses: db.settings.heroFotoUrl,
                      fotoSelesai: db.settings.heroFotoUrl,
                      keterangan: '',
                    })
                  }
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-900 px-4 py-2 text-xs font-semibold text-white"
                >
                  <Plus className="h-4 w-4" /> Tambah Proyek Pembangunan
                </button>
              </div>

              {editingPembangunan && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const item: PembangunanItem = {
                      id: editingPembangunan.id || 'PMB-' + Date.now(),
                      namaProyek: editingPembangunan.namaProyek || '',
                      lokasi: editingPembangunan.lokasi || '',
                      tahun: Number(editingPembangunan.tahun || 2026),
                      sumberDana: editingPembangunan.sumberDana || '',
                      nilaiAnggaran: Number(editingPembangunan.nilaiAnggaran || 0),
                      pelaksana: editingPembangunan.pelaksana || 'TPK Desa',
                      tanggalMulai: editingPembangunan.tanggalMulai || '',
                      tanggalSelesai: editingPembangunan.tanggalSelesai || '',
                      status:
                        (editingPembangunan.status as PembangunanItem['status']) ||
                        'Proses Pengerjaan',
                      progres: Number(editingPembangunan.progres || 0),
                      fotoSebelum: editingPembangunan.fotoSebelum || db.settings.heroFotoUrl,
                      fotoProses: editingPembangunan.fotoProses || db.settings.heroFotoUrl,
                      fotoSelesai: editingPembangunan.fotoSelesai || db.settings.heroFotoUrl,
                      keterangan: editingPembangunan.keterangan || '',
                      isDemo: false,
                    };
                    const exists = db.pembangunan.some((p) => p.id === item.id);
                    const next = exists
                      ? db.pembangunan.map((p) => (p.id === item.id ? item : p))
                      : [item, ...db.pembangunan];
                    await onSaveSection('pembangunan', next);
                    setEditingPembangunan(null);
                    showToast('Data proyek pembangunan disimpan!');
                  }}
                  className="space-y-4 rounded-xl border border-stone-200 bg-white p-6"
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700">Nama Proyek</label>
                      <input
                        type="text"
                        required
                        value={editingPembangunan.namaProyek || ''}
                        onChange={(e) =>
                          setEditingPembangunan({
                            ...editingPembangunan,
                            namaProyek: e.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700">Nilai Anggaran (Rp)</label>
                      <input
                        type="number"
                        value={editingPembangunan.nilaiAnggaran || 0}
                        onChange={(e) =>
                          setEditingPembangunan({
                            ...editingPembangunan,
                            nilaiAnggaran: Number(e.target.value),
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700">
                        Persentase Progres ({editingPembangunan.progres || 0}%)
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={editingPembangunan.progres || 0}
                        onChange={(e) =>
                          setEditingPembangunan({
                            ...editingPembangunan,
                            progres: Number(e.target.value),
                          })
                        }
                        className="mt-2 w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700">Status</label>
                      <select
                        value={editingPembangunan.status || 'Proses Pengerjaan'}
                        onChange={(e) =>
                          setEditingPembangunan({
                            ...editingPembangunan,
                            status: e.target.value as PembangunanItem['status'],
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs"
                      >
                        <option>Perencanaan</option>
                        <option>Proses Pengerjaan</option>
                        <option>Selesai 100%</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700">Lokasi</label>
                      <input
                        type="text"
                        value={editingPembangunan.lokasi || ''}
                        onChange={(e) =>
                          setEditingPembangunan({ ...editingPembangunan, lokasi: e.target.value })
                        }
                        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        openMediaPicker('PEMBANGUNAN', (url) =>
                          setEditingPembangunan((prev) => ({ ...prev, fotoSebelum: url }))
                        )
                      }
                      className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium"
                    >
                      Pilih Foto Sebelum (0%)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        openMediaPicker('PEMBANGUNAN', (url) =>
                          setEditingPembangunan((prev) => ({ ...prev, fotoProses: url }))
                        )
                      }
                      className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium"
                    >
                      Pilih Foto Proses (50%)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        openMediaPicker('PEMBANGUNAN', (url) =>
                          setEditingPembangunan((prev) => ({ ...prev, fotoSelesai: url }))
                        )
                      }
                      className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium"
                    >
                      Pilih Foto Selesai (100%)
                    </button>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingPembangunan(null)}
                      className="rounded-lg border border-stone-300 px-4 py-2 text-xs"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-emerald-900 px-4 py-2 text-xs font-semibold text-white"
                    >
                      Simpan Proyek
                    </button>
                  </div>
                </form>
              )}

              <div className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
                {db.pembangunan.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-mono text-xs font-semibold text-emerald-900">
                        TA {p.tahun} · {formatRupiah(p.nilaiAnggaran)} · Progres {p.progres}%
                      </p>
                      <h4 className="font-serif text-sm font-semibold text-stone-900">
                        {p.namaProyek}
                      </h4>
                      <p className="text-xs text-stone-500">{p.lokasi}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingPembangunan(p)}
                        className="text-xs font-semibold text-emerald-900 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await onSaveSection(
                            'pembangunan',
                            db.pembangunan.filter((x) => x.id !== p.id)
                          );
                          showToast('Proyek dihapus.');
                        }}
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 10. TRANSPARANSI APBDES */}
          {activeTab === 'TRANSPARANSI' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-5">
                <h2 className="font-serif text-xl font-semibold text-stone-900">
                  10. Transparansi APBDes (Pendapatan, Belanja, Pembiayaan)
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    setEditingTransparansi({
                      id: '',
                      tahun: 2026,
                      jenis: 'Belanja',
                      kategori: '',
                      uraian: '',
                      anggaran: 0,
                      realisasi: 0,
                      tanggalUpdate: new Date().toISOString().split('T')[0],
                      filePdfUrl: '#dokumen-apbdes',
                      keterangan: '',
                    })
                  }
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-900 px-4 py-2 text-xs font-semibold text-white"
                >
                  <Plus className="h-4 w-4" /> Tambah Baris APBDes
                </button>
              </div>

              {editingTransparansi && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const item: TransparansiItem = {
                      id: editingTransparansi.id || 'APB-' + Date.now(),
                      tahun: Number(editingTransparansi.tahun || 2026),
                      jenis:
                        (editingTransparansi.jenis as TransparansiItem['jenis']) || 'Belanja',
                      kategori: editingTransparansi.kategori || '',
                      uraian: editingTransparansi.uraian || '',
                      anggaran: Number(editingTransparansi.anggaran || 0),
                      realisasi: Number(editingTransparansi.realisasi || 0),
                      tanggalUpdate:
                        editingTransparansi.tanggalUpdate ||
                        new Date().toISOString().split('T')[0],
                      filePdfUrl: editingTransparansi.filePdfUrl || '#',
                      keterangan: editingTransparansi.keterangan || '',
                      isDemo: false,
                    };
                    const exists = db.transparansi.some((t) => t.id === item.id);
                    const next = exists
                      ? db.transparansi.map((t) => (t.id === item.id ? item : t))
                      : [...db.transparansi, item];
                    await onSaveSection('transparansi', next);
                    setEditingTransparansi(null);
                    showToast('Data APBDes berhasil disimpan!');
                  }}
                  className="grid grid-cols-1 gap-4 rounded-xl border border-stone-200 bg-white p-6 sm:grid-cols-3"
                >
                  <select
                    value={editingTransparansi.jenis || 'Belanja'}
                    onChange={(e) =>
                      setEditingTransparansi({
                        ...editingTransparansi,
                        jenis: e.target.value as TransparansiItem['jenis'],
                      })
                    }
                    className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs"
                  >
                    <option>Pendapatan</option>
                    <option>Belanja</option>
                    <option>Pembiayaan</option>
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="Bidang / Kategori APBDes"
                    value={editingTransparansi.kategori || ''}
                    onChange={(e) =>
                      setEditingTransparansi({ ...editingTransparansi, kategori: e.target.value })
                    }
                    className="rounded-lg border border-stone-300 px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Uraian singkat"
                    value={editingTransparansi.uraian || ''}
                    onChange={(e) =>
                      setEditingTransparansi({ ...editingTransparansi, uraian: e.target.value })
                    }
                    className="rounded-lg border border-stone-300 px-3 py-2 text-xs"
                  />
                  <input
                    type="number"
                    placeholder="Pagu Anggaran (Rp)"
                    value={editingTransparansi.anggaran || 0}
                    onChange={(e) =>
                      setEditingTransparansi({
                        ...editingTransparansi,
                        anggaran: Number(e.target.value),
                      })
                    }
                    className="rounded-lg border border-stone-300 px-3 py-2 font-mono text-xs"
                  />
                  <input
                    type="number"
                    placeholder="Realisasi (Rp)"
                    value={editingTransparansi.realisasi || 0}
                    onChange={(e) =>
                      setEditingTransparansi({
                        ...editingTransparansi,
                        realisasi: Number(e.target.value),
                      })
                    }
                    className="rounded-lg border border-stone-300 px-3 py-2 font-mono text-xs"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-emerald-900 px-4 py-2 text-xs font-semibold text-white"
                  >
                    Simpan APBDes
                  </button>
                </form>
              )}

              <div className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
                {db.transparansi.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-4">
                    <div>
                      <span className="text-xs font-semibold text-emerald-900">{t.jenis}</span>
                      <h4 className="font-serif text-sm font-semibold text-stone-900">
                        {t.kategori}
                      </h4>
                      <p className="font-mono text-xs text-stone-600">
                        Anggaran: {formatRupiah(t.anggaran)} · Realisasi: {formatRupiah(t.realisasi)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingTransparansi(t)}
                        className="text-xs font-semibold text-emerald-900 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await onSaveSection(
                            'transparansi',
                            db.transparansi.filter((x) => x.id !== t.id)
                          );
                          showToast('Item APBDes dihapus.');
                        }}
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 11. DOKUMEN DESA */}
          {activeTab === 'DOKUMEN' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-5">
                <h2 className="font-serif text-xl font-semibold text-stone-900">
                  11. Manajemen Dokumen Publik (PDF, DOCX, XLSX)
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    setEditingDokumen({
                      id: '',
                      nama: '',
                      nomorDokumen: 'Perdes No. 01 / 2026',
                      kategori: 'Peraturan Desa (Perdes)',
                      tanggal: new Date().toISOString().split('T')[0],
                      deskripsi: '',
                      fileUrl: '#dokumen-baru.pdf',
                      tipeFile: 'PDF',
                      ukuranFile: '1,2 MB',
                      unduhan: 0,
                    })
                  }
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-900 px-4 py-2 text-xs font-semibold text-white"
                >
                  <Plus className="h-4 w-4" /> Upload Dokumen Baru
                </button>
              </div>

              {editingDokumen && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const item: DokumenItem = {
                      id: editingDokumen.id || 'DOK-' + Date.now(),
                      nama: editingDokumen.nama || '',
                      nomorDokumen: editingDokumen.nomorDokumen || '',
                      kategori:
                        (editingDokumen.kategori as DokumenItem['kategori']) ||
                        'Peraturan Desa (Perdes)',
                      tanggal:
                        editingDokumen.tanggal || new Date().toISOString().split('T')[0],
                      deskripsi: editingDokumen.deskripsi || '',
                      fileUrl: editingDokumen.fileUrl || '#dokumen.pdf',
                      tipeFile: (editingDokumen.tipeFile as DokumenItem['tipeFile']) || 'PDF',
                      ukuranFile: editingDokumen.ukuranFile || '1,0 MB',
                      unduhan: editingDokumen.unduhan || 0,
                      isDemo: false,
                    };
                    const exists = db.dokumen.some((d) => d.id === item.id);
                    const next = exists
                      ? db.dokumen.map((d) => (d.id === item.id ? item : d))
                      : [item, ...db.dokumen];
                    await onSaveSection('dokumen', next);
                    setEditingDokumen(null);
                    showToast('Dokumen berhasil disimpan!');
                  }}
                  className="space-y-4 rounded-xl border border-stone-200 bg-white p-6"
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <input
                      type="text"
                      required
                      placeholder="Judul Dokumen"
                      value={editingDokumen.nama || ''}
                      onChange={(e) =>
                        setEditingDokumen({ ...editingDokumen, nama: e.target.value })
                      }
                      className="rounded-lg border border-stone-300 px-3 py-2 text-xs sm:col-span-2"
                    />
                    <input
                      type="text"
                      placeholder="Nomor Dokumen"
                      value={editingDokumen.nomorDokumen || ''}
                      onChange={(e) =>
                        setEditingDokumen({ ...editingDokumen, nomorDokumen: e.target.value })
                      }
                      className="rounded-lg border border-stone-300 px-3 py-2 text-xs"
                    />
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Deskripsi dokumen..."
                    value={editingDokumen.deskripsi || ''}
                    onChange={(e) =>
                      setEditingDokumen({ ...editingDokumen, deskripsi: e.target.value })
                    }
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingDokumen(null)}
                      className="rounded-lg border border-stone-300 px-4 py-2 text-xs"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-emerald-900 px-4 py-2 text-xs font-semibold text-white"
                    >
                      Simpan Dokumen
                    </button>
                  </div>
                </form>
              )}

              <div className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
                {db.dokumen.map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-4">
                    <div>
                      <span className="text-xs font-semibold text-emerald-900">
                        {d.kategori} · {d.tipeFile}
                      </span>
                      <h4 className="font-serif text-sm font-semibold text-stone-900">{d.nama}</h4>
                      <p className="font-mono text-xs text-stone-500">{d.nomorDokumen}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingDokumen(d)}
                        className="text-xs font-semibold text-emerald-900 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await onSaveSection(
                            'dokumen',
                            db.dokumen.filter((x) => x.id !== d.id)
                          );
                          showToast('Dokumen dihapus.');
                        }}
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 12, 13, 14: MEDIA, PENGGUNA ADMIN, & GAS KODE */}
          {(activeTab === 'MEDIA' || activeTab === 'PENGGUNA' || activeTab === 'GAS_KODE') && (
            <AdminExtraModules
              activeTab={activeTab}
              db={db}
              onSaveSection={onSaveSection}
              onOpenMediaPicker={openMediaPicker}
              onManageUser={onManageUser}
            />
          )}
        </main>
      </div>

      {/* Global Media Picker Modal */}
      <MediaPickerModal
        isOpen={mediaModalOpen}
        onClose={() => setMediaModalOpen(false)}
        mediaList={db.media}
        defaultCategory={mediaModalCat}
        onSelect={(url, item) => {
          if (mediaCallback) mediaCallback(url, item);
        }}
        onUploadMedia={handleUploadMediaToDb}
        onDeleteMedia={async (id) => {
          await onSaveSection(
            'media',
            db.media.filter((m) => m.id !== id)
          );
        }}
      />
    </div>
  );
};
