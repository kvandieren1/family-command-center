# Onboarding Flow Audit Report

## ✅ Auth Guard
- **Status**: PASS
- **Location**: `src/App.jsx:345`
- **Implementation**: Shows `<Auth />` component when `!isLoggedIn`
- **Fix Required**: None

## ✅ Household Check
- **Status**: PASS
- **Location**: `src/App.jsx:149-234`
- **Implementation**: 
  - `handleGenericOAuthCallback` checks for user's household via profiles table
  - If no household found, calls `checkForExistingHousehold` which sets `onboardingComplete(false)`
  - This correctly triggers SetupWizard
- **Fix Required**: None

## ⚠️ Onboarding Steps

### Step 1: Name/Join Household
- **Status**: PASS
- **Location**: `src/components/SetupWizard.jsx:364-512`
- **Implementation**: 
  - Shows input field for household name OR "Join Van Dieren Home" button
  - `handleJoinHousehold` links user to existing household via profiles table
  - `handleSaveHouseholdName` creates new household in Supabase
- **Fix Required**: None

### Step 2: Google Calendar Sync
- **Status**: PASS
- **Location**: `src/components/SetupWizard.jsx:478-512`
- **Implementation**: 
  - Google Calendar button appears after household name is saved
  - Uses `signInWithGoogle()` from `src/lib/supabase.js`
  - OAuth scope includes `calendar.events.readonly`
- **Fix Required**: None

### Step 3: Role Assignment
- **Status**: PARTIAL
- **Location**: `src/components/SetupWizard.jsx:424-612` (Step 2: The Cockpit)
- **Implementation**: 
  - Step 2 collects Pilot 1 and Pilot 2 names/emails
  - Roles are determined by email via `determineUserRole()` in App.jsx
  - No explicit confirmation step for roles
- **Fix Required**: Consider adding role confirmation or ensure roles are saved properly

## ❌ Mock Data Purge

### Files with Mock Data References:
1. **`src/lib/mockData.js`** - Entire file contains MOCK_DATA structure
2. **`src/components/HeaderMeters.jsx`** - Imports `MOCK_DATA` and `daysUntilVacation` (lines 3-4, 266)
3. **`src/components/AddTaskModal.jsx`** - Imports `MOCK_DATA` for dependents (lines 2, 151)

### Required Actions:
1. Replace `MOCK_DATA.nextVacation` in HeaderMeters with real data from Supabase
2. Replace `MOCK_DATA.household.dependents` in AddTaskModal with real data from profiles table
3. Remove or archive `src/lib/mockData.js` if no longer needed
4. Ensure all components show empty states when no data is available
