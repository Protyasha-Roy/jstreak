import { Request, Response, NextFunction } from 'express';
import { Session } from '../models/Session';
import { User } from '../models/User';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
      session?: any;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Find valid session
    const session = await Session.findOne({
      token,
      expires_at: { $gt: new Date() }
    });

    if (!session) {
      res.status(401).json({ message: 'Session expired or invalid' });
      return;
    }

    // Find user
    const user = await User.findOne({ _id: session.user_id });
    
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    // Attach user and session to request
    req.user = user;
    req.session = session;
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};
