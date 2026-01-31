"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const models_1 = require("../models");
const router = (0, express_1.Router)();
// Get job by ID
router.get('/:id', auth_1.authenticateAgent, async (req, res) => {
    try {
        const job = await models_1.JobModel.findById(req.params.id);
        if (!job) {
            res.status(404).json({ success: false, error: 'Job not found' });
            return;
        }
        // Check if user is client or provider
        if (job.clientAgentId !== req.agent.id && job.providerAgentId !== req.agent.id) {
            res.status(403).json({ success: false, error: 'Access denied' });
            return;
        }
        res.json({ success: true, job });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Update job status (provider only)
router.patch('/:id/status', auth_1.authenticateAgent, async (req, res) => {
    try {
        const job = await models_1.JobModel.findById(req.params.id);
        if (!job) {
            res.status(404).json({ success: false, error: 'Job not found' });
            return;
        }
        // Only provider can update status
        if (job.providerAgentId !== req.agent.id) {
            res.status(403).json({ success: false, error: 'Only provider can update job status' });
            return;
        }
        const { status, output } = req.body;
        // Validate status transitions
        const validTransitions = {
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
        await models_1.JobModel.updateStatus(job.id, status, output);
        // If completed, update provider stats
        if (status === 'completed') {
            await models_1.AgentModel.incrementJobsCompleted(job.providerAgentId);
        }
        res.json({
            success: true,
            message: `Job status updated to ${status}`,
            jobId: job.id
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Create review for completed job
router.post('/:id/review', auth_1.authenticateAgent, async (req, res) => {
    try {
        const job = await models_1.JobModel.findById(req.params.id);
        if (!job) {
            res.status(404).json({ success: false, error: 'Job not found' });
            return;
        }
        // Only client can review
        if (job.clientAgentId !== req.agent.id) {
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
        await models_1.ReviewModel.create({
            jobId: job.id,
            serviceId: job.serviceId,
            clientAgentId: job.clientAgentId,
            providerAgentId: job.providerAgentId,
            rating,
            review
        });
        // Update service rating
        await models_1.ServiceModel.updateRating(job.serviceId, rating);
        res.status(201).json({
            success: true,
            message: 'Review submitted successfully'
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=jobs.js.map