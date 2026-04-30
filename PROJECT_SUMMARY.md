# CampusLink Backend — Project Summary

> A **Spring Boot** REST API backend for the CampusLink mobile application, enabling campus event management, user authentication, and push notifications.

---

## 📌 Project Overview

| Property | Value |
|---|---|
| **Artifact ID** | `campuslink` |
| **Group ID** | `com.campuslink.in` |
| **Version** | `1.0.0` |
| **Java Version** | 17 |
| **Spring Boot Version** | 3.2.0 |
| **Build Tool** | Maven |

---

## 🛠️ Tech Stack & Dependencies

| Dependency | Purpose |
|---|---|
| `spring-boot-starter-web` | REST API layer (Spring MVC) |
| `spring-boot-starter-security` | Security configuration (CSRF disabled, all requests permitted) |
| `spring-boot-starter-validation` | Request body validation |
| `firebase-admin` v9.8.0 | Firestore database + Firebase Cloud Messaging (FCM) |
| `jjwt-api / impl / jackson` v0.11.5 | JWT token generation and validation |
| `cloudinary-http44` v1.39.0 | Cloud image storage (profile photos, event banners) |
| `lombok` | Reduces boilerplate (getters, setters, constructors) |
| `spring-boot-starter-test` | Unit & integration testing |

---

## 🗂️ Project Structure

```
src/main/java/com/campuslink/
├── Application.java            # Spring Boot entry point
├── config/
│   ├── FirebaseConfig.java     # Firebase Admin SDK initialization
│   └── SecurityConfig.java     # Spring Security setup
├── controllers/
│   ├── HomeController.java     # Health-check endpoint
│   ├── AuthController.java     # Auth & user management routes
│   └── EventController.java    # Event CRUD & registration routes
├── models/
│   ├── User.java               # User data model
│   ├── Events.java             # Event data model
│   └── Reservation.java        # Reservation data model
├── services/
│   ├── AuthService.java        # Authentication & user profile logic
│   ├── EventService.java       # Event management + scheduled reminders
│   ├── RegistrationService.java # Event registration/unregistration
│   ├── NotificationService.java # FCM push notification dispatch
│   └── CloudinaryService.java  # Image upload to Cloudinary
└── util/
    └── JwtUtil.java            # JWT generation, validation, claims extraction
```

---

## 🗄️ Data Models

### `User`
| Field | Type | Description |
|---|---|---|
| `id` | String | Firestore document ID |
| `user_name` | String | Display name |
| `email` | String | Unique login email |
| `password` | String | BCrypt-hashed password |
| `role` | String | `STUDENT` (default) or `ADMIN` |
| `department` | String | Academic department |
| `year` | String | Academic year |
| `fcmToken` | String | Firebase Cloud Messaging device token |
| `profilePhotoUrl` | String | Cloudinary image URL |
| `createdAt` | String | ISO timestamp |
| `registeredEvents` | `List<String>` | List of registered event IDs |

### `Events`
| Field | Type | Description |
|---|---|---|
| `id` | String | Firestore document ID |
| `title` | String | Event name |
| `desc` | String | Event description |
| `category` | String | Category (e.g. `GENERAL`, `TECH`, etc.) |
| `eventDate` | String | Date of the event |
| `eventTime` | String | Time of the event |
| `venue` | String | Location |
| `bannerImageUrl` | String | Cloudinary image URL |
| `createdBy` | String | Admin user ID |
| `createdAt` | String | ISO timestamp |
| `isActive` | boolean | Soft-delete flag |
| `registeredUsers` | `List<String>` | List of registered user IDs |

### `Reservation`
| Field | Type | Description |
|---|---|---|
| `id` | String | Firestore document ID |
| `userId` | String | ID of the user |
| `eventId` | String | ID of the event |
| `status` | String | Reservation status |
| `rsvpedAt` | String | Timestamp of registration |

---

## 🔐 Authentication & Security

- **JWT-based authentication** using HMAC-SHA256 (`jjwt` library).
  - Token contains the user's `email` (subject) and `userName` claim.
  - Expiry configured via `${jwt.expiration}` in `application.properties`.
- **Token blacklisting** on logout — revoked tokens are stored in the `blacklisted_tokens` Firestore collection.
- **Password hashing** via `BCryptPasswordEncoder`.
- Spring Security is configured to **permit all requests** at the framework level; authorization is enforced manually in services via token validation.

---

## 📡 API Endpoints

