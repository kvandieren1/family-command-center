#!/bin/bash
# Check Vercel deployment status
# Usage: ./scripts/check-vercel.sh

echo "🔍 Checking Vercel deployment status..."
echo ""

# Try to get project name from git remote
PROJECT_NAME=$(git remote get-url origin 2>/dev/null | sed 's/.*\/\(.*\)\.git/\1/' || echo "")

if [ -z "$PROJECT_NAME" ]; then
  echo "⚠️  Could not detect project name from git remote"
  echo "📋 Manual check options:"
  echo "   1. Visit: https://vercel.com/dashboard"
  echo "   2. Run: vercel ls (if Vercel CLI is installed)"
  echo "   3. Check your Vercel project dashboard"
  exit 1
fi

echo "📦 Project: $PROJECT_NAME"
echo ""

# Check if vercel CLI is installed
if command -v vercel &> /dev/null; then
  echo "✅ Vercel CLI found - fetching latest deployment..."
  vercel ls --limit 1
else
  echo "ℹ️  Vercel CLI not installed. Install with: npm i -g vercel"
  echo ""
  echo "🌐 Check deployment manually:"
  echo "   https://vercel.com/dashboard"
  echo ""
  echo "📱 Your app URL (if deployed):"
  echo "   https://${PROJECT_NAME}.vercel.app"
  echo "   or"
  echo "   https://family-command-center-five.vercel.app"
fi

echo ""
echo "💡 To force cache clear on mobile:"
echo "   1. Open browser DevTools (if possible)"
echo "   2. Clear site data / storage"
echo "   3. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)"
echo "   4. Or uninstall/reinstall the PWA"
