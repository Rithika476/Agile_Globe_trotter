# Globe Trotter — Academic Report Screenshot Checklist 📸

Use this checklist to capture high-resolution screenshots for your academic project presentation and final documentation report.

---

## 1. Public & Marketing Interfaces
- [ ] **1. Landing Page (`/`)**
  - **URL**: `http://localhost:5173/`
  - **What to show**: Clean hero banner, core feature cards (Destinations, Daily Planning, Live Budget Tracking, One-Click Sharing), responsive top header with "Sign In" and "Get Started" buttons.
- [ ] **2. Login Screen (`/login`)**
  - **URL**: `http://localhost:5173/login`
  - **What to show**: Pre-filled demo credentials (`demo@globetrotter.test`), clean card design, client-side input validation states.
- [ ] **3. Registration Screen (`/register`)**
  - **URL**: `http://localhost:5173/register`
  - **What to show**: Name, email, password, and confirm password fields with helper text.

---

## 2. Authenticated Core Application
- [ ] **4. Main Dashboard (`/dashboard`)**
  - **URL**: `http://localhost:5173/dashboard`
  - **What to show**: Personalized greeting ("Welcome back, Demo Explorer!"), 4 top KPI statistic cards (Total Trips, Upcoming Trips, Destinations Planned, Total Budget Allocated), trip card for *"Classic Rajasthan Heritage Tour"* displaying dates, duration, destination badges, and planned budget.
- [ ] **5. Create Trip Modal**
  - **Trigger**: Click "+ New Trip" on Dashboard
  - **What to show**: Form dialog with Title, Start Date, End Date, and Estimated Budget fields with calendar date constraints.

---

## 3. Trip Management (5 Dedicated Modules)
- [ ] **6. Trip Detail — Destinations Tab (`/trips/:tripId?tab=destinations`)**
  - **What to show**: Top trip header banner with dates (Nov 10 – Nov 14, 5 days) and target budget (₹25,000); ordered stops list (Jaipur, Jodhpur, Udaipur) with stop duration tags; native Up/Down reorder controls; "Add Destination" modal.
- [ ] **7. Trip Detail — Itinerary Days Tab (`/trips/:tripId?tab=itinerary`)**
  - **What to show**: Day-by-day calendar schedule (Day 1: Jaipur, Day 2: Jodhpur, etc.); daily cost sum badges; activity cards with color-coded category badges (`sightseeing`, `food`, `accommodation`, `transport`, `shopping`), times, locations, and costs; "Add Activity" modal.
- [ ] **8. Trip Detail — Budget & Analytics Tab (`/trips/:tripId?tab=budget`)**
  - **What to show**:
    - Prominent **red over-budget warning alert** (highlighting target budget ₹25,000 vs planned ₹30,600, exceeded by ₹5,600).
    - Recharts **interactive category donut chart** showing breakdown across accommodation, transport, food, sightseeing, and shopping.
    - Recharts **daily expense bar chart** showing expenditures across days.
- [ ] **9. Trip Detail — Visual Timeline Tab (`/trips/:tripId?tab=timeline`)**
  - **What to show**: Interactive horizontal day selector pills; chronological vertical timeline cards for the selected day with clock icons, location pins, and activity summaries.
- [ ] **10. Trip Detail — Share & Export Tab (`/trips/:tripId?tab=share`)**
  - **What to show**: Share link generation card; active status pill; raw token display with security warning note; 1-click "Copy Link" button; Revoke Link action.

---

## 4. Public Itinerary & Security
- [ ] **11. Public Shared Itinerary View (`/shared/:token`)**
  - **URL**: Paste the generated share link in an incognito or private browser window.
  - **What to show**: Read-only public travel itinerary without authentication; verifies that no owner email, user ID, or sensitive account info is leaked; includes daily schedule and budget overview.
- [ ] **12. User Profile & Security Settings (`/profile`)**
  - **URL**: `http://localhost:5173/profile`
  - **What to show**: User initials avatar, read-only registered email, member registration date; display name update form; secure password change form requiring current password verification.

---

## 5. Technical & Verification Evidence
- [ ] **13. Automated Test Suite Terminal Output**
  - **Command**: `npm run test:api` in `server\`
  - **What to show**: Clean terminal showing all 23/23 passing test cases (`TOTAL TESTS: 23 | PASSED: 23 | FAILED: 0`).
- [ ] **14. Database Seed Terminal Output**
  - **Command**: `npm run seed:demo` in `server\`
  - **What to show**: Clean terminal output displaying the demo user creation, 3 destinations, 5 days, and 11 activities.
- [ ] **15. Responsive Mobile View**
  - **Tool**: Browser DevTools toggle device toolbar (iPhone 14 / Pixel 7 view)
  - **What to show**: Mobile hamburger navigation dropdown, horizontal scrollable day pills, and stacked mobile cards.
