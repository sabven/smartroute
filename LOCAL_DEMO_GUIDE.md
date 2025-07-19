# 🚀 SmartRoute Local Demo Guide

## Quick Start

### Option 1: One-Command Start
```bash
./start-demo.sh
```

### Option 2: Manual Start
```bash
# Terminal 1 - Backend
cd server
node demo-server.js

# Terminal 2 - Frontend  
cd client
npm start
```

## 🌐 Access Your App

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **API Info**: http://localhost:5000/api/demo

## 👥 Demo Accounts

| Role | Email | Password | Features |
|------|-------|----------|----------|
| **Employee** | priya@techcorp.com | emp123 | Book cabs, view trips |
| **Driver** | rajesh@smartroute.com | driver123 | Accept trips, track rides |
| **Admin** | admin@techcorp.com | admin123 | Manage company, fleet |

## 🏢 Corporate Cab Booking Features

### Employee Experience
- **Home → Office** booking in the morning
- **Office → Home** booking in the evening  
- Schedule rides in advance
- Track driver location
- Rate and provide feedback
- View booking history

### Driver Experience
- Receive trip notifications
- Accept/decline ride requests
- Navigate to pickup locations
- Mark trip status (picked up, in transit, completed)
- View earnings and performance

### Admin Experience
- Onboard company employees
- Manage driver fleet
- View all bookings and analytics
- Set company policies and routes
- Monitor system usage

## 🇮🇳 Indian Market Features

- **Bangalore locations**: Koramangala, Electronic City, Whitefield
- **INR pricing**: ₹280 for typical office commute
- **Indian phone numbers**: +91 format
- **Employee IDs**: Corporate structure (EMP001, etc.)
- **Departments**: Engineering, HR, Finance
- **Company-specific**: TechCorp as demo company

## 📱 Mobile-First Design

- Responsive layout works on all devices
- Touch-friendly interface
- Quick action buttons
- Optimized for Indian smartphones

## 🔧 Technical Architecture

```
Frontend (React + TypeScript)
├── Employee Dashboard
├── Driver Dashboard  
├── Admin Panel
├── Booking System
└── Authentication

Backend (Node.js + Express)
├── JWT Authentication
├── Role-based Access
├── Booking Management
├── User Management
└── Demo Data API

Database (In-Memory for Demo)
├── Users (Employee/Driver/Admin)
├── Bookings (Trips & Status)
├── Companies (TechCorp demo)
└── Audit Logs
```

## 💡 Demo Flow

### 1. Employee Books a Ride
1. Login as Employee (priya@techcorp.com)
2. Click "Book Cab to Office"
3. Select pickup time and location
4. Confirm booking

### 2. Driver Receives Notification  
1. Login as Driver (rajesh@smartroute.com)
2. See new trip notification
3. Accept the ride
4. Navigate to pickup

### 3. Admin Monitors System
1. Login as Admin (admin@techcorp.com)
2. View all active bookings
3. Monitor driver performance
4. Generate reports

## 🎯 Perfect for Demonstrating

- **Investors**: Show complete working system
- **Clients**: Demonstrate corporate features
- **Developers**: Code quality and architecture
- **Users**: Test actual workflows

## 🔄 Data Reset

Restart the server to reset demo data:
```bash
# Stop with Ctrl+C, then restart
node demo-server.js
```

## 🚀 Next Steps

1. **Cloud Deployment**: Ready for Azure/AWS production
2. **Real Database**: Switch to PostgreSQL/MongoDB
3. **Mobile Apps**: Use existing API for React Native
4. **Integrations**: Add payments, maps, notifications

---

**Your complete corporate cab booking system is running locally! 🇮🇳**