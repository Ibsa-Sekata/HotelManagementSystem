# Requirements Document

## Introduction

The Hotel Management System frontend (React + Vite) requires a full luxury redesign to match the aesthetic of a presidential five-star hotel. The existing codebase contains a working authentication system (Module 1), room catalog (Modules 2–3), and partial booking infrastructure. Modules 5–6 (reservations, staff booking) are API-wired but not backend-complete, and Modules 8–9 (housekeeping, reports) remain demo-only.

The redesign replaces all inline style objects and ad-hoc CSS with a coherent luxury design system using a midnight navy / champagne gold / warm ivory palette. Every page must be rebuilt to the new standard while preserving all existing API integrations, authentication logic, route structure, and the clear demo-data labelling already in place.

## Glossary

- **UI**: The React + Vite frontend application at `client/`
- **Design_System**: The global CSS custom properties, utility classes, and reusable component styles defined in `index.css`
- **Luxury_Palette**: Midnight navy `#0f1c2e`, champagne gold `#c9a84c`, warm ivory `#fdf8f0`, and white `#ffffff`
- **Live_Module**: A backend module whose API endpoints are implemented and returning real data (Modules 1–3: auth, room types, rooms)
- **Demo_Module**: A backend module not yet implemented; the frontend uses clearly-labelled placeholder data (Modules 5–9)
- **Demo_Banner**: The `DemoBanner` component that visually distinguishes demo data from live data
- **Navbar**: The sticky top navigation component (`Navbar.jsx`)
- **Dashboard_Sidebar**: The left-side navigation panel inside the customer and staff dashboard layouts
- **Chart_Library**: Recharts, to be added as a dependency for rendering data visualizations
- **Booking_Widget**: The sticky date-picker and price-calculator panel on the room detail page
- **Auth_Context**: The `AuthContext.jsx` module managing JWT-based authentication state
- **ETB**: Ethiopian Birr, the currency used throughout the application
- **WCAG_2.1_AA**: Web Content Accessibility Guidelines version 2.1, Level AA

---

## Requirements

### Requirement 1: Design System Foundation

**User Story:** As a developer, I want a single source-of-truth design system, so that all pages share a consistent luxury visual language without duplicating style definitions.

#### Acceptance Criteria

1. THE Design_System SHALL define CSS custom properties for the full Luxury_Palette: `--color-midnight` (`#0f1c2e`), `--color-navy` (`#1a3c5e`), `--color-gold` (`#c9a84c`), `--color-gold-dark` (`#a8893a`), `--color-gold-light` (`#e8cc7a`), `--color-ivory` (`#fdf8f0`), and `--color-white` (`#ffffff`)
2. THE Design_System SHALL define typography tokens using a serif display font (Playfair Display or equivalent) for headings and a sans-serif font (Inter or equivalent) for body text
3. THE Design_System SHALL define at least four elevation shadow levels: `--shadow-xs`, `--shadow-sm`, `--shadow-md`, `--shadow-lg`
4. THE Design_System SHALL define a gold gradient utility: `--gradient-gold` as `linear-gradient(135deg, #c9a84c, #e8cc7a)`
5. THE Design_System SHALL provide button variant classes: `.btn-gold` (gold background, navy text), `.btn-navy` (navy background, white text), `.btn-ghost` (transparent, gold border and text), and `.btn-outline-white` (transparent, white border and text)
6. THE Design_System SHALL provide a `.luxury-card` class with ivory background, subtle gold border accent, and `--shadow-md` elevation
7. WHEN the viewport width is 1024px or less, THE Design_System SHALL apply responsive breakpoints that stack multi-column layouts to single column
8. WHEN the viewport width is 768px or less, THE Design_System SHALL apply mobile-specific adjustments including full-width buttons and reduced font sizes
9. THE Design_System SHALL define a `.demo-banner` style that uses an amber warning palette distinct from the luxury brand palette, so demo data is visually differentiated from live data

### Requirement 2: Navbar Redesign

**User Story:** As a guest or staff member, I want a refined navigation bar, so that I immediately perceive the hotel's luxury brand and can navigate efficiently on any device.

#### Acceptance Criteria

