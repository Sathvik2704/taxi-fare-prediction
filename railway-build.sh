#!/bin/bash

echo "🚀 Railway Build Script for India Taxi Fare"
echo "============================================"

# Clean any existing build artifacts
echo "🧹 Cleaning build cache..."
rm -rf .next
rm -rf node_modules/.cache

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo "🚀 Ready for deployment!"
else
    echo "❌ Build failed!"
    exit 1
fi 