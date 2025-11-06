# Demo Script: SecureOnboard - Broken Access Control

## Preparation (Before Demo)
- [ ] Both backend and frontend servers running
- [ ] Browser DevTools ready (Network + Console tabs)
- [ ] Two browser windows (one for vulnerable, one for patched)
- [ ] Presentation slides loaded

## Part 1: Introduction (2 minutes)

**Slide 1**: Title - "Demonstrating Broken Access Control in Web APIs"

**Speaking Points**:
- OWASP Top 10 2021: A01 - Broken Access Control
- Most critical web application security risk
- Accounts for 34% of all tested applications with security issues
- Today: Live demonstration of IDOR (Insecure Direct Object Reference)

**Slide 2**: Application Overview
- SecureOnboard: Employee onboarding management system
- Three data classes: Public, Sensitive (PII), Admin
- Two users: Alice (Manager) and Bob (Regular User)

---

## Part 2: The Vulnerable Application (5 minutes)

### Step 1: Setup Context
**Action**: Navigate to `http://localhost:5173`

**Say**: 
> "This is our onboarding application. Let me login as Bob, a regular employee."

**Do**:
- Enter username: `bob`
- Enter password: `User@123`
- Click Sign In

**Observe**:
- Bob only sees "My Dashboard" tab
- Shows Bob's profile: ID 17655, Employee ID BM1002

---

### Step 2: Demonstrate IDOR - Access Other Users' Data

**Say**:
> "Bob should only see his own data. But let's see what happens if we tamper with the API request."

**Action 1**: Open DevTools → Network Tab
**Action 2**: Click "View Full" button on Bob's profile
**Action 3**: In Network tab, find the request: `GET /profiles/17655/full`

**Show**: The response contains Bob's sensitive data:
```json
{
  "sensitive": {
    "ssn": "234-56-7890",
    "email": "bob@example.com",
    "phone": "555-0102"
  }
}
```

**Say**:
> "Now watch what happens when Bob changes the ID to access Alice's data..."

**Action 4**: Switch to Console tab, paste and execute:
```javascript
fetch('http://localhost:4000/profiles/17654/full')
  .then(r => r.json())
  .then(data => {
    console.log('🚨 VULNERABILITY: Bob accessed Alice\'s data!');
    console.log('Alice SSN:', data.sensitive.ssn);
    console.log('Alice Email:', data.sensitive.email);
    console.log('Admin Notes:', data.admin.internalNotes);
  })
```

**Highlight**:
- Bob successfully accessed Alice's SSN: `123-45-6789`
- Bob can see admin internal notes
- No authentication or authorization check!

---

### Step 3: Demonstrate Privilege Escalation

**Say**:
> "Even worse - Bob can perform manager-only actions like approving onboarding requests."

**Action**: In Console, execute:
```javascript
fetch('http://localhost:4000/profiles/17656/approve', {
  method: 'PATCH',
  headers: { 'x-user': '2:user' }  // Bob's credentials
})
  .then(r => r.json())
  .then(data => {
    console.log('🚨 PRIVILEGE ESCALATION: Bob approved onboarding!');
    console.log(data);
  })
```

**Show**: Success response - Bob (regular user) approved Carol's onboarding

**Say**:
> "This is a critical vulnerability. A regular user can:
> 1. Access any employee's sensitive PII
> 2. Perform administrative actions
> 3. Enumerate all users by changing IDs"

---

### Step 4: Show Impact - Data Enumeration

**Say**:
> "An attacker can easily enumerate the entire database..."

**Action**: Execute:
```javascript
// Enumerate all profiles
for(let id = 17654; id <= 17660; id++) {
  fetch(`http://localhost:4000/profiles/${id}/full`)
    .then(r => r.json())
    .then(data => console.log(`User ${id}:`, data.firstName, data.lastName, 'SSN:', data.sensitive.ssn))
}
```

**Show**: Complete database of employees with SSNs extracted

---

## Part 3: Real-World Context (2 minutes)

**Slide 3**: Real Incidents

**Say**:
> "This isn't theoretical. Major companies have suffered similar breaches:"

- **Uber (2016)**: IDOR exposed driver and rider details
- **Facebook (2018)**: Access tokens leaked via IDOR
- **Instagram (2019)**: Private account data exposed
- **Peloton (2021)**: User data exposed via predictable IDs

**Slide 4**: OWASP Mapping
- Show OWASP Top 10: A01 - Broken Access Control statistics
- API Security Top 10: API1 - Broken Object Level Authorization

---

## Part 4: The Fix - Patched Version (4 minutes)

### Step 1: Switch to Patched Mode

**Say**:
> "Now let's see how proper security controls prevent these attacks."

**Action**:
1. Stop the backend server (Ctrl+C in backend terminal)
2. Restart in patched mode:
   ```powershell
   $env:MODE="patched"
   npm start
   ```
3. Refresh the frontend (Ctrl+R)

---

### Step 2: Retry IDOR Attack

**Say**:
> "Let me try the exact same attack as Bob..."

**Action 1**: Login as Bob again
**Action 2**: In Console, execute:
```javascript
fetch('http://localhost:4000/profiles/17654/full', {
  headers: { 'x-user': '2:user' }
})
  .then(r => r.json())
  .then(data => console.log(data))
