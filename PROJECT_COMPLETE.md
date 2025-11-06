# SecureOnboard Demo - Project Complete

## Project Status: READY FOR DEMONSTRATION

Your SecureOnboard application is fully built, tested, and ready to demonstrate Broken Access Control vulnerabilities!

---

## Project Structure

```
idor/
├── backend/                    # Express.js API Server
│   ├── server.js              # Main server with vulnerable/patched modes
│   ├── package.json           # Backend dependencies
│   └── node_modules/          # Installed
│
├── frontend/                   # React + Vite Dashboard
│   ├── src/
│   │   ├── pages/             # Separate pages for each dashboard
│   │   │   ├── Login.jsx      # Login page with username/password
│   │   │   ├── OnboardedPage.jsx
│   │   │   ├── OffboardedPage.jsx
│   │   │   ├── InProgressPage.jsx
│   │   │   ├── MyDashboardPage.jsx
│   │   │   └── ExportPage.jsx
│   │   ├── components/        # Reusable UI components
│   │   │   ├── Topbar.jsx
│   │   │   └── StatusBadge.jsx
│   │   ├── lib/
│   │   │   └── api.js        # API configuration
│   │   ├── App.jsx           # Main app with React Router
│   │   ├── index.jsx         # Entry point
│   │   └── styles.css        # Complete styling
│   ├── package.json          # Frontend dependencies
│   ├── vite.config.js        # Vite configuration
│   ├── index.html            # HTML template
│   └── node_modules/         # Installed
│
├── README.md                  # Complete documentation
├── SETUP.md                   # Installation instructions
├── DEMO_SCRIPT.md            # Detailed demo script (20 min)
├── QUICK_REFERENCE.md        # Quick reference guide
└── .gitignore                # Git ignore file
```

---

## What's Built

### Backend Features
- [x] Express.js server with CORS
- [x] Vulnerable mode (MODE=vulnerable) - default
- [x] Patched mode (MODE=patched) - secure version
- [x] 7 demo employee profiles
- [x] Public, Sensitive, and Admin data classes
- [x] Object-level authorization (patched mode)
- [x] Role-based access control (patched mode)
- [x] Proper HTTP status codes (401, 403, 404)

### Frontend Features
- [x] React 18 + React Router
- [x] Professional login page with username/password
- [x] Role-based navigation (Alice vs Bob)
- [x] 5 separate dashboard pages:
    - Onboarded Page
    - Offboarded Page
    - In Progress Page
    - My Dashboard Page
    - Export Page (CSV/JSON export)
- [x] Status badges with color coding
- [x] Clean, professional UI with orange accent theme
- [x] Responsive table layouts
- [x] Empty states for each dashboard

### Documentation
- [x] Complete README with OWASP references
- [x] Detailed setup instructions
- [x] 20-minute demo script with speaking points
- [x] Quick reference guide
- [x] Real-world incident examples
- [x] Security control explanations

---

## Running the Application

### Current Status
**Backend**: Running on http://localhost:4000 (VULNERABLE mode)  
**Frontend**: Running on http://localhost:5173

### Access the Application
Open your browser to: **http://localhost:5173**

### Demo Credentials

**Manager (Alice) - Full Access**
- Username: `alice`
- Password: `Manager@123`
- Access: All 5 dashboards

**User (Bob) - Limited Access**
- Username: `bob`
- Password: `User@123`
- Access: My Dashboard only

---

## Demo Highlights

### Vulnerable Mode Demonstrations

1. IDOR Attack - Access other users' sensitive data
     ```javascript
     // Bob accessing Alice's SSN
     fetch('http://localhost:4000/profiles/17654/full')
         .then(r => r.json())
         .then(console.log)
     ```

2. Privilege Escalation - Perform admin actions as regular user
     ```javascript
     // Bob approving onboarding
     fetch('http://localhost:4000/profiles/17656/approve', {
         method: 'PATCH',
         headers: { 'x-user': '2:user' }
     }).then(r => r.json()).then(console.log)
     ```

