# Railway Deployment Guide for Sui Patreon

This guide will walk you through deploying the Sui Patreon platform to Railway with PostgreSQL, API backend (including indexer), and Next.js frontend.

## Architecture Overview

The deployment consists of:
- **Web Service** - Next.js frontend (Port 3000)
- **Backend Service** - Express API + Sui Event Indexer (Port 3001)
- **PostgreSQL Database** - Railway managed database

## Prerequisites

### Required Credentials

Before deployment, ensure you have:

1. **MinIO S3 Storage** (for avatar uploads)
   - Endpoint: `minio.7k.ag`
   - Access Key
   - Secret Key
   - Bucket name: `sui-patreon`

2. **Google OAuth** (for zkLogin authentication)
   - Client ID from [Google Cloud Console](https://console.cloud.google.com/)
   - Authorized redirect URIs configured

3. **Sui Smart Contract**
   - Deployed package ID: `0xcac1eabc44bc10496c5adb8892fd20f242e7e1b08974c097fc6020590d976990`
   - Network: testnet (or mainnet for production)

### Optional Services
- Upstash Redis (for caching) - **DEPRECATED, not used**
- Custom Seal key servers (for encryption) - optional

---

## Step 1: Install Railway CLI

```bash
npm install -g @railway/cli

# Login to Railway
railway login
```

---

## Step 2: Initialize Railway Project

From your project root directory:

```bash
# Initialize Railway project
railway init

# Follow prompts:
# - Project name: sui-patreon
# - Environment: production (or staging)

# Link to existing project (if you created one in Railway dashboard)
railway link
```

---

## Step 3: Add PostgreSQL Database

```bash
# Add PostgreSQL plugin
railway add --database postgresql

# This automatically creates a DATABASE_URL variable
```

Alternatively, use the Railway dashboard:
1. Go to your project
2. Click "New" → "Database" → "Add PostgreSQL"
3. Railway will automatically set the `DATABASE_URL` environment variable

---

## Step 4: Create Backend Service

### Using Railway Dashboard (Recommended)

1. Go to your Railway project dashboard
2. Click "+ New" → "GitHub Repo"
3. Select your `sui-patreon` repository
4. Railway will auto-detect the monorepo structure

5. **Configure Backend Service**:
   - Click "Settings" on the new service
   - **General**:
     - Service Name: `backend`
     - Root Directory: `backend` (IMPORTANT: Set this to the backend folder)
   - **Build**:
     - Build Command: Leave empty (auto-detected)
     - Watch Paths: `backend/**`
   - **Deploy**:
     - Start Command: `npm run start:railway`
     - Custom Start Command: ✅ Enable

6. **Set Port**:
   - Under "Networking", the port will auto-detect to 3001
   - If not, Railway will use the `PORT` environment variable

### Important Notes

- ✅ **Set Root Directory to `backend`** - This tells Railway to build from the backend folder
- ✅ Railway will auto-detect Node.js and run `npm install` + `npx prisma generate`
- ✅ The startup script handles migrations automatically
- ❌ **Don't use `railway.toml`** for monorepos - configure each service separately

---

## Step 5: Set Backend Environment Variables

### Via Railway Dashboard (Easier)

1. Go to Backend service → Variables
2. Click "New Variable" and add each:

```bash
# Server
NODE_ENV=production
PORT=3001

# Database (auto-set by Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Sui Configuration
PACKAGE_ID=0xcac1eabc44bc10496c5adb8892fd20f242e7e1b08974c097fc6020590d976990
SUI_NETWORK=testnet
POLL_INTERVAL=5000
QUERY_LIMIT=50

# MinIO Storage (SECRETS)
MINIO_ENDPOINT=minio.7k.ag
MINIO_ACCESS_KEY=<your-actual-access-key>
MINIO_SECRET_KEY=<your-actual-secret-key>
MINIO_BUCKET=sui-patreon
MINIO_PUBLIC_URL=https://minio.7k.ag/sui-patreon
MINIO_REGION=us-east-1
MINIO_USE_SSL=true

# Walrus Storage
WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space
WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space

# CORS (set after deploying web service)
FRONTEND_URL=${{Web.RAILWAY_PUBLIC_DOMAIN}}
```

### Via CLI

```bash
# Set variables
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set PACKAGE_ID=0xcac1eabc...
railway variables set MINIO_ACCESS_KEY=your-key
# ... etc
```

**Note**: Reference other services using `${{ServiceName.VARIABLE}}` syntax.

---

## Step 6: Create Web Frontend Service

### Via Railway Dashboard

1. In your Railway project, click "+ New" → "GitHub Repo"
2. Select the **same** `sui-patreon` repository
3. Railway will create a second service from the same repo

4. **Configure Web Service**:
   - Click "Settings" on the new service
   - **General**:
     - Service Name: `web`
     - Root Directory: `web` (IMPORTANT: Set this to the web folder)
   - **Build**:
     - Build Command: Leave empty (auto-detected as `npm run build`)
     - Watch Paths: `web/**`
   - **Deploy**:
     - Start Command: `npm run start`
     - Custom Start Command: ✅ Enable

5. **Port Configuration**:
   - Port will auto-detect to 3000 from Next.js
   - No manual configuration needed

---

## Step 7: Set Frontend Environment Variables

In Web service → Variables:

```bash
# API Backend URL
NEXT_PUBLIC_API_URL=https://${{Backend.RAILWAY_PUBLIC_DOMAIN}}

# Sui Configuration
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_PACKAGE_ID=0xcac1eabc44bc10496c5adb8892fd20f242e7e1b08974c097fc6020590d976990
NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.testnet.sui.io

# Google OAuth (SECRET)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-google-client-id>.apps.googleusercontent.com

# Enoki
NEXT_PUBLIC_ENOKI_API_KEY=enoki_public_d89d2a5524f9127f1fa5fd802b4a2cc0

# App URL (auto-set)
NEXT_PUBLIC_APP_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
```

---

## Step 8: Update Google OAuth Settings

After deploying web service, you'll get a Railway domain (e.g., `https://web-production-xxxx.railway.app`).

Update Google OAuth:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add to **Authorized redirect URIs**:
   ```
   https://your-railway-domain.railway.app
   ```

---

## Step 9: Deploy Services

### Auto-Deploy (Recommended)

Railway will automatically deploy on git push:

```bash
git add .
git commit -m "Configure Railway deployment"
git push origin main
```

Railway will detect changes and redeploy automatically.

### Manual Deploy

```bash
# Deploy specific service
railway up --service backend
railway up --service web
```

---

## Step 10: Run Database Migrations

Migrations run automatically on backend startup via `start-railway.sh`.

To manually verify:

```bash
# Connect to backend service
railway run --service backend

# Run migrations
npx prisma migrate deploy

# Check database
npx prisma studio
```

---

## Step 11: Verify Deployment

### Check Backend Health

```bash
curl https://your-backend.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "runtime": "node",
  "database": "connected",
  "timestamp": "2024-11-20T...",
  "version": "1.0.0"
}
```

### Check Frontend

Visit `https://your-web.railway.app` in browser. You should see the homepage.

### Check Logs

```bash
# Backend logs
railway logs --service backend

# Web logs
railway logs --service web

# Database logs
railway logs --service postgres
```

Look for:
- ✅ "Database migrations completed successfully"
- ✅ "Database connected successfully"
- ✅ "Backend API running on port 3001"
- ✅ "[Indexer] Event listeners started"

---

## Step 12: Configure Custom Domain (Optional)

### For Web Service

1. Go to Web service → Settings → Domains
2. Click "Add Custom Domain"
3. Enter your domain: `app.yourdomain.com`
4. Update DNS records as shown:
   ```
   Type: CNAME
   Name: app
   Value: your-service.railway.app
   ```

### For Backend Service

1. Go to Backend service → Settings → Domains
2. Add: `api.yourdomain.com`
3. Update DNS:
   ```
   Type: CNAME
   Name: api
   Value: your-backend.railway.app
   ```

### Update Environment Variables

After adding custom domains, update:

**Backend:**
```bash
FRONTEND_URL=https://app.yourdomain.com
```

**Web:**
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_URL=https://app.yourdomain.com
```

**Google OAuth:**
- Add `https://app.yourdomain.com` to authorized redirect URIs

---

## Troubleshooting

### Build Fails

**Error**: "Cannot find module '@prisma/client'"

**Solution**: Ensure `npx prisma generate` runs in build command:
```bash
npm install && cd backend && npm install && npx prisma generate
```

---

### Migrations Fail

**Error**: "Database connection failed"

**Solution**: Verify `DATABASE_URL` is set correctly:
```bash
railway variables --service backend
# Check DATABASE_URL value
```

---

### Frontend Can't Reach Backend

**Error**: CORS or network errors in browser console

**Solutions**:
1. Check `NEXT_PUBLIC_API_URL` points to correct backend domain
2. Verify `FRONTEND_URL` is set in backend
3. Check backend logs for CORS errors
4. Test backend health endpoint directly

---

### zkLogin Not Working

**Error**: Google OAuth redirect fails

**Solutions**:
1. Verify `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is correct
2. Check authorized redirect URIs in Google Console
3. Ensure redirect URI matches your Railway domain exactly
4. Check browser console for detailed error messages

---

### Indexer Not Processing Events

**Error**: No new content appearing in database

**Solutions**:
1. Check backend logs for indexer errors:
   ```bash
   railway logs --service backend | grep Indexer
   ```
2. Verify `PACKAGE_ID` matches your deployed contract
3. Check `SUI_NETWORK` is correct (testnet/mainnet)
4. Ensure blockchain RPC is accessible

---

### Images Not Loading

**Error**: Broken images from Walrus or MinIO

**Solutions**:
1. Check MinIO credentials are correct
2. Verify `MINIO_PUBLIC_URL` is accessible
3. Test image URL directly in browser
4. Check Next.js image domain configuration in `next.config.ts`:
   ```ts
   images: {
     remotePatterns: [
       { hostname: 'minio.7k.ag' },
       { hostname: '*.walrus.space' },
     ]
   }
   ```

---

### High Memory Usage

**Symptoms**: Service crashes or restarts frequently

**Solutions**:
1. Upgrade Railway plan for more resources
2. Optimize database queries
3. Check for memory leaks in logs
4. Consider separating indexer into its own service

---

## Monitoring

### View Metrics

Railway Dashboard → Service → Metrics shows:
- CPU usage
- Memory usage
- Network traffic
- Request count

### Set Up Alerts

1. Go to Project Settings → Notifications
2. Add webhook for Slack/Discord/Email
3. Configure alert thresholds

### Health Checks

Railway automatically monitors your `/health` endpoint. If it returns non-200, Railway will restart the service.

---

## Scaling

### Vertical Scaling (More Resources)

1. Go to Service → Settings → Resources
2. Increase RAM/CPU allocation
3. Click "Save"
4. Service will restart with new resources

### Horizontal Scaling (Multiple Instances)

Edit `railway.toml`:
```toml
[[deploy]]
numReplicas = 2  # Run 2 instances
```

**Note**: Ensure your app handles concurrent indexer instances (use locks or leader election).

---

## Cost Optimization

### Current Estimate (Railway Pro Plan)

- **Web Service**: ~$5/month (256 MB RAM)
- **Backend Service**: ~$10/month (512 MB RAM)
- **PostgreSQL**: ~$5/month (shared instance)
- **Total**: ~$20/month + bandwidth costs

### Tips to Reduce Costs

1. **Use Hobby Plan** for development ($5/month)
2. **Share database** across environments
3. **Optimize build caching** to reduce build minutes
4. **Use CDN** for static assets (Cloudflare)
5. **Set aggressive idle timeouts** for non-prod environments

---

## Backup & Recovery

### Database Backups

Railway automatically backs up PostgreSQL daily.

Manual backup:
```bash
railway run --service postgres pg_dump > backup.sql
```

Restore:
```bash
railway run --service postgres psql < backup.sql
```

### Environment Variable Backup

Export all variables:
```bash
railway variables > env-backup.txt
```

---

## CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Railway CLI
        run: npm install -g @railway/cli

      - name: Deploy Backend
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: railway up --service backend

      - name: Deploy Web
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: railway up --service web
```

Get Railway token:
```bash
railway login
railway whoami --token
# Copy token to GitHub Secrets as RAILWAY_TOKEN
```

---

## Security Checklist

- [ ] All secrets in Railway environment variables (not in code)
- [ ] Google OAuth redirect URIs match deployed domains
- [ ] MinIO credentials rotated regularly
- [ ] Database password is strong
- [ ] CORS configured properly (`FRONTEND_URL` set)
- [ ] HTTPS enabled (automatic with Railway)
- [ ] Environment variables not logged
- [ ] Database backups enabled
- [ ] Rate limiting configured (if needed)
- [ ] API keys not committed to git

---

## Post-Deployment Tasks

1. **Test Complete User Flow**:
   - [ ] Homepage loads
   - [ ] Google zkLogin works
   - [ ] Create creator profile
   - [ ] Upload avatar (MinIO)
   - [ ] Create subscription tier
   - [ ] Purchase subscription
   - [ ] Upload content (Walrus)
   - [ ] Access gated content

2. **Verify Indexer**:
   - [ ] Check database for recent events
   - [ ] Monitor indexer logs
   - [ ] Test content sync

3. **Performance Testing**:
   - [ ] Load test API endpoints
   - [ ] Check database query performance
   - [ ] Monitor memory usage

4. **Set Up Monitoring**:
   - [ ] Configure alerts
   - [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
   - [ ] Enable error tracking (Sentry)

---

## Support & Resources

- **Railway Docs**: https://docs.railway.app/
- **Railway Discord**: https://discord.gg/railway
- **Sui Docs**: https://docs.sui.io/
- **Project Issues**: https://github.com/your-org/sui-patreon/issues

---

## Quick Reference

### Useful Commands

```bash
# View logs
railway logs --service backend
railway logs --service web

# Shell access
railway run --service backend bash

# Database access
railway run --service postgres psql

# Restart service
railway restart --service backend

# Check variables
railway variables --service backend

# Deploy specific service
railway up --service backend
```

### Environment Variable Reference

See `.env.railway` for complete list with Railway-specific syntax.

### Port Configuration

- Backend API: `3001`
- Web Frontend: `3000`
- PostgreSQL: `5432` (internal)

---

**Deployment Date**: 2024-11-20
**Railway Version**: Latest
**Node.js Version**: 20.x
**PostgreSQL Version**: 15.x
