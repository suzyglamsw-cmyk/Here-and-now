# Here & Now - Product Requirements Document

## Original Problem Statement
Building a real-time, location-based social connection app called "Here & Now" with:
- Strict visibility logic based on gender, seeking, rainbow, and openToAll rules
- Strict 3-stage photo blurring system: Unmatched (12px/8px heavy blur), Connection Accepted (6px blur), Full Reveal (0px blur/clear)
- Precise mutually exclusive presence logic: checked into a venue OR Not Here
- Non-destructive interaction lists (glances, icebreakers, chat requests) with daily reset at 5am local time
- Clean mutual/hidden/bin/friends behavior for connections

## Tech Stack
- **Backend:** FastAPI, Python, MongoDB (motor)
- **Frontend:** React, TailwindCSS, Shadcn UI
- **Push Notifications:** Web Push (VAPID)
- **3rd Party:** Stripe, Google Maps Platform, OpenAI Whisper & Vision

## Core Features Implemented

### Authentication & Profile
- [x] Registration with age gate, email/password, DOB, gender selection
- [x] Login with password validation (8+ chars, letters + numbers)
- [x] Show/hide password toggles on Register + Login
- [x] Profile with required fields: bio, home_country, home_area, seeking, intent, photos (min 1)
- [x] Town/Country persistence fixed (home_area field name corrected)

### Visibility & Matching
- [x] 3-stage blur system: Heavy (unmatched) → Medium (connection accepted) → Clear (both revealed)
- [x] Bidirectional gender matching (seeking preferences)
- [x] Rainbow + openToAll visibility boundaries
- [x] Users with empty `seeking` hidden from everyone
- [x] Block functionality

### Venue & Discovery
- [x] Venue check-in with heartbeat
- [x] Here Now (Inside Venue) with filters: All, Unmatched, Mutual, Friends, Hidden Matches
- [x] Not Here discovery with same filters and visibility logic
- [x] Default filter changed to "All" (both screens)
- [x] 30-second auto-refresh polling on all screens

### Connections (HereHub)
- [x] Glances system
- [x] Icebreakers
- [x] Chat requests
- [x] Mutual Matches
- [x] Friends list
- [x] Hidden Matches

### Notifications
- [x] Unread badge count from 4 sources (glances, icebreakers, chat requests, stored notifications)
- [x] Soft-delete via `notifications_cleared_at` timestamp
- [x] Error handling for malformed notifications

### UI/UX
- [x] Discover screen with purple→pink gradient header
- [x] Intent ("What are you here for") displayed on all profile surfaces
- [x] Global readability pass (text opacity /50 → /70)
- [x] Push notification auto-resubscription

## Database Schema (Key Fields)
```
users:
  - id, email, password, display_name
  - date_of_birth, age, gender, show_as
  - seeking (array), intent, rainbow, open_to_all
  - home_country, home_area
  - photos (array, min 1 required)
  - bio, presence_note
  - is_visible, is_premium
  - notifications_cleared_at
  - presence_status
```

## API Endpoints (Key)
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login (returns home_country, home_area)
- `GET /api/auth/me` - Get current user (returns home_area correctly now)
- `PUT /api/auth/profile` - Update profile (validates photos, seeking, intent)
- `GET /api/venues` - Venue overview
- `GET /api/venues/{id}/people` - People in venue
- `GET /api/discovery/not-here` - Not Here discovery (with is_connection_accepted, is_revealed)
- `GET /api/notifications` - Get notifications
- `GET /api/notifications/unread/count` - Unread badge count
- `DELETE /api/notifications/clear` - Clear notifications

## Known Issues / Technical Debt
- P1: Monolithic `server.py` (7800+ lines) needs consolidation into `/routes/`
- Route shadowing between `server.py` and `/routes/` (partially resolved)

## Backlog
- P1: Route consolidation refactor
- P2: Group check-ins feature

## Last Updated
April 2025 - Session completed with notifications error handling, filter defaults, and field validations.