```

**Show**: Response:
```json
{
  "error": "Forbidden: You can only access your own data"
}
```

**Say**:
> "✅ Blocked! The server now validates that Bob can only access his own data."

---

### Step 3: Retry Privilege Escalation

**Action**: Execute:
```javascript
fetch('http://localhost:4000/profiles/17656/approve', {
  method: 'PATCH',
  headers: { 'x-user': '2:user' }
})
  .then(r => r.json())
  .then(data => console.log(data))
```

**Show**: Response:
```json
{
  "error": "Forbidden: Admin access required"
}
```

**Say**:
> "✅ Blocked again! Only managers can approve onboarding."

---

### Step 4: Show Authorized Access

**Say**:
> "Let me show how Alice (Manager) can legitimately access this data..."

**Action 1**: Logout and login as Alice (`alice` / `Manager@123`)

**Show**:
- Alice sees all tabs: Onboarded, Offboarded, In Progress, My Dashboard, Export
- Navigate to "In Progress" tab
- Click "View Full" and "Approve" - both work

**Action 2**: In Console, verify with API:
```javascript
fetch('http://localhost:4000/profiles/17656/approve', {
  method: 'PATCH',
  headers: { 'x-user': '1:admin' }  // Alice's credentials
})
  .then(r => r.json())
  .then(data => {
    console.log('✅ SUCCESS: Alice (admin) approved onboarding');
    console.log(data);
  })
```

**Show**: Success - Alice can approve because she has admin role

---

## Part 5: Security Controls Explained (3 minutes)

**Slide 5**: Security Controls Implemented

**Say**:
> "Here's what we fixed in the patched version:"

### 1. Authentication Enforcement
```javascript
const requester = parseRequester(req.headers['x-user']);
if (!requester) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

### 2. Object-Level Authorization
```javascript
const isOwner = String(profile.ownerId) === String(requester.id);
const isAdmin = requester.role === 'admin';

if (!isOwner && !isAdmin) {
  return res.status(403).json({ error: 'Forbidden' });
}
```

### 3. Role-Based Access Control
```javascript
if (requester.role !== 'admin') {
  return res.status(403).json({ error: 'Admin access required' });
}
```

### 4. Non-Guessable IDs
- Sequential IDs (17654) supplemented with UUIDs
- Example: `a1b2c3d4-e5f6-4789-a1b2-c3d4e5f67890`

### 5. Proper Status Codes
- `401`: Unauthorized (no/invalid auth)
- `403`: Forbidden (insufficient permissions)
- `404`: Not found

---

## Part 6: Best Practices (2 minutes)

**Slide 6**: Remediation Checklist

**Say**:
> "To prevent these vulnerabilities in your applications:"

### For Developers:
- ✅ Implement authorization checks on EVERY endpoint
- ✅ Verify user owns the resource OR has required role
- ✅ Use UUIDs instead of sequential IDs
- ✅ Never trust client-supplied identifiers
- ✅ Log and monitor authorization failures
- ✅ Return proper HTTP status codes

### For Security Teams:
- ✅ Test all API endpoints for IDOR
- ✅ Automate authorization testing in CI/CD
- ✅ Review code for missing auth checks
- ✅ Penetration test with different user roles
- ✅ Use SAST/DAST tools to detect issues

### Framework Recommendations:
- Use established auth frameworks (OAuth, JWT)
- Implement RBAC libraries (Casbin, CASL)
- Use ORM/ODM with built-in access control
- Consider using API gateways for centralized authz

---

## Part 7: Q&A and Demo Repository (1 minute)

**Slide 7**: Repository and Resources

**Say**:
> "All code is available in the repository with detailed documentation."

**Show**:
- README.md with complete setup instructions
- Code comments explaining vulnerabilities
- Demo scripts for different attack scenarios
- Links to OWASP resources

**Resources**:
- OWASP Top 10: https://owasp.org/Top10/A01_2021-Broken_Access_Control/
- OWASP API Security: https://owasp.org/API-Security/
- This demo repo: [Your GitHub URL]

---

## Closing (1 minute)

**Slide 8**: Key Takeaways

**Say**:
> "Remember:
> 1. Broken Access Control is the #1 web application risk
> 2. Authorization checks must be on the server, not client
> 3. Always verify: Is this user allowed to access THIS specific resource?
> 4. Test with different roles and permission levels
> 5. Security is not optional - build it in from day one"

**Final Note**:
> "Questions?"

---

## Backup Demos (If Time Permits)

### Additional Demo 1: Export Functionality
- Login as Alice
- Navigate to Export tab
- Show CSV/JSON export
- Discuss how this could leak entire database if unprotected

### Additional Demo 2: Frontend Role-Based UI
- Compare Alice's full navigation with Bob's limited view
- Explain defense-in-depth (UI + API security)
- Note: UI restrictions alone are NOT security

### Additional Demo 3: Browser DevTools Tips
- Show how to find authorization headers
- Demonstrate request replay attacks
- Use Burp Suite or OWASP ZAP for advanced testing

---

## Troubleshooting During Demo

**If backend doesn't start**:
- Check port 4000 is available
- Verify Node.js is installed
- Run `npm install` again

**If frontend doesn't connect**:
- Check CORS settings
- Verify API_BASE URL matches
- Check browser console for errors

**If demo account doesn't work**:
- Username/password are case-sensitive
- Use DevTools to check request payload
- Verify credentials in Login.jsx

---

**Total Demo Time**: ~20 minutes
**Questions/Buffer**: ~10 minutes
**Total Presentation**: 30 minutes
