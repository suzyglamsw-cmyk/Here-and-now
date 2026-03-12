# Here & Now - Product Requirements Document

## Original Problem Statement
Real-time, Location-based, Low-pressure, Spontaneous, Venue-focused, Privacy-safe social app.
Users check in, see who's around, send drink tokens, glance, reveal, and connect — all in the moment.
Account deletion feature required. Playful but grown up design. No AI integration.

## Update (Jan 2026) - Feature Additions
Added: Google Places API, Open-area check-in, Auto-checkout (30min), Block/Report users, Premium system with Stripe, Token purchase system, Live clock on home screen, Legal pages.

## User Personas
- **Urban Social Seeker (25-45)**: Professional looking for spontaneous connections at bars/cafes
- **Event Goer**: Person attending venues who wants to see who else is there
- **Privacy-Conscious Connector**: User who values anonymity until mutual interest

## Core Requirements (Static)
1. JWT-based authentication (register/login/logout)
2. Profile management with avatar selection
3. Venue discovery and check-in system
4. "Who's Here" real-time feed at venues
5. Glance feature (anonymous interest signal)
6. Reveal feature (mutual glances unlock profiles)
7. Drink token system (send virtual drinks)
8. Connections list (matched users)
9. Chat messaging between connections
10. Account deletion capability
11. Privacy toggle (visibility control)

## What's Been Implemented (Jan 2026 Update)

### Phase 1 (Complete)
- [x] Landing page with "Here & Now" branding
- [x] User registration/login with JWT auth
- [x] Profile setup (avatar, bio, interests)
- [x] Venues page with search and live counts
- [x] Check-in/checkout system
- [x] Who's Here page
- [x] Glance feature with mutual match detection
- [x] Drink token sending
- [x] Connections and Chat pages
- [x] Settings with visibility toggle
- [x] Account deletion
- [x] Floating dock navigation

### Phase 2 (Complete)
- [x] Google Places API integration (nearby venues)
- [x] Open-area check-in with approximate radius (~150m)
- [x] Auto-checkout timeout (30 minutes inactivity)
- [x] Block/Report users with one-tap action
- [x] Premium system (Stripe + mock billing)
  - Premium Monthly: $9.99/30 days
  - Premium Yearly: $79.99/365 days
  - Benefits: 20 daily glances, 5 daily tokens, view tracking, 2nd reveal, priority visibility
- [x] Token purchase system (Stripe + mock)
  - 5 Tokens: $4.99
  - 15 Tokens: $9.99
  - 50 Tokens: $24.99
- [x] Live clock on venues page
- [x] Legal pages (Terms, Privacy, Safety)
- [x] Daily glance/token limits enforced
- [x] Heartbeat API for activity tracking
- [x] Restore purchases functionality

## Privacy & Safety Rules Implemented
- Users only visible while checked in
- No location history stored
- No exact GPS shared (rounded to ~100m)
- No movement tracking
- Block/report with one tap
- Soft toast notifications

## Tech Stack
- Frontend: React + Tailwind CSS
- Backend: FastAPI + MongoDB
- Payments: Stripe (with mock mode for testing)
- Location: Google Places API (fallback to seeded venues)
- Real-time: WebSocket

## Prioritized Backlog

### P0 (Critical) - DONE
All core features implemented

### P1 (High Priority) - Next
- Real Google Places API key for production
- Push notifications
- Profile photo upload

### P2 (Medium Priority)
- Venue ratings/reviews
- Friend lists
- Message read receipts

### P3 (Nice to Have)
- Group check-ins
- Event integration
- Profile themes (premium)

## Next Tasks
1. Production Google Places API key
2. Push notification integration
3. Photo upload capability
4. Enhanced WebSocket reliability
