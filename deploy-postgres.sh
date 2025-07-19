#!/bin/bash

# SmartRoute Azure Deployment Script with PostgreSQL
set -e

echo "🚀 SmartRoute Azure Deployment (PostgreSQL)"
echo "============================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Load configuration
if [ ! -f "deployment-config.env" ]; then
    echo -e "${RED}❌ Configuration file not found. Run ./setup-deployment.sh first${NC}"
    exit 1
fi

source deployment-config.env

echo -e "${BLUE}📋 Deploying with configuration:${NC}"
echo "App Name: $APP_NAME"
echo "Location: $LOCATION"
echo "Resource Group: $RESOURCE_GROUP"
echo ""

# Step 1: Create Resource Group
echo -e "${BLUE}📦 Step 1: Creating resource group...${NC}"
az group create --name $RESOURCE_GROUP --location "$LOCATION" --output table

# Step 2: Create PostgreSQL Server
echo -e "${BLUE}🗄️ Step 2: Creating PostgreSQL server...${NC}"
POSTGRES_SERVER_NAME="${APP_NAME}-postgres"
POSTGRES_USERNAME="smartrouteadmin"
POSTGRES_PASSWORD="SmartRoute2024!"

az postgres flexible-server create \
    --name $POSTGRES_SERVER_NAME \
    --resource-group $RESOURCE_GROUP \
    --location "$LOCATION" \
    --admin-user $POSTGRES_USERNAME \
    --admin-password "$POSTGRES_PASSWORD" \
    --sku-name Standard_B1ms \
    --tier Burstable \
    --storage-size 32 \
    --version 14 \
    --yes \
    --output table

# Create database
echo -e "${BLUE}🗃️ Creating database...${NC}"
az postgres flexible-server db create \
    --resource-group $RESOURCE_GROUP \
    --server-name $POSTGRES_SERVER_NAME \
    --database-name smartroute

# Configure firewall to allow Azure services
echo -e "${BLUE}🔥 Configuring firewall...${NC}"
az postgres flexible-server firewall-rule create \
    --resource-group $RESOURCE_GROUP \
    --name $POSTGRES_SERVER_NAME \
    --rule-name AllowAzureServices \
    --start-ip-address 0.0.0.0 \
    --end-ip-address 0.0.0.0

# Get connection string
POSTGRES_CONNECTION_STRING="postgresql://${POSTGRES_USERNAME}:${POSTGRES_PASSWORD}@${POSTGRES_SERVER_NAME}.postgres.database.azure.com/smartroute"

# Step 3: Create App Service Plan
echo -e "${BLUE}🏗️ Step 3: Creating App Service Plan...${NC}"
az appservice plan create \
    --name $APP_SERVICE_PLAN \
    --resource-group $RESOURCE_GROUP \
    --sku B1 \
    --is-linux \
    --output table

# Step 4: Create Web App for API
echo -e "${BLUE}🌐 Step 4: Creating Web App for API...${NC}"
az webapp create \
    --name $API_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --plan $APP_SERVICE_PLAN \
    --runtime "NODE|18-lts" \
    --output table

# Step 5: Configure Environment Variables
echo -e "${BLUE}⚙️ Step 5: Configuring environment variables...${NC}"
az webapp config appsettings set \
    --name $API_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --settings \
        NODE_ENV=production \
        PORT=8080 \
        DATABASE_URL="$POSTGRES_CONNECTION_STRING" \
        JWT_SECRET="$JWT_SECRET" \
        JWT_EXPIRES_IN=7d \
        GOOGLE_MAPS_API_KEY="$GOOGLE_MAPS_KEY" \
        BCRYPT_ROUNDS=12 \
    --output table

# Step 6: Update backend for PostgreSQL
echo -e "${BLUE}📦 Step 6: Preparing backend for PostgreSQL...${NC}"
cd server

# Install PostgreSQL driver
npm install pg sequelize --save

# Create PostgreSQL models
mkdir -p src/models/postgres
cat > src/models/postgres/database.js << 'EOF'
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false
});

module.exports = sequelize;
EOF

cat > src/models/postgres/User.js << 'EOF'
const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('employee', 'driver', 'company_admin'),
    allowNull: false,
    defaultValue: 'employee'
  },
  phone: DataTypes.STRING,
  companyId: DataTypes.UUID,
  employeeId: DataTypes.STRING,
  department: DataTypes.STRING,
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true
});

module.exports = User;
EOF

cat > src/models/postgres/CabBooking.js << 'EOF'
const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const CabBooking = sequelize.define('CabBooking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  employeeId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  driverId: DataTypes.UUID,
  tripType: {
    type: DataTypes.ENUM('home_to_office', 'office_to_home'),
    allowNull: false
  },
  pickupLocation: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  dropLocation: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  scheduledTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled'),
    defaultValue: 'pending'
  },
  fare: DataTypes.DECIMAL(10, 2),
  specialRequests: DataTypes.TEXT,
  rating: DataTypes.INTEGER,
  feedback: DataTypes.TEXT
}, {
  timestamps: true
});

module.exports = CabBooking;
EOF

# Create simple server for PostgreSQL
cat > src/server-postgres.js << 'EOF'
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sequelize = require('./models/postgres/database');
const User = require('./models/postgres/User');
const CabBooking = require('./models/postgres/CabBooking');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Auth endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, role = 'employee' } = req.body;
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      role
    });
    
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
    res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Booking endpoints
