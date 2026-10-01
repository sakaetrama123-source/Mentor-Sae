import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { INITIAL_DESA_DATABASE } from './src/data/initialData';
import { PortalDesaDatabase } from './src/types/desa';

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'portal_desa_db.json');
const CREDENTIALS_FILE = path.join(DATA_DIR, 'admin_credentials.json');

interface StoredCredential {
  id: string;
  username: string;
  passwordHash: string;
  namaLengkap: string;
  jabatan: string;
  role: 'Super Admin' | 'Redaktur' | 'Operator';
  terakhirLogin: string;
}

const activeTokens = new Map<string, { username: string; role: string; expiresAt: number }>();

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadDatabase(): PortalDesaDatabase {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    const initial = JSON.parse(JSON.stringify(INITIAL_DESA_DATABASE)) as PortalDesaDatabase;
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw) as PortalDesaDatabase;
  } catch {
    const initial = JSON.parse(JSON.stringify(INITIAL_DESA_DATABASE)) as PortalDesaDatabase;
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
}

function saveDatabase(db: PortalDesaDatabase): PortalDesaDatabase {
  ensureDataDir();
  db.lastUpdated = new Date().toISOString();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  return db;
}

function loadCredentials(): StoredCredential[] {
  ensureDataDir();
  if (!fs.existsSync(CREDENTIALS_FILE)) {
    const defaults: StoredCredential[] = [
      {
        id: 'ADM-001',
        username: 'admin',
        passwordHash: hashPassword('desa123'),
        namaLengkap: 'Dedi Kurniawan, S.Kom.',
        jabatan: 'Operator Utama SID / Kaur Perencanaan',
        role: 'Super Admin',
        terakhirLogin: '2026-10-01 08:00 WIB',
      },
      {
        id: 'ADM-002',
        username: 'sekdes',
        passwordHash: hashPassword('sekdes123'),
        namaLengkap: 'Asep Saepuloh, S.AP.',
        jabatan: 'Sekretaris Desa Sukamaju',
        role: 'Super Admin',
        terakhirLogin: '2026-09-30 14:20 WIB',
      },
      {
        id: 'ADM-003',
        username: 'redaksi',
        passwordHash: hashPassword('redaksi123'),
        namaLengkap: 'Tim Redaksi Kim Desa',
        jabatan: 'Pengelola Berita & Galeri Desa',
        role: 'Redaktur',
        terakhirLogin: '2026-09-29 10:15 WIB',
      },
    ];
    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(defaults, null, 2), 'utf-8');
    return defaults;
  }
  try {
    return JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8')) as StoredCredential[];
  } catch {
    return [];
  }
}

function saveCredentials(creds: StoredCredential[]) {
  ensureDataDir();
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(creds, null, 2), 'utf-8');
}

