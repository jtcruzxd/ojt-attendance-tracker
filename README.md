# OJT Attendance Tracker

A modern, mobile-friendly attendance tracking application for On-the-Job Training (OJT) programs with separate interfaces for interns and supervisors.

## Features

### For Interns
- **Quick Clock In/Out**: Simple one-click button to clock in and out with automatic timestamps
- **Attendance History**: View all past attendance records with clock in/out times
- **Track Hours**: See total hours worked automatically calculated for each session
- **Mobile Optimized**: Fully responsive design for smartphone use

### For Supervisors
- **Team Management**: View all assigned interns in one place
- **Attendance Overview**: See comprehensive attendance records for each team member
- **Edit Records**: Modify clock times for corrections or missed entries
- **Delete Records**: Remove attendance entries as needed
- **Total Hours**: Automatic calculation of total hours worked per intern

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS
- **Backend**: Next.js Server Actions, Node.js
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth (Email + Password)
- **Styling**: Tailwind CSS with custom Indigo theme

## Project Structure

```
app/
  ├── page.tsx                    # Landing page & dashboard router
  ├── sign-in/page.tsx            # Sign-in page
  ├── sign-up/page.tsx            # Sign-up page
  ├── api/auth/[...all]/route.ts  # Better Auth handler
  └── actions/
      ├── attendance.ts           # Intern attendance actions
      └── supervisor.ts           # Supervisor management actions

components/
  ├── auth-form.tsx               # Auth form component
  ├── intern-dashboard.tsx        # Intern UI
  └── supervisor-dashboard.tsx    # Supervisor UI

lib/
  ├── auth.ts                     # Better Auth configuration
  ├── auth-client.ts              # Auth client
  └── db/
      ├── index.ts                # Drizzle client
      └── schema.ts               # Database schema
```

## Database Schema

### Users Table
- User accounts with role-based access (intern, supervisor, admin)
- Email verification support

### Attendance Table
- Clock in/out timestamps
- Status tracking (active, completed)
- Optional notes field

### Team Assignment Table
- Links interns to supervisors
- Enables supervisor access to team members' records

### Better Auth Tables
- user, session, account, verification (managed by Better Auth)

## Getting Started

### 1. Setup Environment Variables

Create a `.env.local` file:

```
DATABASE_URL=your_neon_database_url
BETTER_AUTH_SECRET=generate_with_openssl_rand_-base64_32
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Seed Test Accounts

```bash
npm run db:migrate-auth
npm run seed
# or: pnpm db:migrate-auth && pnpm seed
```

This migrates Better Auth columns if needed, then creates (or recreates) demo accounts and links the intern to the admin:

| Role | Email | Password |
|------|-------|----------|
| Admin (supervisor) | `admin@ojt.test` | `Admin1234!` |
| Intern | `intern@ojt.test` | `Intern1234!` |

> The elevated role in the app is `supervisor`. The admin test account uses that role so it can open the supervisor dashboard.

### 4. Run Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000` in your browser.

## User Flows

### Intern Flow
1. Sign up or sign in
2. See current clock in/out status
3. Click "Clock In" to start session
4. Work for some time
5. Click "Clock Out" to end session
6. View attendance history with calculated hours

### Supervisor Flow
1. Sign up/sign in with supervisor role
2. View list of assigned team members
3. Select a team member to see their attendance
4. View all their records with total hours
5. Edit or delete any records as needed
6. Add notes to corrections

## Security Features

- **Authentication**: Email + password with secure session management
- **Authorization**: Role-based access control (interns vs supervisors)
- **Data Scoping**: Users can only access their own or their team's data
- **Database Security**: Server-side validation on all actions

## Mobile Design

The app is fully optimized for mobile devices with:
- Large touch-friendly buttons (44px+ height)
- Responsive grid layouts
- Mobile-first CSS approach
- Touch-optimized forms
- Clear hierarchy and spacing

## Future Enhancements

- Team assignment UI
- Attendance analytics & reports
- Email notifications
- Bulk operations
- Export to CSV
- Admin dashboard
- Geolocation tracking (optional)
- QR code check-in

## Development Notes

- All auth logic uses Better Auth on Neon (database-backed)
- All data access is scoped by userId for security
- Server Actions handle all business logic
- Client components for UI interactions only
- Drizzle ORM for type-safe database queries

## Deployment

Deploy to Vercel:

```bash
vercel deploy
```

Make sure environment variables are set in Vercel project settings.

## License

MIT
