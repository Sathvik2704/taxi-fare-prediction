# GitHub Repository Setup Guide

## Step 1: Create Repository on GitHub

1. **Go to GitHub.com** and sign in to your account (Sathvik2704)
2. **Click the "+" icon** in the top right corner
3. **Select "New repository"**
4. **Fill in the repository details:**
   - **Repository name**: `taxi-fare-prediction`
   - **Description**: `India Taxi Fare Prediction App - Full-stack Next.js application with Express backend`
   - **Visibility**: Choose Public or Private
   - **DO NOT** check any initialization options (README, .gitignore, license)
5. **Click "Create repository"**

## Step 2: Push Your Code

After creating the repository, run these commands in your terminal:

```bash
# Push your code to GitHub
git push -u origin main
```

## Step 3: Authentication (if needed)

If you get an authentication error, you'll need to:

### Option A: Use Personal Access Token
1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate a new token with "repo" permissions
3. Use the token as your password when prompted

### Option B: Use GitHub CLI
```bash
# Install GitHub CLI
winget install GitHub.cli

# Login
gh auth login
```

## Step 4: Verify Upload

1. Go to your GitHub repository: `https://github.com/Sathvik2704/taxi-fare-prediction`
2. You should see all your files uploaded
3. Check that the commit message shows: "Configure project for Railway deployment"

## Next Steps

Once your code is on GitHub, proceed to Railway deployment:

1. Go to [Railway.app](https://railway.app)
2. Create new project from GitHub repo
3. Follow the Railway deployment guide in `RAILWAY_DEPLOYMENT.md`

## Troubleshooting

### If "Repository not found" error:
- Make sure you created the repository on GitHub first
- Check the repository name matches exactly: `taxi-fare-prediction`
- Verify you're signed into the correct GitHub account

### If authentication fails:
- Use Personal Access Token instead of password
- Or set up SSH keys for authentication 