1. THE Navbar SHALL display the hotel logo with the Playfair Display (or equivalent serif) font rendering "Grand Horizon" in white and "Hotel" in champagne gold
2. WHEN the user is unauthenticated, THE Navbar SHALL display navigation links for Home and Rooms, a "Sign In" link, and a gold "Book Now" CTA button
3. WHEN the user is authenticated, THE Navbar SHALL display a user avatar with the user's initials, a "My Account" label showing the user's first name, and a "Sign Out" option
4. THE Navbar SHALL be sticky at the top with a `--shadow-md` drop shadow and midnight navy background
5. WHEN the viewport width is 768px or less, THE Navbar SHALL collapse navigation links into a hamburger menu that opens a full-width mobile drawer with ivory background
6. WHEN a navigation link is active, THE Navbar SHALL visually indicate the active state with a champagne gold underline
7. THE Navbar SHALL preserve all existing routing and authentication logic from `AuthContext.jsx`

### Requirement 3: Homepage Redesign

**User Story:** As a prospective guest, I want a visually stunning homepage, so that I immediately experience the hotel's luxury identity and can start searching for rooms.

#### Acceptance Criteria

1. THE Homepage SHALL display a full-viewport hero section with a high-quality hotel background image, a dark overlay, the hotel name in Playfair Display serif font, a tagline, and the availability search widget
2. THE Homepage search widget SHALL accept check-in date, check-out date, and guest count inputs and SHALL navigate to `/rooms` with the selected parameters on submission
3. THE Homepage SHALL display a statistics bar showing at least four hotel metrics (years of excellence, room count, guest rating, restaurant awards) using gold numerals on an ivory background
4. WHEN the room catalog API returns data, THE Homepage SHALL display up to three featured room cards in a responsive grid
5. WHEN the room catalog API returns no data, THE Homepage SHALL display an informative placeholder section without breaking layout
6. THE Homepage SHALL display a hotel amenities section with icon tiles in the midnight navy palette
7. THE Homepage SHALL display a call-to-action section linking to the registration page and rooms listing
8. THE Homepage SHALL load the room catalog from the Live_Module API endpoint (`GET /api/v1/room-types`) without requiring authentication
9. WHEN a hotel image fails to load, THE Homepage SHALL display a styled fallback placeholder that maintains layout integrity

### Requirement 4: Rooms Listing Page Redesign

**User Story:** As a guest, I want to browse and filter rooms elegantly, so that I can find accommodation that matches my requirements.

#### Acceptance Criteria

1. THE Rooms_Page SHALL display a page hero banner with midnight navy background, the page title, and a subtitle
2. THE Rooms_Page SHALL display a filter sidebar with check-in date, check-out date, guest count, minimum price, and maximum price fields
3. WHEN a search is submitted with both check-in and check-out dates, THE Rooms_Page SHALL call `GET /api/v1/rooms/available` with the filter parameters
4. WHEN a search is submitted without dates, THE Rooms_Page SHALL call `GET /api/v1/rooms` to list all room types
5. THE Rooms_Page SHALL display a result count above the room grid
6. WHEN rooms are found, THE Rooms_Page SHALL render results in a two-column responsive grid of luxury room cards
7. WHEN no rooms match the filters, THE Rooms_Page SHALL display an empty state with a clear message and a "Clear Filters" action
8. WHEN the API call is in progress, THE Rooms_Page SHALL display a loading spinner
9. WHEN the API call fails, THE Rooms_Page SHALL display an error alert with the server message
10. THE Rooms_Page SHALL provide a "Clear Filters" button that resets all filter fields and refetches the full room list
11. WHEN the viewport is 768px or less, THE Rooms_Page SHALL stack the filter sidebar above the results grid

### Requirement 5: Room Card Component Redesign

**User Story:** As a guest browsing rooms, I want each room presented as a luxury catalog entry, so that I can quickly evaluate options before clicking through.

#### Acceptance Criteria

1. THE RoomCard SHALL display a room image with a 16:9 aspect ratio and cover fit
2. WHEN an image URL is unavailable or fails to load, THE RoomCard SHALL display a styled fallback using a Cloudinary or placehold.co placeholder that maintains the 16:9 ratio
3. THE RoomCard SHALL display the room name in serif font, a truncated description, bed configuration badge, size badge, and up to four amenity chips
4. WHEN availability search results are shown, THE RoomCard SHALL display an "X available" badge overlaid on the image
5. THE RoomCard SHALL display the base price per night in ETB with "From" prefix and a "View Room" link button in the gold palette
6. WHEN hovered, THE RoomCard SHALL apply a subtle lift effect (translateY and shadow increase) to indicate interactivity
7. THE RoomCard SHALL pass existing check-in and check-out parameters as URL query strings to the room detail link

