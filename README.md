# Family Command Center

A high-density, Bloomberg Terminal-inspired PWA for household management built with React, Tailwind CSS, and Supabase.

## Features

- **Three-Tier Profile System**: Owners, Staff, and Dependents with role-based access
- **14-Day Logistics Ticker**: Horizontal rolling calendar view aggregating events, tasks, and meals
- **Voice AI Integration**: Web Speech API + GPT-4o for automatic task extraction
- **Cognitive Load Tracking**: Visualized load distribution over 3 months
- **Execution Velocity Metrics**: Streak counter and completion rate tracking
- **Sunday Sync Wizard**: 5-step manual sync or verbal AI mode
- **Stripe Integration**: Subscription with auto-refund based on relationship scores
- **PWA Support**: Full iOS "Add to Home Screen" support with push notifications

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Fill in your Supabase and Stripe credentials
```

3. Run database migrations:
- Copy the SQL from `src/lib/database.sql` to your Supabase SQL editor
- Run the migrations to create tables and RLS policies

4. Start development server:
```bash
npm run dev
```

## Project Structure

```
src/
├── components/          # React components
│   ├── Auth.jsx        # Authentication
│   ├── Dashboard.jsx   # Main dashboard
│   ├── LogisticsTicker.jsx  # 14-day calendar view
│   ├── CognitiveLoadChart.jsx  # Load visualization
│   ├── ExecutionStats.jsx     # Velocity metrics
│   ├── VoiceAI.jsx     # Voice input component
│   └── SundaySync.jsx  # Weekly sync wizard
├── lib/
│   ├── supabase.js     # Supabase client config
│   └── database.sql    # Database schema
└── App.jsx             # Main app component
```

## Environment Variables

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `VITE_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key
- `VITE_GOOGLE_CALENDAR_API_KEY`: Google Calendar API key

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory, ready for deployment.

## License

MIT
