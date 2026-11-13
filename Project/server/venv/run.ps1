$serverPath = $PSScriptRoot
$python = Join-Path $serverPath 'Scripts\python.exe'

if (-not (Test-Path $python)) {
    throw "Backend virtual environment Python was not found at: $python"
}

Push-Location $serverPath
try {
    & $python -m uvicorn app.main:app --reload
}
finally {
    Pop-Location
}
