import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticateAgent } from '../middleware/auth';
import { JobModel, ReviewModel, ServiceModel, AgentModel } from '../models';

const router = Router();

// Get job by ID
router.get('/:id', authenticateAgent, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const job = await JobModel.findById(req.params.id);

    if (!job) {
      res.status(404).json({ success: false, error: 'Job not found' });
      return;
    }

    // Check if user is client or provider
    if (job.clientAgentId !== req.agent!.id && job.providerAgentId !== req.agent!.id) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    res.json({ success: true, job });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update job status (provider only)
router.patch('/:id/status', authenticateAgent, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const job = await JobModel.findById(req.params.id);

    if (!job) {
      res.status(404).json({ success: false, error: 'Job not found' });
      return;
    }

    // Only provider can update status
    if (job.providerAgentId !== req.agent!.id) {
      res.status(403).json({ success: false, error: 'Only provider can update job status' });
      return;
    }

    const { status, output } = req.body;

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      'payment_received': ['in_progress'],
      'in_progress': ['completed', 'failed'],
      'completed': [],
      'failed': []
    };

    if (!validTransitions[job.status].includes(status)) {
      res.status(400).json({
        success: false,
        error: `Cannot transition from ${job.status} to ${status}`
      });
      return;
    }

    await JobModel.updateStatus(job.id, status, output);

    // If completed, update provider stats
    if (status === 'completed') {
      await AgentModel.incrementJobsCompleted(job.providerAgentId);
    }

    res.json({
      success: true,
      message: `Job status updated to ${status}`,
      jobId: job.id
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create review for completed job
router.post('/:id/review', authenticateAgent, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const job = await JobModel.findById(req.params.id);

    if (!job) {
      res.status(404).json({ success: false, error: 'Job not found' });
      return;
    }

    // Only client can review
    if (job.clientAgentId !== req.agent!.id) {
      res.status(403).json({ success: false, error: 'Only client can review' });
      return;
    }

    // Job must be completed
    if (job.status !== 'completed') {
      res.status(400).json({ success: false, error: 'Can only review completed jobs' });
      return;
    }

    const { rating, review } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ success: false, error: 'Rating must be between 1 and 5' });
      return;
    }

    // Create review
    await ReviewModel.create({
      jobId: job.id,
      serviceId: job.serviceId,
      clientAgentId: job.clientAgentId,
      providerAgentId: job.providerAgentId,
      rating,
      review
    });

    // Update service rating
    await ServiceModel.updateRating(job.serviceId, rating);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
