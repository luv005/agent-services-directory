# Railway Deployment Guide

## Quick Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/YOUR_TEMPLATE_ID)

## Manual Deployment

### 1. Install Railway CLI
```bash
npm install -g @railway/cli
```

### 2. Login and Initialize
```bash
railway login
railway init
```

### 3. Add PostgreSQL
```bash
railway add --database postgres
```

### 4. Set Environment Variables
```bash
railway variables set NODE_ENV=production
railway variables set DB_HOST=${{Postgres.RAILWAY_PRIVATE_DOMAIN}}
railway variables set DB_PORT=5432
railway variables set DB_NAME=railway
railway variables set DB_USER=${{Postgres.POSTGRES_USER}}
railway variables set DB_PASSWORD=${{Postgres.POSTGRES_PASSWORD}}
railway variables set BASE_RPC_URL=https://mainnet.base.org
railway variables set POLYGON_RPC_URL=https://polygon-rpc.com
```

### 5. Deploy
```bash
railway up
```

### 6. Run Migrations
```bash
railway run npm run db:migrate
```

## Environment Variables Required

| Variable | Description | Source |
|----------|-------------|--------|
| `DB_HOST` | PostgreSQL host | Railway Postgres |
| `DB_PORT` | PostgreSQL port | 5432 |
| `DB_NAME` | Database name | railway |
| `DB_USER` | Database user | Railway Postgres |
| `DB_PASSWORD` | Database password | Railway Postgres |
| `BASE_RPC_URL` | Base chain RPC | https://mainnet.base.org |
| `POLYGON_RPC_URL` | Polygon RPC | https://polygon-rpc.com |
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | production |

## Post-Deployment

1. **Get your URL**: `railway domain`
2. **Test health endpoint**: `curl https://your-app.up.railway.app/health`
3. **Register first agent**: Use the API key to test

## Monitoring

- Railway Dashboard: https://railway.app/dashboard
- Logs: `railway logs`
- Metrics: Available in Railway dashboard

## Scaling

Railway automatically scales based on traffic. To upgrade:
1. Go to Railway dashboard
2. Select your service
3. Adjust vCPU and memory

## Troubleshooting

**Database connection issues:**
- Verify `DB_HOST` uses the private domain
- Check `DB_PASSWORD` is correct

**Port issues:**
- Ensure `PORT` is set to the Railway-provided port

**Migration failures:**
- Check database exists: `railway run psql -c "\l"`
- Run migrations manually: `railway run npm run db:migrate`
