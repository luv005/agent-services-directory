import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticateAgent } from '../middleware/auth';
import { ServiceModel, JobModel, AgentModel } from '../models';
import { X402Service } from '../services/x402';
import { CreateServiceRequest, HireServiceRequest, ServiceSearchFilters } from '../types';

const router = Router();

// Search services
router.get('/search', async (req, res) => {
  try {
    const filters: ServiceSearchFilters = {
      category: req.query.category as any,
      maxPrice: req.query.maxPrice as string,
      minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
      agentId: req.query.agentId as string
    };

    const services = await ServiceModel.search(filters);

    res.json({
      success: true,
      count: services.length,
      services
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get service by ID
router.get('/:id', async (req, res) => {
  try {
    const service = await ServiceModel.findById(req.params.id);

    if (!service) {
      res.status(404).json({ success: false, error: 'Service not found' });
      return;
    }

    res.json({ success: true, service });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new service
router.post('/', authenticateAgent, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const serviceData: CreateServiceRequest = req.body;

    // Validate required fields
    const required = ['name', 'description', 'category', 'pricePerUnit', 'unitType', 'estimatedTime', 'apiSchema'];
    for (const field of required) {
      if (!(field in serviceData)) {
        res.status(400).json({ success: false, error: `${field} is required` });
        return;
      }
    }

    const service = await ServiceModel.create({
      agentId: req.agent!.id,
      name: serviceData.name,
      description: serviceData.description,
      category: serviceData.category,
      pricePerUnit: serviceData.pricePerUnit,
      unitType: serviceData.unitType,
      estimatedTime: serviceData.estimatedTime,
      apiSchema: serviceData.apiSchema,
      isActive: true
    });

    res.status(201).json({
      success: true,
      service
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Hire service (create job)
router.post('/:id/hire', authenticateAgent, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const service = await ServiceModel.findById(req.params.id);

    if (!service) {
      res.status(404).json({ success: false, error: 'Service not found' });
      return;
    }

    if (!service.isActive) {
      res.status(400).json({ success: false, error: 'Service is not active' });
    }

    const hireRequest: HireServiceRequest = req.body;

    // Create job
    const job = await JobModel.create({
      serviceId: service.id,
      clientAgentId: req.agent!.id,
      providerAgentId: service.agentId,
      status: 'pending_payment',
      price: service.pricePerUnit,
      input: hireRequest.input,
      x402RequestId: '' // Will be updated
    });

    // Create payment request
    const provider = await AgentModel.findById(service.agentId);
    const paymentRequest = await X402Service.createPaymentRequest(
      job.id,
      service.pricePerUnit,
      provider!.depositAddress,
      'base',
      'USDC'
    );

    // Update job with request ID
    await JobModel.findById(job.id); // Just to ensure job exists

    // Return 402 with payment instructions
    res.status(402).json(X402Service.format402Response(paymentRequest));
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Submit payment proof
router.post('/:id/pay', authenticateAgent, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { requestId, txHash } = req.body;

    if (!requestId || !txHash) {
      res.status(400).json({ success: false, error: 'requestId and txHash are required' });
      return;
    }

    await X402Service.verifyPayment({ requestId, txHash });

    res.json({
      success: true,
      message: 'Payment verified. Job is now in progress.',
      jobId: requestId
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
