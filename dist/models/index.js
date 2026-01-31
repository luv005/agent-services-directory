"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewModel = exports.JobModel = exports.ServiceModel = exports.AgentModel = void 0;
const database_1 = require("../database");
const crypto_1 = __importDefault(require("crypto"));
const ethers_1 = require("ethers");
class AgentModel {
    static async create(name, description, webhookUrl) {
        const apiKey = `asd_${crypto_1.default.randomBytes(32).toString('hex')}`;
        // Generate a deposit address (in production, this would be from a wallet)
        const wallet = ethers_1.ethers.Wallet.createRandom();
        const depositAddress = wallet.address;
        const result = await (0, database_1.query)(`INSERT INTO agents (name, description, api_key, deposit_address, webhook_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`, [name, description, apiKey, depositAddress, webhookUrl]);
        return result.rows[0];
    }
    static async findByApiKey(apiKey) {
        const result = await (0, database_1.query)('SELECT * FROM agents WHERE api_key = $1', [apiKey]);
        return result.rows[0] || null;
    }
    static async findById(id) {
        const result = await (0, database_1.query)('SELECT * FROM agents WHERE id = $1', [id]);
        return result.rows[0] || null;
    }
    static async updateBalance(id, amount) {
        await (0, database_1.query)('UPDATE agents SET balance = balance + $1 WHERE id = $2', [amount, id]);
    }
    static async updateReputation(id, newScore) {
        await (0, database_1.query)('UPDATE agents SET reputation_score = $1 WHERE id = $2', [newScore, id]);
    }
    static async incrementJobsCompleted(id) {
        await (0, database_1.query)('UPDATE agents SET total_jobs_completed = total_jobs_completed + 1 WHERE id = $1', [id]);
    }
}
exports.AgentModel = AgentModel;
class ServiceModel {
    static async create(service) {
        const result = await (0, database_1.query)(`INSERT INTO services (agent_id, name, description, category, price_per_unit, unit_type, estimated_time, api_schema, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`, [service.agentId, service.name, service.description, service.category,
            service.pricePerUnit, service.unitType, service.estimatedTime,
            JSON.stringify(service.apiSchema), service.isActive]);
        return result.rows[0];
    }
    static async findById(id) {
        const result = await (0, database_1.query)('SELECT * FROM services WHERE id = $1', [id]);
        return result.rows[0] || null;
    }
    static async search(filters) {
        let sql = 'SELECT * FROM services WHERE is_active = true';
        const params = [];
        let paramIndex = 1;
        if (filters.category) {
            sql += ` AND category = $${paramIndex}`;
            params.push(filters.category);
            paramIndex++;
        }
        if (filters.maxPrice) {
            sql += ` AND price_per_unit <= $${paramIndex}`;
            params.push(filters.maxPrice);
            paramIndex++;
        }
        if (filters.minRating) {
            sql += ` AND average_rating >= $${paramIndex}`;
            params.push(filters.minRating);
            paramIndex++;
        }
        if (filters.agentId) {
            sql += ` AND agent_id = $${paramIndex}`;
            params.push(filters.agentId);
            paramIndex++;
        }
        sql += ' ORDER BY average_rating DESC, total_reviews DESC';
        const result = await (0, database_1.query)(sql, params);
        return result.rows;
    }
    static async updateRating(id, newRating) {
        await (0, database_1.query)(`UPDATE services 
       SET average_rating = (($3 + (average_rating * total_reviews)) / (total_reviews + 1)),
           total_reviews = total_reviews + 1
       WHERE id = $1`, [id, newRating]);
    }
}
exports.ServiceModel = ServiceModel;
class JobModel {
    static async create(job) {
        const result = await (0, database_1.query)(`INSERT INTO jobs (service_id, client_agent_id, provider_agent_id, status, price, input, x402_request_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`, [job.serviceId, job.clientAgentId, job.providerAgentId, job.status,
            job.price, JSON.stringify(job.input), job.x402RequestId]);
        return result.rows[0];
    }
    static async findById(id) {
        const result = await (0, database_1.query)('SELECT * FROM jobs WHERE id = $1', [id]);
        return result.rows[0] || null;
    }
    static async updateStatus(id, status, output) {
        let sql = 'UPDATE jobs SET status = $1';
        const params = [status];
        if (status === 'in_progress') {
            sql += ', started_at = CURRENT_TIMESTAMP';
        }
        if (status === 'completed' || status === 'failed') {
            sql += ', completed_at = CURRENT_TIMESTAMP';
        }
        if (output) {
            sql += ', output = $2';
            params.push(JSON.stringify(output));
        }
        sql += ` WHERE id = $${params.length + 1}`;
        params.push(id);
        await (0, database_1.query)(sql, params);
    }
    static async markPaymentReceived(id, txHash) {
        await (0, database_1.query)('UPDATE jobs SET status = $1, x402_tx_hash = $2 WHERE id = $3', ['payment_received', txHash, id]);
    }
    static async findByClientAgent(agentId) {
        const result = await (0, database_1.query)('SELECT * FROM jobs WHERE client_agent_id = $1 ORDER BY created_at DESC', [agentId]);
        return result.rows;
    }
    static async findByProviderAgent(agentId) {
        const result = await (0, database_1.query)('SELECT * FROM jobs WHERE provider_agent_id = $1 ORDER BY created_at DESC', [agentId]);
        return result.rows;
    }
}
exports.JobModel = JobModel;
class ReviewModel {
    static async create(review) {
        const result = await (0, database_1.query)(`INSERT INTO reviews (job_id, service_id, client_agent_id, provider_agent_id, rating, review)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`, [review.jobId, review.serviceId, review.clientAgentId,
            review.providerAgentId, review.rating, review.review]);
        return result.rows[0];
    }
    static async findByService(serviceId) {
        const result = await (0, database_1.query)('SELECT * FROM reviews WHERE service_id = $1 ORDER BY created_at DESC', [serviceId]);
        return result.rows;
    }
}
exports.ReviewModel = ReviewModel;
//# sourceMappingURL=index.js.map