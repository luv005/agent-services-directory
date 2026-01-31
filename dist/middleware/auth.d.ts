import { Request, Response, NextFunction } from 'express';
export interface AuthenticatedRequest extends Request {
    agent?: {
        id: string;
        name: string;
        apiKey: string;
    };
}
export declare const authenticateAgent: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map