### Auth (`/api/auth`)
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | ❌ Public | Register a new user; returns JWT + user object |
| `POST` | `/api/auth/login` | ❌ Public | Login; returns JWT + user object |
| `POST` | `/api/auth/logout` | ✅ Bearer | Blacklists the current token |
| `GET` | `/api/auth/user/{id}` | ❌ Public | Fetch user profile by ID (password excluded) |
| `POST` | `/api/auth/user/upload-image` | ✅ Bearer | Upload profile photo to Cloudinary |
| `PUT` | `/api/auth/user/update` | ✅ Bearer | Update profile fields and/or photo |
| `POST` | `/api/auth/user/fcm-token` | ✅ Bearer | Save FCM device token for push notifications |

### Events (`/api/events`)
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/events` | ❌ Public | List all active events (supports `?category=` filter) |
| `GET` | `/api/events/{id}` | ❌ Public | Get a single event by ID |
| `POST` | `/api/events/admin/create` | ✅ Bearer | Create a new event |
| `POST` | `/api/events/admin/upload-banner/{id}` | ✅ Bearer | Upload event banner image |
| `PUT` | `/api/events/admin/update/{id}` | ✅ Bearer | Update event details |
| `DELETE` | `/api/events/admin/delete/{id}` | ✅ Bearer | Soft-delete (cancel) an event |
| `POST` | `/api/events/admin/reminder/{id}` | ✅ Bearer | Manually trigger reminder notifications |

### Misc
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | ❌ Public | Health check / home endpoint |

**Total:** 15 endpoints — 6 public, 9 protected

---

## ⚙️ Key Services

### `AuthService`
Handles all user lifecycle operations:
- Registration with duplicate email check
- Login with BCrypt password verification
- Token blacklist check on logout
- Profile photo upload via Cloudinary
- Profile field updates (name, department, year, photo)
- FCM token persistence

### `EventService`
Full event management with:
- CRUD operations on Firestore `events` collection
- Optional category filter when listing events
- Flexible event ID resolution (document ID, `id` field, `eventId` field)
- **Automatic 30-minute reminder scheduler** — runs every 60 seconds (configurable via `notifications.reminder.fixed-delay-ms`), checks events starting within 30 minutes and sends FCM push notifications to registered users. Uses `event_reminder_logs` to prevent duplicate sends.
- Manual reminder trigger for admins

### `RegistrationService`
Atomic event registration using Firestore `WriteBatch`:
- Adds event ID to `user.registeredEvents[]`
- Adds user ID to `event.registeredUsers[]`
- Supports unregistration (reverse the above)
- Fetches a user's full registered event list, sorted by start time

### `NotificationService`
Firebase Cloud Messaging wrapper:
- `sendReminder()` — sends a single FCM notification to a device token
- `sendEventReminders()` — sends to a list of tokens, skipping failures gracefully

### `CloudinaryService`
- Uploads `MultipartFile` images to Cloudinary
- Organizes uploads into folders: `campuslink/users` and `campuslink/events`

### `JwtUtil`
- Generates HS256-signed JWTs with email subject + username claim
- Validates and parses tokens
- Checks token expiry
- Extracts `email` and `userName` from token claims

---

## 🔥 Firebase / Firestore Collections

| Collection | Description |
|---|---|
| `users` | User accounts and profile data |
| `events` | Campus events |
| `reservations` | Event registration records |
| `blacklisted_tokens` | Logged-out JWT tokens |
| `event_reminder_logs` | Tracks which reminders have been sent (deduplication) |

---

## 🏗️ Configuration

Key properties expected in `application.properties`:

```properties
# JWT
jwt.secret=<your-secret-key>
jwt.expiration=<expiry-in-ms>

# Firebase
# Credentials loaded via FirebaseConfig from a service account JSON file

# Cloudinary
cloudinary.cloud_name=<name>
cloudinary.api_key=<key>
cloudinary.api_secret=<secret>

# Scheduler
notifications.reminder.fixed-delay-ms=60000
```

---

## 📝 Notes

- **Soft deletes only** — events are cancelled by setting `isActive = false`, not removed from Firestore.
- **Role-based access** is enforced at the service level by validating the JWT bearer token; admin-only routes rely on this token being valid.
- The **date/time parser** in `EventService` supports multiple formats: ISO 8601, `dd-MM-yyyy`, `dd/MM/yyyy`, `MM/dd/yyyy`, and 12/24-hour time formats.
