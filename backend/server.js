const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;
const MODE = process.env.MODE || 'vulnerable';
const IS_PATCHED = MODE === 'patched';

app.use(cors());
app.use(express.json());


const fs = require('fs');
const path = require('path');

// File-backed local DB (JSON). Saves all stateful actions so changes persist across restarts.
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'profiles.json');

const initialProfiles = [
  {
    id: '17654',
    employeeId: 'AJ1001',
    uuid: 'a1b2c3d4-e5f6-4789-a1b2-c3d4e5f67890',
    ownerId: '1',
    firstName: 'Alice',
    lastName: 'Johnson',
    status: 'Onboarded',
    publicFields: { title: 'Manager', department: 'HR' },
    sensitive: { ssn: '123-45-6789', email: 'alice@example.com', phone: '555-0101' },
    admin: { internalNotes: 'Excellent performer', approved: true, approvedBy: 'System', approvedAt: '2024-01-15' }
  },
  {
    id: '17655',
    employeeId: 'BM1002',
    uuid: 'b2c3d4e5-f6a7-4890-b2c3-d4e5f6a78901',
    ownerId: '2',
    firstName: 'Bob',
    lastName: 'Miller',
    status: 'Onboarded',
    publicFields: { title: 'Developer', department: 'Engineering' },
    sensitive: { ssn: '234-56-7890', email: 'bob@example.com', phone: '555-0102' },
    admin: { internalNotes: 'Good team player', approved: true, approvedBy: 'Alice Johnson', approvedAt: '2024-02-10' }
  },
  {
    id: '17656',
    employeeId: 'CD1003',
    uuid: 'c3d4e5f6-a7b8-4901-c3d4-e5f6a7b89012',
    ownerId: '3',
    firstName: 'Carol',
    lastName: 'Davis',
    status: 'In Progress',
    publicFields: { title: 'Designer', department: 'Marketing' },
    sensitive: { ssn: '345-67-8901', email: 'carol@example.com', phone: '555-0103' },
    admin: { internalNotes: 'Pending background check', approved: false, approvedBy: null, approvedAt: null }
  },
  {
    id: '17657',
    employeeId: 'DE1004',
    uuid: 'd4e5f6a7-b8c9-4012-d4e5-f6a7b8c90123',
    ownerId: '4',
    firstName: 'David',
    lastName: 'Evans',
    status: 'Offboarded',
    publicFields: { title: 'Sales Rep', department: 'Sales' },
    sensitive: { ssn: '456-78-9012', email: 'david@example.com', phone: '555-0104' },
    admin: { internalNotes: 'Resigned - Good standing', approved: true, approvedBy: 'Alice Johnson', approvedAt: '2023-12-20' }
  },
  {
    id: '17658',
    employeeId: 'EW1005',
    uuid: 'e5f6a7b8-c9d0-4123-e5f6-a7b8c9d01234',
    ownerId: '5',
    firstName: 'Eve',
    lastName: 'Wilson',
    status: 'In Progress',
    publicFields: { title: 'Analyst', department: 'Finance' },
    sensitive: { ssn: '567-89-0123', email: 'eve@example.com', phone: '555-0105' },
    admin: { internalNotes: 'Awaiting equipment setup', approved: false, approvedBy: null, approvedAt: null }
  },
  {
    id: '17659',
    employeeId: 'FT1006',
    uuid: 'f6a7b8c9-d0e1-4234-f6a7-b8c9d0e12345',
    ownerId: '6',
    firstName: 'Frank',
    lastName: 'Taylor',
    status: 'Onboarded',
    publicFields: { title: 'Product Manager', department: 'Product' },
    sensitive: { ssn: '678-90-1234', email: 'frank@example.com', phone: '555-0106' },
    admin: { internalNotes: 'High performer, fast onboarding', approved: true, approvedBy: 'Alice Johnson', approvedAt: '2024-03-05' }
  },
  {
    id: '17660',
    employeeId: 'GA1007',
    uuid: 'a7b8c9d0-e1f2-4345-a7b8-c9d0e1f23456',
    ownerId: '7',
    firstName: 'Grace',
    lastName: 'Anderson',
    status: 'Offboarded',
    publicFields: { title: 'QA Engineer', department: 'Quality' },
    sensitive: { ssn: '789-01-2345', email: 'grace@example.com', phone: '555-0107' },
    admin: { internalNotes: 'Contract ended', approved: true, approvedBy: 'Alice Johnson', approvedAt: '2023-11-30' }
  }
];

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

