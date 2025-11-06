# SecureOnboard Demo

**Demonstrating Broken Access Control in Web APIs (Exploit → Impact → Fix)**

This is a hands-on demonstration of Broken Access Control (IDOR - Insecure Direct Object Reference) vulnerabilities in web APIs, mapping to **OWASP Top 10 2021: A01 - Broken Access Control**.

## Overview

SecureOnboard is an intentionally vulnerable onboarding application that demonstrates:
- **Three classes of data**: Public (profile display), Sensitive (PII: SSN, email, phone), Admin (internal notes, approval controls)
- **Vulnerable backend**: Allows unauthorized access to other users' data and privileged actions
- **Patched backend**: Enforces proper authentication, object-level authorization, and role-based access control

## Architecture

```
├── backend/          # Express.js API (vulnerable & patched modes)
│   ├── server.js     # Main server with MODE=vulnerable/patched
│   └── package.json
│
└── frontend/         # React + Vite dashboard
    ├── src/
    │   ├── pages/         # Separate pages for each dashboard
    │   │   ├── Login.jsx
    │   │   ├── OnboardedPage.jsx
    │   │   ├── OffboardedPage.jsx
    │   │   ├── InProgressPage.jsx
    │   │   ├── MyDashboardPage.jsx
    │   │   └── ExportPage.jsx
    │   ├── components/    # Reusable UI components
    │   │   ├── Topbar.jsx
    │   │   └── StatusBadge.jsx
    │   └── lib/
    │       └── api.js     # API configuration
    └── package.json
```

## Demo Users

### Alice (Manager)
- **Username**: `alice`
- **Password**: `Manager@123`
- **User ID**: 17654
- **Employee ID**: AJ1001
- **Privileges**: Full access to all dashboards (Onboarded, Offboarded, In Progress, My Dashboard, Export)
- **Actions**: Can approve onboarding, offboard employees, view all sensitive data

### Bob (User)
- **Username**: `bob`
- **Password**: `User@123`
- **User ID**: 17655
- **Employee ID**: BM1002
- **Privileges**: Limited access to "My Dashboard" only
- **Actions**: Can only view his own profile data

## Quick Start

### 1. Install Dependencies

```powershell
# Backend
cd backend
npm install

# Frontend (new terminal)
cd frontend
npm install
```

### 2. Start Backend (Vulnerable Mode)

```powershell
cd backend
npm start
```

Server runs on `http://localhost:4000`

### 3. Start Frontend

```powershell
cd frontend
npm run dev
```

Frontend runs on `http://localhost:5173`

## Demo Script: Exploit → Impact → Fix

### Part 1: Vulnerable Mode Demonstration

#### Step 1: Login as Bob (Regular User)
1. Navigate to `http://localhost:5173`
2. Login with: `bob` / `User@123`
3. Note: Bob only sees "My Dashboard" tab

#### Step 2: Demonstrate IDOR Vulnerability
1. Open Browser DevTools → Network tab
2. Click "View Full" on Bob's profile
3. Observe the API call: `GET /profiles/17655/full`
4. **Tamper the ID**: In DevTools Console, execute:
   ```javascript
   fetch('http://localhost:4000/profiles/17654/full')
     .then(r => r.json())
     .then(console.log)
   ```
5. **Impact**: Bob can access Alice's sensitive data (SSN, email, phone) and admin notes!

#### Step 3: Demonstrate Privilege Escalation
1. In DevTools Console, attempt to approve an onboarding:
   ```javascript
   fetch('http://localhost:4000/profiles/17656/approve', {
     method: 'PATCH',
     headers: { 'x-user': '2:user' }
   }).then(r => r.json()).then(console.log)
   ```
2. **Impact**: Bob (non-admin) can approve onboarding requests meant only for managers!

#### Step 4: Show Multiple IDOR Vectors
- Change IDs in URL: `17654`, `17655`, `17656`, etc.
- Access admin-only endpoints without authorization
- Demonstrate how easy it is to enumerate all user data

### Part 2: Patched Mode Demonstration

#### Step 1: Start Patched Backend
```powershell
# Stop the vulnerable server (Ctrl+C)
# Start patched mode
$env:MODE="patched"; npm start
```

#### Step 2: Retry the Same Attacks
1. Login as Bob again
2. Try to access Alice's data:
   ```javascript
   fetch('http://localhost:4000/profiles/17654/full', {
     headers: { 'x-user': '2:user' }
   }).then(r => r.json()).then(console.log)
   ```
3. **Result**: `403 Forbidden: You can only access your own data`

#### Step 3: Try Privilege Escalation
1. Attempt to approve as Bob:
   ```javascript
   fetch('http://localhost:4000/profiles/17656/approve', {
     method: 'PATCH',
     headers: { 'x-user': '2:user' }
   }).then(r => r.json()).then(console.log)
   ```
2. **Result**: `403 Forbidden: Admin access required`

