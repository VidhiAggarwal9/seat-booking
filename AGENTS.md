# AGENTS.md

## 1. PROJECT

Build a complete end-to-end **Movie Seat Booking Website** using the MERN stack.

The project is primarily for learning and demonstrating:

* React frontend
* Node.js + Express backend
* MongoDB database
* Mongoose
* Authentication
* Authorization
* REST APIs
* Business logic
* Age-based movie restrictions
* Seat availability
* Temporary seat locking
* Race-condition/concurrency handling
* Simulated payment
* Booking confirmation
* Booking history
* Backend validation
* Error handling

The application should behave like a simple movie-ticket booking website.

Do not over-design the frontend. Prioritize correct full-stack architecture and backend logic.

---

# 2. TECHNOLOGY STACK

## Frontend

Use:

* React
* Vite
* JavaScript
* CSS
* React Router

Avoid unnecessary frontend libraries.

---

## Backend

Use:

* Node.js
* Express.js
* JavaScript
* REST APIs
* JWT
* bcrypt/bcryptjs

---

## Database

Use:

* MongoDB
* Mongoose

MongoDB must be the persistent source of truth.

Do not use localStorage as a replacement for the database.

---

# 3. BASIC PROJECT STRUCTURE

The initial project contains:

```text
seat-booking/
│
├── frontend/
│
├── backend/
│
└── AGENTS.md
```

Do not create the complete final folder structure immediately.

Create additional folders and files only when they are required by the current development step.

---

# 4. MAIN APPLICATION FLOW

The completed application should follow this general flow:

```text
Register
   ↓
Login
   ↓
Browse Movies
   ↓
Select Movie
   ↓
Select Show
   ↓
Check Age Eligibility
   ↓
View Seats
   ↓
Select Seats
   ↓
Temporarily Lock Seats
   ↓
Simulated Payment
   ↓
Payment PASS / FAIL
   ↓
PASS → Confirm Booking
FAIL → Release Seats
   ↓
Booking Confirmation
   ↓
My Bookings
```

---

# 5. USER AUTHENTICATION

Users must be able to:

* Register
* Login
* Logout
* Access protected resources
* View their own bookings

User information may include:

```text
name
email
password
age
```

Passwords must never be stored as plain text.

Passwords must be hashed before being stored in MongoDB.

Use JWT-based authentication.

The JWT must be delivered and stored as an **HttpOnly cookie**, not read or
stored by frontend JavaScript.

Login flow:

```text
Login Form
   ↓
POST /api/auth/login
   ↓
Backend verifies credentials
   ↓
Backend creates JWT
   ↓
Backend sets JWT as HttpOnly cookie
   ↓
Browser automatically sends cookie with authenticated API requests
   ↓
Backend auth middleware verifies JWT from the cookie
   ↓
req.user is populated from the authenticated user
   ↓
Controller
```

Cookie requirements:

* `HttpOnly` — frontend JavaScript cannot read the JWT.
* `Secure` in production.
* `SameSite` set appropriately (e.g. `Lax` or `Strict`).
* Sent automatically by the browser on authenticated API requests.

The backend must verify the JWT from the cookie for protected routes.

Never trust a `userId` sent from the frontend when determining the authenticated user.

The authenticated user's identity should come from the verified cookie token only.

Logout must clear the HttpOnly cookie server-side.

The frontend must not directly read, parse, or store the JWT.

---

# 6. MOVIES

Movies should contain information such as:

```text
title
description
genre
duration
ageLimit
poster/image
```

Movies may use dummy/demo data.

A movie can have multiple shows.

Example:

```text
Movie:
Interstellar

Genre:
Sci-Fi

Age Limit:
13

Shows:
10:00 AM
2:00 PM
6:00 PM
9:00 PM
```

---

# 7. AGE RESTRICTION

Age restrictions must be enforced by the backend.

Example:

```text
User age = 12
Movie age limit = 13

Result:
Booking rejected
```

```text
User age = 18
Movie age limit = 13

Result:
Booking allowed
```

The frontend may display an age restriction message, but the backend must perform the final validation.

Never trust an age value supplied by the frontend.

The backend should obtain the user's age from the authenticated user's database record.

The user must not be able to bypass the restriction by modifying the frontend request.

---

# 8. MOVIE SHOWS

A movie can have multiple shows.

A show should identify at least:

```text
movie
date
startTime
screen
```

The seat availability must belong to a specific show.

The same physical seat can therefore be available for one show and booked for another show.

---

# 9. SEAT SYSTEM

Seats should have states such as:

```text
AVAILABLE
LOCKED
BOOKED
```

Example layout:

```text
A1 A2 A3 A4 A5
B1 B2 B3 B4 B5
C1 C2 C3 C4 C5
D1 D2 D3 D4 D5
```

The frontend displays the seat state.

However, the backend/database is always the final authority.

Never assume a seat is available merely because the frontend displays it as available.

---

# 10. TEMPORARY SEAT LOCKING

When a user selects a seat and starts the booking/payment process, the backend should temporarily lock the seat.

