#!/bin/bash

# SmartRoute Azure Deployment Script
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🚀 SmartRoute Azure Deployment"
echo "============================="

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

# Step 2: Create Cosmos DB
echo -e "${BLUE}🗄️ Step 2: Creating Cosmos DB (this may take 5-10 minutes)...${NC}"
az cosmosdb create \
    --name $COSMOS_DB_NAME \
    --resource-group $RESOURCE_GROUP \
    --kind MongoDB \
    --locations regionName="$LOCATION" \
    --default-consistency-level Session \
    --output table

echo -e "${BLUE}🔗 Getting database connection string...${NC}"
MONGODB_URI=$(az cosmosdb keys list \
    --name $COSMOS_DB_NAME \
    --resource-group $RESOURCE_GROUP \
    --type connection-strings \
    --query 'connectionStrings[0].connectionString' -o tsv)

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
        MONGODB_URI="$MONGODB_URI" \
        JWT_SECRET="$JWT_SECRET" \
        JWT_EXPIRES_IN=7d \
        GOOGLE_MAPS_API_KEY="$GOOGLE_MAPS_KEY" \
        BCRYPT_ROUNDS=12 \
    --output table

# Step 6: Prepare and Deploy Backend
echo -e "${BLUE}📦 Step 6: Preparing backend for deployment...${NC}"

# Update server configuration for production
cd server

# Ensure we have the right start script
if ! grep -q '"start".*"node.*server.js"' package.json; then
    echo -e "${YELLOW}⚙️ Updating package.json start script...${NC}"
    # Create a temporary file with the updated package.json
    jq '.scripts.start = "node src/server.js"' package.json > package.json.tmp && mv package.json.tmp package.json
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

# Step 11: Get deployment info
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
echo -e "${GREEN}🎉 Deployment completed!${NC}"
echo "=================================="
echo ""
echo -e "${BLUE}📍 Your SmartRoute URLs:${NC}"
echo "🌐 Frontend: $FRONTEND_URL"
echo "🔧 Backend API: $API_URL"
echo "❤️ Health Check: ${API_URL}/api/health"
echo ""
echo -e "${BLUE}📝 Next Steps:${NC}"
echo "1. 📤 Deploy frontend to Static Web Apps:"
echo "   - Go to Azure Portal > Static Web Apps > $STATIC_APP_NAME"
echo "   - Upload the contents of client/build folder"
echo ""
echo "2. 🧪 Test your application:"
echo "   - Visit the frontend URL"
echo "   - Try logging in with demo credentials"
echo ""
echo "3. 🏷️ Configure custom domain (optional):"
echo "   - Add your own domain in Azure Portal"
echo ""
echo -e "${YELLOW}💰 Monthly cost: ~$40 USD${NC}"
echo -e "${GREEN}🇮🇳 Your corporate cab booking system is now live on Azure!${NC}"

# Save deployment info
cat > deployment-info.txt << EOF
SmartRoute Azure Deployment Info
================================

Frontend URL: $FRONTEND_URL
Backend API: $API_URL
Health Check: ${API_URL}/api/health

Resource Group: $RESOURCE_GROUP
API App Service: $API_APP_NAME
Static Web App: $STATIC_APP_NAME
Cosmos DB: $COSMOS_DB_NAME

Demo Credentials:
- Employee: priya@techcorp.com / emp123
- Driver: rajesh@smartroute.com / driver123
- Admin: admin@techcorp.com / admin123

Deployed on: $(date)
EOF

echo ""
echo -e "${GREEN}📄 Deployment info saved to deployment-info.txt${NC}"