### Requirement 6: Room Detail Page Redesign

**User Story:** As a guest considering a room, I want a rich, immersive detail view, so that I can make an informed booking decision.

#### Acceptance Criteria

1. THE Room_Detail_Page SHALL display a full-width hero image gallery with thumbnail navigation for multiple images
2. WHEN only one image exists, THE Room_Detail_Page SHALL display it without thumbnail navigation
3. THE Room_Detail_Page SHALL display the room name, bed configuration, room size, full description, amenities grid, and hotel policies section
4. THE Room_Detail_Page SHALL display a sticky Booking_Widget panel showing the price per night, date pickers, guest count selectors, a live price calculation breakdown (subtotal, 15% tax, total), and a call-to-action button
5. WHEN check-in and check-out dates are selected, THE Booking_Widget SHALL calculate and display the nightly subtotal, 15% tax, and grand total in ETB
6. WHEN the user is unauthenticated and clicks the booking button, THE Room_Detail_Page SHALL redirect to `/login` with the current room detail URL as the return path
7. WHEN the booking API (Module 5) is not yet available, THE Room_Detail_Page SHALL display a Demo_Banner explaining the status and SHALL NOT hide the booking widget
8. THE Room_Detail_Page SHALL load room data from `GET /api/v1/room-types/:id`
9. WHEN the room ID is invalid, THE Room_Detail_Page SHALL display an error state without crashing

### Requirement 7: Login Page Redesign

**User Story:** As a returning guest or staff member, I want a polished login screen, so that I feel confident in the security and prestige of the hotel's digital service.

#### Acceptance Criteria

1. THE Login_Page SHALL display a split-layout with a decorative hotel image panel on the left and a centered form card on the right on desktop viewports
2. WHEN the viewport is 768px or less, THE Login_Page SHALL display only the form card on a navy gradient background
3. THE Login_Page SHALL display the hotel logo, "Welcome Back" heading in serif font, email and password fields, and a full-width gold "Sign In" button
4. WHEN authentication succeeds for a customer role, THE Login_Page SHALL redirect to `/dashboard`
5. WHEN authentication succeeds for a staff role, THE Login_Page SHALL redirect to `/staff`
6. WHEN authentication fails, THE Login_Page SHALL display the server error message in a styled error alert without clearing the email field
7. THE Login_Page SHALL provide a link to the registration page
8. THE Login_Page SHALL preserve all existing `AuthContext.login()` logic

### Requirement 8: Registration Page Redesign

**User Story:** As a new guest, I want a welcoming registration form, so that I can create an account quickly and begin booking.

#### Acceptance Criteria

1. THE Register_Page SHALL display a split-layout mirroring the Login_Page with a decorative panel and a form card
2. THE Register_Page SHALL collect first name, last name, email, password, and optional phone number
3. WHEN the password does not meet the minimum requirements (8 characters, 1 uppercase, 1 lowercase, 1 number), THE Register_Page SHALL display an inline validation message before submission
4. WHEN registration succeeds, THE Register_Page SHALL redirect the customer to `/dashboard`
5. WHEN registration fails, THE Register_Page SHALL display the server error message in a styled error alert
6. THE Register_Page SHALL provide a link to the login page
7. THE Register_Page SHALL preserve all existing `AuthContext.register()` logic

### Requirement 9: Customer Dashboard Redesign

**User Story:** As a logged-in guest, I want a personal dashboard that reflects the hotel's luxury brand, so that managing my reservations feels as premium as my stay.

#### Acceptance Criteria

1. THE Customer_Dashboard SHALL display a sidebar with the guest's avatar (initials), full name, account type label, and navigation links to My Bookings and My Profile
2. WHEN the viewport is 768px or less, THE Customer_Dashboard SHALL replace the sidebar with a bottom navigation bar or collapsible top navigation
3. THE Customer_Dashboard sidebar SHALL render navigation links for "My Bookings" and "Browse Rooms" with active state highlighting in champagne gold
4. THE Customer_Dashboard SHALL route `/dashboard/bookings` to the Bookings sub-page and `/dashboard/profile` to the Profile sub-page
5. THE Customer_Dashboard SHALL preserve all existing `AuthContext` role guards and route protection from `ProtectedRoute.jsx`

### Requirement 10: Customer Bookings Sub-Page Redesign