#### Step 4: Login as Alice (Manager)
1. Logout and login with: `alice` / `Manager@123`
2. Alice sees all tabs: Onboarded, Offboarded, In Progress, My Dashboard, Export
3. Alice can successfully:
   - View any employee's full data (authorized)
   - Approve onboarding requests
   - Offboard employees
   - Export data

## Security Controls in Patched Mode

### 1. **Authentication**
- `x-user` header required for sensitive endpoints
- Format: `{userId}:{role}`

### 2. **Object-Level Authorization**
- Verify requester owns the resource OR has admin role
- Check on EVERY request to sensitive data

### 3. **Role-Based Access Control (RBAC)**
- Admin-only actions: approve, offboard
- User actions: view own data only

### 4. **Non-Guessable IDs**
- UUIDs used alongside sequential IDs
- Example: `a1b2c3d4-e5f6-4789-a1b2-c3d4e5f67890`

### 5. **Proper HTTP Status Codes**
- `401 Unauthorized`: No/invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource doesn't exist

## Data Structure

Each employee profile contains:

```javascript
{
  id: '17654',              // User ID
  employeeId: 'AJ1001',     // Employee ID (initials + number)
  uuid: 'a1b2c3d4...',      // Non-guessable identifier
  ownerId: '1',             // Owner user ID
  firstName: 'Alice',
  lastName: 'Johnson',
  status: 'Onboarded',      // Onboarded | In Progress | Offboarded
  publicFields: {           // PUBLIC: Anyone can see
    title: 'Manager',
    department: 'HR'
  },
  sensitive: {              // SENSITIVE: Owner or admin only
    ssn: '123-45-6789',
    email: 'alice@example.com',
    phone: '555-0101'
  },
  admin: {                  // ADMIN: Admins only
    internalNotes: 'Excellent performer',
    approved: true,
    approvedBy: 'System',
    approvedAt: '2024-01-15'
  }
}
```

## Learning Objectives

### Vulnerabilities Demonstrated
1. **IDOR (Insecure Direct Object Reference)**
   - Tampering with IDs in URLs/requests
   - Accessing other users' sensitive data
   
2. **Broken Function Level Authorization**
   - Non-admin users invoking admin-only APIs
   - Missing role checks on privileged operations

3. **Information Disclosure**
   - Leaking sensitive PII (SSN, email, phone)
   - Exposing internal admin notes

### Remediation Techniques
1. **Object-level authorization checks**
2. **Role-based access control**
3. **Proper authentication enforcement**
4. **Non-guessable resource identifiers**
5. **Consistent security controls across all endpoints**

## References

### OWASP
- [OWASP Top 10 2021: A01 - Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)
- [OWASP API Security Top 10: API1 - Broken Object Level Authorization](https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/)

### Real-World Incidents
- **Uber (2016)**: IDOR allowed access to driver/rider details
- **Facebook (2018)**: Access token exposure via IDOR
- **Instagram (2019)**: IDOR exposed private account information
- **Peloton (2021)**: User data exposure via predictable IDs

## API Endpoints

### Public Endpoints
- `GET /health` - Health check
- `GET /mode` - Current server mode (vulnerable/patched)

### Profile Endpoints
- `GET /profiles` - List all profiles (public fields only)
- `GET /profiles/:id` - Get single profile (public fields)
- `GET /profiles/:id/full` - Get full profile (sensitive + admin)
  - **Vulnerable**: No auth required
  - **Patched**: Requires owner or admin

### Admin Endpoints
- `PATCH /profiles/:id/approve` - Approve onboarding
  - **Vulnerable**: Anyone can approve
  - **Patched**: Admin only
  
- `PATCH /profiles/:id/offboard` - Offboard employee
  - **Vulnerable**: Anyone can offboard
  - **Patched**: Admin only

## Testing Scenarios

### Scenario 1: Horizontal Privilege Escalation
- **Attack**: Bob accesses Alice's data by changing ID
- **Vulnerable**: Succeeds
- **Patched**: 403 Forbidden

### Scenario 2: Vertical Privilege Escalation
- **Attack**: Bob approves onboarding (admin action)
- **Vulnerable**: Succeeds
- **Patched**: 403 Forbidden

### Scenario 3: Enumeration
- **Attack**: Iterate through IDs to harvest data
- **Vulnerable**: Full database accessible
- **Patched**: Only authorized data returned

## Notes

- This is a **demo application** for educational purposes only
- Do NOT use vulnerable patterns in production code
- Always implement proper authorization checks
- Test authorization logic thoroughly
- Consider using established auth frameworks (OAuth, RBAC libraries)

## 🎬 Presentation Tips

1. **Start with the problem**: Show how easy IDOR attacks are
2. **Demonstrate real impact**: Show sensitive data exposure
3. **Show the fix**: Contrast vulnerable vs patched behavior
4. **Map to OWASP**: Reference official documentation
5. **Discuss real incidents**: Relate to actual CVEs
6. **Provide remediation guidance**: Share best practices

## 📧 Questions?

This demo is designed to be self-contained and reproducible. All code is heavily commented for learning purposes.

---

**Built for security education** | **OWASP Top 10 2021: A01** | **Broken Access Control Demo**
