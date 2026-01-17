# Family Command Center - Setup Guide

## Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Stripe account (for subscription features)
- Google Cloud account (for Calendar API)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Go to SQL Editor and run the SQL from `src/lib/database.sql`
3. Go to Settings > API and copy:
   - Project URL → `VITE_SUPABASE_URL`
   - Anon/Public Key → `VITE_SUPABASE_ANON_KEY`

## Step 3: Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
VITE_GOOGLE_CALENDAR_API_KEY=your_google_calendar_api_key
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

## Step 4: Google Calendar API Setup

1. Go to Google Cloud Console
2. Create a new project or select existing
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URI: `http://localhost:5173/auth/google/callback`
6. Copy API Key and Client ID to `.env`

## Step 5: Stripe Setup (Optional)

1. Create Stripe account at https://stripe.com
2. Get Publishable Key from Dashboard
3. Set up webhook endpoint for subscription events
4. Implement backend API endpoints:
   - `/api/stripe/create-subscription` - Create subscription
   - `/api/stripe/refund` - Process refunds based on relationship scores

## Step 6: Backend API Setup (Optional - for GPT-4o)

Create a backend API endpoint `/api/extract-task` that:
- Receives transcript and profiles
- Calls OpenAI GPT-4o API
- Returns structured task data

Example implementation (Node.js/Express):

```javascript
app.post('/api/extract-task', async (req, res) => {
  const { transcript, profiles } = req.body
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'system',
      content: 'Extract task information from conversation transcript...'
    }, {
      role: 'user',
      content: transcript
    }]
  })
  
  // Parse and return structured data
  res.json({ task: {...} })
})
```

## Step 7: Run Development Server

```bash
npm run dev
```

Visit http://localhost:5173

## Step 8: First-Time Setup

1. Sign up with email/password
2. Complete household setup wizard:
   - Enter household name
   - Add owners (Amy, Kyle) with initials
   - Add dependents (Noah, Leia) with color codes
3. Start using the command center!

## Step 9: PWA Icons

Create the following icon files in `public/`:
- `pwa-192x192.png` (192x192px)
- `pwa-512x512.png` (512x512px)
- `apple-touch-icon.png` (180x180px)

Use a dark, terminal-inspired design with green accent colors.

## Production Deployment

1. Build the app:
```bash
npm run build
```

2. Deploy `dist/` folder to:
   - Vercel
   - Netlify
   - Supabase Hosting
   - Any static hosting service

3. Update redirect URIs in Google OAuth settings for production domain

4. Set up backend API endpoints on your hosting platform

## Features Overview

### Core Features
- ✅ Three-tier profile system (Owners, Staff, Dependents)
- ✅ 14-day logistics ticker
- ✅ Task management with cognitive load tracking
- ✅ Meal planning with grocery lists
- ✅ Google Calendar sync
- ✅ Voice AI task extraction
- ✅ Cognitive load visualization
- ✅ Execution velocity metrics
- ✅ Sunday Sync wizard
- ✅ Stripe subscription integration
- ✅ PWA support with push notifications

### Next Steps
- Implement GPT-4o backend integration
- Set up Stripe webhook handlers
- Configure production environment variables
- Test on iOS devices for PWA functionality
- Set up automated Sunday Sync reminders
