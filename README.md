# Globe Trotter 🌍

A personalized travel-planning web application designed to help travelers plan, organize, and track itineraries, destinations, and activities. (Note: This is a planning platform, not a booking engine—no payment processing or flight/hotel booking).

## Storage Architecture Note (D: Drive)
To preserve space on the C: system drive, the entire project, its packages (`node_modules`), build outputs, temporary directories, and local npm caches are strictly configured to live on `D:\GlobeTrotter\`.

- Project root `.npmrc`, `client/.npmrc`, and `server/.npmrc` redirect all package caches to `D:\GlobeTrotter\.npm-cache`.
- System temp files point to `D:\Temp`.

## Project Structure

```text
GlobeTrotter/
├── .npmrc                  # npm cache redirection to D:\GlobeTrotter\.npm-cache
├── .gitignore              # Ignores node_modules, .npm-cache, dist, .env
├── README.md               # Project documentation
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
└── server/                 # Backend: Node.js + Express + TypeScript
    ├── .npmrc
    ├── .env.example
    ├── .env
    ├── .gitignore
    └── src/
        ├── config/
        ├── models/
        ├── routes/         # Health and API routes
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
- PowerShell (Windows)

### Running the Server
Open a terminal in `D:\GlobeTrotter\server`:
```powershell
$env:npm_config_cache = "D:\GlobeTrotter\.npm-cache"
$env:TEMP = "D:\Temp"
$env:TMP = "D:\Temp"
npm run dev
```
The server will start on `http://localhost:5000` (Health endpoint: `http://localhost:5000/api/health`).

### Running the Client
Open a second terminal in `D:\GlobeTrotter\client`:
```powershell
$env:npm_config_cache = "D:\GlobeTrotter\.npm-cache"
$env:TEMP = "D:\Temp"
$env:TMP = "D:\Temp"
npm run dev
```
The client will start on `http://localhost:5173`.
