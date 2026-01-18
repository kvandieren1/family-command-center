# PowerShell script to check Vercel deployment status
# Usage: .\scripts\check-vercel.ps1

Write-Host "🔍 Checking Vercel deployment status..." -ForegroundColor Cyan
Write-Host ""

# Try to get project name from git remote
try {
    $remoteUrl = git remote get-url origin 2>$null
    if ($remoteUrl) {
        $PROJECT_NAME = $remoteUrl -replace '.*/(.*)\.git', '$1'
    } else {
        $PROJECT_NAME = ""
    }
} catch {
    $PROJECT_NAME = ""
}

if ([string]::IsNullOrEmpty($PROJECT_NAME)) {
    Write-Host "⚠️  Could not detect project name from git remote" -ForegroundColor Yellow
    Write-Host "📋 Manual check options:" -ForegroundColor White
    Write-Host "   1. Visit: https://vercel.com/dashboard" -ForegroundColor Gray
    Write-Host "   2. Run: vercel ls (if Vercel CLI is installed)" -ForegroundColor Gray
    Write-Host "   3. Check your Vercel project dashboard" -ForegroundColor Gray
    exit 1
}

Write-Host "📦 Project: $PROJECT_NAME" -ForegroundColor Green
Write-Host ""

# Check if vercel CLI is installed
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if ($vercelInstalled) {
    Write-Host "✅ Vercel CLI found - fetching latest deployment..." -ForegroundColor Green
    vercel ls --limit 1
} else {
    Write-Host "ℹ️  Vercel CLI not installed. Install with: npm i -g vercel" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🌐 Check deployment manually:" -ForegroundColor White
    Write-Host "   https://vercel.com/dashboard" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📱 Your app URL (if deployed):" -ForegroundColor White
    Write-Host "   https://${PROJECT_NAME}.vercel.app" -ForegroundColor Gray
    Write-Host "   or" -ForegroundColor Gray
    Write-Host "   https://family-command-center-five.vercel.app" -ForegroundColor Gray
}

Write-Host ""
Write-Host "💡 To force cache clear on mobile:" -ForegroundColor Cyan
Write-Host "   1. Open browser DevTools (if possible)" -ForegroundColor Gray
Write-Host "   2. Clear site data / storage" -ForegroundColor Gray
Write-Host "   3. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)" -ForegroundColor Gray
Write-Host "   4. Or uninstall/reinstall the PWA" -ForegroundColor Gray
