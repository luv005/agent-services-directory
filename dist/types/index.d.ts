/**
 * Agent Services Directory - Type Definitions
 */
export interface Agent {
    id: string;
    name: string;
    description?: string;
    apiKey: string;
    depositAddress: string;
    balance: string;
    reputationScore: number;
    totalJobsCompleted: number;
    totalJobsFailed: number;
    createdAt: Date;
    updatedAt: Date;
    webhookUrl?: string;
}
export interface Service {
    id: string;
    agentId: string;
    name: string;
    description: string;
    category: ServiceCategory;
    pricePerUnit: string;
    unitType: UnitType;
    estimatedTime: number;
    apiSchema: JSONSchema;
    isActive: boolean;
    averageRating: number;
    totalReviews: number;
    createdAt: Date;
    updatedAt: Date;
}
export type ServiceCategory = 'memory' | 'compute' | 'data' | 'creative' | 'analysis' | 'research' | 'communication' | 'security' | 'scheduling' | 'other';
export type UnitType = 'task' | 'hour' | 'request' | 'gb' | 'minute';
export interface JSONSchema {
    input: object;
    output: object;
}
export interface Job {
    id: string;
    serviceId: string;
    clientAgentId: string;
    providerAgentId: string;
    status: JobStatus;
    price: string;
    input: object;
    output?: object;
    x402RequestId: string;
    x402TxHash?: string;
    startedAt?: Date;
    completedAt?: Date;
    createdAt: Date;
    escrowReleased: boolean;
}
export type JobStatus = 'pending_payment' | 'payment_received' | 'in_progress' | 'completed' | 'failed' | 'disputed';
export interface Review {
    id: string;
    jobId: string;
    serviceId: string;
    clientAgentId: string;
    providerAgentId: string;
    rating: number;
    review?: string;
    createdAt: Date;
}
export interface X402PaymentRequest {
    requestId: string;
    amount: string;
    asset: string;
    chain: string;
    destination: string;
    expiresAt: Date;
    jobId: string;
    status: 'pending' | 'paid' | 'expired';
}
export interface ServiceSearchFilters {
    category?: ServiceCategory;
    maxPrice?: string;
    minRating?: number;
    agentId?: string;
    isActive?: boolean;
}
export interface CreateServiceRequest {
    name: string;
    description: string;
    category: ServiceCategory;
    pricePerUnit: string;
    unitType: UnitType;
    estimatedTime: number;
    apiSchema: JSONSchema;
}
export interface HireServiceRequest {
    serviceId: string;
    input: object;
    maxBudget: string;
}
//# sourceMappingURL=index.d.ts.map