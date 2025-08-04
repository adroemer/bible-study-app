#!/bin/bash

# Azure Static Web Apps Environment Configuration Script
# This script configures environment variables for the Azure Functions

echo "Setting up Azure Static Web Apps environment variables..."

# Get the resource group and app name (corrected from discovery)
RESOURCE_GROUP="Bible_Study"
APP_NAME="bible-study-app"

echo "Resource Group: $RESOURCE_GROUP"
echo "App Name: $APP_NAME"

# Check if we're logged in to Azure
if ! az account show &> /dev/null; then
    echo "Please run 'az login' first to authenticate with Azure"
    exit 1
fi

echo ""
echo "⚠️  IMPORTANT: You need to provide the actual values for these environment variables:"
echo "   - AZURE_OPENAI_API_KEY (from your Azure OpenAI service)"
echo "   - AZURE_OPENAI_ENDPOINT (e.g., https://biblestudyopenai.openai.azure.com/)"
echo "   - DEPLOYMENT_NAME (e.g., gpt-4o-mini)"
echo ""

read -p "Enter your AZURE_OPENAI_API_KEY: " AZURE_OPENAI_API_KEY
read -p "Enter your AZURE_OPENAI_ENDPOINT: " AZURE_OPENAI_ENDPOINT
read -p "Enter your DEPLOYMENT_NAME [gpt-4o-mini]: " DEPLOYMENT_NAME
DEPLOYMENT_NAME=${DEPLOYMENT_NAME:-gpt-4o-mini}

echo ""
echo "Configuring environment variables for Azure Functions..."

# Set the environment variables 
az staticwebapp appsettings set \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --setting-names \
        "AZURE_OPENAI_API_KEY=$AZURE_OPENAI_API_KEY" \
        "AZURE_OPENAI_ENDPOINT=$AZURE_OPENAI_ENDPOINT" \
        "DEPLOYMENT_NAME=$DEPLOYMENT_NAME"

if [ $? -eq 0 ]; then
    echo "✅ Environment variables configured successfully!"
    echo "The Azure Functions should now have access to the OpenAI credentials."
    echo ""
    echo "Test the configuration by visiting:"
    echo "https://kind-mud-094d4dc0f.2.azurestaticapps.net/api/test"
    echo ""
    echo "If the test shows all environment variables as 'true', try the main app!"
else
    echo "❌ Failed to configure environment variables."
    echo "Please check your Azure permissions and resource names."
    exit 1
fi