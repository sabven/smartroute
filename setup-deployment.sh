#!/bin/bash

# SmartRoute Azure Deployment Setup
echo "🚀 SmartRoute Azure Deployment Setup"
echo "======================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${BLUE}This script will help you deploy SmartRoute to Azure.${NC}"
echo ""

# Check Azure CLI
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI is not installed.${NC}"
    echo ""
    echo "Please install Azure CLI first:"
    echo "macOS: brew install azure-cli"
    echo "Windows: Download from https://aka.ms/installazurecliwindows"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Azure CLI is installed${NC}"

# Check login
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}🔐 Please login to Azure first:${NC}"
    az login
fi

SUBSCRIPTION=$(az account show --query name -o tsv)
echo -e "${GREEN}✅ Logged in to Azure subscription: $SUBSCRIPTION${NC}"
echo ""

# Collect deployment configuration
echo -e "${BLUE}📝 Deployment Configuration${NC}"
echo "Please provide the following information:"
echo ""

# Resource naming
echo -e "${YELLOW}1. Application Name (will be used for Azure resources):${NC}"
read -p "Enter a unique name (lowercase, no spaces): " APP_NAME

if [[ ! "$APP_NAME" =~ ^[a-z][a-z0-9-]*[a-z0-9]$ ]]; then
    echo -e "${RED}❌ Invalid name. Use lowercase letters, numbers, and hyphens only.${NC}"
    exit 1
fi

# Region selection
echo ""
echo -e "${YELLOW}2. Select Azure Region:${NC}"
echo "1) East US (recommended for global access)"
echo "2) Central India (closer to your target market)"
echo "3) West Europe (GDPR compliant)"
read -p "Choose region (1-3): " REGION_CHOICE

case $REGION_CHOICE in
    1) LOCATION="East US" ;;
    2) LOCATION="Central India" ;;
    3) LOCATION="West Europe" ;;
    *) LOCATION="East US" ;;
esac

# JWT Secret
echo ""
echo -e "${YELLOW}3. Security Configuration:${NC}"
echo "Enter a JWT secret (must be at least 32 characters):"
echo "Suggestion: Use a password manager to generate a strong secret"
read -s -p "JWT Secret: " JWT_SECRET
echo ""

if [ ${#JWT_SECRET} -lt 32 ]; then
    echo -e "${RED}❌ JWT Secret must be at least 32 characters${NC}"
    exit 1
fi

# Google Maps API Key
echo ""
echo -e "${YELLOW}4. Google Maps API Key (optional):${NC}"
echo "This is needed for map features. You can add it later."
read -p "Google Maps API Key (or press Enter to skip): " GOOGLE_MAPS_KEY

# Confirmation
echo ""
echo -e "${BLUE}📋 Deployment Summary${NC}"
echo "================================"
echo "App Name: $APP_NAME"
echo "Region: $LOCATION"
echo "JWT Secret: [CONFIGURED]"
echo "Google Maps: $([ -n "$GOOGLE_MAPS_KEY" ] && echo "CONFIGURED" || echo "SKIPPED")"
echo ""
echo "Resources to be created:"
echo "- Resource Group: ${APP_NAME}-rg"
echo "- App Service: ${APP_NAME}-api"
echo "- Static Web App: ${APP_NAME}-frontend"
echo "- Cosmos DB: ${APP_NAME}-cosmos"
echo ""
echo -e "${YELLOW}Estimated monthly cost: ~$40 USD${NC}"
echo ""

read -p "Proceed with deployment? (y/N): " CONFIRM

if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# Save configuration
cat > deployment-config.env << EOF
APP_NAME=$APP_NAME
LOCATION=$LOCATION
JWT_SECRET=$JWT_SECRET
GOOGLE_MAPS_KEY=$GOOGLE_MAPS_KEY
RESOURCE_GROUP=${APP_NAME}-rg
APP_SERVICE_PLAN=${APP_NAME}-plan
API_APP_NAME=${APP_NAME}-api
STATIC_APP_NAME=${APP_NAME}-frontend
COSMOS_DB_NAME=${APP_NAME}-cosmos
EOF

echo ""
echo -e "${GREEN}✅ Configuration saved to deployment-config.env${NC}"
echo -e "${BLUE}🚀 Ready to deploy! Run: ./deploy-to-azure.sh${NC}"