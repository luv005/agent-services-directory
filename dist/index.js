"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const agents_1 = __importDefault(require("./routes/agents"));
const services_1 = __importDefault(require("./routes/services"));
const jobs_1 = __importDefault(require("./routes/jobs"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/api/v1/agents', agents_1.default);
app.use('/api/v1/services', services_1.default);
app.use('/api/v1/jobs', jobs_1.default);
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
app.use((err, req, res, next) => {
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
exports.default = app;
//# sourceMappingURL=index.js.map