**User Story:** As a logged-in guest, I want to view my booking history in a well-organised, visually clear layout, so that I can track and manage my reservations.

#### Acceptance Criteria

1. THE Customer_Bookings_Page SHALL call `GET /api/v1/bookings/my` and display the returned booking records
2. WHEN bookings are loading, THE Customer_Bookings_Page SHALL display a loading spinner
3. WHEN no bookings exist, THE Customer_Bookings_Page SHALL display a luxury-styled empty state with a link to browse rooms
4. WHEN bookings exist, THE Customer_Bookings_Page SHALL render each booking as a card showing booking reference, room type, room number, check-in and check-out dates, number of nights, payment status badge, and booking status badge
5. WHEN a booking has status `confirmed`, THE Customer_Bookings_Page SHALL display a cancel button that calls `PATCH /api/v1/bookings/:id/cancel` after confirmation
6. WHEN a booking has an applicable status, THE Customer_Bookings_Page SHALL display an invoice button that calls `POST /api/v1/invoices/booking/:id` and shows the invoice total
7. THE Customer_Bookings_Page SHALL display a "+ New Booking" button that navigates to `/rooms`
8. WHEN the API returns an error, THE Customer_Bookings_Page SHALL display a styled error alert with the server message

### Requirement 11: Customer Profile Sub-Page Redesign

**User Story:** As a logged-in guest, I want to manage my profile in a clean, branded form, so that keeping my details up to date feels effortless.

#### Acceptance Criteria

1. THE Customer_Profile_Page SHALL display a two-panel layout with "Personal Information" and "Change Password" sections
2. THE Customer_Profile_Page SHALL pre-populate first name, last name, and phone fields from `AuthContext.user`
3. THE Customer_Profile_Page SHALL display the email field as read-only with a visual disabled state
4. WHEN the profile form is submitted, THE Customer_Profile_Page SHALL call `PATCH /api/v1/auth/me` and display a success or error alert
5. WHEN the password form is submitted, THE Customer_Profile_Page SHALL call `PATCH /api/v1/auth/me/password` and display a success or error alert
6. THE Customer_Profile_Page SHALL display account metadata (account type, member since date) in the password panel

### Requirement 12: Staff Dashboard Redesign

**User Story:** As a hotel staff member or manager, I want a professional operations dashboard, so that I can efficiently manage the hotel from any device.

#### Acceptance Criteria

1. THE Staff_Dashboard SHALL display a luxury sidebar with the staff member's avatar, name, role label, and role-gated navigation sections
2. THE Staff_Dashboard sidebar SHALL display an "Operations" section with links to Overview, Reception, and Housekeeping for all staff roles
3. WHEN the authenticated user has role `manager` or `admin`, THE Staff_Dashboard sidebar SHALL additionally display a "Management" section with links to Room Management and Reports
4. WHEN the viewport is 768px or less, THE Staff_Dashboard SHALL collapse the sidebar and provide a mobile-friendly navigation alternative
5. THE Staff_Dashboard SHALL preserve all existing role-based route guards from `ProtectedRoute.jsx`

### Requirement 13: Staff Overview Sub-Page Redesign

**User Story:** As a hotel staff member, I want a clear, data-rich overview of today's hotel status, so that I can prioritize my work at a glance.

#### Acceptance Criteria

1. THE Staff_Overview_Page SHALL display a date header showing today's date in a human-readable format
2. THE Staff_Overview_Page SHALL display a KPI row with four stat cards: Occupied Rooms, Today's Arrivals, Today's Departures, and Available Rooms
3. WHEN booking data is unavailable (Demo_Module), THE Staff_Overview_Page SHALL display a Demo_Banner and populate stat cards with clearly-labelled demo values
4. THE Staff_Overview_Page SHALL display a "Today's Arrivals & Departures" table with booking reference, guest name, room number, room type, check-in, check-out, status badge, payment badge, and action button columns
5. THE Staff_Overview_Page SHALL display a "Quick Actions" grid with clickable tiles for Walk-In Booking, Check In Guest, Generate Invoice, and Assign Cleaning
6. WHEN a Quick Action tile is clicked and the relevant module is not yet implemented, THE Staff_Overview_Page SHALL display an informative message indicating which module is pending
7. THE Staff_Overview_Page SHALL display a room-status summary chart (donut or bar) showing the count of rooms by status using Chart_Library
8. WHEN booking data is demo, THE Staff_Overview_Page SHALL label the chart with a DEMO badge

