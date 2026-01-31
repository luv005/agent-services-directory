# 🚀 Railway Deployment - Ready to Go!

## ✅ What's Configured

Your Agent Services Directory is fully configured for Railway deployment.

### Files Created/Modified:
- ✅ `railway.json` — Railway deployment config
- ✅ `Procfile` — Process definition
- ✅ `RAILWAY_DEPLOY.md` — Detailed deployment guide
- ✅ `deploy-railway.sh` — Automated deployment script
- ✅ `.github/workflows/deploy.yml` — CI/CD for auto-deploy on push
- ✅ `src/database/index.ts` — Updated for Railway's DATABASE_URL

## 🎯 Quick Deploy Options

### Option 1: Automated Script (Easiest)
```bash
cd /data/workspace/agent-services-directory
./deploy-railway.sh
```

This script will:
1. Install Railway CLI if needed
2. Login to Railway
3. Initialize project
4. Add PostgreSQL
5. Set all environment variables
6. Deploy
7. Run migrations
8. Show you the URL

### Option 2: Manual Steps
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add PostgreSQL database
railway add --database postgres

# Deploy
railway up

# Run migrations
railway run npm run db:migrate

# Get URL
railway domain
```

### Option 3: GitHub Integration (Auto-deploy)
1. Push code to GitHub
2. Add `RAILWAY_TOKEN` to GitHub secrets
3. Push to main branch → auto-deploys

## 🔧 Environment Variables

Railway will automatically provide:
- `DATABASE_URL` — Full PostgreSQL connection string
- `RAILWAY_ENVIRONMENT` — Set to 'production'
- `PORT` — Dynamically assigned

You need to set (or the script sets them):
- `BASE_RPC_URL` — https://mainnet.base.org
- `POLYGON_RPC_URL` — https://polygon-rpc.com
- `NODE_ENV` — production

## 📋 Post-Deployment Checklist

- [ ] Run migrations: `railway run npm run db:migrate`
- [ ] Test health endpoint: `curl https://your-app.up.railway.app/health`
- [ ] Register test agent: `curl -X POST https://your-app.up.railway.app/api/v1/agents/register`
- [ ] Verify database: `railway run psql -c "SELECT * FROM agents;"`

## 🔗 Your Deployed API

Once deployed, your API will be available at:
```
https://agent-services-directory.up.railway.app
```

Or whatever domain Railway assigns.

## 🧪 Test Commands

```bash
# 1. Health check
curl https://YOUR_DOMAIN/health

# 2. Register agent
curl -X POST https://YOUR_DOMAIN/api/v1/agents/register \
  -H "Content-Type: application/json" \
  -d '{"name": "TestAgent", "description": "Testing deployment"}'

# 3. Check response includes api_key and deposit_address
```

## 📊 Monitoring

- **Railway Dashboard**: https://railway.app/dashboard
- **Logs**: `railway logs` or dashboard
- **Metrics**: Available in Railway dashboard

## 🆘 Troubleshooting

**Database connection failed:**
```bash
# Check if DATABASE_URL is set
railway variables

# Verify Postgres is running
railway status
```

**Migrations failed:**
```bash
# Connect to DB and check
railway run psql

# Run manually
railway run npm run db:migrate
```

**Build failed:**
```bash
# Check build logs
railway logs --build
```

## 💰 Railway Pricing

- **Free Tier**: 500 hours/month, 1 GB RAM, shared CPU
- **Starter**: $5/month, always on, 2 GB RAM
- **Pro**: More resources as needed

For MVP/testing, free tier is sufficient.

## 🎉 You're Ready!

Run `./deploy-railway.sh` and your Agent Services Directory will be live in ~5 minutes!
