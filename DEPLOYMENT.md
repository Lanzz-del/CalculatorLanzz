# Deployment Guide

This guide will walk you through deploying the AI Super-App to production.

## Prerequisites

- GitHub account
- Supabase account
- Google Cloud Console project
- Vercel account (for frontend)
- Railway or Render account (for backend)

## Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Fill in project details
4. Wait for project to be created

### 1.2 Create Database Tables

Go to SQL Editor and run:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  google_id TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User API keys table
CREATE TABLE user_api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  openai_key TEXT,
  anthropic_key TEXT,
  google_gemini_key TEXT,
  deepseek_key TEXT,
  binance_key TEXT,
  binance_secret TEXT,
  news_api_key TEXT,
  openweather_key TEXT,
  fred_api_key TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

-- Create policies (optional, backend uses service key)
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view own API keys" ON user_api_keys
  FOR SELECT USING (auth.uid() = user_id);
```

### 1.3 Get Supabase Credentials

1. Go to Project Settings > API
2. Copy:
   - Project URL (SUPABASE_URL)
   - anon/public key (SUPABASE_ANON_KEY)
   - service_role key (SUPABASE_SERVICE_KEY)

## Step 2: Google OAuth Setup

### 2.1 Create OAuth Credentials

1. Go to https://console.cloud.google.com
2. Create new project or select existing
3. Go to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Choose "Web application"
6. Add authorized JavaScript origins:
   ```
   http://localhost:3000
   https://your-frontend-domain.vercel.app
   ```
7. Add authorized redirect URIs:
   ```
   http://localhost:3000
   https://your-frontend-domain.vercel.app
   ```
8. Copy Client ID and Client Secret

### 2.2 Enable Google+ API

1. Go to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click "Enable"

## Step 3: Backend Deployment (Railway)

### 3.1 Install Railway CLI

```bash
npm install -g @railway/cli
```

### 3.2 Login to Railway

```bash
railway login
```

### 3.3 Initialize Project

```bash
cd backend
railway init
```

### 3.4 Add Environment Variables

In Railway dashboard, add these variables:

```
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend-domain.vercel.app

SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

JWT_SECRET=generate_a_random_string_here
```

### 3.5 Deploy

```bash
railway up
```

### 3.6 Get Backend URL

After deployment, Railway will provide a URL like:
`https://your-app.railway.app`

## Step 4: Backend Deployment (Alternative: Render)

### 4.1 Create New Web Service

1. Go to https://render.com
2. Click "New" > "Web Service"
3. Connect your GitHub repository
4. Configure:
   - Name: ai-super-app-backend
   - Environment: Node
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`

### 4.2 Add Environment Variables

Add the same variables as Railway (see Step 3.4)

### 4.3 Deploy

Click "Create Web Service"

## Step 5: Frontend Deployment (Vercel)

### 5.1 Update API URL

Edit `frontend/js/app.js`:

```javascript
const API_URL = 'https://your-backend-url.railway.app/api';
```

Edit `frontend/login.html`:

```javascript
const API_URL = 'https://your-backend-url.railway.app/api';
const GOOGLE_CLIENT_ID = 'your_actual_google_client_id';
```

### 5.2 Deploy with Vercel CLI

```bash
npm install -g vercel
cd frontend
vercel
```

Follow the prompts:
- Set up and deploy? Yes
- Which scope? Your account
- Link to existing project? No
- Project name? ai-super-app
- Directory? ./
- Override settings? No

### 5.3 Deploy to Production

```bash
vercel --prod
```

### 5.4 Alternative: Deploy via Vercel Dashboard

1. Go to https://vercel.com
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - Framework Preset: Other
   - Root Directory: frontend
   - Build Command: (leave empty)
   - Output Directory: (leave empty)
5. Click "Deploy"

## Step 6: Update Google OAuth

After deployment, update Google OAuth settings:

1. Go to Google Cloud Console
2. Edit OAuth client
3. Add production URLs to authorized origins and redirect URIs:
   ```
   https://your-frontend-domain.vercel.app
   ```

## Step 7: Test Deployment

### 7.1 Test Backend

```bash
curl https://your-backend-url.railway.app/health
```

Should return: `{"status":"ok","timestamp":"..."}`

### 7.2 Test Frontend

1. Visit your Vercel URL
2. Try logging in with Google
3. Add API keys in settings
4. Test AI chat
5. Check market data
6. Try trading tools

## Step 8: Configure Custom Domain (Optional)

### Frontend (Vercel)

1. Go to Vercel dashboard
2. Select your project
3. Go to "Settings" > "Domains"
4. Add your custom domain
5. Follow DNS configuration instructions

### Backend (Railway)

1. Go to Railway dashboard
2. Select your project
3. Go to "Settings" > "Domains"
4. Add custom domain
5. Configure DNS records

## Environment Variables Summary

### Backend (.env)

```env
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend-domain.vercel.app

SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

JWT_SECRET=your_random_jwt_secret
```

### Frontend (hardcoded in files)

- `API_URL` in `js/app.js` and `login.html`
- `GOOGLE_CLIENT_ID` in `login.html`

## Monitoring and Maintenance

### Railway

- View logs: `railway logs`
- Monitor metrics in dashboard
- Set up alerts

### Vercel

- View deployment logs in dashboard
- Monitor analytics
- Set up custom alerts

### Supabase

- Monitor database usage
- Check API usage
- Review logs

## Troubleshooting

### CORS Errors

Update backend `server.js`:

```javascript
app.use(cors({
  origin: 'https://your-frontend-domain.vercel.app',
  credentials: true
}));
```

### OAuth Errors

- Verify Client ID in frontend matches Google Console
- Check authorized origins and redirect URIs
- Ensure URLs use HTTPS in production

### Database Connection Issues

- Verify Supabase credentials
- Check if tables are created
- Review Supabase logs

### API Rate Limits

- Monitor API usage on provider dashboards
- Implement caching if needed
- Consider upgrading API plans

## Security Checklist

- [ ] All environment variables set correctly
- [ ] HTTPS enabled on all domains
- [ ] CORS configured for production domain only
- [ ] JWT secret is strong and random
- [ ] Supabase RLS policies configured
- [ ] API keys stored securely in database
- [ ] Rate limiting enabled
- [ ] Error messages don't expose sensitive info
- [ ] Google OAuth restricted to your domains
- [ ] Regular security updates applied

## Cost Estimation

### Free Tier Limits

- **Supabase**: 500MB database, 2GB bandwidth
- **Railway**: $5 credit/month, then pay-as-you-go
- **Vercel**: 100GB bandwidth, unlimited deployments
- **Render**: 750 hours/month free tier

### Paid Services (User's API Keys)

Users provide their own API keys for:
- OpenAI, Anthropic, Google, DeepSeek
- NewsAPI, OpenWeather, FRED
- Binance (optional)

## Backup and Recovery

### Database Backups

Supabase provides automatic backups. To manually backup:

```bash
# Export data
pg_dump -h db.your-project.supabase.co -U postgres -d postgres > backup.sql
```

### Code Backups

- Keep code in GitHub
- Tag releases
- Document changes

## Scaling Considerations

### Backend Scaling

- Railway/Render auto-scales
- Monitor response times
- Add caching layer if needed (Redis)
- Consider load balancer for high traffic

### Database Scaling

- Monitor Supabase usage
- Upgrade plan if needed
- Add indexes for performance
- Consider read replicas

### Frontend Scaling

- Vercel handles CDN automatically
- Optimize images and assets
- Implement lazy loading
- Use service workers for caching

## Support

For deployment issues:
- Railway: https://railway.app/help
- Vercel: https://vercel.com/support
- Supabase: https://supabase.com/docs
- Render: https://render.com/docs

---

**Deployment Complete! 🎉**

Your AI Super-App is now live and ready to use!
