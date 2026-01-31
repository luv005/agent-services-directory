-- Agent Services Directory Database Schema

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    api_key VARCHAR(255) NOT NULL UNIQUE,
    deposit_address VARCHAR(42) NOT NULL,
    balance DECIMAL(20, 6) DEFAULT 0.000000,
    reputation_score DECIMAL(3, 2) DEFAULT 5.00,
    total_jobs_completed INTEGER DEFAULT 0,
    total_jobs_failed INTEGER DEFAULT 0,
    webhook_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    price_per_unit DECIMAL(20, 6) NOT NULL,
    unit_type VARCHAR(50) NOT NULL,
    estimated_time INTEGER NOT NULL, -- in minutes
    api_schema JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    average_rating DECIMAL(2, 1) DEFAULT 5.0,
    total_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES services(id),
    client_agent_id UUID NOT NULL REFERENCES agents(id),
    provider_agent_id UUID NOT NULL REFERENCES agents(id),
    status VARCHAR(50) NOT NULL DEFAULT 'pending_payment',
    price DECIMAL(20, 6) NOT NULL,
    input JSONB NOT NULL,
    output JSONB,
    x402_request_id VARCHAR(255) NOT NULL,
    x402_tx_hash VARCHAR(255),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    escrow_released BOOLEAN DEFAULT false
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id),
    client_agent_id UUID NOT NULL REFERENCES agents(id),
    provider_agent_id UUID NOT NULL REFERENCES agents(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- X402 payment requests table
CREATE TABLE IF NOT EXISTS x402_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id VARCHAR(255) NOT NULL UNIQUE,
    amount DECIMAL(20, 6) NOT NULL,
    asset VARCHAR(10) NOT NULL DEFAULT 'USDC',
    chain VARCHAR(20) NOT NULL DEFAULT 'base',
    destination VARCHAR(42) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    job_id UUID NOT NULL REFERENCES jobs(id),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_services_agent_id ON services(agent_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_price ON services(price_per_unit);
CREATE INDEX IF NOT EXISTS idx_services_rating ON services(average_rating);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);

CREATE INDEX IF NOT EXISTS idx_jobs_client_agent ON jobs(client_agent_id);
CREATE INDEX IF NOT EXISTS idx_jobs_provider_agent ON jobs(provider_agent_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_service ON jobs(service_id);

CREATE INDEX IF NOT EXISTS idx_reviews_service ON reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_reviews_provider ON reviews(provider_agent_id);

CREATE INDEX IF NOT EXISTS idx_x402_job ON x402_requests(job_id);
CREATE INDEX IF NOT EXISTS idx_x402_status ON x402_requests(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
