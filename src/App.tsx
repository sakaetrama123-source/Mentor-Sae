import React, { useState, useEffect, useCallback } from 'react';
import {
  PortalDesaDatabase,
  MenuPage,
  BeritaItem,
  GaleriItem,
  DokumenItem,
  AdminUser,
} from './types/desa';
import { INITIAL_DESA_DATABASE } from './data/initialData';
import { PublicPages } from './components/PublicPages';
import { AdminDashboard } from './components/AdminDashboard';
import { SearchModal } from './components/SearchModal';
import {
  BeritaDetailModal,
  GaleriLightboxModal,
  DokumenPreviewModal,
} from './components/PublicModals';
import { Search, Menu, X, ChevronDown, ShieldCheck, ArrowLeft } from 'lucide-react';

const ALL_PUBLIC_MENUS: MenuPage[] = [
  'BERANDA',
  'PROFIL DESA',
  'PEMERINTAHAN',
  'BERITA',
  'AGENDA',
  'GALERI',
  'POTENSI DESA',
  'DATA DESA',
  'PEMBANGUNAN',
  'TRANSPARANSI',
  'DOKUMEN',
  'KONTAK',
];

function pageToHash(page: MenuPage): string {
  return '#' + page.toLowerCase().replace(/\s+/g, '-');
}