### Requirement 14: Reception Desk Sub-Page Redesign

**User Story:** As a receptionist, I want a fast, clear check-in/check-out interface, so that I can process guest arrivals and departures efficiently.

#### Acceptance Criteria

1. THE Reception_Page SHALL display an actions bar with "Walk-In Booking" and "Find Booking" buttons
2. THE Reception_Page SHALL display a "Today's Guest List" table with all columns from the current demo data structure (booking ref, guest name, room, room type, check-in, check-out, status, payment, actions)
3. WHEN a booking has status `confirmed`, THE Reception_Page SHALL display a "Check In" action button in that row
4. WHEN a booking has status `checked_in`, THE Reception_Page SHALL display a "Check Out" action button in that row
5. THE Reception_Page SHALL display a Demo_Banner explaining that check-in and check-out require Module 5 and Module 6
6. WHEN demo data is shown, THE Reception_Page SHALL annotate each row's status badge with a DEMO indicator

### Requirement 15: Housekeeping Board Redesign

**User Story:** As a housekeeping supervisor, I want a visual board of room cleaning tasks, so that I can track and assign work efficiently.

#### Acceptance Criteria

1. THE Housekeeping_Page SHALL display a status summary row with four stat cards for Pending, In Progress, Clean, and Inspected task counts
2. THE Housekeeping_Page SHALL display a task table with room number, floor, room type, task type, priority badge, assigned staff, and status columns
3. THE Housekeeping_Page SHALL display a "New Task" button in the table header
4. THE Housekeeping_Page SHALL display a Demo_Banner indicating that this module requires Module 8
5. WHEN a task row is shown with demo data, THE Housekeeping_Page SHALL display a DEMO badge alongside the status badge
6. THE Housekeeping_Page SHALL use colour-coded status indicators consistent with the Luxury_Palette (warm tones for pending, cool for in-progress, green for clean)

### Requirement 16: Room Management Sub-Page Redesign

**User Story:** As a hotel manager, I want to manage room types and individual rooms in a polished interface, so that the catalog is always accurate and visually consistent with the luxury brand.

#### Acceptance Criteria

1. THE Room_Management_Page SHALL display a tab interface switching between "Room Types" and "Individual Rooms" views
2. THE Room_Management_Page SHALL load room types from `GET /api/v1/room-types?all=true` and individual rooms from `GET /api/v1/rooms`
3. WHEN data is loading, THE Room_Management_Page SHALL display a full-page loading spinner
4. WHEN the API returns an error, THE Room_Management_Page SHALL display a styled error alert
5. THE Room_Types_Tab SHALL display a table with name, bed configuration, base price, capacity, minimum stay, image count, active status badge, and Edit/Activate actions
6. THE Individual_Rooms_Tab SHALL display a visual floor-map grid of room tiles colour-coded by status and a searchable/sortable data table below
7. THE Room_Management_Page SHALL display "+ Room Type" and "+ Room" action buttons (actions may alert with pending module notice)
8. THE Room_Management_Page SHALL render live data from the backend without requiring demo banners

### Requirement 17: Reports & Analytics Sub-Page Redesign

**User Story:** As a hotel manager, I want interactive charts and KPI cards on the reports page, so that I can understand hotel performance at a glance.

#### Acceptance Criteria

1. THE Reports_Page SHALL display a KPI row with four stat cards: YTD Revenue, Total Bookings, Average Occupancy, and Average Stay Length
2. THE Reports_Page SHALL render a line chart of monthly revenue using Chart_Library with months on the x-axis and ETB revenue on the y-axis
3. THE Reports_Page SHALL render a bar chart of monthly bookings and occupancy percentage using Chart_Library
4. THE Reports_Page SHALL display a "Room Type Performance" table with columns for room type, bookings count, revenue, average rate, and occupancy percentage
5. THE Reports_Page SHALL display a Demo_Banner because this page uses Module 9 demo data
6. WHEN hovering over chart data points, THE Reports_Page SHALL display a tooltip showing exact values formatted in ETB

### Requirement 18: Responsive Layout and Accessibility

**User Story:** As a user on any device, I want all pages to be fully usable on desktop, tablet, and mobile, so that I have a consistent luxury experience regardless of screen size.

#### Acceptance Criteria

