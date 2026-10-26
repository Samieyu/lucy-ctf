import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  async sendPasswordResetEmail(email: string, rawToken: string) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

    if (!this.transporter) {
      this.logger.warn(`[DEV MAIL] Password reset requested for ${email}: ${resetLink}`);
      return;
    }

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@lucyctf.org',
      to: email,
      subject: 'Lucy CTF - Password Reset Request',
      text: `You requested a password reset. Click this link to set a new password: ${resetLink}\nThis link expires in 15 minutes.`,
      html: `<p>You requested a password reset for Lucy CTF.</p><p><a href="${resetLink}">Click here to reset your password</a></p><p>This link expires in 15 minutes.</p>`,
    });
  }

  async sendVerificationEmail(email: string, rawToken: string) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verifyLink = `${frontendUrl}/verify-email?token=${rawToken}&email=${encodeURIComponent(email)}`;

    if (!this.transporter) {
      this.logger.warn(`[DEV MAIL] Email verification for ${email}: ${verifyLink}`);
      return;
    }

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@lucyctf.org',
      to: email,
      subject: 'Lucy CTF - Verify Email Address',
      text: `Please verify your email address by clicking: ${verifyLink}`,
      html: `<p>Welcome to Lucy CTF!</p><p><a href="${verifyLink}">Click here to verify your email address</a></p>`,
    });
  }
}
