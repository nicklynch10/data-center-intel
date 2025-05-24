#!/bin/bash
set -e

# Load environment variables
export $(grep -v '^#' .env.local | xargs)

APP_ID="d3bg9y1j0yk9xr"
BRANCH_NAME="main"

echo "Creating branch in Amplify..."
aws amplify create-branch \
  --app-id $APP_ID \
  --branch-name $BRANCH_NAME \
  --region us-east-2 || true

echo "Creating deployment..."
DEPLOYMENT_ID=$(aws amplify create-deployment \
  --app-id $APP_ID \
  --branch-name $BRANCH_NAME \
  --region us-east-2 \
  --query 'zipUploadUrl' \
  --output text)

echo "Upload URL: $DEPLOYMENT_ID"

# Create a simple index.html for testing
mkdir -p test-deploy
echo '<!DOCTYPE html><html><head><title>Data Center Intel</title></head><body><h1>Deploying...</h1><p>The full Next.js app will be deployed shortly.</p></body></html>' > test-deploy/index.html

# Create zip file
cd test-deploy
zip -r ../test-deploy.zip .
cd ..

# Upload to the presigned URL
curl -T test-deploy.zip "$DEPLOYMENT_ID"

echo "Starting deployment job..."
aws amplify start-deployment \
  --app-id $APP_ID \
  --branch-name $BRANCH_NAME \
  --region us-east-2

echo "Deployment started! Check status at:"
echo "https://console.aws.amazon.com/amplify/home?region=us-east-2#/$APP_ID/$BRANCH_NAME"