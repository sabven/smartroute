# SmartRoute Setup Guide

## Prerequisites

- Node.js 16+ 
- MongoDB 4.4+
- npm or yarn
- Git

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd SmartRoute
```

### 2. Backend Setup

```bash
cd server
npm install
```

### 3. Environment Configuration

Copy the environment example file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/smartroute
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
BCRYPT_ROUNDS=12
```

### 4. Database Setup

Make sure MongoDB is running:

```bash
# macOS with Homebrew
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

### 5. Start the Backend Server

```bash
npm run dev
```

The server will start on `http://localhost:5000`

### 6. Frontend Setup

In a new terminal:

```bash
cd client
npm install
npm start
```

The React app will start on `http://localhost:3000`

## Development

### Backend Development

- **Start development server**: `npm run dev`
- **Start production server**: `npm start`
- **Run tests**: `npm test`

### Frontend Development

- **Start development server**: `npm start`
- **Build for production**: `npm run build`
- **Run tests**: `npm test`
- **Run linter**: `npm run lint`

## Project Structure

```
SmartRoute/
├── client/                 # React frontend
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API services
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utility functions
│   ├── package.json
│   └── tailwind.config.js
├── server/                # Node.js backend
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # MongoDB models
│   │   ├── routes/        # API routes
│   │   └── utils/         # Utility functions
│   ├── package.json
│   └── .env
├── shared/                # Shared utilities
├── docs/                  # Documentation
└── README.md
```

## Configuration

### MongoDB

Create a MongoDB database named `smartroute`. The application will automatically create the necessary collections.

### Google Maps API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Maps JavaScript API
4. Create credentials (API Key)
5. Add the API key to your `.env` file

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment | development |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/smartroute |
| `JWT_SECRET` | JWT signing secret | (required) |
| `JWT_EXPIRES_IN` | JWT expiration time | 7d |
| `GOOGLE_MAPS_API_KEY` | Google Maps API key | (optional) |
| `BCRYPT_ROUNDS` | Password hashing rounds | 12 |

## Features

### ✅ Implemented
- User authentication with JWT
- Role-based access control (Admin, Dispatcher, Driver)
- Vehicle management
- Route planning interface
- Fleet dashboard
- Mobile-responsive design
- RESTful API architecture
- Database models for all entities

### 🚧 In Progress
- Google Maps integration
- Route optimization algorithms
- Real-time tracking with Socket.io

### 📋 Planned
- Mobile apps (React Native)
- Advanced analytics
- Geofencing
- Push notifications
- Report generation

## Testing

### Demo Credentials

The application includes demo data and users:

**Admin User:**
- Email: admin@smartroute.com
- Password: admin123

**Dispatcher User:**
- Email: dispatcher@smartroute.com
- Password: dispatch123

**Driver User:**
- Email: driver@smartroute.com
- Password: driver123

### API Testing

Use tools like Postman or curl to test API endpoints:

```bash
# Health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@smartroute.com","password":"admin123"}'
```

## Deployment

### Production Build

1. **Backend:**
   ```bash
   cd server
   npm install --production
   npm start
   ```

2. **Frontend:**
   ```bash
   cd client
   npm run build
   ```

### Environment Setup

- Set `NODE_ENV=production`
- Use a production MongoDB instance
- Configure proper JWT secrets
- Set up SSL/HTTPS
- Configure CORS for production domains

### Docker (Optional)

Create `docker-compose.yml` for containerized deployment:

```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:4.4
    environment:
      MONGO_INITDB_DATABASE: smartroute
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"

  backend:
    build: ./server
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/smartroute
    ports:
      - "5000:5000"
    depends_on:
      - mongodb

  frontend:
    build: ./client
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongodb_data:
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify database permissions

2. **Port Already in Use**
   - Change `PORT` in `.env` file
   - Kill existing processes on the port

3. **Module Not Found Errors**
   - Run `npm install` in both client and server directories
   - Clear node_modules and reinstall if needed

4. **CORS Errors**
   - Verify proxy configuration in client `package.json`
   - Check CORS settings in server configuration

### Getting Help

- Check the [API Documentation](./API.md)
- Review server logs for error details
- Ensure all environment variables are set correctly