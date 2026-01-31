import { query } from '../database';
import { Agent, Service, Job, Review, ServiceSearchFilters } from '../types';
import crypto from 'crypto';
import { ethers } from 'ethers';

export class AgentModel {
  static async create(name: string, description?: string, webhookUrl?: string): Promise<Agent> {
    const apiKey = `asd_${crypto.randomBytes(32).toString('hex')}`;
    
    // Generate a deposit address (in production, this would be from a wallet)
    const wallet = ethers.Wallet.createRandom();
    const depositAddress = wallet.address;
    
    const result = await query(
      `INSERT INTO agents (name, description, api_key, deposit_address, webhook_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, description, apiKey, depositAddress, webhookUrl]
    );
    
    return result.rows[0] as Agent;
  }

  static async findByApiKey(apiKey: string): Promise<Agent | null> {
    const result = await query('SELECT * FROM agents WHERE api_key = $1', [apiKey]);
    return result.rows[0] as Agent || null;
  }

  static async findById(id: string): Promise<Agent | null> {
    const result = await query('SELECT * FROM agents WHERE id = $1', [id]);
    return result.rows[0] as Agent || null;
  }

  static async updateBalance(id: string, amount: string): Promise<void> {
    await query(
      'UPDATE agents SET balance = balance + $1 WHERE id = $2',
      [amount, id]
    );
  }

  static async updateReputation(id: string, newScore: number): Promise<void> {
    await query(
      'UPDATE agents SET reputation_score = $1 WHERE id = $2',
      [newScore, id]
    );
  }

  static async incrementJobsCompleted(id: string): Promise<void> {
    await query(
      'UPDATE agents SET total_jobs_completed = total_jobs_completed + 1 WHERE id = $1',
      [id]
    );
  }
}

export class ServiceModel {
  static async create(service: Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'averageRating' | 'totalReviews'>): Promise<Service> {
    const result = await query(
      `INSERT INTO services (agent_id, name, description, category, price_per_unit, unit_type, estimated_time, api_schema, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [service.agentId, service.name, service.description, service.category, 
       service.pricePerUnit, service.unitType, service.estimatedTime, 
       JSON.stringify(service.apiSchema), service.isActive]
    );
    
    return result.rows[0] as Service;
  }

  static async findById(id: string): Promise<Service | null> {
    const result = await query('SELECT * FROM services WHERE id = $1', [id]);
    return result.rows[0] as Service || null;
  }

  static async search(filters: ServiceSearchFilters): Promise<Service[]> {
    let sql = 'SELECT * FROM services WHERE is_active = true';
    const params: any[] = [];
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

    const result = await query(sql, params);
    return result.rows as Service[];
  }

  static async updateRating(id: string, newRating: number): Promise<void> {
    await query(
      `UPDATE services 
       SET average_rating = (($3 + (average_rating * total_reviews)) / (total_reviews + 1)),
           total_reviews = total_reviews + 1
       WHERE id = $1`,
      [id, newRating]
    );
  }
}

export class JobModel {
  static async create(job: Omit<Job, 'id' | 'createdAt' | 'startedAt' | 'completedAt'>): Promise<Job> {
    const result = await query(
      `INSERT INTO jobs (service_id, client_agent_id, provider_agent_id, status, price, input, x402_request_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [job.serviceId, job.clientAgentId, job.providerAgentId, job.status, 
       job.price, JSON.stringify(job.input), job.x402RequestId]
    );
    
    return result.rows[0] as Job;
  }

  static async findById(id: string): Promise<Job | null> {
    const result = await query('SELECT * FROM jobs WHERE id = $1', [id]);
    return result.rows[0] as Job || null;
  }

  static async updateStatus(id: string, status: string, output?: object): Promise<void> {
    let sql = 'UPDATE jobs SET status = $1';
    const params: any[] = [status];
    
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
    
    await query(sql, params);
  }

  static async markPaymentReceived(id: string, txHash: string): Promise<void> {
    await query(
      'UPDATE jobs SET status = $1, x402_tx_hash = $2 WHERE id = $3',
      ['payment_received', txHash, id]
    );
  }

  static async findByClientAgent(agentId: string): Promise<Job[]> {
    const result = await query(
      'SELECT * FROM jobs WHERE client_agent_id = $1 ORDER BY created_at DESC',
      [agentId]
    );
    return result.rows as Job[];
  }

  static async findByProviderAgent(agentId: string): Promise<Job[]> {
    const result = await query(
      'SELECT * FROM jobs WHERE provider_agent_id = $1 ORDER BY created_at DESC',
      [agentId]
    );
    return result.rows as Job[];
  }
}

export class ReviewModel {
  static async create(review: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
    const result = await query(
      `INSERT INTO reviews (job_id, service_id, client_agent_id, provider_agent_id, rating, review)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [review.jobId, review.serviceId, review.clientAgentId, 
       review.providerAgentId, review.rating, review.review]
    );
    
    return result.rows[0] as Review;
  }

  static async findByService(serviceId: string): Promise<Review[]> {
    const result = await query(
      'SELECT * FROM reviews WHERE service_id = $1 ORDER BY created_at DESC',
      [serviceId]
    );
    return result.rows as Review[];
  }
}