1. THE UI SHALL render correctly at viewport widths of 375px (mobile), 768px (tablet), and 1280px (desktop) without horizontal overflow or broken layouts
2. THE UI SHALL ensure all interactive elements (buttons, links, form fields) have a minimum touch target size of 44×44 CSS pixels
3. THE UI SHALL provide visible focus indicators on all interactive elements that are distinct from the default browser style and meet WCAG_2.1_AA contrast requirements
4. THE UI SHALL use semantic HTML elements (`<nav>`, `<main>`, `<aside>`, `<section>`, `<header>`, `<footer>`, `<article>`) throughout all pages
5. ALL images in the UI SHALL include descriptive `alt` attributes
6. ALL form fields in the UI SHALL be associated with a visible `<label>` element
7. THE UI SHALL support keyboard-only navigation through all interactive elements in a logical tab order

### Requirement 19: Image Handling and Fallbacks

**User Story:** As a guest, I want hotel images to always appear, even when a specific image is unavailable, so that the luxury aesthetic is never broken by missing assets.

#### Acceptance Criteria

1. WHEN a room image URL fails to load, THE UI SHALL substitute a styled fallback placeholder image from Unsplash or placehold.co that maintains the intended aspect ratio
2. THE UI SHALL use lazy loading (`loading="lazy"`) on all below-the-fold images
3. THE Navbar SHALL display the hotel logo using a styled text mark rather than an image file, so it is always visible regardless of network conditions
4. THE Hero sections SHALL reference Unsplash images via their CDN URL with appropriate width and quality query parameters
5. WHEN a hero image fails to load, THE UI SHALL display the section's gradient background as a fallback that preserves readability of text overlaid on it

### Requirement 20: Demo Data Transparency

**User Story:** As a hotel manager or developer reviewing the system, I want all demo data clearly and consistently labelled, so that there is never confusion between live backend data and placeholder content.

#### Acceptance Criteria

1. WHEN a page section displays data from a Demo_Module, THE UI SHALL render a Demo_Banner component at the top of that section with the module name and status
2. THE Demo_Banner SHALL use a colour scheme (amber/yellow tones) that is visually distinct from the primary luxury palette
3. WHEN individual table rows contain demo data, THE UI SHALL append a "DEMO" badge to the status cell of each such row
4. THE UI SHALL NOT display demo banners on pages or sections that display exclusively live data (auth, room catalog, room management, user profile)
5. WHEN a user interacts with a demo action (button click that would call an unimplemented API), THE UI SHALL display a descriptive message stating which module is pending rather than a generic alert

### Requirement 21: Chart Integration

**User Story:** As a hotel manager, I want all analytics charts to be real interactive visualizations rather than inline progress bars, so that data is more comprehensible and professional.

#### Acceptance Criteria

1. THE UI SHALL install Recharts as a production dependency in `client/package.json`
2. THE Staff_Overview_Page SHALL render a donut or pie chart showing room status distribution using Recharts
3. THE Reports_Page SHALL render a responsive line chart of monthly revenue using `LineChart` and `ResponsiveContainer` from Recharts
4. THE Reports_Page SHALL render a responsive bar chart of monthly bookings using `BarChart` and `ResponsiveContainer` from Recharts
5. ALL charts SHALL use colors from the Luxury_Palette (midnight navy, champagne gold, and semantic status colors)
6. ALL charts SHALL include axis labels and a legend where appropriate
7. WHEN the viewport is 768px or less, THE charts SHALL scale responsively within their containers without overflowing

### Requirement 22: Backend and Auth Preservation

**User Story:** As a system owner, I want all existing backend API integrations and authentication flows preserved exactly, so that the redesign does not introduce regressions.

#### Acceptance Criteria

1. THE UI SHALL NOT modify any file in the `server/` directory
2. THE UI SHALL NOT change the API base URL, endpoint paths, or request/response contracts defined in `client/src/api/`
3. THE UI SHALL preserve all `AuthContext.jsx` logic including token storage, session restoration on mount, forced logout event listener, and all exported action functions
4. THE UI SHALL preserve all `ProtectedRoute.jsx` role-guard logic
5. THE UI SHALL preserve the existing React Router route structure (`/`, `/rooms`, `/rooms/:id`, `/login`, `/register`, `/dashboard/*`, `/staff/*`)
6. THE UI SHALL preserve the `DEMO_BOOKINGS` and `DEMO_ARRIVALS` arrays in `bookings.api.js` as the data source for demo sections
7. WHEN a Live_Module API call returns a non-2xx HTTP status, THE UI SHALL display the server error message to the user without crashing