Example:

```text
AVAILABLE
    ↓
LOCKED
```

A lock should contain information such as:

```text
lockedBy
lockedUntil
```

The lock should expire after a defined period, such as 5 minutes.

After expiration:

```text
LOCKED
   ↓
AVAILABLE
```

unless the booking has already been successfully confirmed.

The backend must check whether an existing lock has expired before rejecting a new lock request.

---

# 11. RACE CONDITION / CONCURRENCY

This is a critical project requirement.

The application must safely handle two users attempting to book the same seat at approximately the same time.

Example:

```text
User A → A1
User B → A1
```

The frontend must NOT decide who gets the seat.

The backend/database must make the final decision.

The implementation should use appropriate database mechanisms such as:

* atomic conditional updates
* unique indexes/constraints where appropriate
* MongoDB transactions where necessary

Do NOT rely on this type of logic alone:

```javascript
if (seat.available) {
    seat.available = false;
    await seat.save();
}
```

This can produce a race condition because two requests may read the same state before either update is completed.

The seat-lock operation must be designed so that only one concurrent request can successfully acquire the same seat for the same show.

Expected result:

```text
Request A ─────┐
               ├── Database
Request B ─────┘
                  ↓
            Only one succeeds
```

The other request should receive an appropriate error such as:

```text
Seat A1 is no longer available.
```

There must never be two confirmed bookings for the same seat and show.

When implementing this feature, explain:

1. What race condition exists.
2. Why the naive implementation is unsafe.
3. What database operation is being used.
4. Why the selected operation is atomic/concurrency-safe.
5. How the failure case is handled.

---

# 12. SIMULATED PAYMENT

Do not integrate a real payment provider.

Create a simulated payment service.

The payment result should be determined by a simple backend condition.

The system must support both:

```text
PAYMENT SUCCESS
```

and:

```text
PAYMENT FAILURE
```

Example conceptual flow:

```text
Payment Request
      ↓
Backend Payment Simulation
      ↓
PASS / FAIL
```

If payment succeeds:

```text
LOCKED
   ↓
BOOKED
```

If payment fails:

```text
LOCKED
   ↓
AVAILABLE
```

The payment system must clearly be labeled as simulated/demo payment.

Do not represent it as a real payment gateway.

---

# 13. BOOKING

A booking should contain information such as:

```text
user
movie
show
seats
amount
paymentStatus
bookingStatus
createdAt
```

After successful payment:

```text
paymentStatus = SUCCESS
bookingStatus = CONFIRMED
```

The corresponding seats must become:

```text
BOOKED
```

If payment fails, the booking must not become confirmed.

---

# 14. BOOKING HISTORY

Authenticated users must be able to see their previous bookings.

The backend must only return bookings belonging to the authenticated user.

The frontend should display information such as:

```text
Movie
Show
Date
Seats
Amount
Payment Status
Booking Status
Booking Date
```

Users must not be able to access another user's bookings by changing an ID in the frontend request.

---

# 15. DATABASE MODELS

At minimum, consider models for:

```text
User
Movie
Show
Seat / ShowSeat
Booking
```

The final model design may be adjusted if a different structure provides better consistency.

Before implementing models, explain:

* Why each model exists
* Important fields
* Relationships
* Required indexes
* How seats relate to shows
* How duplicate bookings are prevented

Do not blindly create models without explaining the data relationships.

---

# 16. API DESIGN

Use REST APIs.

Possible endpoints include:

```text
POST   /api/auth/register
POST   /api/auth/login

GET    /api/movies
GET    /api/movies/:id

GET    /api/shows/:id/seats

POST   /api/seats/lock

POST   /api/payment/simulate

POST   /api/bookings/confirm

GET    /api/bookings/my-bookings
```

These are examples, not mandatory exact endpoints.

Modify the API structure when necessary for a better architecture.

Explain the purpose of each endpoint when implementing it.

---

# 17. FRONTEND PAGES

The frontend should approximately contain:

```text
Login
Register
Home / Movies
Movie Details
Show Selection
Seat Selection
Payment
Booking Confirmation
My Bookings
```

Keep the design simple.

The UI should resemble a basic movie-ticket booking website.

Prioritize:

* usability
* clear navigation
* responsive layout
* clear seat states
* useful error messages

Do not spend excessive effort on animations.

---

# 18. BACKEND VALIDATION

All important business rules must be validated on the backend.

Validate:

* request data
* authentication
* authorization
* user existence
* movie existence
* show existence
* age eligibility
* seat availability
* seat ownership/lock
* lock expiration
* payment result
* booking validity

Frontend validation is useful for user experience but is never sufficient for security or business rules.

---

# 19. SECURITY

Follow basic security practices:

* Hash passwords.
* Never store plain-text passwords.
* Never expose passwords in API responses.
* Use JWT authentication.
* Protect private routes.
* Validate request data.
* Validate MongoDB IDs.
* Use environment variables for secrets.
* Do not commit `.env`.
* Do not trust user IDs from the frontend.
* Do not trust age information from the frontend.
* Do not trust seat availability information from the frontend.
* Prevent users from accessing other users' bookings.

