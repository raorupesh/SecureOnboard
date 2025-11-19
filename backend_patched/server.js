const express = require('express');
const cors = require('cors');

const app = express();
// Explicit patched server
// Default to 4001 to avoid colliding with vulnerable backend on 4000
const PORT = process.env.PORT || 4001;
const MODE = 'patched';
const IS_PATCHED = true;

// Restrict CORS to known frontend origins for browsers (support both demo frontends)
const FRONTEND_ORIGINS = (process.env.FRONTEND_ORIGINS || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map(s => s.trim());
app.use(cors({
  origin: (origin, callback) => {
    // Allow no-origin requests (e.g., curl/Postman) to reach our own trust checks
    if (!origin) return callback(null, true);
    if (FRONTEND_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true
}));
app.use(express.json());


const fs = require('fs');
const path = require('path');

// File-backed local DB (JSON). Saves all stateful actions so changes persist across restarts.
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'profiles.json');

const initialProfiles = require('./data/profiles.json');

// Ensure data directory exists and load profiles from disk (persist changes)
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadProfiles() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load profiles.json, using initial data', e);
  }
  // write initial data
  fs.writeFileSync(DATA_FILE, JSON.stringify(initialProfiles, null, 2));
  return JSON.parse(JSON.stringify(initialProfiles));
}

function saveProfiles() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(profiles, null, 2));
  } catch (e) {
    console.error('Failed to save profiles.json', e);
  }
}

let profiles = loadProfiles();

function findById(idOrUuid) {
  return profiles.find(p => p.id === idOrUuid || p.uuid === idOrUuid);
}

function parseRequester(headerValue) {
  if (!headerValue) return null;
  const [id, role] = String(headerValue).split(':');
  return { id, role };
}

function isTrustedClient(req, requester) {
  // Admins are trusted regardless (allows admin Postman for demos)
  if (requester && requester.role === 'admin') return true;
  const origin = req.headers['origin'];
  const referer = req.headers['referer'] || '';
  const originOk = origin && FRONTEND_ORIGINS.includes(origin);
  const refererOk = FRONTEND_ORIGINS.some(o => referer.startsWith(o));
  return originOk || refererOk;
}

function requireAuth(req, res, next) {
  const requester = parseRequester(req.headers['x-user']);
  if (!requester) return res.status(401).json({ error: 'Unauthorized' });
  req.requester = requester;
  next();
}

function requireAdmin(req, res, next) {
  const requester = req.requester || parseRequester(req.headers['x-user']);
  if (!requester) return res.status(401).json({ error: 'Unauthorized' });
  if (requester.role !== 'admin') return res.status(403).json({ error: 'Forbidden: Admin access required' });
  req.requester = requester;
  next();
}

function requireTrustedClient(req, res, next) {
  const requester = req.requester || parseRequester(req.headers['x-user']);
  if (!isTrustedClient(req, requester)) return res.status(403).json({ error: 'Forbidden: Untrusted client' });
  next();
}

// Audit DB (sqlite) - logs actions for later inspection
const db = require('./db');

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, mode: MODE });
});

// Mode info
app.get('/mode', (req, res) => {
  res.json({ mode: MODE, patched: IS_PATCHED });
});

// Get all profiles (basic info only)
app.get('/profiles', (req, res) => {
  // Allow public listing of non-sensitive profile fields only from trusted client (browser frontend)
  const requester = parseRequester(req.headers['x-user']);
  if (!isTrustedClient(req, requester)) {
    const origin = req.headers['origin'] || null;
    db.logAction({ actorId: requester ? requester.id : null, actorRole: requester ? requester.role : null, targetProfileId: null, eventType: 'list_profiles_denied', details: { reason: 'untrusted_client', origin } }).catch(() => {});
    return res.status(403).json({ error: 'Forbidden: Untrusted client' });
  }

  const list = profiles.map(p => ({
    id: p.id,
    employeeId: p.employeeId,
    uuid: p.uuid,
    ownerId: p.ownerId,
    firstName: p.firstName,
    lastName: p.lastName,
    status: p.status,
    publicFields: p.publicFields
  }));

  db.logAction({ actorId: requester ? requester.id : null, actorRole: requester ? requester.role : null, targetProfileId: null, eventType: 'list_profiles', details: { count: list.length, mode: MODE } }).catch(() => {});
  return res.json(list);
});

// Get own profile (full) - convenient endpoint for My Dashboard
app.get('/profiles/self', requireAuth, requireTrustedClient, (req, res) => {
  const requester = req.requester;
  const profile = profiles.find(p => String(p.ownerId) === String(requester.id));
  if (!profile) return res.status(404).json({ error: 'Not found' });
  db.logAction({ eventType: 'view_self', actorId: requester.id, actorRole: requester.role, targetProfileId: profile.id, details: { mode: MODE } }).catch(() => {});
  res.json(profile);
});