function hashToPage(hash: string): MenuPage {
  if (!hash) return 'BERANDA';
  const clean = decodeURIComponent(hash.replace(/^#/, ''))
    .trim()
    .toUpperCase()
    .replace(/-/g, ' ');
  const allValid: MenuPage[] = [...ALL_PUBLIC_MENUS, 'ADMIN'];
  return allValid.find((m) => m === clean) || 'BERANDA';
}

export default function App() {
  const [db, setDb] = useState<PortalDesaDatabase>(INITIAL_DESA_DATABASE);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activePage, setActivePage] = useState<MenuPage>(() =>
    hashToPage(window.location.hash)
  );
  const [pageHistory, setPageHistory] = useState<MenuPage[]>(() => [
    hashToPage(window.location.hash),
  ]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState<boolean>(false);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);

  // Public Modals State
  const [selectedBerita, setSelectedBerita] = useState<BeritaItem | null>(null);
  const [lightboxItems, setLightboxItems] = useState<GaleriItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [selectedDokumen, setSelectedDokumen] = useState<DokumenItem | null>(null);

  // Admin Session State
  const [adminToken, setAdminToken] = useState<string | null>(() =>
    localStorage.getItem('desa_admin_token')
  );
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(() => {
    const saved = localStorage.getItem('desa_admin_user');
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  // Load initial database from server
  useEffect(() => {
    let mounted = true;
    fetch('/api/desa')
      .then((res) => res.json())
      .then((json) => {
        if (mounted && json.status === 'success' && json.data) {
          setDb(json.data);
        }
      })
      .catch(() => {
        // Fallback to initial seeded database if offline
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Initialize browser history state & listen to mobile/browser Back button (popstate)
  useEffect(() => {
    const initialPage = hashToPage(window.location.hash);
    if (!window.history.state) {
      window.history.replaceState(
        { page: initialPage, modal: null },
        '',
        pageToHash(initialPage)
      );
    }

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state as { page?: MenuPage; modal?: string | null } | null;

      // Close modals if the popped state has no active modal
      if (!state || !state.modal) {
        setSelectedBerita(null);
        setLightboxIndex(null);
        setSelectedDokumen(null);
        setSearchOpen(false);
      }

      const targetPage = state?.page || hashToPage(window.location.hash);
      setActivePage(targetPage);
      setMobileMenuOpen(false);
      setMoreDropdownOpen(false);
      setPageHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : [targetPage]));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Sync dynamic theme color & document title
  useEffect(() => {
    if (db.settings.warnaUtama) {
      document.documentElement.style.setProperty('--desa-primary', db.settings.warnaUtama);
    }
    document.title = `${activePage === 'BERANDA' ? 'Portal Resmi' : activePage + ' –'} ${db.settings.namaDesa}`;
  }, [db.settings.warnaUtama, db.settings.namaDesa, activePage]);

  const handleNavigate = useCallback(
    (page: MenuPage) => {
      setMobileMenuOpen(false);
      setMoreDropdownOpen(false);
      setSelectedBerita(null);
      setLightboxIndex(null);
      setSelectedDokumen(null);
      setSearchOpen(false);

      if (page !== activePage) {
        setActivePage(page);
        setPageHistory((prev) => [...prev, page]);
        window.history.pushState({ page, modal: null }, '', pageToHash(page));
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [activePage]
  );

  const handleGoBack = useCallback(() => {
    if (pageHistory.length > 1) {
      window.history.back();
    } else {
      handleNavigate('BERANDA');
    }
  }, [pageHistory.length, handleNavigate]);

  const closeModalAndSyncHistory = useCallback((closeFn: () => void) => {
    closeFn();
    if (window.history.state?.modal) {
      window.history.back();
    }
  }, []);

  const handleOpenBerita = (berita: BeritaItem) => {
    setSelectedBerita(berita);
    window.history.pushState(
      { page: activePage, modal: 'berita' },
      '',
      pageToHash(activePage)
    );
    fetch(`/api/berita/${berita.id}/view`, { method: 'POST' })
      .then((r) => r.json())
      .then((res) => {
        if (res.status === 'success') {
          setDb((prev) => ({
            ...prev,
            berita: prev.berita.map((b) =>
              b.id === berita.id ? { ...b, views: res.views } : b
            ),
          }));
        }
      })
      .catch(() => {});
  };

  const handleTriggerDocDownload = (doc: DokumenItem) => {
    fetch(`/api/dokumen/${doc.id}/download`, { method: 'POST' })
      .then((r) => r.json())
      .then((res) => {
        if (res.status === 'success') {
          setDb((prev) => ({
            ...prev,
            dokumen: prev.dokumen.map((d) =>
              d.id === doc.id ? { ...d, unduhan: res.unduhan } : d
            ),
          }));
        }
      })
      .catch(() => {});
  };

  const handleSaveSection = async (section: keyof PortalDesaDatabase, data: unknown) => {
    setDb((prev) => ({ ...prev, [section]: data }));
    if (!adminToken) return;
    const res = await fetch('/api/admin/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ section, data }),
    });
    const json = await res.json();
    if (json.status === 'success' && json.data) {
      setDb(json.data);
    }
  };

  const handleClearDemo = async () => {
    if (!adminToken) return;
    const res = await fetch('/api/admin/clear-demo', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const json = await res.json();
    if (json.status === 'success' && json.data) {
      setDb(json.data);
    }
  };

  const handleResetDemo = async () => {
    if (!adminToken) return;
    const res = await fetch('/api/admin/reset-demo', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const json = await res.json();
    if (json.status === 'success' && json.data) {
      setDb(json.data);
    }
  };

  const handleManageUser = async (
    action: 'save' | 'delete',
    user: Partial<AdminUser> & { newPassword?: string }
  ) => {
    if (!adminToken) return;
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ action, user }),
    });
    const json = await res.json();
    if (json.status === 'success' && json.data) {
      setDb(json.data);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FBF9F5] p-6 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-stone-300 border-t-emerald-900" />
        <p className="mt-4 font-serif text-lg font-medium text-stone-900">
          Memuat Portal Informasi {db.settings.namaDesa}...
        </p>
      </div>
    );
  }

  // If on ADMIN route, render AdminDashboard
  if (activePage === 'ADMIN') {
    return (
      <AdminDashboard
        db={db}
        adminToken={adminToken}
        currentAdmin={currentAdmin}
        onLoginSuccess={(token, user) => {
          setAdminToken(token);
          setCurrentAdmin(user);
          localStorage.setItem('desa_admin_token', token);
          localStorage.setItem('desa_admin_user', JSON.stringify(user));
        }}
        onLogout={() => {
          fetch('/api/auth/logout', {
            method: 'POST',
            headers: { Authorization: `Bearer ${adminToken}` },
          }).catch(() => {});
          setAdminToken(null);
          setCurrentAdmin(null);
          localStorage.removeItem('desa_admin_token');
          localStorage.removeItem('desa_admin_user');
        }}
        onSaveSection={handleSaveSection}
        onClearDemo={handleClearDemo}
        onResetDemo={handleResetDemo}
        onManageUser={handleManageUser}
        onBackToPublic={(page) => {
          if (page) handleNavigate(page);
          else handleGoBack();
        }}
      />
    );
  }

  const primaryDesktopMenus: MenuPage[] = [
    'BERANDA',
    'PROFIL DESA',
    'PEMERINTAHAN',
    'BERITA',
    'TRANSPARANSI',
  ];
  const secondaryDesktopMenus: MenuPage[] = ALL_PUBLIC_MENUS.filter(
    (m) => !primaryDesktopMenus.includes(m)
  );

  const previousPageLabel =
    pageHistory.length > 1 ? pageHistory[pageHistory.length - 2] : 'BERANDA';

  return (
    <div className="flex min-h-screen flex-col bg-[#FBF9F5] text-[#1C1917]">
      {/* TOP BAR CONTRACT: 3 ZONES (Brand Title — 5 Primary Nav Links + More — Search & Admin Actions) */}
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          {/* Zone 1: Single text element wordmark */}
          <button
            type="button"
            onClick={() => handleNavigate('BERANDA')}
            className="font-serif text-lg font-bold tracking-tight text-stone-900 whitespace-nowrap"
          >
            {db.settings.namaDesa}
          </button>

          {/* Zone 2: Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-stone-600">
            {primaryDesktopMenus.map((menu) => (
              <button
                key={menu}
                type="button"
                onClick={() => handleNavigate(menu)}
                className={`py-1 transition-colors whitespace-nowrap ${
                  activePage === menu
                    ? 'border-b-2 border-emerald-900 text-emerald-900'
                    : 'hover:text-stone-900'
                }`}
              >
                {menu}
              </button>
            ))}

            {/* Dropdown for remaining menus so header never overflows */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                className={`flex items-center gap-1 py-1 transition-colors whitespace-nowrap ${
                  secondaryDesktopMenus.includes(activePage)
                    ? 'border-b-2 border-emerald-900 text-emerald-900'
                    : 'hover:text-stone-900'
                }`}
              >
                <span>Menu Lainnya</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>

              {moreDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl border border-stone-200 bg-white py-2 shadow-xl">
                  {secondaryDesktopMenus.map((menu) => (
                    <button
                      key={menu}
                      type="button"
                      onClick={() => handleNavigate(menu)}
                      className={`block w-full px-4 py-2 text-left text-xs font-medium transition-colors ${
                        activePage === menu
                          ? 'bg-emerald-50 font-semibold text-emerald-900'
                          : 'text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      {menu}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Zone 3: Primary Actions (Search + Admin CMS + Mobile Hamburger) */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setSearchOpen(true);
                window.history.pushState(
                  { page: activePage, modal: 'search' },
                  '',
                  pageToHash(activePage)
                );
              }}
              className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-100 whitespace-nowrap"
              aria-label="Cari informasi desa"
            >
              <Search className="h-3.5 w-3.5 text-emerald-900" />
              <span className="hidden sm:inline">Pencarian</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavigate('ADMIN')}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-900 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-800 whitespace-nowrap"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Dashboard Admin</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg border border-stone-200 p-2 text-stone-700 hover:bg-stone-100 lg:hidden"
              aria-label="Buka menu navigasi"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Secondary Horizontal Quick-Nav Bar for all 12 Menus on Desktop */}
        <div className="hidden border-t border-stone-100 bg-[#FBF9F5] lg:block">
          <div className="mx-auto flex max-w-7xl items-center gap-5 overflow-x-auto px-8 py-2 text-[11px] font-medium text-stone-600">
            {ALL_PUBLIC_MENUS.map((menu) => (
              <button
                key={menu}
                type="button"
                onClick={() => handleNavigate(menu)}
                className={`transition-colors whitespace-nowrap ${
                  activePage === menu
                    ? 'font-bold text-emerald-900 underline underline-offset-4'
                    : 'hover:text-stone-900'
                }`}
              >
                {menu}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Hamburger Menu Drawer */}
        {mobileMenuOpen && (
          <div className="border-t border-stone-200 bg-white px-4 py-4 lg:hidden">
            <div className="mb-3 border-b border-stone-100 pb-2 text-xs text-stone-500">
              Pemerintah {db.settings.namaDesa} · {db.settings.kecamatan} · {db.settings.kabupaten}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {ALL_PUBLIC_MENUS.map((menu) => (
                <button
                  key={menu}
                  type="button"
                  onClick={() => handleNavigate(menu)}
                  className={`rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors ${
                    activePage === menu
                      ? 'bg-emerald-900 font-semibold text-white'
                      : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {menu}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* CONTEXTUAL BACK NAVIGATION BAR FOR SUB-PAGES */}
      {activePage !== 'BERANDA' && (
        <div className="border-b border-stone-200/80 bg-stone-100/70">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 text-xs sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={handleGoBack}
              className="flex items-center gap-1.5 font-semibold text-emerald-900 hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Kembali ke {previousPageLabel}</span>
            </button>
            <div className="flex items-center gap-1.5 text-stone-500">
              <span>Beranda</span>
              <span>/</span>
              <span className="font-semibold text-stone-800">{activePage}</span>
            </div>
          </div>
        </div>
      )}

      {/* MAIN PUBLIC VIEWPORT */}
      <main className="flex-1">
        <PublicPages
          activePage={activePage}
          db={db}
          onNavigate={handleNavigate}
          onOpenBerita={handleOpenBerita}
          onOpenLightbox={(items, idx) => {
            setLightboxItems(items);
            setLightboxIndex(idx);
            window.history.pushState(
              { page: activePage, modal: 'lightbox' },
              '',
              pageToHash(activePage)
            );
          }}
          onOpenDokumen={(doc) => {
            setSelectedDokumen(doc);
            window.history.pushState(
              { page: activePage, modal: 'dokumen' },
              '',
              pageToHash(activePage)
            );
          }}
        />
      </main>

      {/* INSTITUTIONAL FOOTER */}
      <footer className="border-t border-stone-200 bg-white text-stone-600">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
            <div className="md:col-span-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-900">
                Pemerintah {db.settings.kabupaten} · {db.settings.kecamatan}
              </p>
              <h3 className="mt-1 font-serif text-xl font-bold text-stone-900">
                Portal Informasi Resmi {db.settings.namaDesa}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-stone-600">
                {db.settings.alamatKantor}
              </p>
              <p className="mt-2 font-mono text-xs text-stone-500">
                Telp: {db.settings.telepon} · Email: {db.settings.email}
              </p>
            </div>

            <div className="md:col-span-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                Akses Cepat Layanan Publik
              </h4>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                {ALL_PUBLIC_MENUS.map((menu) => (
                  <button
                    key={menu}
                    type="button"
                    onClick={() => handleNavigate(menu)}
                    className="text-left text-stone-600 hover:text-emerald-900 hover:underline"
                  >
                    {menu}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                Pengelolaan Sistem Informasi
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-stone-600">
                Seluruh berita, foto galeri Google Drive, dan laporan APBDes dikelola secara dinamis melalui CMS Pemerintah Desa.
              </p>
              <button
                type="button"
                onClick={() => handleNavigate('ADMIN')}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-stone-300 px-3.5 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-100"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-900" />
                Login Operator / Admin Desa
              </button>
            </div>
          </div>

          <div className="mt-8 border-t border-stone-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500">
            <p>
              © {new Date().getFullYear()} Pemerintah {db.settings.namaDesa}, {db.settings.kecamatan}, {db.settings.kabupaten}. Hak Cipta Dilindungi.
            </p>
            <p>Sistem Informasi Desa Mandiri Terintegrasi</p>
          </div>
        </div>
      </footer>

      {/* GLOBAL MODALS */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => closeModalAndSyncHistory(() => setSearchOpen(false))}
        db={db}
        onNavigate={handleNavigate}
        onSelectBerita={handleOpenBerita}
      />

      <BeritaDetailModal
        berita={selectedBerita}
        onClose={() => closeModalAndSyncHistory(() => setSelectedBerita(null))}
      />

      <GaleriLightboxModal
        items={lightboxItems}
        activeIndex={lightboxIndex}
        onClose={() => closeModalAndSyncHistory(() => setLightboxIndex(null))}
        onChangeIndex={(idx) => setLightboxIndex(idx)}
      />

      <DokumenPreviewModal
        dokumen={selectedDokumen}
        settings={db.settings}
        onClose={() => closeModalAndSyncHistory(() => setSelectedDokumen(null))}
        onTriggerDownload={handleTriggerDocDownload}
      />
    </div>
  );
}
