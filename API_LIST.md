# CampusLink Backend API List

## All APIs

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | / | No | Health/home endpoint. |
| POST | /api/auth/register | No | Register a new user account. |
| POST | /api/auth/login | No | Login user and return token + user data. |
| POST | /api/auth/logout | Bearer token | Logout current token (blacklist). |
| GET | /api/auth/user/{id} | No | Get user profile by user ID. |
| POST | /api/auth/user/upload-image | Bearer token | Upload authenticated user's profile image. |
| PUT | /api/auth/user/update | Bearer token | Update authenticated user's profile fields and optional image. |
| POST | /api/auth/user/fcm-token | Bearer token | Save authenticated user's FCM token for push notifications. |
| GET | /api/events | No | Get all active events (optional category filter). |
| GET | /api/events/{id} | No | Get event details by ID. |
| POST | /api/events/admin/create | Bearer token | Create an event. |
| POST | /api/events/admin/upload-banner/{id} | Bearer token | Upload banner image for an event. |
| PUT | /api/events/admin/update/{id} | Bearer token | Update event by ID. |
| DELETE | /api/events/admin/delete/{id} | Bearer token | Cancel (soft delete) event by ID. |
| POST | /api/events/admin/reminder/{id} | Bearer token | Manually trigger event reminder notifications. |

## Summary

- Total endpoints: 15
- Public endpoints: 6
- Bearer token protected endpoints: 9