3. Data Enumeration - Extract entire database
     ```javascript
     // Enumerate all profiles
     for(let id = 17654; id <= 17660; id++) {
         fetch(`http://localhost:4000/profiles/${id}/full`)
             .then(r => r.json())
             .then(d => console.log(d.firstName, d.sensitive.ssn))
     }
     ```

### Patched Mode - All Attacks Blocked

Switch to patched mode:
```powershell
# Stop backend (Ctrl+C)
$env:MODE="patched"
npm start
```

All attacks return:
- `401 Unauthorized` - Missing authentication
- `403 Forbidden` - Insufficient permissions

---

## User Roles & Access Matrix

| Feature             | Alice (Manager) | Bob (User) |
|---------------------|-----------------|------------|
| Onboarded Dashboard | Read/Offboard   | Hidden     |
| Offboarded Dashboard| Read            | Hidden     |
| In Progress Dashboard| Read/Approve   | Hidden     |
| My Dashboard        | Read            | Read       |
| Export Data         | CSV/JSON        | Hidden     |
| View Full Profile   | All users       | Own only (patched) |
| Approve Onboarding  | Yes             | No (patched) |
| Offboard Employees  | Yes             | No (patched) |

---

## Security Controls (Patched Mode)

1. Authentication Enforcement
     - `x-user` header required
     - Format: `{userId}:{role}`

2. Object-Level Authorization
     - Verify user owns resource OR has admin role
     - Checked on every sensitive request

3. Role-Based Access Control
     - Admin-only: approve, offboard
     - User: view own data only

4. Non-Guessable IDs
     - UUIDs alongside sequential IDs
     - Example: `a1b2c3d4-e5f6-4789-a1b2-c3d4e5f67890`

5. Proper HTTP Status Codes
     - 401: No/invalid authentication
     - 403: Insufficient permissions
     - 404: Resource not found

---

## Documentation Files

1. README.md (Main)
     - Complete project overview
     - OWASP Top 10 mapping
     - Real-world incidents
     - Security remediation

2. SETUP.md
     - Installation steps
     - Running instructions
     - Troubleshooting guide

3. DEMO_SCRIPT.md
     - 20-minute presentation script
     - Step-by-step demo flow
     - Speaking points
     - Backup demos

4. QUICK_REFERENCE.md
     - Quick start commands
     - Login credentials
     - Attack examples
     - API endpoints

---

## Learning Objectives Achieved

- Demonstrate OWASP A01: Broken Access Control
- Show IDOR vulnerability exploitation
- Show privilege escalation attacks
- Implement proper authorization checks
- Map vulnerabilities to real-world incidents
- Provide hands-on exploitation examples
- Show vulnerable vs patched comparison
- Document remediation techniques

---

## Unique Features

1. Separate Pages - Clean code organization with dedicated page components
2. Role-Based UI - Dynamic navigation based on user privileges
3. Professional Design - Modern, clean interface with orange accents
4. Export Functionality - CSV and JSON data export for managers
5. Status Tracking - Visual status badges (Onboarded, In Progress, Offboarded)
6. Realistic Data - 7 employees with complete profiles
7. Complete Documentation - Ready for presentation and education

---

## Next Steps for Demo

1. Review DEMO_SCRIPT.md - Familiarize yourself with the flow
2. Practice Attacks - Run through IDOR and privilege escalation demos
3. Test Both Modes - Verify vulnerable and patched behavior
4. Prepare Slides - Use README content for presentation slides
5. Set Up Environment - Ensure both servers start cleanly

---

## Pro Tips for Presentation

1. Start with Impact - Show real-world breaches first
2. Live Demo - Use browser DevTools for visibility
3. Compare Side-by-Side - Vulnerable vs Patched
4. Emphasize OWASP - Map to official documentation
5. Show Code - Explain authorization checks in server.js
6. Q&A Prep - Review common questions in DEMO_SCRIPT.md

---

## Known Issues/Notes

- Vite CJS deprecation warning (non-critical, cosmetic)
- Frontend npm audit shows 2 moderate vulnerabilities (dev dependencies only)
- Demo uses simplified auth (x-user header) - use OAuth/JWT in production

---

## Success Criteria: ALL MET

- Backend with vulnerable and patched modes
- React frontend with clean code structure
- Login page with username/password
- Separate pages for each dashboard
- Role-based access (Alice vs Bob)
- 7+ employee profiles with proper IDs
- Employee ID format: Initials + 4 digits (AJ1001)
- User ID format: 5-digit numbers (17654)
- Status tracking (Onboarded, In Progress, Offboarded)
- Export functionality for managers
- Complete documentation
- Demo script with OWASP references
- Servers running and tested

---

## Support

- Check README.md for detailed documentation
- Review QUICK_REFERENCE.md for common commands
- See DEMO_SCRIPT.md for presentation guidance
- Check .gitignore before committing to version control

---

Congratulations! Your SecureOnboard demo is complete and ready to demonstrate Broken Access Control vulnerabilities!

Next Step: Review DEMO_SCRIPT.md and practice your presentation flow.

Servers Running:
- Backend: http://localhost:4000 (VULNERABLE mode)
- Frontend: http://localhost:5173

Demo Ready: YES!
