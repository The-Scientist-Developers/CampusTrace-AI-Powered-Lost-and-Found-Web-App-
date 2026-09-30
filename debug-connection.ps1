# CampusTrace Frontend-Backend Connection Debug Script

Write-Host "🔍 Checking CampusTrace Connection Issues..." -ForegroundColor Cyan
Write-Host ""

# Check if backend is running on 8000
Write-Host "1. Testing backend on localhost:8000..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -ErrorAction Stop -TimeoutSec 3
    Write-Host "✅ Backend is running!" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend is NOT running on port 8000" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   How to fix: Run: cd CampusTrace-Backend && python -m uvicorn app.main:app --reload --port 8000" -ForegroundColor Yellow
}

Write-Host ""

# Check common frontend ports
Write-Host "2. Testing frontend on common ports..." -ForegroundColor Yellow
$ports = 5173, 3000, 5174, 8080
foreach ($port in $ports) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$port" -ErrorAction Stop -TimeoutSec 2
        Write-Host "✅ Frontend found on port $port" -ForegroundColor Green
    } catch {
        Write-Host "   Port $port: Not running" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "3. Network connectivity check..." -ForegroundColor Yellow
try {
    $dns = [System.Net.Dns]::GetHostAddresses("localhost")
    Write-Host "✅ Localhost resolves to: $dns" -ForegroundColor Green
} catch {
    Write-Host "❌ Cannot resolve localhost" -ForegroundColor Red
}

Write-Host ""
Write-Host "4. Environment variables check..." -ForegroundColor Yellow
$env:VITE_API_URL | Select-Object -First 1 | % {
    if ($_) {
        Write-Host "✅ VITE_API_URL is set to: $_" -ForegroundColor Green
    } else {
        Write-Host "⚠️  VITE_API_URL not set (using default: http://localhost:8000)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🔧 Quick Fix Steps:" -ForegroundColor Cyan
Write-Host "1. Open Terminal 1: cd CampusTrace-Backend"
Write-Host "2. Run: python -m uvicorn app.main:app --reload --port 8000"
Write-Host "3. Open Terminal 2: cd CampusTrace/apps/web"
Write-Host "4. Run: npm run dev"
Write-Host "5. Check that frontend is on http://localhost:5173"
Write-Host ""
