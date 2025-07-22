# SmartRoute Quick Start 🚀

## Persistent Setup (Recommended)

```bash
./start-persistent.sh
```

This uses PM2 to keep services running persistently. Services will:
- Stay running even if they crash
- Automatically restart on errors
- Run in the background
- Show detailed status monitoring

## Simple Setup

```bash
./start.sh
```

Basic startup that may stop if terminal is closed.

## Manual Setup (if script doesn't work)

### 1. Install Dependencies
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies  
cd ../client
npm install
```

### 2. Start Server
```bash
cd server
npm start
```

### 3. Start Client (in new terminal)
```bash
cd client
npm start
```

## Access the Application

- **Client**: http://localhost:3000
- **Server API**: http://localhost:8000
- **Health Check**: http://localhost:8000/api/health

## Demo Credentials

- **Employee**: priya@techcorp.com / emp123
- **Driver**: rajesh@smartroute.com / driver123  
- **Admin**: admin@techcorp.com / admin123

## Service Management Commands

```bash
# Stop all services
./stop.sh

# View service status
./node_modules/.bin/pm2 status

# View logs
./node_modules/.bin/pm2 logs

# Restart services
./node_modules/.bin/pm2 restart all
```

## Troubleshooting

### Port Already in Use
```bash
# Kill processes on ports 3000 and 8000
lsof -ti:3000 | xargs kill -9
lsof -ti:8000 | xargs kill -9
```

### Database Issues
The app uses PostgreSQL. Make sure you have PostgreSQL installed and running:
```bash
brew install postgresql
brew services start postgresql
```

### Dependencies Issues
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

## Common Issues & Solutions

1. **"EADDRINUSE" Error**: Port is already in use - run the kill commands above
2. **"Cannot connect to server"**: Make sure server started successfully at port 8000
3. **Client won't load**: Check if both dependencies are installed and ports are free
4. **Database connection failed**: Ensure PostgreSQL is installed and running