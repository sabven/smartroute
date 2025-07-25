# SmartRoute Development Setup

This guide helps you quickly set up a complete development environment for SmartRoute with sample data.

## Quick Start

### 1. Prerequisites
- PostgreSQL database running
- Node.js installed
- Dependencies installed (`npm install` in both server and client directories)

### 2. Environment Setup
Ensure your `.env` file in the server directory contains:
```env
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=development
PORT=8000
```

### 3. Database Setup with Sample Data
Run the comprehensive setup script:
```bash
cd server
node setup-development.js
```

This script will:
- ✅ Drop and recreate all tables
- ✅ Create admin, employee, and driver accounts
- ✅ Add sample employee profiles with Indian names and Bangalore addresses
- ✅ Add sample driver profiles with complete details
- ✅ Create and assign vehicles to drivers
- ✅ Generate sample bookings
- ✅ Display all login credentials

### 4. Start the Application
```bash
# Start server (from server directory)
npm run dev
# or
node server-postgres-working.js

# Start client (from client directory)
npm start
```

## Login Credentials

### Admin Account
- **Email:** admin@techcorp.com
- **Password:** admin123
- **Role:** Company Admin

### Demo Accounts
- **Employee:** priya@techcorp.com | emp123
- **Driver:** rajesh@smartroute.com | driver123

### Sample Employee Accounts (Password: password123)
1. rajesh.kumar@company.com
2. priya.sharma@company.com
3. arun.reddy@company.com
4. meera.iyer@company.com
5. vikash.singh@company.com
6. anita.das@company.com

### Sample Driver Accounts (Password: driver123)
1. ravi.kumar@smartroute.com
2. suresh.reddy@smartroute.com
3. prakash.sharma@smartroute.com
4. anand.nair@smartroute.com
5. rajesh.iyer@smartroute.com

## What's Included

### Sample Data
- **14 Total Users** (1 admin, 7 employees, 6 drivers)
- **6 Employee Profiles** with complete Indian addresses in Bangalore
- **5 Driver Profiles** with license details and emergency contacts
- **5 Vehicles** (cars) assigned to drivers with fuel and feature data
- **3 Sample Bookings** with different statuses

### Features Available
- Role-based authentication and navigation
- Employee profile management with saved addresses
- Driver management with comprehensive profiles
- Vehicle management with real-time status
- Booking system with driver assignment
- Admin dashboard with fleet management
- Toast notifications and error handling

## Database Schema

The setup includes these main tables:
- `Users` - Authentication and basic user info
- `EmployeeProfiles` - Detailed employee information and addresses
- `DriverProfiles` - Driver licenses, documents, and details
- `Vehicles` - Fleet vehicles with features and maintenance data
- `CabBookings` - Trip requests and assignments
- `Notifications` - System notifications

## Development Notes

- All sample data uses realistic Indian names and Bangalore addresses
- Driver profiles include valid Karnataka license numbers and formats
- Vehicles have realistic fuel levels and feature configurations
- Employee profiles include home/office addresses for trip planning
- Bookings demonstrate different status workflows

## Troubleshooting

### Database Connection Issues
1. Verify PostgreSQL is running
2. Check DATABASE_URL in .env file
3. Ensure database exists and is accessible

### Port Conflicts
- Server runs on port 8000 by default
- Client runs on port 3000 by default
- Update config files if ports are in use

### Authentication Issues
- Clear localStorage if experiencing login problems
- Restart both server and client after database reset

## Next Steps

After setup, you can:
1. Login as admin to see the fleet management dashboard
2. Login as employee to book cabs and manage profile
3. Login as driver to view assigned trips
4. Test the vehicle assignment workflow
5. Explore the comprehensive logging and notification systems

---

**💡 Pro Tip:** Run the setup script whenever you want to reset to a clean development state with fresh sample data.