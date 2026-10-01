export interface GasFileTemplate {
  filename: string;
  description: string;
  code: string;
}

export const GAS_PROJECT_FILES: GasFileTemplate[] = [
  {
    filename: 'Config.gs',
    description: 'Konfigurasi Utama Spreadsheet ID, Root Folder ID Google Drive, Daftar Nama Sheet, dan Struktur Sub-Folder Drive.',
    code: `/**
 * NAMA FILE: Config.gs
 * Konfigurasi Utama Portal Informasi Desa - Google Sheets & Google Drive
 */

const CONFIG = {
  // Ganti dengan ID Google Spreadsheet Anda (lihat URL spreadsheet)
  SPREADSHEET_ID: 'GANTI_DENGAN_SPREADSHEET_ID_ANDA',

  // Ganti dengan ID Folder Utama "PORTAL DESA" di Google Drive Anda (opsional, otomatis dibuat jika kosong)
  ROOT_DRIVE_FOLDER_ID: '',
  ROOT_FOLDER_NAME: 'PORTAL DESA',

  // Sub-folder otomatis di dalam Google Drive "PORTAL DESA"
  DRIVE_SUBFOLDERS: [
    'BERITA',
    'GALERI',
    'BANNER',
    'PROFIL',
    'PEMERINTAHAN',
    'PEMBANGUNAN',
    'POTENSI',
    'DOKUMEN'
  ],

  // Daftar 12 Sheet Database Utama (Menggunakan ID Unik, bukan nomor baris)
  SHEETS: {
    SETTINGS: 'SETTINGS',
    BERITA: 'BERITA',
    GALERI: 'GALERI',
    AGENDA: 'AGENDA',
    PROFIL: 'PROFIL',
    PEMERINTAHAN: 'PEMERINTAHAN',
    DATA_DESA: 'DATA_DESA',
    POTENSI: 'POTENSI',
    PEMBANGUNAN: 'PEMBANGUNAN',
    TRANSPARANSI: 'TRANSPARANSI',
    DOKUMEN: 'DOKUMEN',
    ADMIN: 'ADMIN'
  },

  // Durasi Token Login Admin (dalam detik) - 12 Jam
  SESSION_TTL_SECONDS: 43200
};
`,
  },
  {
    filename: 'Code.gs',
    description: 'Router Utama Web App (doGet, doPost), Penyajian HTML Publik/Admin, dan Endpoint API JSON.',
    code: `/**
 * NAMA FILE: Code.gs
 * Router Utama Google Apps Script (doGet, doPost, Include Partial HTML, & Setup Awal)
 */

function doGet(e) {
  const page = (e && e.parameter && e.parameter.page) ? e.parameter.page.toLowerCase() : 'index';
  const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : '';

  // Jika dipanggil sebagai JSON REST API (misal sinkronisasi portal eksternal)
  if (action === 'getPublicData') {
    return jsonResponse({
      status: 'success',
      data: getAllPublicData()
    });
  }

  let templateName = 'index';
  let pageTitle = 'Portal Informasi Desa Digital';

  if (page === 'admin') {
    templateName = 'admin';
    pageTitle = 'Dashboard Admin – Portal Informasi Desa';
  } else if (page === 'login') {
    templateName = 'login';
    pageTitle = 'Login Admin – Portal Informasi Desa';
  }

  const template = HtmlService.createTemplateFromFile(templateName);
  template.appUrl = ScriptApp.getService().getUrl();
  
  return template.evaluate()
    .setTitle(pageTitle)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=5')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const action = payload.action;
    const token = payload.token || '';

    // Endpoint Publik (Tanpa Token Admin)
    if (action === 'getPublicData') {
      return jsonResponse({ status: 'success', data: getAllPublicData() });
    }
    if (action === 'login') {
      return jsonResponse(loginAdmin(payload.username, payload.password));
    }
    if (action === 'searchPublic') {
      return jsonResponse({ status: 'success', results: searchPortalContent(payload.query) });
    }

    // Validasi Token Admin untuk seluruh aksi tulis/ubah/hapus
    if (!verifyAdminSession(token)) {
      return jsonResponse({ status: 'error', message: 'Sesi tidak valid atau telah berakhir. Silakan login kembali.' });
    }

    switch (action) {
      case 'saveRecord':
        return jsonResponse(saveSheetRecord(payload.sheetName, payload.record));
      case 'deleteRecord':
        return jsonResponse(deleteSheetRecord(payload.sheetName, payload.id));
      case 'uploadFile':
        return jsonResponse(uploadFileToDrive(payload.base64Data, payload.fileName, payload.mimeType, payload.category, payload.keterangan));
      case 'deleteFile':
        return jsonResponse(deleteDriveFileById(payload.fileId, payload.mediaId));
      case 'clearDemoData':
        return jsonResponse(removeAllDemoRecords());
      case 'logout':
        return jsonResponse(logoutAdmin(token));
      default:
        return jsonResponse({ status: 'error', message: 'Aksi tidak dikenali: ' + action });
    }
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

/**
 * Helper untuk menyertakan file style.css.html dan script.html di dalam template HTML
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Fungsi Setup Awal: Jalankan 1x dari Editor Apps Script untuk membuat 12 Sheet, Folder Drive, dan Akun Admin
 */
function setupPortalDesa() {
  initDatabaseSheets();
  initDriveFolders();
  ensureDefaultAdmin();
  Logger.log('Setup Portal Informasi Desa berhasil diselesaikan!');
}
`,
  },
  {
    filename: 'Auth.gs',
    description: 'Sistem Keamanan Login Admin, Hashing Password SHA-256, dan Manajemen Token Session CacheService.',
    code: `/**
 * NAMA FILE: Auth.gs
 * Keamanan Autentikasi Admin, Hash SHA-256, dan Validasi Session Token
 */

function hashPassword(password) {
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password, Utilities.Charset.UTF_8);
  return rawHash.map(function(byte) {
    const v = (byte < 0) ? 256 + byte : byte;
    return ('0' + v.toString(16)).slice(-2);
  }).join('');
}

function ensureDefaultAdmin() {
  const admins = getSheetData(CONFIG.SHEETS.ADMIN);
  if (admins.length === 0) {
    saveSheetRecord(CONFIG.SHEETS.ADMIN, {
      id: 'ADM-001',
      username: 'admin',
      passwordHash: hashPassword('desa123'),
      namaLengkap: 'Administrator Utama Desa',
      jabatan: 'Operator SID',
      role: 'Super Admin',
      terakhirLogin: new Date().toISOString()
    });
  }
}

function loginAdmin(username, password) {
  if (!username || !password) {
    return { status: 'error', message: 'Username dan password wajib diisi.' };
  }
  const cleanUser = String(username).trim().toLowerCase();
  const passHash = hashPassword(String(password));
  const admins = getSheetData(CONFIG.SHEETS.ADMIN);

  const matched = admins.find(function(a) {
    return String(a.username).toLowerCase() === cleanUser && a.passwordHash === passHash;
  });

  if (!matched) {
    return { status: 'error', message: 'Username atau password salah.' };
  }

  const token = Utilities.getUuid();
  const cache = CacheService.getScriptCache();
  const sessionData = JSON.stringify({
    id: matched.id,
    username: matched.username,
    namaLengkap: matched.namaLengkap,
    role: matched.role,
    loginAt: new Date().toISOString()
  });

  cache.put('ADMIN_TOKEN_' + token, sessionData, CONFIG.SESSION_TTL_SECONDS);

  // Update waktu login terakhir
  matched.terakhirLogin = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm');
  saveSheetRecord(CONFIG.SHEETS.ADMIN, matched);

  return {
    status: 'success',
    token: token,
    user: {
      id: matched.id,
      username: matched.username,
      namaLengkap: matched.namaLengkap,
      jabatan: matched.jabatan,
      role: matched.role
    }
  };
}

function verifyAdminSession(token) {
  if (!token) return false;
  const cache = CacheService.getScriptCache();
  const session = cache.get('ADMIN_TOKEN_' + token);
  return Boolean(session);
}

function logoutAdmin(token) {
  if (token) {
    CacheService.getScriptCache().remove('ADMIN_TOKEN_' + token);
  }
  return { status: 'success', message: 'Berhasil keluar dari sesi admin.' };
}
`,
  },
  {
    filename: 'Database.gs',
    description: 'Mesin CRUD Google Sheets berbasis ID Unik (Bukan Nomor Baris), Filter Publik, dan Pencarian.',
    code: `/**
 * NAMA FILE: Database.gs
 * Pengelolaan Database Google Sheets dengan ID Unik untuk 12 Tabel
 */

function getSpreadsheet() {
  if (CONFIG.SPREADSHEET_ID && CONFIG.SPREADSHEET_ID !== 'GANTI_DENGAN_SPREADSHEET_ID_ANDA') {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function initDatabaseSheets() {
  const ss = getSpreadsheet();
  const schema = {
    SETTINGS: ['id', 'key', 'value', 'updatedAt'],
    BERITA: ['id', 'judul', 'kategori', 'tanggal', 'penulis', 'fotoUtama', 'ringkasan', 'isi', 'galeriFoto', 'status', 'views', 'isDemo'],
    GALERI: ['id', 'judul', 'kategori', 'tanggal', 'fotoUrl', 'fileId', 'keterangan', 'isDemo'],
    AGENDA: ['id', 'namaKegiatan', 'tanggal', 'jam', 'lokasi', 'penyelenggara', 'deskripsi', 'fotoUrl', 'status', 'isDemo'],
    PROFIL: ['id', 'field', 'content', 'updatedAt'],
    PEMERINTAHAN: ['id', 'nama', 'jabatan', 'nip', 'kategori', 'pendidikan', 'periode', 'fotoUrl', 'deskripsi', 'urutan', 'isDemo'],
    DATA_DESA: ['id', 'kategori', 'label', 'nilai', 'satuan', 'keterangan', 'urutan', 'isDemo'],
    POTENSI: ['id', 'nama', 'kategori', 'deskripsi', 'fotoUrl', 'pemilik', 'alamat', 'kontak', 'whatsapp', 'lokasiMaps', 'kisaranHarga', 'isDemo'],
    PEMBANGUNAN: ['id', 'namaProyek', 'lokasi', 'tahun', 'sumberDana', 'nilaiAnggaran', 'pelaksana', 'tanggalMulai', 'tanggalSelesai', 'status', 'progres', 'fotoSebelum', 'fotoProses', 'fotoSelesai', 'keterangan', 'isDemo'],
    TRANSPARANSI: ['id', 'tahun', 'jenis', 'kategori', 'uraian', 'anggaran', 'realisasi', 'tanggalUpdate', 'filePdfUrl', 'keterangan', 'isDemo'],
    DOKUMEN: ['id', 'nama', 'nomorDokumen', 'kategori', 'tanggal', 'deskripsi', 'fileUrl', 'tipeFile', 'ukuranFile', 'unduhan', 'isDemo'],
    ADMIN: ['id', 'username', 'passwordHash', 'namaLengkap', 'jabatan', 'role', 'terakhirLogin']
  };

  Object.keys(schema).forEach(function(sheetName) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(schema[sheetName]);
      sheet.getRange(1, 1, 1, schema[sheetName].length).setFontWeight('bold').setBackground('#14532D').setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);
    }
  });
}

function getSheetData(sheetName) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const headers = values[0];
  const rows = values.slice(1);

  return rows.map(function(row) {
    const obj = {};
    headers.forEach(function(h, idx) {
      let val = row[idx];
      if ((h === 'galeriFoto' || h === 'misi' || h === 'pengumuman') && typeof val === 'string' && val.startsWith('[')) {
        try { val = JSON.parse(val); } catch (e) {}
      }
      obj[h] = val;
    });
    return obj;
  });
}

function saveSheetRecord(sheetName, record) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet tidak ditemukan: ' + sheetName);

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  if (!record.id) {
    record.id = sheetName.substring(0, 3).toUpperCase() + '-' + new Date().getTime();
  }

  const rowValues = headers.map(function(h) {
    const val = record[h];
    if (Array.isArray(val) || (typeof val === 'object' && val !== null)) {
      return JSON.stringify(val);
    }
    return val !== undefined ? val : '';
  });

  // Cari baris berdasarkan ID Unik pada kolom pertama (index 0)
  let existingRowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(record.id)) {
      existingRowIndex = i + 1;
      break;
    }
  }

  if (existingRowIndex > 0) {
    sheet.getRange(existingRowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }

  return { status: 'success', id: record.id, record: record };
}

function deleteSheetRecord(sheetName, id) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { status: 'error', message: 'Sheet tidak ditemukan' };

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { status: 'success', deletedId: id };
    }
  }
  return { status: 'error', message: 'Data dengan ID ' + id + ' tidak ditemukan' };
}

function getAllPublicData() {
  return {
    settings: getSheetData(CONFIG.SHEETS.SETTINGS),
    profil: getSheetData(CONFIG.SHEETS.PROFIL),
    berita: getSheetData(CONFIG.SHEETS.BERITA).filter(function(b) { return b.status === 'Terbit'; }),
    galeri: getSheetData(CONFIG.SHEETS.GALERI),
    agenda: getSheetData(CONFIG.SHEETS.AGENDA),
    pemerintahan: getSheetData(CONFIG.SHEETS.PEMERINTAHAN),
    dataDesa: getSheetData(CONFIG.SHEETS.DATA_DESA),
    potensi: getSheetData(CONFIG.SHEETS.POTENSI),
    pembangunan: getSheetData(CONFIG.SHEETS.PEMBANGUNAN),
    transparansi: getSheetData(CONFIG.SHEETS.TRANSPARANSI),
    dokumen: getSheetData(CONFIG.SHEETS.DOKUMEN)
  };
}
`,
  },
  {
    filename: 'Drive.gs',
    description: 'Manajemen Penyimpanan Foto & Dokumen Otomatis di Google Drive (Pembuatan Sub-Folder & URL Publik).',
    code: `/**
 * NAMA FILE: Drive.gs
 * Pengelolaan Upload Gambar & Dokumen ke Struktur Folder Google Drive "PORTAL DESA"
 */

function getOrCreateRootFolder() {
  if (CONFIG.ROOT_DRIVE_FOLDER_ID) {
    try {
      return DriveApp.getFolderById(CONFIG.ROOT_DRIVE_FOLDER_ID);
    } catch (e) {}
  }
  const folders = DriveApp.getFoldersByName(CONFIG.ROOT_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  const created = DriveApp.createFolder(CONFIG.ROOT_FOLDER_NAME);
  created.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return created;
}

function getCategoryFolder(categoryName) {
  const root = getOrCreateRootFolder();
  const cleanCat = (categoryName || 'GALERI').toUpperCase();
  const subFolders = root.getFoldersByName(cleanCat);
  if (subFolders.hasNext()) {
    return subFolders.next();
  }
  const created = root.createFolder(cleanCat);
  created.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return created;
}

function initDriveFolders() {
  const root = getOrCreateRootFolder();
  CONFIG.DRIVE_SUBFOLDERS.forEach(function(folderName) {
    getCategoryFolder(folderName);
  });
  return root.getId();
}

function uploadFileToDrive(base64Data, fileName, mimeType, category, keterangan) {
  const folder = getCategoryFolder(category);
  const splitBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
  const decoded = Utilities.base64Decode(splitBase64);
  const blob = Utilities.newBlob(decoded, mimeType || 'image/jpeg', fileName);

  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  const fileId = file.getId();
  const publicUrl = 'https://lh3.googleusercontent.com/d/' + fileId;

  return {
    status: 'success',
    fileId: fileId,
    url: publicUrl,
    downloadUrl: 'https://drive.google.com/uc?export=download&id=' + fileId,
    namaFile: fileName,
    kategori: category,
    tanggalUpload: Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd'),
    keterangan: keterangan || ''
  };
}

function deleteDriveFileById(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    file.setTrashed(true);
    return { status: 'success', fileId: fileId };
  } catch (err) {
    return { status: 'error', message: err.toString() };
  }
}
`,
  },
  {
    filename: 'Utils.gs',
    description: 'Fungsi Utilitas JSON Response, Sanitasi Input, Pencarian Lintas Tabel, dan Pembersih Data Demo.',
    code: `/**
 * NAMA FILE: Utils.gs
 * Helper JSON Output, Sanitasi Keamanan Input, dan Pencarian Terpadu
 */

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function sanitizeInput(text) {
  if (typeof text !== 'string') return text;
  return text.replace(/<script\\b[^<]*(?:(?!<\\/script>)<[^<]*)*<\\/script>/gi, '').trim();
}

function searchPortalContent(query) {
  const q = String(query || '').toLowerCase().trim();
  if (!q) return [];

  const data = getAllPublicData();
  const results = [];

  data.berita.forEach(function(item) {
    if (String(item.judul).toLowerCase().includes(q) || String(item.ringkasan).toLowerCase().includes(q)) {
      results.push({ tipe: 'BERITA', id: item.id, judul: item.judul, ringkasan: item.ringkasan, tanggal: item.tanggal });
    }
  });

  data.agenda.forEach(function(item) {
    if (String(item.namaKegiatan).toLowerCase().includes(q) || String(item.deskripsi).toLowerCase().includes(q)) {
      results.push({ tipe: 'AGENDA', id: item.id, judul: item.namaKegiatan, ringkasan: item.lokasi, tanggal: item.tanggal });
    }
  });

  data.potensi.forEach(function(item) {
    if (String(item.nama).toLowerCase().includes(q) || String(item.deskripsi).toLowerCase().includes(q)) {
      results.push({ tipe: 'POTENSI DESA', id: item.id, judul: item.nama, ringkasan: item.kategori, tanggal: '' });
    }
  });

  data.dokumen.forEach(function(item) {
    if (String(item.nama).toLowerCase().includes(q) || String(item.deskripsi).toLowerCase().includes(q)) {
      results.push({ tipe: 'DOKUMEN', id: item.id, judul: item.nama, ringkasan: item.kategori, tanggal: item.tanggal });
    }
  });

  return results;
}

function removeAllDemoRecords() {
  const targetSheets = ['BERITA', 'GALERI', 'AGENDA', 'PEMERINTAHAN', 'DATA_DESA', 'POTENSI', 'PEMBANGUNAN', 'TRANSPARANSI', 'DOKUMEN'];
  let removedCount = 0;

  targetSheets.forEach(function(sheetName) {
    const rows = getSheetData(sheetName);
    rows.forEach(function(row) {
      if (row.isDemo === true || String(row.isDemo).toLowerCase() === 'true') {
        deleteSheetRecord(sheetName, row.id);
        removedCount++;
      }
    });
  });

  return { status: 'success', removedCount: removedCount };
}
`,
  },
  {
    filename: 'index.html',
    description: 'Halaman Utama Publik (SPA Terpadu) untuk Google Apps Script HtmlService.',
    code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Portal Informasi Desa Digital</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <?!= include('style.css'); ?>
</head>
<body class="bg-[#FBF9F5] text-stone-900">
  <div id="portal-app">Memuat Portal Informasi Desa...</div>
  <?!= include('script'); ?>
</body>
</html>`,
  },
  {
    filename: 'admin.html',
    description: 'Halaman Dashboard Admin CMS untuk Google Apps Script (?page=admin).',
    code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Dashboard Admin – Portal Informasi Desa</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <?!= include('style.css'); ?>
</head>
<body class="bg-stone-100 text-stone-900">
  <div id="admin-app">Memuat Dashboard Admin...</div>
  <script>window.INITIAL_VIEW = 'ADMIN';</script>
  <?!= include('script'); ?>
</body>
</html>`,
  },
  {
    filename: 'login.html',
    description: 'Halaman Otentikasi Login Admin untuk Google Apps Script (?page=login).',
    code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Login Admin – Portal Informasi Desa</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <?!= include('style.css'); ?>
</head>
<body class="bg-stone-100 text-stone-900">
  <div id="login-app">Memuat Halaman Login...</div>
  <script>window.INITIAL_VIEW = 'LOGIN';</script>
  <?!= include('script'); ?>
</body>
</html>`,
  },
  {
    filename: 'style.css.html',
    description: 'Stylesheet Partial untuk Google Apps Script HtmlService.',
    code: `<style>
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=JetBrains+Mono:wght@400;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  body { font-family: 'Plus Jakarta Sans', sans-serif; }
  h1, h2, .font-serif { font-family: 'Fraunces', serif; }
  .font-mono, .tabular-nums { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; }
</style>`,
  },
  {
    filename: 'script.html',
    description: 'Client-Side JavaScript Bridge untuk google.script.run & Fetch API pada Google Apps Script.',
    code: `<script>
  const PortalAPI = {
    call: function(action, payload) {
      return new Promise(function(resolve, reject) {
        if (window.google && google.script && google.script.run) {
          google.script.run
            .withSuccessHandler(resolve)
            .withFailureHandler(reject)
            .doPost({ postData: { contents: JSON.stringify(Object.assign({ action: action }, payload)) } });
        } else {
          fetch('/api/' + action, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload || {})
          }).then(r => r.json()).then(resolve).catch(reject);
        }
      });
    }
  };
