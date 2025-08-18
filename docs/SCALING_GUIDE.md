# SmartRoute Scaling Guide

## Database Optimization for 1000+ Rides/Day

### 1. Add Database Indexes
```sql
-- Critical indexes for performance
CREATE INDEX idx_bookings_status_date ON cab_bookings(status, date);
CREATE INDEX idx_bookings_driver_id ON cab_bookings(driver_id);
CREATE INDEX idx_bookings_user_id ON cab_bookings(user_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_bookings_created_at ON cab_bookings(created_at);

-- Composite indexes for common queries
CREATE INDEX idx_bookings_status_created ON cab_bookings(status, created_at);
CREATE INDEX idx_bookings_date_time ON cab_bookings(date, time);
```

### 2. Connection Pooling Configuration
```javascript
// server/src/config/database.js
const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  pool: {
    max: 20,          // Maximum connections (up from default 5)
    min: 5,           // Minimum connections
    acquire: 30000,   // Maximum time to get connection
    idle: 10000,      // Maximum idle time
    evict: 1000       // Check for idle connections every 1s
  },
  logging: process.env.NODE_ENV === 'production' ? false : console.log
});
```

### 3. Caching Strategy
```javascript
// Add Redis for caching
const redis = require('redis');
const client = redis.createClient({
  host: 'localhost',
  port: 6379,
  retry_strategy: (options) => Math.min(options.attempt * 100, 3000)
});

// Cache frequently accessed data
const cacheBookingStats = async () => {
  const stats = await CabBooking.findAll({
    attributes: ['status', [sequelize.fn('COUNT', '*'), 'count']],
    group: ['status']
  });
  
  await client.setex('booking_stats', 300, JSON.stringify(stats)); // 5min cache
};
```

## Server Scaling Options

### Option 1: Vertical Scaling (Easiest)
```yaml
# Current → Recommended for 1000 rides/day
CPU: 2 cores → 4 cores
RAM: 4GB → 8GB
Storage: SSD with 1000 IOPS → 3000 IOPS
Database: Standard → Performance tier
```

### Option 2: Horizontal Scaling
```javascript
// Load balancer configuration
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);
  
  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork(); // Restart worker
  });
} else {
  // Worker process
  require('./server.js');
  console.log(`Worker ${process.pid} started`);
}
```

## Performance Monitoring

### 1. Key Metrics to Track
```javascript
// Add to server/middleware/monitoring.js
const prometheus = require('prom-client');

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status']
});

const activeBookings = new prometheus.Gauge({
  name: 'active_bookings_total',
  help: 'Total number of active bookings'
});

const databaseConnections = new prometheus.Gauge({
  name: 'database_connections_active',
  help: 'Number of active database connections'
});
```

### 2. Health Check Endpoints
```javascript
// Add to server routes
app.get('/health', async (req, res) => {
  const dbStatus = await checkDatabaseHealth();
  const memoryUsage = process.memoryUsage();
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    memory: memoryUsage,
    uptime: process.uptime()
  });
});
```

## Real-time Features Scaling

### WebSocket Optimization
```javascript
// server/src/websocket.js
const io = require('socket.io')(server, {
  cors: { origin: "*" },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6 // 1MB
});

// Room-based updates for better performance
io.on('connection', (socket) => {
  socket.on('join_driver_room', (driverId) => {
    socket.join(`driver_${driverId}`);
  });
  
  socket.on('join_admin_room', () => {
    socket.join('admin_dashboard');
  });
});

// Emit updates only to relevant rooms
const notifyDriverAssignment = (driverId, booking) => {
  io.to(`driver_${driverId}`).emit('new_assignment', booking);
  io.to('admin_dashboard').emit('booking_updated', booking);
};
```

## Cost Analysis

### Current vs Scaled Infrastructure
```
Current (Development):
- Server: $20/month (Basic VPS)
- Database: $15/month (Managed PostgreSQL)
- Total: $35/month

Scaled (1000 rides/day):
- Server: $60/month (4 CPU, 8GB RAM)
- Database: $45/month (Performance tier)
- CDN: $10/month (Static assets)
- Monitoring: $20/month (APM tools)
- Total: $135/month

Cost per ride: $0.135 (very reasonable!)
```

## Emergency Scaling Plan

### If you suddenly get 5000+ rides/day:
1. **Immediate (1 hour)**:
   - Scale server vertically (more CPU/RAM)
   - Enable database read replicas
   - Add Redis caching

2. **Short-term (1 week)**:
   - Implement horizontal scaling
   - Add load balancer
   - Database sharding by region

3. **Long-term (1 month)**:
   - Microservices architecture
   - Event-driven architecture
   - Auto-scaling infrastructure