function verifyToken(req: express.Request): boolean {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return false;
  const session = activeTokens.get(token);
  if (!session) return false;
  if (Date.now() > session.expiresAt) {
    activeTokens.delete(token);
    return false;
  }
  return true;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  // Initialize DB & Credentials on boot
  loadDatabase();
  loadCredentials();

  // Public Endpoint: Get all database state
  app.get('/api/desa', (_req, res) => {
    const db = loadDatabase();
    res.json({ status: 'success', data: db });
  });

  // Public Endpoint: Increment News View Counter
  app.post('/api/berita/:id/view', (req, res) => {
    const db = loadDatabase();
    const item = db.berita.find((b) => b.id === req.params.id);
    if (item) {
      item.views = (item.views || 0) + 1;
      saveDatabase(db);
    }
    res.json({ status: 'success', views: item ? item.views : 0 });
  });

  // Public Endpoint: Increment Document Download Counter
  app.post('/api/dokumen/:id/download', (req, res) => {
    const db = loadDatabase();
    const doc = db.dokumen.find((d) => d.id === req.params.id);
    if (doc) {
      doc.unduhan = (doc.unduhan || 0) + 1;
      saveDatabase(db);
    }
    res.json({ status: 'success', unduhan: doc ? doc.unduhan : 0 });
  });

  // Auth Endpoint: Login
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
      res.status(400).json({ status: 'error', message: 'Username dan password wajib diisi.' });
      return;
    }

    const creds = loadCredentials();
    const cleanUser = String(username).trim().toLowerCase();
    const passHash = hashPassword(String(password));

    const matched = creds.find((c) => c.username.toLowerCase() === cleanUser && c.passwordHash === passHash);
    if (!matched) {
      res.status(401).json({ status: 'error', message: 'Username atau password tidak sesuai.' });
      return;
    }

    const token = crypto.randomUUID();
    activeTokens.set(token, {
      username: matched.username,
      role: matched.role,
      expiresAt: Date.now() + 12 * 60 * 60 * 1000,
    });

    const nowFormatted = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB';
    matched.terakhirLogin = nowFormatted;
    saveCredentials(creds);

    // Sync public admin list
    const db = loadDatabase();
    db.adminUsers = creds.map(({ passwordHash: _ph, ...rest }) => rest);
    saveDatabase(db);

    res.json({
      status: 'success',
      token,
      user: {
        id: matched.id,
        username: matched.username,
        namaLengkap: matched.namaLengkap,
        jabatan: matched.jabatan,
        role: matched.role,
        terakhirLogin: matched.terakhirLogin,
      },
    });
  });

  // Auth Endpoint: Logout
  app.post('/api/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (token) activeTokens.delete(token);
    res.json({ status: 'success' });
  });

  // Protected Admin Endpoint: Update full or partial database section
  app.post('/api/admin/update', (req, res) => {
    if (!verifyToken(req)) {
      res.status(401).json({ status: 'error', message: 'Sesi admin tidak valid. Silakan login kembali.' });
      return;
    }

    const { section, data } = req.body || {};
    const db = loadDatabase();

    const allowedSections: (keyof PortalDesaDatabase)[] = [
      'settings',
      'profil',
      'dataDesa',
      'pemerintahan',
      'berita',
      'agenda',
      'galeri',
      'potensi',
      'pembangunan',
      'transparansi',
      'dokumen',
      'media',
    ];

    if (!allowedSections.includes(section)) {
      res.status(400).json({ status: 'error', message: 'Bagian database tidak dikenali.' });
      return;
    }

    (db as Record<string, unknown>)[section] = data;
    const updated = saveDatabase(db);
    res.json({ status: 'success', data: updated });
  });

  // Protected Admin Endpoint: Manage Admin Accounts
  app.post('/api/admin/users', (req, res) => {
    if (!verifyToken(req)) {
      res.status(401).json({ status: 'error', message: 'Akses ditolak.' });
      return;
    }

    const { action, user } = req.body || {};
    let creds = loadCredentials();

    if (action === 'save') {
      const existingIdx = creds.findIndex((c) => c.id === user.id);
      if (existingIdx >= 0) {
        creds[existingIdx] = {
          ...creds[existingIdx],
          username: user.username,
          namaLengkap: user.namaLengkap,
          jabatan: user.jabatan,
          role: user.role,
          passwordHash: user.newPassword ? hashPassword(user.newPassword) : creds[existingIdx].passwordHash,
        };
      } else {
        creds.push({
          id: 'ADM-' + Date.now().toString().slice(-4),
          username: user.username,
          passwordHash: hashPassword(user.newPassword || 'desa123'),
          namaLengkap: user.namaLengkap,
          jabatan: user.jabatan,
          role: user.role || 'Operator',
          terakhirLogin: 'Belum pernah login',
        });
      }
    } else if (action === 'delete') {
      if (creds.length <= 1) {
        res.status(400).json({ status: 'error', message: 'Tidak dapat menghapus satu-satunya akun admin.' });
        return;
      }
      creds = creds.filter((c) => c.id !== user.id);
    }

    saveCredentials(creds);
    const db = loadDatabase();
    db.adminUsers = creds.map(({ passwordHash: _ph, ...rest }) => rest);
    const updated = saveDatabase(db);

    res.json({ status: 'success', data: updated });
  });

  // Protected Admin Endpoint: Clear All Demo Data
  app.post('/api/admin/clear-demo', (req, res) => {
    if (!verifyToken(req)) {
      res.status(401).json({ status: 'error', message: 'Akses ditolak.' });
      return;
    }

    const db = loadDatabase();
    db.berita = db.berita.filter((i) => !i.isDemo);
    db.galeri = db.galeri.filter((i) => !i.isDemo);
    db.agenda = db.agenda.filter((i) => !i.isDemo);
    db.potensi = db.potensi.filter((i) => !i.isDemo);
    db.pembangunan = db.pembangunan.filter((i) => !i.isDemo);
    db.transparansi = db.transparansi.filter((i) => !i.isDemo);
    db.dokumen = db.dokumen.filter((i) => !i.isDemo);
    db.media = db.media.filter((i) => !i.isDemo);

    const updated = saveDatabase(db);
    res.json({ status: 'success', data: updated });
  });

  // Protected Admin Endpoint: Restore Initial Demo Data
  app.post('/api/admin/reset-demo', (req, res) => {
    if (!verifyToken(req)) {
      res.status(401).json({ status: 'error', message: 'Akses ditolak.' });
      return;
    }

    const fresh = JSON.parse(JSON.stringify(INITIAL_DESA_DATABASE)) as PortalDesaDatabase;
    const creds = loadCredentials();
    fresh.adminUsers = creds.map(({ passwordHash: _ph, ...rest }) => rest);
    const updated = saveDatabase(fresh);
    res.json({ status: 'success', data: updated });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Portal Informasi Desa server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
