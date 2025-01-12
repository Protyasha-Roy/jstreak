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
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Find valid session
    const session = await Session.findOne({
      token,
      expires_at: { $gt: new Date() }
    });

    if (!session) {
      return res.status(401).json({ message: 'Session expired or invalid' });
    }

    // Find user
    const user = await User.findOne({ _id: session.user_id });
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Attach user and session to request
    req.user = user;
    req.session = session;
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};
