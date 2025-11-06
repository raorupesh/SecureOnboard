# SecureOnboard - Quick Reference

## Quick Start Commands

### Start Servers
```powershell
# Terminal 1: Backend (Vulnerable Mode)
cd backend
npm start

# Terminal 2: Frontend
cd frontend
npm run dev
```

## Login Credentials

| User  | Username | Password      | Role    | Access                                    |
|-------|----------|---------------|---------|-------------------------------------------|
| Alice | alice    | Manager@123   | Manager | All dashboards + Admin actions            |
| Bob   | bob      | User@123      | User    | My Dashboard only                         |

## Dashboard Access

### Alice (Manager) - Full Access
- Onboarded - View/offboard onboarded employees
- Offboarded - View offboarded employees
- In Progress - View/approve pending onboarding
- My Dashboard - View own profile
- Export - Export data as CSV/JSON

### Bob (User) - Limited Access
- My Dashboard - View own profile only
- All other tabs hidden

## Vulnerable Mode Demo Attacks

### Attack 1: Access Another User's Data (IDOR)
```javascript
// Bob accessing Alice's sensitive data
fetch('http://localhost:4000/profiles/17654/full')
  .then(r => r.json())
  .then(console.log)
```

**Expected Result (Vulnerable)**: Success - Returns Alice's SSN, email, admin notes

**Expected Result (Patched)**: 403 Forbidden

---

### Attack 2: Privilege Escalation
```javascript
// Bob (regular user) trying to approve onboarding
fetch('http://localhost:4000/profiles/17656/approve', {
  method: 'PATCH',
  headers: { 'x-user': '2:user' }
})
  .then(r => r.json())
  .then(console.log)
```

**Expected Result (Vulnerable)**: Success - Bob approves onboarding

**Expected Result (Patched)**: 403 - Admin access required

---

### Attack 3: Data Enumeration
```javascript
// Enumerate all user profiles
for(let id = 17654; id <= 17660; id++) {
  fetch(`http://localhost:4000/profiles/${id}/full`)
    .then(r => r.json())
    .then(data => console.log(`${data.firstName} ${data.lastName}: ${data.sensitive.ssn}`))
}
```

**Expected Result (Vulnerable)**: All SSNs extracted

**Expected Result (Patched)**: 403 for unauthorized access

## Switch to Patched Mode

```powershell
# Stop backend (Ctrl+C)
# Set environment variable
$env:MODE="patched"
# Restart
npm start
```

## Employee Data Reference

| Name            | User ID | Employee ID | Status      | Owner ID |
|-----------------|---------|-------------|-------------|----------|
| Alice Johnson   | 17654   | AJ1001      | Onboarded   | 1        |
| Bob Miller      | 17655   | BM1002      | Onboarded   | 2        |
| Carol Davis     | 17656   | CD1003      | In Progress | 3        |
| David Evans     | 17657   | DE1004      | Offboarded  | 4        |
| Eve Wilson     | 17658   | EW1005      | In Progress | 5        |
| Frank Taylor    | 17659   | FT1006      | Onboarded   | 6        |
| Grace Anderson  | 17660   | GA1007      | Offboarded  | 7        |

## API Endpoints

### Public
- `GET /health` - Health check
- `GET /mode` - Current mode (vulnerable/patched)
- `GET /profiles` - List profiles (public fields only)
- `GET /profiles/:id` - Single profile (public fields)

### Protected
- `GET /profiles/:id/full` - Full profile (sensitive + admin data)
  - Vulnerable: No auth required
  - Patched: Owner or admin only

### Admin-Only
- `PATCH /profiles/:id/approve` - Approve onboarding
  - Vulnerable: Anyone can approve
  - Patched: Admin only

- `PATCH /profiles/:id/offboard` - Offboard employee
  - Vulnerable: Anyone can offboard
  - Patched: Admin only

## Demo Flow Checklist

- [ ] 1. Start backend (vulnerable mode)
- [ ] 2. Start frontend
- [ ] 3. Login as Bob
- [ ] 4. Demonstrate IDOR attack (access Alice's data)
- [ ] 5. Demonstrate privilege escalation (approve as Bob)
- [ ] 6. Show data enumeration
- [ ] 7. Restart backend in patched mode
- [ ] 8. Retry attacks - all blocked
- [ ] 9. Login as Alice
- [ ] 10. Show authorized admin access works

## Troubleshooting

### Backend won't start
- Check port 4000 is available
- Run `npm install` in backend folder
- Check Node.js version (need v16+)

### Frontend won't connect
- Verify backend is running on port 4000
- Check API_BASE in `frontend/src/lib/api.js`
- Clear browser cache and reload

### Login not working
- Username/password are case-sensitive
- Check browser console for errors
- Verify credentials: alice/Manager@123 or bob/User@123

### CORS errors
- Ensure backend started before frontend
- Check CORS configuration in server.js

## Resources

- **README.md** - Complete project documentation
- **SETUP.md** - Detailed installation instructions
- **DEMO_SCRIPT.md** - Full presentation script
- **OWASP Top 10** - https://owasp.org/Top10/A01_2021-Broken_Access_Control/

## Key Takeaways

1. Never trust client input - Always validate on server
2. Check authorization on every request - Not just authentication
3. Implement object-level checks - Verify user owns the resource
4. Use proper HTTP status codes - 401 vs 403 matters
5. Test with different roles - Don't just test happy path
