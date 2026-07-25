# BookingSlot Application

BookingSlot is a comprehensive scheduling and appointment management platform. It consists of a NestJS backend powered by Prisma & PostgreSQL, and a modern Next.js frontend using TailwindCSS and shadcn/ui.

## 🚀 Setup & Installation

### 1. Prerequisites
- Node.js (v18 or higher)
- PostgreSQL running locally (or a hosted PostgreSQL database)

### 2. Backend Setup
```bash
cd backend
npm install

# Set up your environment variables
# Copy .env.example to .env and ensure DATABASE_URL points to your PostgreSQL database
# Run Prisma Migrations
npx prisma migrate dev

# Start the backend server
npm run start:dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Start the frontend server
npm run dev
```

---

## 🧪 How to Test the Application

You can test the application via the Web UI or via the provided Postman Collection.

### Option 1: Testing via Web UI (Frontend)
Open your browser to `http://localhost:3001` (or 3000 if 3001 is not used).

**Owner Walkthrough:**
1. Go to the **Sign Up** page and select the **"I own a Business"** toggle.
2. Complete registration. You will be routed to the Owner Dashboard.
3. In the sidebar, navigate to **Business Profile** and save your business details. *(Required before adding services)*
4. Navigate to **Services** and add a new service (e.g., "Haircut" for 30 mins).
5. Navigate to **Availability**. Select your working days (e.g., Monday-Friday) and add hours from 09:00 AM to 05:00 PM.

**Customer Walkthrough:**
1. Log out of the Owner account and return to the Sign Up page. 
2. Keep the default **"I am a Customer"** toggle and register a new account.
3. Go to your Customer Dashboard. You should see the Owner's business and the "Haircut" service listed. 
4. Click **Book Now**, select a date, and you will see dynamically generated 30-minute time slots (09:00, 09:30, 10:00, etc.).
5. Click a time slot to book it. It will appear in your **My Bookings** tab.

---

### Option 2: Testing via Postman (API Layer)

A fully updated Postman collection is located in the root of this repository: 
📁 `BookingSlot.postman_collection.json`

**To test the API:**
1. Import `BookingSlot.postman_collection.json` into Postman.
2. Under your Postman environment or Collection Variables, create a variable named `token`.
3. Run `Auth > Register` (Ensure the body uses `"role": "OWNER"`).
4. Run `Auth > Login` with those credentials. 
5. Copy the `accessToken` from the login response and paste it into your Postman `{{token}}` variable.
6. Run `Business Profile (Owner) > Create Profile` to initialize the business.
7. Run `Services (Owner) > Create Service` and `Availability (Owner) > Create Availability`.
8. You can then register a Customer account and run the `Bookings (Customer)` endpoints!
