# Cache Busting Guide

This document explains how cache busting works in this project and how to force mobile devices to download the latest version.

## How Cache Busting Works

### 1. **Build-Time Versioning**
- Each build generates a unique version using timestamp + random string
- This version is embedded in:
  - Service worker cache names
  - Asset filenames (JS/CSS)
  - VitePWA workbox configuration

### 2. **Service Worker Updates**
- Service workers are configured to:
  - Skip waiting and activate immediately on install
  - Delete old caches when new version is detected
  - Use network-first strategy for HTML files
  - Use stale-while-revalidate for assets

### 3. **VitePWA Configuration**
- Changed from `autoUpdate` to `prompt` for better control
- Cache IDs include build version
- Runtime caching strategies ensure fresh content

## Commands

### Build with Cache Busting
```bash
npm run build:bust
```

This runs the standard Vite build, which now includes:
- Versioned cache names
- Unique asset filenames
- Updated service worker

### Check Vercel Deployment Status

**Windows (PowerShell):**
```powershell
.\scripts\check-vercel.ps1
```

**Mac/Linux:**
```bash
./scripts/check-vercel.sh
```

**Or use Vercel CLI:**
```bash
vercel ls
```

## Force Cache Clear on Mobile

### Option 1: Hard Refresh
- **iOS Safari**: Hold refresh button → "Request Desktop Site" then refresh again
- **Android Chrome**: Menu → Settings → Site Settings → Clear & Reset
- **PWA**: Uninstall and reinstall the app

### Option 2: Clear Browser Data
1. Open browser settings
2. Find "Site Settings" or "Storage"
3. Clear data for your domain
4. Reload the app

### Option 3: Developer Tools (if accessible)
1. Open DevTools (if possible on mobile)
2. Application/Storage tab
3. Clear Site Data
4. Unregister Service Workers
5. Hard refresh

### Option 4: Add Query Parameter (Temporary)
Add `?v=2` or any unique string to your URL:
```
https://family-command-center-five.vercel.app?v=2
```

## Verification

After deploying, verify the new version is live:

1. **Check Vercel Dashboard**: https://vercel.com/dashboard
2. **Check Build Logs**: Look for the deployment in Vercel
3. **Check Asset URLs**: View page source and verify JS/CSS filenames have new hashes
4. **Check Service Worker**: In DevTools → Application → Service Workers, verify new version is active

## Troubleshooting

### Mobile Still Shows Old Version

1. **Wait 5-10 minutes**: CDN propagation can take time
2. **Clear PWA cache**: Uninstall and reinstall the PWA
3. **Check service worker**: Ensure new version is registered
4. **Verify deployment**: Check Vercel dashboard that latest commit is deployed
5. **Check build output**: Verify `dist/` folder has new asset filenames

### Service Worker Not Updating

The service worker should auto-update, but if it doesn't:

1. Unregister old service worker in DevTools
2. Hard refresh the page
3. Check browser console for service worker errors

### Vercel Not Deploying

1. Check GitHub: Ensure code is pushed to `main` branch
2. Check Vercel: Verify project is connected to correct repo
3. Check build logs: Look for errors in Vercel deployment logs
4. Manual trigger: Go to Vercel dashboard → Deployments → Redeploy

## Technical Details

### Cache Version Generation
```javascript
const BUILD_VERSION = Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
```

This creates a unique version like: `lxyz123abc` that changes on every build.

### Service Worker Cache Strategy
- **HTML**: Network-first (always try to fetch fresh)
- **Assets (JS/CSS)**: Stale-while-revalidate (serve cache, update in background)
- **Old caches**: Automatically deleted on new service worker activation

### Asset Filenames
Vite automatically includes content hashes in filenames:
- `index-[hash].js` → `index-Dm8SAOve.js`
- `index-[hash].css` → `index-B8PZ2-oE.css`

These hashes change when file content changes, ensuring browsers download new versions.
