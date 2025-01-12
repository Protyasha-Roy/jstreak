import { Resend } from 'resend';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not defined in environment variables');
}

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: EmailOptions) => {
  try {
    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to,
      subject,
      html,
    });

    return { success: true, data };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error };
  }
};

// Email templates
export const getWelcomeEmailTemplate = (username: string) => {
  return {
    subject: 'Welcome to JStreak! 🎉',
    html: `
      <h1>Welcome to JStreak, ${username}!</h1>
      <p>Thank you for joining our journaling community. We're excited to have you on board!</p>
      <p>Start your journaling journey today by logging into your account:</p>
      <p><a href="${process.env.FRONTEND_URL}/login">Login to JStreak</a></p>
      <p>Happy journaling!</p>
      <p>Best regards,<br>The JStreak Team</p>
    `
  };
};

export const getPasswordResetEmailTemplate = (username: string, resetToken: string) => {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  return {
    subject: 'Reset Your JStreak Password',
    html: `
      <h1>Password Reset Request</h1>
      <p>Hi ${username},</p>
      <p>We received a request to reset your password. Click the link below to set a new password:</p>
      <p><a href="${resetLink}">Reset Password</a></p>
      <p>This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br>The JStreak Team</p>
    `
  };
};

export const getVerificationEmailTemplate = (username: string, verificationCode: string) => {
  return {
    subject: 'Verify Your JStreak Email',
    html: `
      <h1>Email Verification</h1>
      <p>Hi ${username},</p>
      <p>Your verification code is:</p>
      <h2 style="font-size: 24px; padding: 10px; background-color: #f5f5f5; text-align: center;">${verificationCode}</h2>
      <p>Enter this code in the app to verify your email address.</p>
      <p>This code will expire in 10 minutes.</p>
      <p>Best regards,<br>The JStreak Team</p>
    `
  };
};