app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await CabBooking.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const booking = await CabBooking.create(req.body);
    res.status(201).json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Initialize database and start server
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');
    
    await sequelize.sync({ force: false });
    console.log('Database synchronized');
    
    // Create demo users
    const demoUsers = [
      { email: 'priya@techcorp.com', password: 'emp123', name: 'Priya Singh', role: 'employee' },
      { email: 'rajesh@smartroute.com', password: 'driver123', name: 'Rajesh Kumar', role: 'driver' },
      { email: 'admin@techcorp.com', password: 'admin123', name: 'Admin User', role: 'company_admin' }
    ];
    
    for (const userData of demoUsers) {
      const existingUser = await User.findOne({ where: { email: userData.email } });
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        await User.create({ ...userData, password: hashedPassword });
        console.log(`Created demo user: ${userData.email}`);
      }
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 SmartRoute API running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
}

startServer();
EOF

# Update package.json to use PostgreSQL server
if grep -q "server.js" package.json; then
    sed -i.bak 's/server.js/server-postgres.js/g' package.json
fi

# Install dependencies
npm install --silent

# Create deployment package
echo -e "${BLUE}📦 Creating deployment package...${NC}"
zip -r ../smartroute-api.zip . -x "node_modules/*" ".env*" "*.log" -q

cd ..

# Deploy to Azure
echo -e "${BLUE}🚀 Step 7: Deploying backend to Azure...${NC}"
az webapp deployment source config-zip \
    --name $API_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --src smartroute-api.zip

# Step 8: Create Static Web App
echo -e "${BLUE}🌐 Step 8: Creating Static Web App...${NC}"
STATIC_APP_JSON=$(az staticwebapp create \
    --name $STATIC_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --location "East US 2" \
    --output json)

STATIC_APP_URL=$(echo $STATIC_APP_JSON | jq -r '.defaultHostname')

# Step 9: Configure CORS
echo -e "${BLUE}🔒 Step 9: Configuring CORS...${NC}"
az webapp cors add \
    --name $API_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --allowed-origins "https://$STATIC_APP_URL" "http://localhost:3000"

# Step 10: Prepare Frontend
echo -e "${BLUE}⚙️ Step 10: Preparing frontend...${NC}"
cd client

# Update config with production API URL
cat > src/config.ts << EOF
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://${API_APP_NAME}.azurewebsites.net/api'
  : 'http://localhost:5000/api';

export const APP_VERSION = '1.0.0';
export const APP_NAME = 'SmartRoute Corporate Cab Booking';
EOF

# Build frontend
echo -e "${BLUE}🏗️ Building frontend for production...${NC}"
npm run build

cd ..

# Get deployment info
API_URL="https://${API_APP_NAME}.azurewebsites.net"
FRONTEND_URL="https://${STATIC_APP_URL}"

# Test deployment
echo -e "${BLUE}🧪 Testing deployment...${NC}"
echo "Waiting for API to start..."
sleep 60

if curl -f -s "${API_URL}/api/health" > /dev/null; then
    echo -e "${GREEN}✅ Backend API is responding${NC}"
else
    echo -e "${YELLOW}⚠️ Backend API may still be starting up${NC}"
fi

# Clean up
rm -f smartroute-api.zip

# Final instructions
echo ""
echo -e "${GREEN}🎉 PostgreSQL Deployment completed!${NC}"
echo "============================================"
echo ""
echo -e "${BLUE}📍 Your SmartRoute URLs:${NC}"
echo "🌐 Frontend: $FRONTEND_URL"
echo "🔧 Backend API: $API_URL"
echo "❤️ Health Check: ${API_URL}/api/health"
echo "🗃️ Database: PostgreSQL on Azure"
echo ""
echo -e "${BLUE}📝 Database Connection:${NC}"
echo "Server: ${POSTGRES_SERVER_NAME}.postgres.database.azure.com"
echo "Database: smartroute"
echo "Username: $POSTGRES_USERNAME"
echo ""
echo -e "${BLUE}📝 Demo Credentials:${NC}"
echo "- Employee: priya@techcorp.com / emp123"
echo "- Driver: rajesh@smartroute.com / driver123"
echo "- Admin: admin@techcorp.com / admin123"
echo ""
echo -e "${YELLOW}💰 Monthly cost: ~$25 USD (PostgreSQL is more cost-effective)${NC}"
echo -e "${GREEN}🇮🇳 Your corporate cab booking system is now live on Azure!${NC}"

# Save deployment info
cat > deployment-info.txt << EOF
SmartRoute Azure Deployment Info (PostgreSQL)
=============================================

Frontend URL: $FRONTEND_URL
Backend API: $API_URL
Health Check: ${API_URL}/api/health

Database: PostgreSQL
Server: ${POSTGRES_SERVER_NAME}.postgres.database.azure.com
Database: smartroute
Username: $POSTGRES_USERNAME

Resource Group: $RESOURCE_GROUP
API App Service: $API_APP_NAME
Static Web App: $STATIC_APP_NAME
PostgreSQL Server: $POSTGRES_SERVER_NAME

Demo Credentials:
- Employee: priya@techcorp.com / emp123
- Driver: rajesh@smartroute.com / driver123
- Admin: admin@techcorp.com / admin123

Deployed on: $(date)
EOF

echo ""
echo -e "${GREEN}📄 Deployment info saved to deployment-info.txt${NC}"