</script>`,
  },
];

export const INSTALLATION_GUIDE_STEPS = [
  {
    step: 1,
    title: 'Membuat Google Spreadsheet Database',
    detail: 'Buka Google Sheets (sheets.new), buat spreadsheet baru dengan nama "DATABASE PORTAL DESA". Salin ID Spreadsheet dari URL browser (kode panjang di antara /d/ dan /edit).',
  },
  {
    step: 2,
    title: 'Membuat Google Drive Penyimpanan',
    detail: 'Buka Google Drive (drive.google.com) menggunakan akun Google resmi Pemerintah Desa yang memiliki kapasitas penyimpanan mencukupi.',
  },
  {
    step: 3,
    title: 'Membuat Folder Utama "PORTAL DESA"',
    detail: 'Buat folder baru bernama "PORTAL DESA" di Google Drive. Salin Folder ID dari URL ketika folder tersebut dibuka. Sub-folder (BERITA, GALERI, BANNER, PROFIL, PEMERINTAHAN, PEMBANGUNAN, POTENSI, DOKUMEN) akan dibuat otomatis oleh script.',
  },
  {
    step: 4,
    title: 'Membuat Project Google Apps Script',
    detail: 'Pada Google Spreadsheet yang telah dibuat, klik menu Ekstensi (Extensions) → Apps Script. Beri nama project "Backend Portal Informasi Desa".',
  },
  {
    step: 5,
    title: 'Membuat Setiap File (.gs dan .html)',
    detail: 'Di panel kiri editor Apps Script, klik tanda (+) untuk menambahkan file Script (.gs): Config.gs, Code.gs, Auth.gs, Database.gs, Drive.gs, Utils.gs, serta file HTML: index.html, admin.html, login.html, style.css.html, dan script.html.',
  },
  {
    step: 6,
    title: 'Menempelkan Kode Lengkap',
    detail: 'Salin masing-masing kode dari menu "Kode Apps Script & Instalasi" di Dashboard Admin ini, lalu tempelkan (paste) ke dalam file yang sesuai di editor Google Apps Script.',
  },
  {
    step: 7,
    title: 'Mengatur Spreadsheet ID',
    detail: 'Buka file Config.gs, lalu ganti nilai SPREADSHEET_ID dengan ID Google Spreadsheet yang Anda salin pada Langkah 1.',
  },
  {
    step: 8,
    title: 'Mengatur Folder ID Google Drive',
    detail: 'Masih di file Config.gs, isi nilai ROOT_DRIVE_FOLDER_ID dengan ID Folder Google Drive dari Langkah 3 (atau biarkan kosong agar sistem membuat folder otomatis).',
  },
  {
    step: 9,
    title: 'Membuat Akun Admin Default',
    detail: 'Secara otomatis fungsi ensureDefaultAdmin() di Auth.gs akan membuat akun Super Admin pertama dengan username "admin" dan password "desa123" (tersimpan dalam bentuk hash SHA-256 di sheet ADMIN).',
  },
  {
    step: 10,
    title: 'Menjalankan Fungsi Setup (setupPortalDesa)',
    detail: 'Pilih file Code.gs di editor, pilih fungsi "setupPortalDesa" pada dropdown toolbar atas, lalu klik tombol "Jalankan" (Run). Fungsi ini otomatis membuat 12 Sheet beserta header dan 8 Sub-Folder Google Drive.',
  },
  {
    step: 11,
    title: 'Memberikan Izin Akses Google (Otorisasi)',
    detail: 'Saat muncul jendela "Otorisasi diperlukan", klik Tinjau Izin → Pilih akun Google Desa → Klik Lanjutan (Advanced) → Klik "Buka Backend Portal Informasi Desa" → Klik Izinkan (Allow).',
  },
  {
    step: 12,
    title: 'Deploy sebagai Web App',
    detail: 'Klik tombol biru "Terapkan" (Deploy) di kanan atas editor Apps Script → pilih "Deployment baru" (New deployment) → Pilih jenis "Aplikasi Web" (Web app).',
  },
  {
    step: 13,
    title: 'Pengaturan "Execute as" (Jalankan Sebagai)',
    detail: 'Pada kolom "Execute as" (Jalankan sebagai), pilih "Me" (Saya / Akun Pemilik Desa) agar pengunjung publik dapat membaca data tanpa harus login Google.',
  },
  {
    step: 14,
    title: 'Pengaturan Akses (Who has access)',
    detail: 'Pada kolom "Who has access" (Siapa saja yang memiliki akses), pilih "Anyone" (Siapa saja), lalu klik Deploy dan salin URL Web App yang dihasilkan.',
  },
  {
    step: 15,
    title: 'Cara Membuka Website Publik',
    detail: 'Buka URL Web App hasil deploy untuk mengakses halaman publik, atau tempelkan URL Web App tersebut pada menu Pengaturan di aplikasi ini untuk sinkronisasi cloud langsung.',
  },
  {
    step: 16,
    title: 'Cara Membuka Dashboard Admin',
    detail: 'Tambahkan parameter ?page=admin pada URL Web App Anda, atau klik tombol "Dashboard Admin" di pojok kanan atas portal, lalu login menggunakan akun admin Anda.',
  },
];
