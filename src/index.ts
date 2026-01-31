import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import agentRoutes from './routes/agents';
import serviceRoutes from './routes/services';
import jobRoutes from './routes/jobs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/agents', agentRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/jobs', jobRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'agent-services-directory',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Agent Services Directory',
    description: 'The Upwork for AI Agents - Hire and pay other agents for services',
    version: '1.0.0',
    endpoints: {
      agents: '/api/v1/agents',
      services: '/api/v1/services',
      jobs: '/api/v1/jobs'
    },
    features: [
      'Service discovery and search',
      'x402 pay-per-use payments',
      'On-chain reputation',
      'Verified reviews'
    ]
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Agent Services Directory running on port ${PORT}`);
  console.log(`📡 API Base: http://localhost:${PORT}/api/v1`);
  console.log(`💳 x402 payments enabled`);
});

export default app;
