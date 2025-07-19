# SmartRoute - Corporate Cab Booking System

A mobile-first web application for corporate cab booking in India. Companies can onboard their employees who can book rides between home and office, with drivers getting real-time notifications and optimized routes.

![SmartRoute Logo](https://via.placeholder.com/200x80/3B82F6/FFFFFF?text=SmartRoute)

## 🚀 Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd SmartRoute

# Start backend
cd server
npm install
cp .env.example .env  # Configure your environment
npm run dev

# Start frontend (in new terminal)
cd client
npm install
npm start
```

Visit `http://localhost:3000` to access the application.

## 📋 Features

### ✅ Core Features
- **🚖 Corporate Cab Booking**: Employees can book rides between home and office
- **🏢 Company Management**: Onboard companies with multiple office locations
- **👥 Multi-Role System**: Employees, Drivers, and Company Admins
- **📱 Mobile-First Design**: Fully responsive interface optimized for mobile devices
- **🚗 Driver Interface**: Real-time trip requests and notifications for drivers
- **📊 Employee Dashboard**: Personal booking history and quick booking options
- **🛡️ Security**: JWT-based authentication with role-based access control
- **🇮🇳 India-Ready**: Designed for Indian corporate transport needs

### 🚧 Core Functionality
- **📅 Smart Booking**: 3-step booking process with date/time selection
- **🔔 Driver Notifications**: Real-time trip assignment and acceptance
- **⭐ Rating System**: Employee feedback and driver ratings
- **💰 Fare Management**: Dynamic pricing with corporate billing
- **📍 Route Planning**: Home-to-office and office-to-home trips

### 📅 Planned Enhancements
- **📱 Mobile Apps**: Dedicated Android/iOS apps for employees and drivers
- **🗺️ Google Maps Integration**: Interactive maps for route visualization
- **⚡ Route Optimization**: Multi-passenger pickup optimization
- **📊 Analytics**: Corporate transport analytics and reporting
- **💳 Payment Integration**: UPI, corporate wallets, and expense management

## 🏗️ Project Structure

```
SmartRoute/
├── 📁 client/              # React frontend application
│   ├── 📁 src/
│   │   ├── 📁 components/  # Reusable UI components
│   │   ├── 📁 pages/       # Application pages
│   │   ├── 📁 hooks/       # Custom React hooks
│   │   ├── 📁 services/    # API service layer
│   │   ├── 📁 types/       # TypeScript type definitions
│   │   └── 📁 utils/       # Utility functions
│   └── 📄 package.json
├── 📁 server/              # Node.js backend API
│   ├── 📁 src/
│   │   ├── 📁 config/      # Database and app configuration
│   │   ├── 📁 controllers/ # API route handlers
│   │   ├── 📁 middleware/  # Express middleware
│   │   ├── 📁 models/      # MongoDB data models
│   │   ├── 📁 routes/      # API route definitions
│   │   └── 📁 utils/       # Backend utilities
│   └── 📄 package.json
├── 📁 shared/              # Shared utilities and types
├── 📁 docs/                # Documentation
│   ├── 📄 API.md          # API documentation
│   └── 📄 SETUP.md        # Setup instructions
└── 📄 README.md
```

## 🛠️ Technology Stack

### Frontend
- **React.js 18+** - Modern React with hooks and functional components
- **TypeScript** - Type-safe JavaScript development
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Socket.io Client** - Real-time communication

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **Socket.io** - Real-time bidirectional communication
- **bcrypt** - Password hashing

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Nodemon** - Development server auto-restart
- **PostCSS** - CSS processing

## 🔐 Demo Credentials

The application includes demo users for testing:

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| **Employee** | priya@techcorp.com | emp123 | Corporate employee who can book cabs |
| **Driver** | rajesh@smartroute.com | driver123 | Driver who receives and handles trip requests |
| **Company Admin** | admin@techcorp.com | admin123 | Company administrator managing fleet |

## 📱 Mobile-First Design

SmartRoute is built with a mobile-first approach, ensuring optimal experience across all devices:

- **Responsive Layout**: Adapts to any screen size
- **Touch-Friendly**: Optimized for touch interactions
- **Performance**: Fast loading and smooth animations
- **PWA Ready**: Progressive Web App capabilities

## 🔌 API Architecture

The backend provides a comprehensive RESTful API designed for both web and future mobile applications:

### Core Endpoints
- **Authentication**: `/api/auth/*` - User registration, login, profile management
- **Vehicles**: `/api/vehicles/*` - Fleet management operations
- **Routes**: `/api/routes/*` - Route planning and optimization
- **Tracking**: `/api/tracking/*` - Real-time vehicle tracking
- **Users**: `/api/users/*` - User management (admin only)

### Real-time Features
- **WebSocket Events**: Live vehicle tracking updates
- **Push Notifications**: Route alerts and status changes
- **Live Dashboard**: Real-time fleet status monitoring

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- MongoDB 4.4+
- npm or yarn

### Installation

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd SmartRoute
   ```

2. **Backend Setup**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd client
   npm install
   npm start
   ```

For detailed setup instructions, see [SETUP.md](./docs/SETUP.md).

## 📚 Documentation

- **[Setup Guide](./docs/SETUP.md)** - Detailed installation and configuration
- **[API Documentation](./docs/API.md)** - Complete API reference

## 🔮 Roadmap

### Phase 1: Web Application Foundation ✅
- [x] User authentication and authorization
- [x] Fleet management interface
- [x] Route planning dashboard
- [x] Mobile-responsive design
- [x] RESTful API architecture

### Phase 2: Enhanced Features 🚧
- [ ] Google Maps integration
- [ ] Route optimization algorithms
- [ ] Real-time tracking with Socket.io
- [ ] Advanced analytics dashboard

### Phase 3: Mobile Applications 📅
- [ ] React Native mobile apps
- [ ] Push notifications
- [ ] Offline capabilities
- [ ] GPS tracking integration

### Phase 4: Advanced Features 📅
- [ ] Machine learning route optimization
- [ ] Predictive analytics
- [ ] Integration with third-party services
- [ ] Advanced reporting and insights

## 💬 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

**SmartRoute** - Revolutionizing fleet management and route optimization 🚛✨