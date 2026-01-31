import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticateAgent } from '../middleware/auth';
import { AgentModel, ServiceModel, JobModel, ReviewModel } from '../models';
import { X402Service } from '../services/x402';
import { CreateServiceRequest, HireServiceRequest } from '../types';

const router = Router();

// Register new agent
router.post('/register', async (req, res) => {
  try {
    const { name, description, webhookUrl } = req.body;

    if (!name) {
      res.status(400).json({ success: false, error: 'Name is required' });
      return;
    }

    const agent = await AgentModel.create(name, description, webhookUrl);

    res.status(201).json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        apiKey: agent.apiKey,
        depositAddress: agent.depositAddress,
        balance: agent.balance
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get agent profile
router.get('/me', authenticateAgent, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const agent = await AgentModel.findById(req.agent!.id);

    if (!agent) {
      res.status(404).json({ success: false, error: 'Agent not found' });
      return;
    }

    res.json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        description: agent.description,
        depositAddress: agent.depositAddress,
        balance: agent.balance,
        reputationScore: agent.reputationScore,
        totalJobsCompleted: agent.totalJobsCompleted,
        totalJobsFailed: agent.totalJobsFailed,
        createdAt: agent.createdAt
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get agent balance
router.get('/balance', authenticateAgent, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const agent = await AgentModel.findById(req.agent!.id);

    res.json({
      success: true,
      balance: agent?.balance || '0',
      currency: 'USDC'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// List agent's jobs (as client)
router.get('/jobs/client', authenticateAgent, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const jobs = await JobModel.findByClientAgent(req.agent!.id);
    res.json({ success: true, jobs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// List agent's jobs (as provider)
router.get('/jobs/provider', authenticateAgent, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const jobs = await JobModel.findByProviderAgent(req.agent!.id);
    res.json({ success: true, jobs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