---

# 20. ERROR HANDLING

Handle at least:

```text
Invalid registration
Duplicate email
Invalid login
Wrong password
Invalid/expired token
Unauthorized request
Movie not found
Show not found
Age restriction violation
Seat unavailable
Seat already locked
Seat already booked
Expired seat lock
Payment failure
Invalid booking
Database errors
```

Use appropriate HTTP status codes.

Return clear but safe error messages.

Do not expose internal stack traces or sensitive information to the frontend.

---

# 21. DEVELOPMENT WORKFLOW

This project MUST be developed incrementally.

NEVER generate the complete application in one step.

NEVER create the entire final folder structure and all files immediately.

Work in phases.

Recommended phases:

```text
Phase 1
Architecture and planning

Phase 2
Frontend initialization

Phase 3
Basic frontend pages/components

Phase 4
Backend initialization

Phase 5
MongoDB connection

Phase 6
Database models

Phase 7
Authentication

Phase 8
Movie/show APIs

Phase 9
Seat system

Phase 10
Concurrency-safe seat locking

Phase 11
Simulated payment

Phase 12
Booking confirmation

Phase 13
Booking history

Phase 14
Frontend-backend integration

Phase 15
End-to-end testing

Phase 16
Concurrency and edge-case testing
```

The exact phases can be adjusted if needed.

---

# 22. ONE STEP AT A TIME

Within each phase, work on one small step at a time.

Preferred workflow:

```text
Create/change one logical piece
        ↓
Explain it
        ↓
Run/test it
        ↓
Show result
        ↓
STOP
```

Do not implement several unrelated features at once.

When possible, create one file at a time.

---

# 23. STOP RULE

This is extremely important.

After completing the requested step:

1. Explain what was changed.
2. Explain why it was changed.
3. Explain important code decisions.
4. Run the relevant test/check.
5. Show the expected/resulting output.
6. STOP.

Do not automatically continue to the next step.

Wait for the user to explicitly ask to continue.

---

# 24. COMMAND RULE

The development environment is:

```text
Windows
PowerShell
VS Code
```

Whenever giving terminal commands:

* Make them directly copy-pasteable.
* Explain what the command does.
* Explain what it changes.
* Explain why the command is needed.

Do not give unnecessary commands.

Do not combine many unrelated commands into one large command unless there is a clear reason.

---

# 25. CODE EXPLANATION RULE

The user is learning the architecture.

Do not hide important logic behind unnecessary abstractions.

When implementing important functionality, explain the request flow.

For example:

```text
React
 ↓
HTTP Request
 ↓
Express Route
 ↓
Middleware
 ↓
Controller
 ↓
Service / Business Logic
 ↓
Mongoose
 ↓
MongoDB
 ↓
Response
 ↓
React
```

For authentication explain:

```text
Login Form
 ↓
POST /login
 ↓
Controller
 ↓
Find User
 ↓
Compare Password
 ↓
Generate JWT
 ↓
Return Response
 ↓
Frontend stores authentication state
```

For seat locking explain the complete database flow.

---

# 26. TESTING

Testing is part of development.

Do not wait until the entire project is finished.

Test each feature after implementation.

Important tests include:

## Authentication

```text
Valid registration → success
Duplicate email → failure
Valid login → success
Wrong password → failure
Invalid token → failure
```

## Age restriction

```text
User age 12 + movie limit 13 → reject

User age 13 + movie limit 13 → allow

User age 18 + movie limit 13 → allow
```

## Seats

```text
Available seat → lock

Already locked seat → reject

Already booked seat → reject

Expired lock → available
```

## Race condition

Attempt two nearly simultaneous lock requests for the same:

```text
show + seat
```

Expected:

```text
Exactly one request succeeds.

The other request fails.

There can never be two confirmed bookings for the same show + seat.
```

## Payment

```text
Payment PASS → booking confirmed

Payment FAIL → booking not confirmed + temporary lock released
```

---

# 27. SOURCE OF TRUTH

Always remember:

Frontend:

```text
Display
Input
API requests
User experience
```

Backend:

```text
Authentication
Authorization
Validation
Business rules
Seat locking
Concurrency handling
Payment simulation
Booking confirmation
```

Database:

```text
Persistent source of truth
```

Never make the frontend the final authority for:

* age eligibility
* authentication
* seat availability
* booking status
* payment status
* user identity

---

# 28. FINAL QUALITY REQUIREMENT

The completed project should demonstrate a genuine end-to-end MERN application.

The important learning outcomes are:

```text
Frontend
    ↓
REST API
    ↓
Backend
    ↓
Authentication
    ↓
Business Logic
    ↓
MongoDB
    ↓
Concurrency Handling
    ↓
Payment Simulation
    ↓
Booking
```

The project should be understandable enough that the user can explain the architecture and request flow in an interview.

Prioritize correctness, clarity, and learning over unnecessary complexity.
