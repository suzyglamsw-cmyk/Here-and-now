# Here & Now - Product Requirements Document

## Original Problem Statement
Real-time, Location-based, Low-pressure, Spontaneous, Venue-focused, Privacy-safe social app.

## What's Been Implemented

### Core Features (Complete)
- [x] JWT-based authentication
- [x] Profile management with up to 3 photos
- [x] Venue discovery and check-in
- [x] Who's Here real-time feed
- [x] Glance & Reveal system
- [x] Drink token system
- [x] Connections & Chat
- [x] Friends list
- [x] Block/Report users
- [x] Account deletion

### Premium System (Complete)
- Premium Monthly: £7.99/30 days
- Premium Yearly: £59.99/365 days

### Photo Upload (Complete)
- Upload up to 3 profile photos
- Stored in MongoDB (base64)

### Push Notifications (Complete)
- Service Worker for browser push
- pywebpush for actual delivery
- Per-category settings

### Google Places API (Complete)
- **GET /api/places/nearby** - Search nearby venues
  - Returns real venues with photos, ratings, open/closed status
  - Caches results for 5 minutes
  - Falls back to seeded venues if no API key
- **GET /api/places/{place_id}/details** - Get place details
  - Returns name, address, photos, rating, hours
- **GET /api/places/photo** - Photo proxy
  - Serves Google Places photos without exposing API key
- **Frontend enhancements:**
  - Rating stars display
  - Open/Closed status badge
  - Distance formatting (m/km)
  - Demo Mode notice for seeded venues

### Admin & Test Tools (Complete)
- Admin Reports page
- Test Mode with fake users

## Tech Stack
- Frontend: React + Tailwind CSS + Shadcn UI
- Backend: FastAPI + MongoDB
- Payments: Stripe
- Push: pywebpush + VAPID
- Location: Google Places API

## API Summary (65+ endpoints)

### Places (New)
- GET /api/places/nearby?lat=X&lng=Y&radius=500
- GET /api/places/{place_id}/details
- GET /api/places/photo?photo_ref=X

### Auth & Profile
- POST /api/auth/register, /login, /forgot-password, /reset-password
- GET /api/auth/me
- PUT /api/auth/profile, /visibility

### Photos
- POST /api/photos/upload
- GET /api/photos/{id}
- DELETE /api/photos/{slot}

### Push
- POST /api/push/subscribe
- GET/PUT /api/push/settings

### Social & Interactions
- POST /api/glance, /drink-token
- GET /api/connections, /notifications, /friends

## Environment Variables
```
# Backend
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
JWT_SECRET=xxx
STRIPE_API_KEY=sk_test_xxx
GOOGLE_PLACES_API_KEY=xxx  # Required for real venues
VAPID_PUBLIC_KEY=xxx
VAPID_PRIVATE_KEY_FILE=/app/backend/vapid_private.pem

# Frontend
REACT_APP_BACKEND_URL=https://xxx
```

## Database Collections
- users, photos, venues, checkins
- glances, drink_tokens, connections, messages
- friends, reports, password_resets
- push_subscriptions, push_settings, push_queue
- places_cache (5-min TTL)

## Remaining Tasks

### P1 (High)
- [ ] Google Play Billing for Android
- [ ] Production Google Places API key

### P2 (Medium)
- [ ] Cloud storage for photos (S3/GCS)
- [ ] Message read receipts

### P3 (Nice to Have)
- [ ] Profile themes (premium)
- [ ] Group check-ins
