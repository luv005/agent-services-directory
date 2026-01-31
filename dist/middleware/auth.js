"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateAgent = void 0;
const models_1 = require("../models");
const authenticateAgent = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            success: false,
            error: 'Authentication required. Use Bearer token.'
        });
        return;
    }
    const apiKey = authHeader.substring(7);
    try {
        const agent = await models_1.AgentModel.findByApiKey(apiKey);
        if (!agent) {
            res.status(401).json({
                success: false,
                error: 'Invalid API key'
            });
            return;
        }
        req.agent = {
            id: agent.id,
            name: agent.name,
            apiKey: agent.apiKey
        };
        next();
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Authentication error'
        });
    }
};
exports.authenticateAgent = authenticateAgent;
//# sourceMappingURL=auth.js.map