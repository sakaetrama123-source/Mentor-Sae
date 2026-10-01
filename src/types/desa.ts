export type MenuPage =
  | 'BERANDA'
  | 'PROFIL DESA'
  | 'PEMERINTAHAN'
  | 'BERITA'
  | 'AGENDA'
  | 'GALERI'
  | 'POTENSI DESA'
  | 'DATA DESA'
  | 'PEMBANGUNAN'
  | 'TRANSPARANSI'
  | 'DOKUMEN'
  | 'KONTAK'
  | 'ADMIN';

export interface PengumumanItem {
  id: string;
  judul: string;
  isi: string;
  tanggal: string;
  penting: boolean;
  aktif: boolean;
}

export interface DesaSettings {
  namaDesa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  kodePos: string;
  slogan: string;
  deskripsiSingkat: string;
  logoUrl: string;
  heroFotoUrl: string;
  warnaUtama: string;
  alamatKantor: string;
  telepon: string;
  whatsapp: string;
  email: string;
  jamPelayanan: string;
  facebook: string;
  instagram: string;
  youtube: string;
  mapsEmbedUrl: string;
  koordinat: string;
  gasWebAppUrl: string;
  spreadsheetId: string;
  driveFolderId: string;
  pengumuman: PengumumanItem[];
}

export interface ProfilDesa {
  sejarah: string;
  visi: string;
  misi: string[];
  letakGeografis: string;
  batasUtara: string;
  batasSelatan: string;
  batasTimur: string;
  batasBarat: string;
  luasWilayah: string;
  ketinggianMdpl: string;
  curahHujan: string;
  jumlahDusun: string;
  kondisiDesa: string;
  kepalaDesaNama: string;
  kepalaDesaJabatan: string;
  kepalaDesaPeriode: string;
  kepalaDesaFoto: string;
  kepalaDesaSambutan: string;
  strukturBaganCatatan: string;
}

export interface StatistikItem {
  id: string;
  kategori: 'Utama' | 'Pendidikan' | 'Pekerjaan' | 'Agama' | 'Umur' | 'Wilayah';
  label: string;
  nilai: number;
  satuan: string;
  keterangan: string;
  urutan: number;
  isDemo?: boolean;
}

export interface PerangkatDesa {
  id: string;
  nama: string;
  jabatan: string;
  nip: string;
  kategori: 'Kepala Desa' | 'Sekretariat' | 'Kaur' | 'Kasi' | 'Kepala Dusun' | 'BPD';
  pendidikan: string;
  periode: string;
  fotoUrl: string;
  deskripsi: string;
  urutan: number;
  isDemo?: boolean;
}

export interface BeritaItem {
  id: string;
  judul: string;
  kategori: 'Pemerintahan' | 'Pembangunan' | 'Kemasyarakatan' | 'UMKM & Ekonomi' | 'Budaya' | 'Pengumuman' | 'Kesehatan';
  tanggal: string;
  penulis: string;
  fotoUtama: string;
  ringkasan: string;
  isi: string;
  galeriFoto: string[];
  status: 'Terbit' | 'Draft';
  views: number;
  isDemo?: boolean;
}

export interface AgendaItem {
  id: string;
  namaKegiatan: string;
  tanggal: string;
  jam: string;
  lokasi: string;
  penyelenggara: string;
  deskripsi: string;
  fotoUrl: string;
  status: 'Akan Datang' | 'Berlangsung' | 'Selesai';
  isDemo?: boolean;
}

export interface GaleriItem {
  id: string;
  judul: string;
  kategori:
    | 'Kegiatan Desa'
    | 'Pemerintahan'
    | 'Pembangunan'
    | 'Budaya'
    | 'Olahraga'
    | 'UMKM'
    | 'Pertanian'
    | 'Wisata'
    | 'Lainnya';
  tanggal: string;
  fotoUrl: string;
  fileId: string;
  keterangan: string;
  isDemo?: boolean;
}

export interface PotensiItem {
  id: string;
  nama: string;
  kategori:
    | 'UMKM'
    | 'Pertanian'
    | 'Peternakan'
    | 'Perikanan'
    | 'Wisata'
    | 'Kerajinan'
    | 'Kuliner'
    | 'Produk Unggulan';
  deskripsi: string;
  fotoUrl: string;
  pemilik: string;
  alamat: string;
  kontak: string;
  whatsapp: string;
  lokasiMaps: string;
  kisaranHarga: string;
  isDemo?: boolean;
}

export interface PembangunanItem {
  id: string;
  namaProyek: string;
  lokasi: string;
  tahun: number;
  sumberDana: string;
  nilaiAnggaran: number;
  pelaksana: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  status: 'Perencanaan' | 'Proses Pengerjaan' | 'Selesai 100%';
  progres: number;
  fotoSebelum: string;
  fotoProses: string;
  fotoSelesai: string;
  keterangan: string;
  isDemo?: boolean;
}

export interface TransparansiItem {
  id: string;
  tahun: number;
  jenis: 'Pendapatan' | 'Belanja' | 'Pembiayaan';
  kategori: string;
  uraian: string;
  anggaran: number;
  realisasi: number;
  tanggalUpdate: string;
  filePdfUrl: string;
  keterangan: string;
  isDemo?: boolean;
}

export interface DokumenItem {
  id: string;
  nama: string;
  nomorDokumen: string;
  kategori:
    | 'Peraturan Desa (Perdes)'
    | 'SK Kepala Desa'
    | 'APBDes & Keuangan'
    | 'RPJMDes & RKPDes'
    | 'Formulir Layanan Warga'
    | 'Laporan Keterangan (LKPPD)'
    | 'Lainnya';
  tanggal: string;
  deskripsi: string;
  fileUrl: string;
  tipeFile: 'PDF' | 'DOCX' | 'XLSX' | 'LAINNYA';
  ukuranFile: string;
  unduhan: number;
  isDemo?: boolean;
}

export interface MediaItem {
  id: string;
  namaFile: string;
  tanggalUpload: string;
  kategori:
    | 'BERITA'
    | 'GALERI'
    | 'BANNER'
    | 'PROFIL'
    | 'PEMERINTAHAN'
    | 'PEMBANGUNAN'
    | 'POTENSI'
    | 'DOKUMEN';
  folderDrive: string;
  url: string;
  fileId: string;
  keterangan: string;
  ukuran: string;
  isDemo?: boolean;
}

export interface AdminUser {
  id: string;
  username: string;
  namaLengkap: string;
  jabatan: string;
  role: 'Super Admin' | 'Redaktur' | 'Operator';
  terakhirLogin: string;
}

export interface PortalDesaDatabase {
  settings: DesaSettings;
  profil: ProfilDesa;
  dataDesa: StatistikItem[];
  pemerintahan: PerangkatDesa[];
  berita: BeritaItem[];
  agenda: AgendaItem[];
  galeri: GaleriItem[];
  potensi: PotensiItem[];
  pembangunan: PembangunanItem[];
  transparansi: TransparansiItem[];
  dokumen: DokumenItem[];
  media: MediaItem[];
  adminUsers: AdminUser[];
  lastUpdated: string;
}
