# Railway Deployment Fix

## The Issue

The `railway.toml` file was causing deployment failures because:
1. NIXPACKS builder is deprecated in Railway
2. Railway doesn't support multi-service configuration in `railway.toml` for monorepos
3. The correct approach is to create separate services in Railway dashboard

## What Was Fixed

✅ **Removed** `railway.toml` (was causing parse errors)
✅ **Updated** `DEPLOY.md` with correct monorepo deployment instructions
✅ **Fixed** backend build process:
  - Changed `build` script to only run `npx prisma generate` (no bundling)
  - Added `tsx` dependency to run TypeScript files directly
  - Updated `start-railway.sh` to use `npx tsx` instead of `node`
  - No more bundling errors with Node.js built-ins
✅ **Kept** all other configuration:
  - `backend/start-railway.sh` (combined API + indexer startup)
  - `.env.railway` (environment variable template)
  - Updated `backend/package.json` scripts
  - Removed Redis dependencies

## Correct Deployment Steps

### 1. Create Backend Service

In Railway dashboard:
1. Click "+ New" → "GitHub Repo"
2. Select your `sui-patreon` repository
3. Go to **Settings**:
   - **Root Directory**: `backend` ⚠️ CRITICAL
   - **Start Command**: `npm run start:railway`
   - **Watch Paths**: `backend/**`

Railway will auto-detect Node.js and run:
- `npm install`
- `npx prisma generate`
- Then execute your start command

### 2. Create Web Service

In Railway dashboard:
1. Click "+ New" → "GitHub Repo"
2. Select **same** `sui-patreon` repository
3. Go to **Settings**:
   - **Root Directory**: `web` ⚠️ CRITICAL
   - **Start Command**: `npm run start`
   - **Watch Paths**: `web/**`

Railway will auto-detect Next.js and run:
- `npm install`
- `npm run build`
- Then execute your start command

### 3. Add PostgreSQL

```bash
railway add --database postgresql
```

Or via dashboard: "+ New" → "Database" → "Add PostgreSQL"

### 4. Set Environment Variables

See `.env.railway` for the complete list.

**Backend Service:**
```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=${{Postgres.DATABASE_URL}}
PACKAGE_ID=0xcac1eabc44bc10496c5adb8892fd20f242e7e1b08974c097fc6020590d976990
SUI_NETWORK=testnet
MINIO_ACCESS_KEY=<your-key>
MINIO_SECRET_KEY=<your-secret>
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-client-id>
# ... see .env.railway for full list
```

**Web Service:**
```bash
NEXT_PUBLIC_API_URL=https://${{Backend.RAILWAY_PUBLIC_DOMAIN}}
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_PACKAGE_ID=0xcac1eabc...
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-client-id>
NEXT_PUBLIC_ENOKI_API_KEY=<your-enoki-key>
# ... see .env.railway for full list
```

### 5. Deploy

Railway auto-deploys on git push:

```bash
git add .
git commit -m "Fix Railway deployment configuration"
git push origin main
```

## Why Root Directory is Critical

Without setting Root Directory:
- ❌ Railway builds from project root
- ❌ Can't find the correct package.json
- ❌ Build commands fail

With Root Directory set to `backend` or `web`:
- ✅ Railway builds from the specific service folder
- ✅ Finds the correct package.json
- ✅ All paths are relative to that folder

## Verification

After deployment:

```bash
# Check backend health
curl https://your-backend.railway.app/health

# Expected response:
{
  "status": "ok",
  "runtime": "node",
  "database": "connected"
}
```

Visit your web service URL to see the frontend.

## Common Issues

### Build still failing?
- Double-check Root Directory is set (Settings → Service Settings → Root Directory)
- Verify it's set to `backend` or `web` (not empty)
- Check Watch Paths is set to `backend/**` or `web/**`

### Migrations not running?
- Check backend logs: `railway logs --service backend`
- Look for "Database migrations completed successfully"
- Verify DATABASE_URL is set correctly

### Services can't communicate?
- Use `${{ServiceName.RAILWAY_PUBLIC_DOMAIN}}` to reference other services
- Example: `NEXT_PUBLIC_API_URL=https://${{Backend.RAILWAY_PUBLIC_DOMAIN}}`

## Full Documentation

See `DEPLOY.md` for the complete deployment guide with:
- Detailed configuration steps
- Troubleshooting section
- Security checklist
- Monitoring setup
- And more

---

**This fix removes the problematic `railway.toml` and provides the correct configuration approach for Railway monorepo deployments.**
