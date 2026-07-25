# BookSlot API Backend

BookSlot is a robust scheduling and booking backend built with NestJS and Prisma. It implements a strict "Solo Business" model where an owner can set up a profile, define services, set their weekly availability, and mathematically prevent double-bookings through advanced database constraints.

## Tech Stack
- **Framework**: NestJS (Express under the hood)
- **Language**: TypeScript (Strict Mode)
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Validation**: class-validator & class-transformer
- **Authentication**: JWT & Passport

## Architecture & Design Decisions
- **Clean Module Architecture**: Every domain entity (`users`, `auth`, `business-profile`, `services`, `slots`, `bookings`) gets its own isolated module, controller, and service.
- **Dynamic Slot Generation**: Instead of pre-saving millions of empty 30-minute slots to the database, slots are generated dynamically on-the-fly based on the day's `Availability` boundaries, existing overlapping `Booking` records, and the mathematical length of the `Service.durationMinutes`.
- **Double Booking Prevention**: We use Prisma's `Serializable` isolation level during the transaction lock, combined with a `@@unique([businessId, bookingDate, startTime])` constraint in Postgres. This absolutely guarantees zero double bookings even under heavy concurrent traffic.
- **Role-Based Access Control**: Strict `@RolesGuard` enforcement. Owners cannot accidentally access customer actions, and customers cannot manage business settings.

## Folder Structure
```text
src/
├── auth/                 # JWT Strategies, Guards, Auth Service
├── users/                # User registration & lookup
├── business-profile/     # Business Profile management for Owners
├── services/             # Services offered by the business
├── availability/         # Weekly operational hours 
├── slots/                # Core mathematical engine for dynamic slots
├── bookings/             # Booking engine & Owner/Customer APIs
├── common/               # Global filters & interceptors
├── main.ts               # Bootstraps app with ValidationPipes & Swagger
```

## Setup & Installation

**1. Clone & Install**
```bash
npm install
```

**2. Environment Variables**
Copy the sample environment file and adjust for your local PostgreSQL database:
```bash
cp .env.example .env
```

**3. Database Setup**
Apply the migrations to setup your database schema:
```bash
npx prisma migrate deploy
# Or for local development: npx prisma migrate dev
npx prisma generate
```

**4. Running Locally**
```bash
npm run start:dev
```

**5. Running Unit Tests**
```bash
npm run test
```

## API Overview
*Note: Swagger docs are available at `/api` when running locally.*

### Auth & Users
- `POST /auth/register` - Register as OWNER or CUSTOMER.
- `POST /auth/login` - Login to get JWT token.

### Business & Settings (Owner Only)
- `POST /business` - Create your business profile.
- `POST /services` - Add a service (e.g. Haircut - 30 mins).
- `POST /availability` - Define working hours for specific days.

### Slots (Public / Customer)
- `GET /services/:id/slots?date=YYYY-MM-DD` - Get dynamically generated slots.

### Bookings (Customer)
- `POST /bookings` - Book a slot.
- `GET /bookings/me` - View own bookings (supports pagination & status filters).
- `PATCH /bookings/:id/cancel` - Cancel a booking.

### Bookings (Owner)
- `GET /owner/bookings` - View all incoming bookings for your business.
- `PATCH /owner/bookings/:id/status` - Mark booking as CONFIRMED, COMPLETED, or NO_SHOW.

## Future Improvements
- Add caching for `getSlots` via Redis to reduce database hits on high-traffic days.
- Implement soft-deletes on Bookings for analytics tracking.
- Add real-time WebSocket events to update front-end slot UI instantly when someone else books.
