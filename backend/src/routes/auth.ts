import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Session } from '../models/Session';
import { authenticate } from '../middleware/auth';
import { sendEmail, getVerificationEmailTemplate, getPasswordResetEmailTemplate } from '../services/email';

const router = express.Router();

// In-memory storage for pending registrations
const pendingRegistrations = new Map<string, {
  username: string;
  email: string;
  password_hash: string;
  verificationCode: string;
  expiresAt: Date;
}>();

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
router.get('/check-username', async (req, res) => {
  try {
    const { username } = req.query;
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ message: 'Username is required' });
    }
    
    const user = await User.findOne({ username: username.toLowerCase() });
    return res.json({ exists: !!user });
  } catch (error) {
    console.error('Check username error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check email availability
router.get('/check-email', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    const user = await User.findOne({ email: email.toLowerCase() });
    return res.json({ exists: !!user });
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: email.toLowerCase() }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.username === username.toLowerCase()
          ? 'Username already taken'
          : 'Email already registered'
      });
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
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { otp } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    // Get pending registration
    const registration = pendingRegistrations.get(token);
    
    if (!registration) {
      return res.status(400).json({ message: 'Invalid or expired registration' });
    }

    if (registration.verificationCode !== otp) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    if (registration.expiresAt < new Date()) {
      pendingRegistrations.delete(token);
      return res.status(400).json({ message: 'Verification code expired' });
    }

    // Create user
    const user = await User.create({
      username: registration.username,
      email: registration.email,
      password_hash: registration.password_hash,
      email_verified: true // Email is verified since OTP matched
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
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username or email
    const user = await User.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: username.toLowerCase() }
      ]
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
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
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
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
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    // Find valid reset session
    const session = await Session.findOne({
      token,
      expires_at: { $gt: new Date() }
    });

    if (!session) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Update password
    const password_hash = await bcrypt.hash(password, 10);
    await User.updateOne({ _id: session.user_id }, { password_hash });

    // Delete reset session
    await Session.deleteOne({ _id: session._id });

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send verification code
router.post('/send-verification', authenticate, async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout
router.post('/logout', authenticate, async (req, res) => {
  try {
    await Session.deleteOne({ _id: req.session._id });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to create a new session
async function createSession(userId: string, req: express.Request) {
  const token = uuidv4();
  const expires_at = new Date();
  expires_at.setDate(expires_at.getDate() + 30); // 30 days session

  const session = await Session.create({
    user_id: userId,
    token,
    expires_at,
    user_agent: req.headers['user-agent'],
    ip_address: req.ip
  });

  return session;
}

export default router;
