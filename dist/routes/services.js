"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const models_1 = require("../models");
const x402_1 = require("../services/x402");
const router = (0, express_1.Router)();
// Search services
router.get('/search', async (req, res) => {
    try {
        const filters = {
            category: req.query.category,
            maxPrice: req.query.maxPrice,
            minRating: req.query.minRating ? parseFloat(req.query.minRating) : undefined,
            agentId: req.query.agentId
        };
        const services = await models_1.ServiceModel.search(filters);
        res.json({
            success: true,
            count: services.length,
            services
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Get service by ID
router.get('/:id', async (req, res) => {
    try {
        const service = await models_1.ServiceModel.findById(req.params.id);
        if (!service) {
            res.status(404).json({ success: false, error: 'Service not found' });
            return;
        }
        res.json({ success: true, service });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Create new service
router.post('/', auth_1.authenticateAgent, async (req, res) => {
    try {
        const serviceData = req.body;
        // Validate required fields
        const required = ['name', 'description', 'category', 'pricePerUnit', 'unitType', 'estimatedTime', 'apiSchema'];
        for (const field of required) {
            if (!(field in serviceData)) {
                res.status(400).json({ success: false, error: `${field} is required` });
                return;
            }
        }
        const service = await models_1.ServiceModel.create({
            agentId: req.agent.id,
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
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Hire service (create job)
router.post('/:id/hire', auth_1.authenticateAgent, async (req, res) => {
    try {
        const service = await models_1.ServiceModel.findById(req.params.id);
        if (!service) {
            res.status(404).json({ success: false, error: 'Service not found' });
            return;
        }
        if (!service.isActive) {
            res.status(400).json({ success: false, error: 'Service is not active' });
        }
        const hireRequest = req.body;
        // Create job
        const job = await models_1.JobModel.create({
            serviceId: service.id,
            clientAgentId: req.agent.id,
            providerAgentId: service.agentId,
            status: 'pending_payment',
            price: service.pricePerUnit,
            input: hireRequest.input,
            x402RequestId: '', // Will be updated
            escrowReleased: false
        });
        // Create payment request
        const provider = await models_1.AgentModel.findById(service.agentId);
        const paymentRequest = await x402_1.X402Service.createPaymentRequest(job.id, service.pricePerUnit, provider.depositAddress, 'base', 'USDC');
        // Update job with request ID
        await models_1.JobModel.findById(job.id); // Just to ensure job exists
        // Return 402 with payment instructions
        res.status(402).json(x402_1.X402Service.format402Response(paymentRequest));
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Submit payment proof
router.post('/:id/pay', auth_1.authenticateAgent, async (req, res) => {
    try {
        const { requestId, txHash } = req.body;
        if (!requestId || !txHash) {
            res.status(400).json({ success: false, error: 'requestId and txHash are required' });
            return;
        }
        await x402_1.X402Service.verifyPayment({ requestId, txHash });
        res.json({
            success: true,
            message: 'Payment verified. Job is now in progress.',
            jobId: requestId
        });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=services.js.map