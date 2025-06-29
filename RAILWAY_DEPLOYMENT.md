# Railway Deployment Guide for India Taxi Fare

## Prerequisites
1. GitHub account with your project repository
2. Railway account (free tier available)
3. MongoDB database (MongoDB Atlas recommended)

## Step 1: Prepare Your Repository

Your project is now configured for Railway deployment with:
- ✅ Unified server (Next.js + Express) in `server.js`
- ✅ Updated `package.json` with all dependencies
- ✅ Railway configuration in `railway.json`
- ✅ API endpoints updated to use `/api` prefix

## Step 2: Set Up MongoDB Database

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account and cluster
3. Get your connection string (format: `mongodb+srv://username:password@cluster.mongodb.net/taxi-app`)

## Step 3: Deploy to Railway

### Option A: Deploy via Railway Dashboard

1. **Connect Repository**
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

2. **Configure Environment Variables**
   - In your Railway project dashboard, go to "Variables" tab
   - Add the following environment variables:

```env
# Database
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/taxi-app

# JWT Secret (generate a random string)
JWT_SECRET=your_super_secret_jwt_key_here

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Facebook OAuth (optional)
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# App Configuration
NODE_ENV=production
PORT=3000
```

3. **Deploy**
   - Railway will automatically detect your Node.js project
   - It will run `npm install` and `npm run railway:start`
   - Your app will be deployed to a Railway URL

### Option B: Deploy via Railway CLI

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Deploy**
   ```bash
   railway login
   railway init
   railway up
   ```

## Step 4: Configure Custom Domain (Optional)

1. In Railway dashboard, go to "Settings" tab
2. Click "Custom Domains"
3. Add your domain and configure DNS

## Step 5: Update OAuth Redirect URIs

If using Google/Facebook OAuth:

1. **Google Console**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Add your Railway URL to authorized redirect URIs:
     - `https://your-app.railway.app/auth/google/callback`

2. **Facebook Developers**
   - Go to [Facebook Developers](https://developers.facebook.com)
   - Add your Railway URL to OAuth redirect URIs:
     - `https://your-app.railway.app/auth/facebook/callback`

## Step 6: Test Your Deployment

1. **Frontend**: Visit your Railway URL
2. **API Endpoints**: Test with Postman or curl:
   - `POST /api/register` - User registration
   - `POST /api/login` - User login
   - `POST /api/feedback` - Submit feedback
   - `GET /api/admin/feedback` - Admin feedback (requires JWT)

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | ✅ Yes |
| `JWT_SECRET` | Secret key for JWT tokens | ✅ Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | ❌ Optional |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | ❌ Optional |
| `FACEBOOK_APP_ID` | Facebook OAuth app ID | ❌ Optional |
| `FACEBOOK_APP_SECRET` | Facebook OAuth app secret | ❌ Optional |
| `NODE_ENV` | Environment (production/development) | ✅ Yes |
| `PORT` | Port number (Railway sets this automatically) | ❌ Auto |

## Troubleshooting

### Common Issues:

1. **Build Fails**
   - Check Railway logs for error messages
   - Ensure all dependencies are in `package.json`

2. **Database Connection Fails**
   - Verify `MONGODB_URI` is correct
   - Check MongoDB Atlas network access settings

3. **CORS Errors**
   - Railway automatically handles CORS for your domain
   - Check if you're accessing from the correct URL

4. **OAuth Not Working**
   - Verify redirect URIs in Google/Facebook console
   - Check environment variables are set correctly

### Railway Logs
- View logs in Railway dashboard under "Deployments" tab
- Use `railway logs` command if using CLI

## Monitoring and Scaling

1. **Railway Dashboard**
   - Monitor CPU, memory usage
   - View request logs
   - Set up alerts

2. **Custom Domain**
   - Railway provides SSL certificates automatically
   - Configure DNS records as instructed

3. **Scaling**
   - Railway automatically scales based on traffic
   - Upgrade plan for more resources if needed

## Security Best Practices

1. **Environment Variables**
   - Never commit secrets to Git
   - Use Railway's secure variable storage

2. **JWT Secret**
   - Use a strong, random string
   - Rotate periodically

3. **Database**
   - Use MongoDB Atlas with network restrictions
   - Enable authentication

4. **CORS**
   - Only allow necessary origins
   - Railway handles this automatically

## Support

- Railway Documentation: [docs.railway.app](https://docs.railway.app)
- Railway Discord: [discord.gg/railway](https://discord.gg/railway)
- MongoDB Atlas Support: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com) 