import React, { useState, useMemo } from 'react';
import { PortalDesaDatabase, MenuPage, BeritaItem } from '../types/desa';
import { Search, X, ArrowRight } from 'lucide-react';
import { formatTanggalIndo } from '../utils/formatters';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  db: PortalDesaDatabase;
  onNavigate: (page: MenuPage) => void;
  onSelectBerita: (berita: BeritaItem) => void;
}

interface SearchResult {
  id: string;
  kategori: string;
  judul: string;
  ringkasan: string;
  tanggal?: string;
  targetPage: MenuPage;
  beritaItem?: BeritaItem;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  db,
  onNavigate,
  onSelectBerita,
}) => {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('SEMUA');

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const list: SearchResult[] = [];

    // 1. Berita (Hanya yang Terbit)
    db.berita
      .filter((b) => b.status === 'Terbit')
      .forEach((b) => {
        if (
          b.judul.toLowerCase().includes(q) ||
          b.ringkasan.toLowerCase().includes(q) ||
          b.isi.toLowerCase().includes(q) ||
          b.kategori.toLowerCase().includes(q)
        ) {
          list.push({
            id: b.id,
            kategori: 'BERITA',
            judul: b.judul,
            ringkasan: b.ringkasan,
            tanggal: b.tanggal,
            targetPage: 'BERITA',
            beritaItem: b,
          });
        }
      });

    // 2. Agenda
    db.agenda.forEach((a) => {
      if (
        a.namaKegiatan.toLowerCase().includes(q) ||
        a.deskripsi.toLowerCase().includes(q) ||
        a.lokasi.toLowerCase().includes(q)
      ) {
        list.push({
          id: a.id,
          kategori: 'AGENDA',
          judul: a.namaKegiatan,
          ringkasan: `${a.lokasi} · ${a.jam} — ${a.deskripsi}`,
          tanggal: a.tanggal,
          targetPage: 'AGENDA',
        });
      }
    });

    // 3. Galeri
    db.galeri.forEach((g) => {
      if (
        g.judul.toLowerCase().includes(q) ||
        g.keterangan.toLowerCase().includes(q) ||
        g.kategori.toLowerCase().includes(q)
      ) {
        list.push({
          id: g.id,
          kategori: 'GALERI',
          judul: g.judul,
          ringkasan: `${g.kategori} — ${g.keterangan}`,
          tanggal: g.tanggal,
          targetPage: 'GALERI',
        });
      }
    });

    // 4. Potensi Desa
    db.potensi.forEach((p) => {
      if (
        p.nama.toLowerCase().includes(q) ||
        p.deskripsi.toLowerCase().includes(q) ||
        p.kategori.toLowerCase().includes(q) ||
        p.pemilik.toLowerCase().includes(q)
      ) {
        list.push({
          id: p.id,
          kategori: 'POTENSI DESA',
          judul: p.nama,
          ringkasan: `${p.kategori} · ${p.pemilik} — ${p.deskripsi}`,
          targetPage: 'POTENSI DESA',
        });
      }
    });

    // 5. Dokumen
    db.dokumen.forEach((d) => {
      if (
        d.nama.toLowerCase().includes(q) ||
        d.deskripsi.toLowerCase().includes(q) ||
        d.kategori.toLowerCase().includes(q) ||
        d.nomorDokumen.toLowerCase().includes(q)
      ) {
        list.push({
          id: d.id,
          kategori: 'DOKUMEN',
          judul: d.nama,
          ringkasan: `${d.nomorDokumen} · ${d.kategori} — ${d.deskripsi}`,
          tanggal: d.tanggal,
          targetPage: 'DOKUMEN',
        });
      }
    });

    // 6. Pembangunan & Informasi Desa
    db.pembangunan.forEach((pm) => {
      if (
        pm.namaProyek.toLowerCase().includes(q) ||
        pm.lokasi.toLowerCase().includes(q) ||
        pm.keterangan.toLowerCase().includes(q)
      ) {
        list.push({
          id: pm.id,
          kategori: 'INFORMASI DESA',
          judul: pm.namaProyek,
          ringkasan: `${pm.lokasi} · Progres ${pm.progres}% — ${pm.keterangan}`,
          tanggal: String(pm.tahun),
          targetPage: 'PEMBANGUNAN',
        });
      }
    });

    db.pemerintahan.forEach((pr) => {
      if (pr.nama.toLowerCase().includes(q) || pr.jabatan.toLowerCase().includes(q)) {
        list.push({
          id: pr.id,
          kategori: 'INFORMASI DESA',
          judul: `${pr.nama} — ${pr.jabatan}`,
          ringkasan: pr.deskripsi,
          targetPage: 'PEMERINTAHAN',
        });
      }
    });

    return list;
  }, [query, db]);

  if (!isOpen) return null;

  const filteredResults =
    activeFilter === 'SEMUA' ? results : results.filter((r) => r.kategori === activeFilter);

  const categories = ['SEMUA', 'BERITA', 'AGENDA', 'GALERI', 'POTENSI DESA', 'DOKUMEN', 'INFORMASI DESA'];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-stone-950/65 p-4 pt-14 backdrop-blur-xs">
      <div className="flex max-h-[82vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-2xl">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-stone-200 px-5 py-4">
          <Search className="h-5 w-5 shrink-0 text-emerald-900" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari berita desa, agenda kegiatan, UMKM, APBDes, dokumen, atau perangkat desa..."
            className="w-full bg-transparent text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-xs font-medium text-stone-400 hover:text-stone-700"
            >
              Reset
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-stone-100 bg-stone-50 px-5 py-2.5">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveFilter(cat)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                activeFilter === cat
                  ? 'bg-emerald-900 text-white'
                  : 'text-stone-600 hover:bg-stone-200/70 hover:text-stone-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-5">
          {!query.trim() ? (
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-stone-700">
                Ketik kata kunci pencarian di atas
              </p>
              <p className="mt-1 text-xs text-stone-500">
                Contoh kata kunci: <button type="button" onClick={() => setQuery('Gotong Royong')} className="underline hover:text-emerald-900">Gotong Royong</button>,{' '}
                <button type="button" onClick={() => setQuery('Kopi')} className="underline hover:text-emerald-900">Kopi</button>,{' '}
                <button type="button" onClick={() => setQuery('Irigasi')} className="underline hover:text-emerald-900">Irigasi</button>,{' '}
                <button type="button" onClick={() => setQuery('APBDes')} className="underline hover:text-emerald-900">APBDes</button>,{' '}
                <button type="button" onClick={() => setQuery('Musrenbang')} className="underline hover:text-emerald-900">Musrenbang</button>
              </p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm font-medium text-stone-700">
                Tidak ditemukan hasil untuk &ldquo;{query}&rdquo;
              </p>
              <p className="mt-1 text-xs text-stone-500">
                Coba gunakan kata kunci lain seperti nama dusun, topik berita, atau jenis dokumen.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {filteredResults.map((res) => (
                <button
                  key={`${res.kategori}-${res.id}`}
                  type="button"
                  onClick={() => {
                    if (res.beritaItem) {
                      onSelectBerita(res.beritaItem);
                    } else {
                      onNavigate(res.targetPage);
                    }
                    onClose();
                  }}
                  className="group flex w-full items-start justify-between gap-4 py-3.5 text-left transition-colors hover:bg-stone-50 px-2 rounded-lg"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs text-stone-500">
                      <span className="font-semibold text-emerald-900">{res.kategori}</span>
                      {res.tanggal && (
                        <>
                          <span>·</span>
                          <span className="font-mono">{formatTanggalIndo(res.tanggal)}</span>
                        </>
                      )}
                    </div>
                    <h4 className="mt-1 text-sm font-semibold text-stone-900 group-hover:text-emerald-900">
                      {res.judul}
                    </h4>
                    <p className="mt-0.5 line-clamp-2 text-xs text-stone-600">{res.ringkasan}</p>
                  </div>
                  <ArrowRight className="mt-2 h-4 w-4 shrink-0 text-stone-400 transition-transform group-hover:translate-x-1 group-hover:text-emerald-900" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
