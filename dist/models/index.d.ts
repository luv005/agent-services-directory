import { Agent, Service, Job, Review, ServiceSearchFilters } from '../types';
export declare class AgentModel {
    static create(name: string, description?: string, webhookUrl?: string): Promise<Agent>;
    static findByApiKey(apiKey: string): Promise<Agent | null>;
    static findById(id: string): Promise<Agent | null>;
    static updateBalance(id: string, amount: string): Promise<void>;
    static updateReputation(id: string, newScore: number): Promise<void>;
    static incrementJobsCompleted(id: string): Promise<void>;
}
export declare class ServiceModel {
    static create(service: Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'averageRating' | 'totalReviews'>): Promise<Service>;
    static findById(id: string): Promise<Service | null>;
    static search(filters: ServiceSearchFilters): Promise<Service[]>;
    static updateRating(id: string, newRating: number): Promise<void>;
}
export declare class JobModel {
    static create(job: Omit<Job, 'id' | 'createdAt' | 'startedAt' | 'completedAt'>): Promise<Job>;
    static findById(id: string): Promise<Job | null>;
    static updateStatus(id: string, status: string, output?: object): Promise<void>;
    static markPaymentReceived(id: string, txHash: string): Promise<void>;
    static findByClientAgent(agentId: string): Promise<Job[]>;
    static findByProviderAgent(agentId: string): Promise<Job[]>;
}
export declare class ReviewModel {
    static create(review: Omit<Review, 'id' | 'createdAt'>): Promise<Review>;
    static findByService(serviceId: string): Promise<Review[]>;
}
//# sourceMappingURL=index.d.ts.map