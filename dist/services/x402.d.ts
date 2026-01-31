export interface PaymentRequest {
    requestId: string;
    amount: string;
    asset: string;
    chain: string;
    destination: string;
    expiresAt: Date;
    jobId: string;
}
export interface PaymentProof {
    requestId: string;
    txHash: string;
}
export declare class X402Service {
    static createPaymentRequest(jobId: string, amount: string, destination: string, chain?: string, asset?: string): Promise<PaymentRequest>;
    static verifyPayment(proof: PaymentProof): Promise<boolean>;
    private static verifyOnChain;
    static getPaymentRequest(requestId: string): Promise<any | null>;
    static format402Response(paymentRequest: PaymentRequest): {
        success: boolean;
        message: string;
        payment_instructions: {
            request_id: string;
            amount: string;
            asset: string;
            destination: string;
            chain: string;
            expires_at: string;
        };
    };
}
//# sourceMappingURL=x402.d.ts.map