# SmartRoute Azure Deployment Guide

## Prerequisites

1. **Azure Account** with active subscription
2. **Azure CLI** installed locally
3. **Node.js 16+** and **npm**
4. **Git** for version control

## Deployment Architecture

```
SmartRoute on Azure
├── Frontend: Azure Static Web Apps
├── Backend: Azure App Service (Node.js)
├── Database: Azure Cosmos DB (MongoDB API)
└── Storage: Azure Blob Storage (for assets)
```

## Step 1: Azure CLI Login

```bash
# Install Azure CLI (if not installed)
# Windows: Download from https://aka.ms/installazurecliwindows
# macOS: brew install azure-cli
# Linux: curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login to Azure
az login

# Set your subscription (replace with your subscription ID)
az account set --subscription "your-subscription-id"

# Create resource group
az group create --name smartroute-rg --location "East US"
```

## Step 2: Prepare Application for Production

### 2.1 Backend Environment Configuration

Create production environment file:

```bash
# In server directory
cp .env.example .env.production
```

Update `.env.production` with production values:
```env
NODE_ENV=production
PORT=8080
MONGODB_URI=your-cosmos-db-connection-string
JWT_SECRET=your-production-jwt-secret-32-chars-min
JWT_EXPIRES_IN=7d
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
BCRYPT_ROUNDS=12
```

### 2.2 Update Backend for Production

```bash
cd server
npm install --production
```

Add production script to `package.json`:
```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "production": "NODE_ENV=production node src/server.js"
  }
}
```

### 2.3 Frontend Production Build

```bash
cd client
npm run build
```

## Step 3: Database Setup (Azure Cosmos DB)

```bash
# Create Cosmos DB account with MongoDB API
az cosmosdb create \
  --name smartroute-cosmos \
  --resource-group smartroute-rg \
  --kind MongoDB \
  --locations regionName="East US" \
  --default-consistency-level Session

# Get connection string
az cosmosdb keys list \
  --name smartroute-cosmos \
  --resource-group smartroute-rg \
  --type connection-strings
```

## Step 4: Backend Deployment (Azure App Service)

### 4.1 Create App Service Plan

```bash
az appservice plan create \
  --name smartroute-plan \
  --resource-group smartroute-rg \
  --sku B1 \
  --is-linux
```

### 4.2 Create Web App

```bash
az webapp create \
  --name smartroute-api \
  --resource-group smartroute-rg \
  --plan smartroute-plan \
  --runtime "NODE|18-lts"
```

### 4.3 Configure Environment Variables

```bash
# Set production environment variables
az webapp config appsettings set \
  --name smartroute-api \
  --resource-group smartroute-rg \
  --settings \
    NODE_ENV=production \
    MONGODB_URI="your-cosmos-db-connection-string" \
    JWT_SECRET="your-production-jwt-secret" \
    JWT_EXPIRES_IN=7d \
    GOOGLE_MAPS_API_KEY="your-google-maps-key"
```

### 4.4 Deploy Backend

```bash
# Zip the server directory
cd server
zip -r ../smartroute-api.zip . -x "node_modules/*" ".env*"

# Deploy to App Service
az webapp deployment source config-zip \
  --name smartroute-api \
  --resource-group smartroute-rg \
  --src ../smartroute-api.zip
```

## Step 5: Frontend Deployment (Azure Static Web Apps)

### 5.1 Create Static Web App

```bash
az staticwebapp create \
  --name smartroute-frontend \
  --resource-group smartroute-rg \
  --location "East US 2"
```

### 5.2 Update Frontend API URL

Update `client/src/config.ts`:
```typescript
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://smartroute-api.azurewebsites.net/api'
  : 'http://localhost:5000/api';
```

### 5.3 Deploy Frontend

```bash
# Build for production
cd client
npm run build

# Deploy to Static Web Apps
az staticwebapp deployment token show \
  --name smartroute-frontend \
  --resource-group smartroute-rg

# Use the deployment token with GitHub Actions or manual upload
```

## Step 6: Custom Domain & SSL (Optional)

```bash
# Add custom domain
az webapp config hostname add \
  --webapp-name smartroute-api \
  --resource-group smartroute-rg \
  --hostname api.smartroute.com

# Enable SSL
az webapp config ssl bind \
  --name smartroute-api \
  --resource-group smartroute-rg \
  --certificate-thumbprint <cert-thumbprint> \
  --ssl-type SNI
```

## Step 7: Monitoring & Logging

### 7.1 Enable Application Insights

```bash
az monitor app-insights component create \
  --app smartroute-insights \
  --location "East US" \
  --resource-group smartroute-rg \
  --application-type web

# Get instrumentation key
az monitor app-insights component show \
  --app smartroute-insights \
  --resource-group smartroute-rg \
  --query instrumentationKey
```

### 7.2 Configure Logging

```bash
az webapp log config \
  --name smartroute-api \
  --resource-group smartroute-rg \
  --application-logging filesystem \
  --level information
```

## Step 8: Production URLs

After deployment, your URLs will be:

- **Backend API**: `https://smartroute-api.azurewebsites.net`
- **Frontend**: `https://smartroute-frontend.azurestaticapps.net`
- **Database**: Azure Cosmos DB with MongoDB API

## Step 9: Post-Deployment Configuration

### 9.1 CORS Setup

```bash
az webapp cors add \
  --name smartroute-api \
  --resource-group smartroute-rg \
  --allowed-origins https://smartroute-frontend.azurestaticapps.net
```

### 9.2 Health Check

```bash
# Test backend health
curl https://smartroute-api.azurewebsites.net/api/health

# Test frontend
curl https://smartroute-frontend.azurestaticapps.net
```

## Security Considerations

1. **Environment Variables**: Never commit production secrets to Git
2. **HTTPS Only**: Ensure all endpoints use HTTPS
3. **CORS**: Configure strict CORS policies
4. **Authentication**: Use strong JWT secrets (32+ characters)
5. **Database**: Enable MongoDB authentication and encryption

## Cost Optimization

1. **App Service**: Use B1 Basic tier for development, scale up for production
2. **Cosmos DB**: Use shared throughput for cost efficiency
3. **Static Web Apps**: Free tier available for small applications
4. **Monitoring**: Basic Application Insights included

## Troubleshooting

### Common Issues:

1. **Connection String**: Ensure Cosmos DB connection string is correctly formatted
2. **CORS Errors**: Verify CORS settings in App Service
3. **Environment Variables**: Check all required env vars are set
4. **Build Failures**: Ensure Node.js version compatibility

### Useful Commands:

```bash
# View app logs
az webapp log tail --name smartroute-api --resource-group smartroute-rg

# Restart app
az webapp restart --name smartroute-api --resource-group smartroute-rg

# Check deployment status
az webapp deployment list --name smartroute-api --resource-group smartroute-rg
```

## Estimated Monthly Costs (USD)

- **App Service B1**: ~$13/month
- **Cosmos DB (Shared)**: ~$25/month
- **Static Web Apps**: Free tier
- **Application Insights**: ~$2/month
- **Total**: ~$40/month

## Next Steps After Deployment

1. Set up CI/CD pipeline with GitHub Actions
2. Configure custom domain names
3. Set up monitoring alerts
4. Implement backup strategies
5. Configure scaling rules