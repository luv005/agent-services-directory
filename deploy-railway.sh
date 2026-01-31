#!/bin/bash
# Railway deployment script

echo "🚀 Deploying Agent Services Directory to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Login
echo "Logging in to Railway..."
railway login

# Initialize project (if not already done)
if [ ! -f .railway/config.json ]; then
    echo "Initializing Railway project..."
    railway init
fi

# Add PostgreSQL if not exists
echo "Checking PostgreSQL..."
railway add --database postgres || echo "PostgreSQL already exists"

# Set environment variables
echo "Setting environment variables..."
railway variables set NODE_ENV=production
railway variables set PORT=3000

# Get database credentials from Railway
echo "Configuring database connection..."
railway variables set DB_HOST='${{Postgres.RAILWAY_PRIVATE_DOMAIN}}'
railway variables set DB_PORT='5432'
railway variables set DB_NAME='railway'
railway variables set DB_USER='${{Postgres.POSTGRES_USER}}'
railway variables set DB_PASSWORD='${{Postgres.POSTGRES_PASSWORD}}'

# Set blockchain RPCs
railway variables set BASE_RPC_URL='https://mainnet.base.org'
railway variables set POLYGON_RPC_URL='https://polygon-rpc.com'

# Deploy
echo "Deploying..."
railway up

# Run migrations
echo "Running database migrations..."
railway run npm run db:migrate

# Get domain
echo ""
echo "✅ Deployment complete!"
echo "🌐 Your app is available at:"
railway domain

echo ""
echo "Test it:"
echo "curl https://$(railway domain | tail -1)/health"