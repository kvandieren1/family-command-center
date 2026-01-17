# Project Structure

## Directory Layout

```
Family Command Center/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service worker
│   └── vite.svg               # Vite logo
├── src/
│   ├── api/
│   │   └── extract-task.js    # GPT-4o task extraction API stub
│   ├── components/
│   │   ├── Auth.jsx           # Authentication component
│   │   ├── Dashboard.jsx     # Main dashboard
│   │   ├── LogisticsTicker.jsx # 14-day calendar view
│   │   ├── CognitiveLoadChart.jsx # Load visualization
│   │   ├── ExecutionStats.jsx # Velocity metrics
│   │   ├── VoiceAI.jsx        # Voice input component
│   │   ├── SundaySync.jsx    # Weekly sync wizard
│   │   ├── TaskManager.jsx   # Task CRUD interface
│   │   ├── MealPlanner.jsx   # Meal planning component
│   │   ├── GoogleCalendarSync.jsx # Calendar sync
│   │   ├── StripeSubscription.jsx # Subscription management
│   │   └── HouseholdSetup.jsx # First-time setup wizard
│   ├── hooks/
│   │   └── useHousehold.js    # Household data hook
│   ├── lib/
│   │   ├── supabase.js        # Supabase client config
│   │   ├── database.sql       # Database schema
│   │   ├── googleCalendar.js  # Google Calendar API
│   │   ├── notifications.js   # Push notifications
│   │   ├── mealPlanner.js     # Meal planning utilities
│   │   └── utils.js           # General utilities
│   ├── App.jsx                # Main app component
│   ├── main.jsx               # Entry point
│   └── index.css              # Global styles
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore rules
├── index.html                 # HTML entry point
├── package.json               # Dependencies
├── postcss.config.js          # PostCSS config
├── tailwind.config.js         # Tailwind config
├── vite.config.js             # Vite config with PWA plugin
├── README.md                   # Project README
├── SETUP.md                    # Setup instructions
└── PROJECT_STRUCTURE.md        # This file
```

## Component Hierarchy

```
App
├── Auth (if not authenticated)
└── Dashboard (if authenticated)
    ├── LogisticsTicker (14-day view)
    ├── ExecutionStats
    ├── CognitiveLoadChart
    ├── GoogleCalendarSync
    ├── StripeSubscription
    ├── TaskManager
    ├── MealPlanner
    └── VoiceAI (floating button)
```

## Data Flow

1. **Authentication**: Supabase Auth → User Session
2. **Household Setup**: User creates household → Profiles created
3. **Data Loading**: Components query Supabase based on `household_id`
4. **Voice Input**: Web Speech API → Transcript → GPT-4o API → Task Creation
5. **Calendar Sync**: Google Calendar API → Supabase `calendar_events`
6. **Notifications**: Service Worker → Push Notifications

## Key Features by Component

### Dashboard
- Main hub displaying all widgets
- Navigation to specialized views
- Household/profile context

### LogisticsTicker
- 14-day horizontal scrolling calendar
- Aggregates: Calendar events, Tasks, Meals
- Color-coded by dependent
- Task indicators with owner initials

### TaskManager
- CRUD operations for tasks
- Cognitive weight assignment
- Owner/dependent linking
- Status tracking

### CognitiveLoadChart
- 3-month stacked bar chart
- Shows Heavy/Medium/Low distribution
- Per-owner breakdown

### ExecutionStats
- Streak calculation
- Completion rate
- Task counts

### VoiceAI
- Floating mic button
- Web Speech API integration
- Task extraction (GPT-4o)
- Quick task creation

### SundaySync
- 5-step manual wizard
- Verbal AI mode (future)
- Relationship score tracking

### MealPlanner
- Weekly meal planning
- Grocery list generation
- Meal type categorization

## Database Schema

- `households` - Root entity
- `profiles` - Users (owners/staff/dependents)
- `tasks` - Action items
- `meals` - Meal planning
- `calendar_events` - Synced events
- `cognitive_load` - Load tracking
- `execution_metrics` - Performance data
- `relationship_scores` - Weekly scores
- `subscriptions` - Stripe subscriptions

## Environment Variables

- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe public key
- `VITE_GOOGLE_CALENDAR_API_KEY` - Google Calendar API key
- `VITE_GOOGLE_CLIENT_ID` - Google OAuth client ID

## Styling

- Tailwind CSS with custom terminal theme
- Dark mode by default
- High-density, Bloomberg-inspired UI
- Minimal animations
- Monospace font family
- Color-coded by cognitive weight and dependents

## PWA Features

- Service worker for offline support
- Manifest.json for installability
- Push notifications
- iOS "Add to Home Screen" support
- Caching strategy

## Next Steps for Production

1. Set up backend API for GPT-4o integration
2. Implement Stripe webhook handlers
3. Create PWA icons (192x192, 512x512, 180x180)
4. Configure production environment
5. Set up CI/CD pipeline
6. Test on iOS devices
7. Implement error boundaries
8. Add loading states
9. Optimize bundle size
10. Set up analytics
