#!/bin/bash
# Script to set Railway environment variables from .env file

# Source the .env file to load variables
source .env

echo "Setting Railway environment variables..."

railway variables \
  --set "R2_ACCOUNT_ID=$R2_ACCOUNT_ID" \
  --set "R2_ACCESS_KEY_ID=$R2_ACCESS_KEY_ID" \
  --set "R2_SECRET_ACCESS_KEY=$R2_SECRET_ACCESS_KEY" \
  --set "R2_BUCKET_NAME=$R2_BUCKET_NAME" \
  --set "R2_PUBLIC_URL=$R2_PUBLIC_URL"

echo "Done! Railway will automatically redeploy."