// Get single profile (public fields only)
app.get('/profiles/:id', (req, res) => {
  const profile = findById(req.params.id);
  if (!profile) return res.status(404).json({ error: 'Not found' });
  const requester = parseRequester(req.headers['x-user']);

  // Log public profile read
  db.logAction({
    actorId: requester ? requester.id : null,
    actorRole: requester ? requester.role : null,
    targetProfileId: profile.id,
    eventType: 'get_profile',
    details: { mode: MODE }
  }).catch(() => {});

  res.json({
    id: profile.id,
    employeeId: profile.employeeId,
    uuid: profile.uuid,
    ownerId: profile.ownerId,
    firstName: profile.firstName,
    lastName: profile.lastName,
    status: profile.status,
    publicFields: profile.publicFields
  });
});

// Get full profile (patched: enforces owner or admin)
app.get('/profiles/:id/full', (req, res) => {
  const profile = findById(req.params.id);
  if (!profile) return res.status(404).json({ error: 'Not found' });
  
  const requester = parseRequester(req.headers['x-user']);
  if (!requester) {
    // Log denied access due to missing auth
    db.logAction({ eventType: 'view_full_denied', actorId: null, actorRole: null, targetProfileId: profile.id, details: { reason: 'unauthorized' } }).catch(() => {});
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!isTrustedClient(req, requester)) {
    db.logAction({ eventType: 'view_full_denied', actorId: requester.id, actorRole: requester.role, targetProfileId: profile.id, details: { reason: 'untrusted_client' } }).catch(() => {});
    return res.status(403).json({ error: 'Forbidden: Untrusted client' });
  }
  
  // Check if requester is admin or owner
  const isOwner = String(profile.ownerId) === String(requester.id);
  const isAdmin = requester.role === 'admin';
  
  if (!isOwner && !isAdmin) {
    // Log denied access due to insufficient permissions
    db.logAction({ eventType: 'view_full_denied', actorId: requester.id, actorRole: requester.role, targetProfileId: profile.id, details: { reason: 'forbidden' } }).catch(() => {});
    return res.status(403).json({ error: 'Forbidden: You can only access your own data' });
  }

  // Log successful full-view
  db.logAction({ eventType: 'view_full', actorId: requester.id, actorRole: requester.role, targetProfileId: profile.id, details: { mode: MODE } }).catch(() => {});

  res.json(profile);
});

// Approve profile (patched: admin only)
app.patch('/profiles/:id/approve', requireAuth, requireTrustedClient, requireAdmin, (req, res) => {
  const profile = findById(req.params.id);
  if (!profile) return res.status(404).json({ error: 'Not found' });
  const requester = req.requester;
  
  const prevStatus = profile.status;
  profile.admin.approved = true;
  profile.admin.approvedBy = 'System';
  profile.admin.approvedAt = new Date().toISOString().split('T')[0];
  profile.status = 'Onboarded';
  saveProfiles();

  // Log approval
  db.logAction({ eventType: 'approve', actorId: requester.id, actorRole: requester.role, targetProfileId: profile.id, details: { prevStatus } }).catch(() => {});

  res.json({ success: true, profile });
});

// Reject profile (patched: admin only)
app.patch('/profiles/:id/reject', requireAuth, requireTrustedClient, requireAdmin, (req, res) => {
  const profile = findById(req.params.id);
  if (!profile) return res.status(404).json({ error: 'Not found' });
  const requester = req.requester;
  
  const prevStatus = profile.status;
  profile.status = 'Rejected';
  profile.admin.approved = false;
  saveProfiles();

  db.logAction({ eventType: 'reject', actorId: requester.id, actorRole: requester.role, targetProfileId: profile.id, details: { prevStatus } }).catch(() => {});

  res.json({ success: true, profile });
});

// Offboard profile (patched: admin only)
app.patch('/profiles/:id/offboard', requireAuth, requireTrustedClient, requireAdmin, (req, res) => {
  const profile = findById(req.params.id);
  if (!profile) return res.status(404).json({ error: 'Not found' });
  const requester = req.requester;
  
  const prevStatus = profile.status;
  profile.status = 'Offboarded';
  saveProfiles();

  db.logAction({ eventType: 'offboard', actorId: requester.id, actorRole: requester.role, targetProfileId: profile.id, details: { prevStatus } }).catch(() => {});

  res.json({ success: true, profile });
});

// Re-onboard profile (patched: admin only)
app.patch('/profiles/:id/onboard', requireAuth, requireTrustedClient, requireAdmin, (req, res) => {
  const profile = findById(req.params.id);
  if (!profile) return res.status(404).json({ error: 'Not found' });
  const requester = req.requester;

  const prevStatus = profile.status;
  profile.status = 'Onboarded';
  if (profile.admin) {
    profile.admin.approved = true;
    profile.admin.approvedBy = 'System';
    profile.admin.approvedAt = new Date().toISOString().split('T')[0];
  }
  saveProfiles();

  db.logAction({ eventType: 'onboard', actorId: requester.id, actorRole: requester.role, targetProfileId: profile.id, details: { prevStatus } }).catch(() => {});

  res.json({ success: true, profile });
});

app.listen(PORT, () => {
  console.log(`\nSecureOnboard PATCHED Backend running on port ${PORT}`);
  console.log(`Mode: ${MODE.toUpperCase()}`);
  console.log(`Access: http://localhost:${PORT}\n`);
});
