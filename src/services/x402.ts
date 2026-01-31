import { ethers } from 'ethers';
import { query } from '../database';
import { v4 as uuidv4 } from 'uuid';

const USDC_CONTRACTS: Record<string, string> = {
  base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  polygon: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
};

const RPC_URLS: Record<string, string> = {
  base: 'https://mainnet.base.org',
  polygon: 'https://polygon-rpc.com'
};

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

export class X402Service {
  static async createPaymentRequest(
    jobId: string,
    amount: string,
    destination: string,
    chain: string = 'base',
    asset: string = 'USDC'
  ): Promise<PaymentRequest> {
    const requestId = uuidv4();
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour expiry

    await query(
      `INSERT INTO x402_requests (request_id, amount, asset, chain, destination, expires_at, job_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [requestId, amount, asset, chain, destination, expiresAt, jobId]
    );

    return {
      requestId,
      amount,
      asset,
      chain,
      destination,
      expiresAt,
      jobId
    };
  }

  static async verifyPayment(proof: PaymentProof): Promise<boolean> {
    // Check if payment request exists and is pending
    const requestResult = await query(
      'SELECT * FROM x402_requests WHERE request_id = $1 AND status = $2',
      [proof.requestId, 'pending']
    );

    if (requestResult.rows.length === 0) {
      throw new Error('Payment request not found or already processed');
    }

    const request = requestResult.rows[0];

    // Check if expired
    if (new Date() > new Date(request.expires_at)) {
      await query(
        'UPDATE x402_requests SET status = $1 WHERE request_id = $2',
        ['expired', proof.requestId]
      );
      throw new Error('Payment request expired');
    }

    // Check if tx already used (replay protection)
    const txResult = await query(
      'SELECT * FROM jobs WHERE x402_tx_hash = $1',
      [proof.txHash]
    );

    if (txResult.rows.length > 0) {
      throw new Error('Transaction already used');
    }

    // Verify on-chain
    const isValid = await this.verifyOnChain(proof.txHash, request);

    if (!isValid) {
      throw new Error('Payment verification failed');
    }

    // Mark as paid
    await query(
      'UPDATE x402_requests SET status = $1 WHERE request_id = $2',
      ['paid', proof.requestId]
    );

    // Update job status
    await query(
      'UPDATE jobs SET status = $1, x402_tx_hash = $2 WHERE id = $3',
      ['payment_received', proof.txHash, request.job_id]
    );

    // Credit provider's balance
    const jobResult = await query(
      'SELECT provider_agent_id FROM jobs WHERE id = $1',
      [request.job_id]
    );

    if (jobResult.rows.length > 0) {
      await query(
        'UPDATE agents SET balance = balance + $1 WHERE id = $2',
        [request.amount, jobResult.rows[0].provider_agent_id]
      );
    }

    return true;
  }

  private static async verifyOnChain(
    txHash: string,
    request: any
  ): Promise<boolean> {
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URLS[request.chain]);
      
      // Get transaction receipt
      const receipt = await provider.getTransactionReceipt(txHash);
      
      if (!receipt || receipt.status !== 1) {
        return false;
      }

      // For production, we'd verify:
      // 1. Transaction is to USDC contract
      // 2. Transfer is to the correct destination address
      // 3. Amount matches expected
      // 4. Transaction is confirmed (N blocks)

      // Simplified check for MVP
      return receipt.to?.toLowerCase() === USDC_CONTRACTS[request.chain].toLowerCase() ||
             receipt.to?.toLowerCase() === request.destination.toLowerCase();
    } catch (error) {
      console.error('On-chain verification error:', error);
      return false;
    }
  }

  static async getPaymentRequest(requestId: string): Promise<any | null> {
    const result = await query(
      'SELECT * FROM x402_requests WHERE request_id = $1',
      [requestId]
    );
    return result.rows[0] || null;
  }

  static format402Response(paymentRequest: PaymentRequest) {
    return {
      success: false,
      message: 'Payment Required',
      payment_instructions: {
        request_id: paymentRequest.requestId,
        amount: paymentRequest.amount,
        asset: paymentRequest.asset,
        destination: paymentRequest.destination,
        chain: paymentRequest.chain,
        expires_at: paymentRequest.expiresAt.toISOString()
      }
    };
  }
}
