# Globe Trotter 🌍

A personalized travel-planning web application designed to help travelers plan, organize, and track itineraries, destinations, and activities. (Note: This is a planning platform, not a booking engine—no payment processing or flight/hotel booking).

## Storage Architecture Note (D: Drive)
To preserve space on the C: system drive, the entire project, its packages (`node_modules`), build outputs, temporary directories, local npm caches, and database files are strictly configured to live on `D:\`.

- Project root `.npmrc`, `client/.npmrc`, and `server/.npmrc` redirect all package caches to `D:\GlobeTrotter\.npm-cache`.
- System temp files point to `D:\Temp`.
- MongoDB data files: `D:\MongoDB\data\`
- MongoDB log files: `D:\MongoDB\log\mongod.log`
- Dedicated port: `27018` (prevents conflicts with any default port 27017 services)

## Project Structure

```text
GlobeTrotter/
├── .npmrc                  # npm cache redirection to D:\GlobeTrotter\.npm-cache
├── .gitignore              # Ignores node_modules, .npm-cache, dist, .env
├── README.md               # Project documentation
├── scripts/
│   └── start-mongodb.ps1   # Starts local MongoDB instance on port 27018 pointing to D:\MongoDB
├── client/                 # Frontend: React + Vite + TypeScript + Tailwind CSS
│   ├── .npmrc
│   ├── vite.config.ts      # Dev server on port 5173, proxy /api -> port 5000
│   ├── tailwind.config.js
│   ├── .env.example
│   └── src/
│       ├── components/
│       ├── pages/          # Home, NotFound
│       ├── layouts/
│       ├── hooks/
│       ├── services/
│       ├── types/
│       ├── utils/
│       └── assets/
└── server/                 # Backend: Node.js + Express + TypeScript + Mongoose
    ├── .npmrc
    ├── .env.example        # PORT=5000, MONGODB_URI=mongodb://127.0.0.1:27018/globetrotter
    ├── .env
    ├── .gitignore
    ├── scripts/
    │   ├── verify-db.ts    # Script to sync indexes and verify database CRUD
    │   └── verify-persistence.ts # Script to test persistence across restarts
    └── src/
        ├── config/
        │   └── db.ts       # Mongoose connection & graceful shutdown
        ├── models/         # User, Trip, Destination, ItineraryDay, Activity, TripShare
        ├── routes/         # Health routes (/api/health, /api/health/db)
        ├── controllers/
        ├── services/
        ├── middleware/     # Central error handler
        ├── validators/
        ├── types/
        ├── utils/
        ├── app.ts          # Express app configuration & middleware
        └── index.ts        # Server entry point on port 5000
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm (v9+)
- MongoDB Community Server (v7+)
- PowerShell (Windows)

### 1. Running MongoDB (Port 27018)
Open a terminal and run the startup script:
```powershell
powershell -ExecutionPolicy Bypass -File "D:\GlobeTrotter\scripts\start-mongodb.ps1"
```
*(Leave this running. Data is stored in `D:\MongoDB\data` and logs in `D:\MongoDB\log\mongod.log`. To stop: press `Ctrl + C`)*

### 2. Running the Server
Open a second terminal in `D:\GlobeTrotter\server`:
```powershell
Set-Location "D:\GlobeTrotter\server"
$env:npm_config_cache = "D:\GlobeTrotter\.npm-cache"
$env:TEMP = "D:\Temp"
$env:TMP = "D:\Temp"
npm run dev
```
The server will start on `http://localhost:5000`:
- Service health: `http://localhost:5000/api/health`
- Database health: `http://localhost:5000/api/health/db`

To verify database schemas and indexes at any time:
```powershell
npm run verify:db
```

### 3. Running the Client
Open a third terminal in `D:\GlobeTrotter\client`:
```powershell
Set-Location "D:\GlobeTrotter\client"
$env:npm_config_cache = "D:\GlobeTrotter\.npm-cache"
$env:TEMP = "D:\Temp"
$env:TMP = "D:\Temp"
npm run dev
```
The client will start on `http://localhost:5173`.
