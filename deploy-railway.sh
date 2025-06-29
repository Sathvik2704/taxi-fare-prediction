#!/bin/bash

echo "🚀 Railway Deployment Script for India Taxi Fare"
echo "================================================"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found. Please initialize git first:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    exit 1
fi

# Check if changes are committed
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  You have uncommitted changes. Please commit them first:"
    echo "   git add ."
    echo "   git commit -m 'Prepare for Railway deployment'"
    exit 1
fi

echo "✅ Repository is ready for deployment"
echo ""
echo "📋 Next Steps:"
echo "1. Push your code to GitHub:"
echo "   git push origin main"
echo ""
echo "2. Go to Railway Dashboard:"
echo "   https://railway.app"
echo ""
echo "3. Create new project from GitHub repo"
echo ""
echo "4. Set environment variables in Railway:"
echo "   - MONGODB_URI (from MongoDB Atlas)"
echo "   - JWT_SECRET (random string)"
echo "   - GOOGLE_CLIENT_ID (optional)"
echo "   - GOOGLE_CLIENT_SECRET (optional)"
echo "   - FACEBOOK_APP_ID (optional)"
echo "   - FACEBOOK_APP_SECRET (optional)"
echo "   - NODE_ENV=production"
echo ""
echo "5. Deploy and get your Railway URL!"
echo ""
echo "📖 For detailed instructions, see: RAILWAY_DEPLOYMENT.md" 