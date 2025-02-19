import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Session } from '../models/Session';
import { authenticate } from '../middleware/auth';
import { sendEmail, getVerificationEmailTemplate, getPasswordResetEmailTemplate } from '../services/email';

const router = express.Router();

/**
 * asyncHandler: Wraps an async route handler so that it returns Promise<void>.
 */
function asyncHandler(
  fn: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<void>
): express.RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

// In-memory storage for pending registrations
const pendingRegistrations = new Map<
  string,
  {
    username: string;
    email: string;
    password_hash: string;
    verificationCode: string;
    expiresAt: Date;
  }
>();

// Cleanup expired pending registrations every 10 minutes
setInterval(() => {
  const now = new Date();
  for (const [token, registration] of pendingRegistrations.entries()) {
    if (registration.expiresAt < now) {
      pendingRegistrations.delete(token);
    }
  }
}, 10 * 60 * 1000);

// Check username availability
router.get(
  '/check-username',
  asyncHandler(async (req, res) => {
    const { username } = req.query;
    if (!username || typeof username !== 'string') {
      res.status(400).json({ message: 'Username is required' });
      return;
    }

    const user = await User.findOne({ username: username.toLowerCase() });
    res.json({ exists: !!user });
    return;
  })
);

// Check email availability
router.get(
  '/check-email',
  asyncHandler(async (req, res) => {
    const { email } = req.query;
    if (!email || typeof email !== 'string') {
      res.status(400).json({ message: 'Email is required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    res.json({ exists: !!user });
    return;
  })
);

// Register new user
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: email.toLowerCase() }
      ]
    });

    if (existingUser) {
      res.status(400).json({
        message:
          existingUser.username === username.toLowerCase()
            ? 'Username already taken'
            : 'Email already registered'
      });
      return;
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Generate verification code
    const verificationCode = Math.random().toString().slice(2, 8);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry

    // Generate a temporary token for this registration
    const token = uuidv4();

    // Store registration data temporarily
    pendingRegistrations.set(token, {
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password_hash,
      verificationCode,
      expiresAt
    });

    // Send verification email
    const { subject, html } = getVerificationEmailTemplate(username, verificationCode);
    await sendEmail({
      to: email,
      subject,
      html
    });

    res.status(201).json({
      user: {
        username: username.toLowerCase(),
        email: email.toLowerCase()
      },
      token
    });
    return;
  })
);

// Verify OTP
router.post(
  '/verify-otp',
  asyncHandler(async (req, res) => {
    const { otp } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(400).json({ message: 'Token is required' });
      return;
    }

    // Get pending registration
    const registration = pendingRegistrations.get(token);
    if (!registration) {
      res.status(400).json({ message: 'Invalid or expired registration' });
      return;
    }

    if (registration.verificationCode !== otp) {
      res.status(400).json({ message: 'Invalid verification code' });
      return;
    }

    if (registration.expiresAt < new Date()) {
      pendingRegistrations.delete(token);
      res.status(400).json({ message: 'Verification code expired' });
      return;
    }

    // Create user
    const user = await User.create({
      username: registration.username,
      email: registration.email,
      password_hash: registration.password_hash,
      email_verified: true
    });

    // Create session token
    const sessionToken = uuidv4();
    const expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Create session
    await Session.create({
      user_id: user._id,
      token: sessionToken,
      expires_at,
      user_agent: req.headers['user-agent'],
      ip_address: req.ip
    });

    // Clear pending registration
    pendingRegistrations.delete(token);

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      },
      token: sessionToken
    });
    return;
  })
);

// Login
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    // Find user by username or email
    const user = await User.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: username.toLowerCase() }
      ]
    });

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Create session token
    const token = uuidv4();
    const expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Create session
    await Session.create({
      user_id: user._id,
      token,
      expires_at,
      user_agent: req.headers['user-agent'],
      ip_address: req.ip
    });

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      },
      token
    });
    return;
  })
);

// Request password reset
router.post(
  '/forgot-password',
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Generate reset token
    const resetToken = uuidv4();
    const expires_at = new Date();
    expires_at.setHours(expires_at.getHours() + 1); // 1 hour expiry

    // Store reset token in session
    await Session.create({
      user_id: user._id,
      token: resetToken,
      expires_at,
      user_agent: req.headers['user-agent'],
      ip_address: req.ip
    });

    // Send reset email
    const { subject, html } = getPasswordResetEmailTemplate(user.username, resetToken);
    await sendEmail({
      to: email,
      subject,
      html
    });

    res.json({ message: 'Password reset email sent' });
    return;
  })
);

// Reset password
router.post(
  '/reset-password',
  asyncHandler(async (req, res) => {
    const { token, password } = req.body;

    // Find valid reset session
    const session = await Session.findOne({
      token,
      expires_at: { $gt: new Date() }
    });
    if (!session) {
      res.status(400).json({ message: 'Invalid or expired reset token' });
      return;
    }

    // Update password
    const password_hash = await bcrypt.hash(password, 10);
    await User.updateOne({ _id: session.user_id }, { password_hash });

    // Delete reset session
    await Session.deleteOne({ _id: session._id });

    res.json({ message: 'Password reset successful' });
    return;
  })
);

// Send verification code
router.post(
  '/send-verification',
  authenticate,
  asyncHandler(async (req, res) => {
    const verificationCode = Math.random().toString().slice(2, 8);
    const expires_at = new Date();
    expires_at.setMinutes(expires_at.getMinutes() + 10); // 10 minutes expiry

    // Store verification code in session
    await Session.create({
      user_id: req.user._id,
      token: verificationCode,
      expires_at,
      user_agent: req.headers['user-agent'],
      ip_address: req.ip
    });

    // Send verification email
    const { subject, html } = getVerificationEmailTemplate(req.user.username, verificationCode);
    await sendEmail({
      to: req.user.email,
      subject,
      html
    });

    res.json({ message: 'Verification code sent' });
  })
);

// Logout
router.post(
  '/logout',
  authenticate,
  asyncHandler(async (req, res) => {
    await Session.deleteOne({ _id: req.session._id });
    res.json({ message: 'Logged out successfully' });
  })
);

// Get current user
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    res.json({
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email
      }
    });
  })
);

// Helper function to create a new session (if needed)


export default router;
