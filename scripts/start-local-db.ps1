# PowerShell script to run local standalone PostgreSQL service for JARVIS
$base = "$HOME\.local-db"
$bin = "$base\bin"
$data = "$base\data"

if (-not (Test-Path "$bin\postgres.exe")) {
    Write-Error "PostgreSQL binary not found in $bin. Please review README or use Docker."
    exit 1
}

$isReady = & "$bin\pg_isready.exe" -h 127.0.0.1 -p 5432
if ($LASTEXITCODE -eq 0) {
    Write-Host "PostgreSQL is already running on port 5432."
    exit 0
}

Write-Host "Starting PostgreSQL daemon..."
Start-Process -FilePath "$bin\postgres.exe" -ArgumentList "-D `"$data`" -p 5432" -WindowStyle Hidden
Start-Sleep -Seconds 2

& "$bin\pg_isready.exe" -h 127.0.0.1 -p 5432
if ($LASTEXITCODE -eq 0) {
    Write-Host "PostgreSQL started successfully and is accepting connections on localhost:5432."
} else {
    Write-Error "Failed to verify PostgreSQL connection."
}
