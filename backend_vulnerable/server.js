const express = require('express');
const cors = require('cors');
const app = express();
// Explicit vulnerable server
const PORT = process.env.PORT || 4000;
const MODE = 'vulnerable';
const IS_PATCHED = false;

app.use(cors());
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
  const requester = parseRequester(req.headers['x-user']);
  // Log the list access (actor may be null for unauthenticated requests)
  db.logAction({
    actorId: requester ? requester.id : null,
    actorRole: requester ? requester.role : null,
    targetProfileId: null,
    eventType: 'list_profiles',
    details: { count: list.length, mode: MODE }
  }).catch(() => {});

  res.json(list);
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

// Get full profile (vulnerable - returns everything, no auth checks)
app.get('/profiles/:id/full', (req, res) => {
  const profile = findById(req.params.id);
  if (!profile) return res.status(404).json({ error: 'Not found' });

  // Vulnerable: returns all data regardless of auth
  const possibleRequester = parseRequester(req.headers['x-user']);
  db.logAction({ eventType: 'view_full', actorId: possibleRequester ? possibleRequester.id : null, actorRole: possibleRequester ? possibleRequester.role : null, targetProfileId: profile.id, details: { mode: MODE } }).catch(() => {});

  res.json(profile);
});

// Approve profile (vulnerable - anyone can approve)
app.patch('/profiles/:id/approve', (req, res) => {
  const profile = findById(req.params.id);
  if (!profile) return res.status(404).json({ error: 'Not found' });

  // Vulnerable: anyone can approve
  const prevStatus = profile.status;
  profile.admin.approved = true;
  profile.admin.approvedBy = 'System';
  profile.admin.approvedAt = new Date().toISOString().split('T')[0];
  profile.status = 'Onboarded';
  saveProfiles();

  // Log approval
  const possibleRequester = parseRequester(req.headers['x-user']);
  db.logAction({ eventType: 'approve', actorId: possibleRequester ? possibleRequester.id : null, actorRole: possibleRequester ? possibleRequester.role : null, targetProfileId: profile.id, details: { prevStatus } }).catch(() => {});

  res.json({ success: true, profile });
});

// Reject profile (vulnerable)
app.patch('/profiles/:id/reject', (req, res) => {
  const profile = findById(req.params.id);
  if (!profile) return res.status(404).json({ error: 'Not found' });

  const prevStatus = profile.status;
  profile.status = 'Rejected';
  profile.admin.approved = false;
  saveProfiles();

  const possibleRequester = parseRequester(req.headers['x-user']);
  db.logAction({ eventType: 'reject', actorId: possibleRequester ? possibleRequester.id : null, actorRole: possibleRequester ? possibleRequester.role : null, targetProfileId: profile.id, details: { prevStatus } }).catch(() => {});

  res.json({ success: true, profile });
});

// Offboard profile (vulnerable)
app.patch('/profiles/:id/offboard', (req, res) => {
  const profile = findById(req.params.id);
  if (!profile) return res.status(404).json({ error: 'Not found' });

  const prevStatus = profile.status;
  profile.status = 'Offboarded';
  saveProfiles();

  const possibleRequester = parseRequester(req.headers['x-user']);
  db.logAction({ eventType: 'offboard', actorId: possibleRequester ? possibleRequester.id : null, actorRole: possibleRequester ? possibleRequester.role : null, targetProfileId: profile.id, details: { prevStatus } }).catch(() => {});

  res.json({ success: true, profile });
});

// Re-onboard profile (vulnerable)
app.patch('/profiles/:id/onboard', (req, res) => {
  const profile = findById(req.params.id);
  if (!profile) return res.status(404).json({ error: 'Not found' });

  const prevStatus = profile.status;
  profile.status = 'Onboarded';
  if (profile.admin) {
    profile.admin.approved = true;
    profile.admin.approvedBy = 'System';
    profile.admin.approvedAt = new Date().toISOString().split('T')[0];
  }
  saveProfiles();

  const possibleRequester = parseRequester(req.headers['x-user']);
  db.logAction({ eventType: 'onboard', actorId: possibleRequester ? possibleRequester.id : null, actorRole: possibleRequester ? possibleRequester.role : null, targetProfileId: profile.id, details: { prevStatus } }).catch(() => {});

  res.json({ success: true, profile });
});

app.listen(PORT, () => {
  console.log(`\nSecureOnboard VULNERABLE Backend running on port ${PORT}`);
  console.log(`Mode: ${MODE.toUpperCase()}`);
  console.log(`Access: http://localhost:${PORT}\n`);
});
