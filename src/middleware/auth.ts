import { Request, Response, NextFunction } from 'express';
import { AgentModel } from '../models';

export interface AuthenticatedRequest extends Request {
  agent?: {
    id: string;
    name: string;
    apiKey: string;
  };
}

export const authenticateAgent = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
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
    const agent = await AgentModel.findByApiKey(apiKey);

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
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
};
