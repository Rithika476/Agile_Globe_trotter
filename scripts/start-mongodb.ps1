# ==============================================================================
# Globe Trotter - Local MongoDB Startup Script
#
# Starts a standalone, user-space mongod process strictly bound to the D: drive:
#   - Database storage: D:\MongoDB\data
#   - Log file:         D:\MongoDB\log\mongod.log
#   - IP Binding:       127.0.0.1 (localhost only)
#   - Port:             27018 (dedicated to Globe Trotter, avoids conflict with port 27017)
#
# This script does NOT install or modify any Windows services or registry settings.
# TO STOP: Press Ctrl + C in this terminal window.
# ==============================================================================

$mongodPath = "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe"
$dbPath = "D:\MongoDB\data"
$logPath = "D:\MongoDB\log\mongod.log"
$port = 27018
$bindIp = "127.0.0.1"

# Ensure directories exist
if (-not (Test-Path $dbPath)) { New-Item -ItemType Directory -Force -Path $dbPath | Out-Null }
if (-not (Test-Path (Split-Path $logPath))) { New-Item -ItemType Directory -Force -Path (Split-Path $logPath) | Out-Null }

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Starting Globe Trotter MongoDB on port $port..." -ForegroundColor Green
Write-Host "Storage path: $dbPath" -ForegroundColor Yellow
Write-Host "Log path:     $logPath" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to cleanly stop the database." -ForegroundColor Magenta
Write-Host "==========================================" -ForegroundColor Cyan

& $mongodPath --dbpath $dbPath --logpath $logPath --bind_ip $bindIp --port $port