// Get full profile (vulnerable vs patched)
app.get('/profiles/:id/full', (req, res) => {
  const profile = findById(req.params.id);
  if (!profile) return res.status(404).json({ error: 'Not found' });
  
  if (IS_PATCHED) {
    const requester = parseRequester(req.headers['x-user']);
    if (!requester) {
      // Log denied access due to missing auth
      db.logAction({ eventType: 'view_full_denied', actorId: null, actorRole: null, targetProfileId: profile.id, details: { reason: 'unauthorized' } }).catch(() => {});
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Check if requester is admin or owner
    const isOwner = String(profile.ownerId) === String(requester.id);
    const isAdmin = requester.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      // Log denied access due to insufficient permissions
      db.logAction({ eventType: 'view_full_denied', actorId: requester.id, actorRole: requester.role, targetProfileId: profile.id, details: { reason: 'forbidden' } }).catch(() => {});
      return res.status(403).json({ error: 'Forbidden: You can only access your own data' });
    }
  }
  // Log successful full-view
  const possibleRequester = parseRequester(req.headers['x-user']);
  db.logAction({ eventType: 'view_full', actorId: possibleRequester ? possibleRequester.id : null, actorRole: possibleRequester ? possibleRequester.role : null, targetProfileId: profile.id, details: { mode: MODE } }).catch(() => {});

  // Vulnerable: returns all data regardless of auth
  // Patched: only returns if authorized
  res.json(profile);
});

// Approve profile (vulnerable vs patched)
app.patch('/profiles/:id/approve', (req, res) => {
  const profile = findById(req.params.id);
  if (!profile) return res.status(404).json({ error: 'Not found' });
  
  if (IS_PATCHED) {
    const requester = parseRequester(req.headers['x-user']);
    if (!requester) {
      db.logAction({ eventType: 'approve_denied', actorId: null, actorRole: null, targetProfileId: profile.id, details: { reason: 'unauthorized' } }).catch(() => {});
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (requester.role !== 'admin') {
      db.logAction({ eventType: 'approve_denied', actorId: requester.id, actorRole: requester.role, targetProfileId: profile.id, details: { reason: 'forbidden' } }).catch(() => {});
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
  }
  
  // Vulnerable: anyone can approve
  // Patched: only admin can approve
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

// Reject profile
app.patch('/profiles/:id/reject', (req, res) => {
  const profile = findById(req.params.id);
  if (!profile) return res.status(404).json({ error: 'Not found' });
  
  if (IS_PATCHED) {
    const requester = parseRequester(req.headers['x-user']);
    if (!requester) {
      db.logAction({ eventType: 'reject_denied', actorId: null, actorRole: null, targetProfileId: profile.id, details: { reason: 'unauthorized' } }).catch(() => {});
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (requester.role !== 'admin') {
      db.logAction({ eventType: 'reject_denied', actorId: requester.id, actorRole: requester.role, targetProfileId: profile.id, details: { reason: 'forbidden' } }).catch(() => {});
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
  }
  
  const prevStatus = profile.status;
  profile.status = 'Rejected';
  profile.admin.approved = false;
  saveProfiles();

  const possibleRequester = parseRequester(req.headers['x-user']);
  db.logAction({ eventType: 'reject', actorId: possibleRequester ? possibleRequester.id : null, actorRole: possibleRequester ? possibleRequester.role : null, targetProfileId: profile.id, details: { prevStatus } }).catch(() => {});

  res.json({ success: true, profile });
});

// Offboard profile
app.patch('/profiles/:id/offboard', (req, res) => {
  const profile = findById(req.params.id);
  if (!profile) return res.status(404).json({ error: 'Not found' });
  
  if (IS_PATCHED) {
    const requester = parseRequester(req.headers['x-user']);
    if (!requester) {
      db.logAction({ eventType: 'offboard_denied', actorId: null, actorRole: null, targetProfileId: profile.id, details: { reason: 'unauthorized' } }).catch(() => {});
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (requester.role !== 'admin') {
      db.logAction({ eventType: 'offboard_denied', actorId: requester.id, actorRole: requester.role, targetProfileId: profile.id, details: { reason: 'forbidden' } }).catch(() => {});
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
  }
  
  const prevStatus = profile.status;
  profile.status = 'Offboarded';
  saveProfiles();

  const possibleRequester = parseRequester(req.headers['x-user']);
  db.logAction({ eventType: 'offboard', actorId: possibleRequester ? possibleRequester.id : null, actorRole: possibleRequester ? possibleRequester.role : null, targetProfileId: profile.id, details: { prevStatus } }).catch(() => {});

  res.json({ success: true, profile });
});

app.listen(PORT, () => {
  console.log(`\nSecureOnboard Backend running on port ${PORT}`);
  console.log(`Mode: ${MODE.toUpperCase()}`);
  console.log(`Access: http://localhost:${PORT}\n`);
});
