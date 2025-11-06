# SecureOnboard - Setup Instructions

## Prerequisites
- Node.js (v16 or higher)
- npm or yarn

## Installation Steps

### 1. Install Backend Dependencies
```powershell
cd backend
npm install
```

### 2. Install Frontend Dependencies
```powershell
cd frontend
npm install
```

## Running the Application

### Start Backend (Vulnerable Mode - Default)
```powershell
cd backend
npm start
```
Server will run on `http://localhost:4000`

### Start Backend (Patched Mode)
```powershell
cd backend
$env:MODE="patched"
npm start
```

### Start Frontend
```powershell
cd frontend
npm run dev
```
Frontend will run on `http://localhost:5173`

## Demo Credentials

**Manager (Alice)**
- Username: `alice`
- Password: `Manager@123`
- Access: All dashboards

**User (Bob)**
- Username: `bob`
- Password: `User@123`
- Access: My Dashboard only

## Quick Demo Flow

1. Start backend in vulnerable mode
2. Start frontend
3. Login as Bob
4. Open DevTools and tamper with API calls
5. Stop backend and restart in patched mode
6. Retry the same attacks - they will be blocked
7. Login as Alice to see full manager access


## Troubleshooting

**Port Already in Use**
- Backend: Change `PORT` in server.js
- Frontend: Vite will automatically use next available port

**CORS Errors**
- Ensure backend is running before starting frontend
- Check that API_BASE in frontend/src/lib/api.js matches backend URL

**Missing Dependencies**
- Run `npm install` in both backend and frontend directories
