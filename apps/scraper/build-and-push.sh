#!/bin/bash
set -e

# Load environment variables
source ../../.env.local

# Variables
AWS_REGION=${AWS_REGION:-us-east-2}
AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID}
ECR_REPOSITORY="data-center-intel-scraper-prod"
IMAGE_TAG=${1:-latest}

if [ -z "$AWS_ACCOUNT_ID" ]; then
  echo "Error: AWS_ACCOUNT_ID not set"
  exit 1
fi

ECR_URL="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
FULL_IMAGE_NAME="${ECR_URL}/${ECR_REPOSITORY}:${IMAGE_TAG}"

echo "🔑 Logging into ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_URL}

echo "🏗️  Building Docker image..."
docker build -t ${ECR_REPOSITORY}:${IMAGE_TAG} -f Dockerfile ../..

echo "🏷️  Tagging image..."
docker tag ${ECR_REPOSITORY}:${IMAGE_TAG} ${FULL_IMAGE_NAME}

echo "📤 Pushing image to ECR..."
docker push ${FULL_IMAGE_NAME}

echo "✅ Successfully pushed ${FULL_IMAGE_NAME}"
echo ""
echo "To deploy this image, update the ECS task definition to use:"
echo "  ${FULL_IMAGE_NAME}"