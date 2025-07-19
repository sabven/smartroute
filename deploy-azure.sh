#!/bin/bash

# SmartRoute Azure Deployment Script
# Run this script to deploy SmartRoute to Azure

set -e

echo "🚀 Starting SmartRoute deployment to Azure..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RESOURCE_GROUP="smartroute-rg"
LOCATION="East US"
APP_SERVICE_PLAN="smartroute-plan"
API_APP_NAME="smartroute-api-$(date +%s)"
STATIC_APP_NAME="smartroute-frontend"
COSMOS_DB_NAME="smartroute-cosmos"

echo -e "${BLUE}Configuration:${NC}"
echo "Resource Group: $RESOURCE_GROUP"
echo "Location: $LOCATION"
echo "API App Name: $API_APP_NAME"
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI is not installed. Please install it first:${NC}"
    echo "https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if user is logged in
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}🔐 Please login to Azure first:${NC}"
    az login
fi

# Get current subscription
SUBSCRIPTION=$(az account show --query id -o tsv)
echo -e "${GREEN}✅ Using subscription: $SUBSCRIPTION${NC}"

# Prompt for environment variables
echo -e "${YELLOW}📝 Please provide the following configuration:${NC}"

read -p "JWT Secret (32+ characters): " JWT_SECRET
if [ ${#JWT_SECRET} -lt 32 ]; then
    echo -e "${RED}❌ JWT Secret must be at least 32 characters${NC}"
    exit 1
fi

read -p "Google Maps API Key (optional, press enter to skip): " GOOGLE_MAPS_KEY

# Step 1: Create Resource Group
echo -e "${BLUE}📦 Creating resource group...${NC}"
az group create --name $RESOURCE_GROUP --location "$LOCATION" --output table

# Step 2: Create Cosmos DB
echo -e "${BLUE}🗄️ Creating Cosmos DB (MongoDB API)...${NC}"
az cosmosdb create \
    --name $COSMOS_DB_NAME \
    --resource-group $RESOURCE_GROUP \
    --kind MongoDB \
    --locations regionName="$LOCATION" \
    --default-consistency-level Session \
    --output table

# Get Cosmos DB connection string
echo -e "${BLUE}🔗 Getting database connection string...${NC}"
MONGODB_URI=$(az cosmosdb keys list \
    --name $COSMOS_DB_NAME \
    --resource-group $RESOURCE_GROUP \
    --type connection-strings \
    --query 'connectionStrings[0].connectionString' -o tsv)

# Step 3: Create App Service Plan
echo -e "${BLUE}🏗️ Creating App Service Plan...${NC}"
az appservice plan create \
    --name $APP_SERVICE_PLAN \
    --resource-group $RESOURCE_GROUP \
    --sku B1 \
    --is-linux \
    --output table

# Step 4: Create Web App for API
echo -e "${BLUE}🌐 Creating Web App for API...${NC}"
az webapp create \
    --name $API_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --plan $APP_SERVICE_PLAN \
    --runtime "NODE|18-lts" \
    --output table

# Step 5: Configure API Environment Variables
echo -e "${BLUE}⚙️ Configuring environment variables...${NC}"
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

# Step 6: Prepare backend for deployment
echo -e "${BLUE}📦 Preparing backend for deployment...${NC}"
cd server

# Create production package.json if it doesn't exist
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found in server directory${NC}"
    exit 1
fi

# Install production dependencies
npm install --production --silent

# Create deployment package
echo -e "${BLUE}📦 Creating deployment package...${NC}"
zip -r ../smartroute-api.zip . -x "node_modules/*" ".env*" "*.log" -q

cd ..

# Step 7: Deploy backend
echo -e "${BLUE}🚀 Deploying backend to Azure...${NC}"
az webapp deployment source config-zip \
    --name $API_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --src smartroute-api.zip

# Step 8: Create Static Web App for frontend
echo -e "${BLUE}🌐 Creating Static Web App for frontend...${NC}"
STATIC_APP_JSON=$(az staticwebapp create \
    --name $STATIC_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --location "East US 2" \
    --output json)

STATIC_APP_URL=$(echo $STATIC_APP_JSON | jq -r '.defaultHostname')

# Step 9: Configure CORS
echo -e "${BLUE}🔒 Configuring CORS...${NC}"
az webapp cors add \
    --name $API_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --allowed-origins "https://$STATIC_APP_URL" "http://localhost:3000"

# Step 10: Update frontend configuration
echo -e "${BLUE}⚙️ Updating frontend configuration...${NC}"
cd client

# Create config file
cat > src/config.ts << EOF
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://${API_APP_NAME}.azurewebsites.net/api'
  : 'http://localhost:5000/api';

export const APP_VERSION = '1.0.0';
export const APP_NAME = 'SmartRoute Corporate Cab Booking';
EOF

# Build frontend
echo -e "${BLUE}🏗️ Building frontend...${NC}"
npm run build

cd ..

# Step 11: Get deployment URLs
API_URL="https://${API_APP_NAME}.azurewebsites.net"
FRONTEND_URL="https://${STATIC_APP_URL}"

# Step 12: Test deployment
echo -e "${BLUE}🧪 Testing deployment...${NC}"
sleep 30  # Wait for deployment to complete

if curl -f -s "${API_URL}/api/health" > /dev/null; then
    echo -e "${GREEN}✅ Backend API is responding${NC}"
else
    echo -e "${YELLOW}⚠️ Backend API may still be starting up${NC}"
fi

# Clean up
rm -f smartroute-api.zip

# Final output
echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}📍 Deployment URLs:${NC}"
echo "Frontend: $FRONTEND_URL"
echo "Backend API: $API_URL"
echo "Health Check: ${API_URL}/api/health"
echo ""
echo -e "${BLUE}📝 Next Steps:${NC}"
echo "1. Deploy frontend manually to Static Web Apps using Azure portal"
echo "2. Test the application endpoints"
echo "3. Configure custom domain (optional)"
echo "4. Set up monitoring and alerts"
echo ""
echo -e "${BLUE}💰 Estimated monthly cost: ~$40 USD${NC}"
echo ""
echo -e "${YELLOW}📋 Save these URLs for reference!${NC}"