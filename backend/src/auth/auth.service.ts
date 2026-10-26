import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { authenticator } from 'otplib';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt-payload.interface';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/password-reset.dto';
import { Verify2FADto } from './dto/two-factor.dto';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });

    if (existing) {
      throw new ConflictException('Email or username already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        passwordHash,
        emailVerified: false,
        emailVerificationToken: hashedVerificationToken,
      },
    });

    // Send verification email in background
    this.mailService
      .sendVerificationEmail(user.email, verificationToken)
      .catch(() => {});

    return this.issueTokens(
      {
        sub: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
      },
      user.id,
    );
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isBanned) {
      throw new ForbiddenException(
        `Account is banned: ${user.banReason || 'Violation of rules'}`,
      );
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2FA Verification
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      if (!dto.twoFactorCode) {
        return {
          requires2FA: true,
          message: 'Two-factor authentication code required',
        };
      }

      const isValid = this.verify2FAOrRecovery(
        user.twoFactorSecret,
        user.twoFactorRecoveryCodes,
        dto.twoFactorCode,
      );

      if (!isValid) {
        throw new UnauthorizedException('Invalid two-factor code or recovery key');
      }
    }

    return this.issueTokens(
      {
        sub: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
      },
      user.id,
    );
  }

  // Refresh token rotation with family reuse detection
  async refreshToken(rawRefreshToken: string) {
    if (!rawRefreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const tokenHash = crypto
      .createHash('sha256')
      .update(rawRefreshToken)
      .digest('hex');

    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    // Reuse detection: if record is not found or already revoked, revoke whole family
    if (!tokenRecord || tokenRecord.isRevoked) {
      if (tokenRecord) {
        await this.prisma.refreshToken.updateMany({
          where: { familyId: tokenRecord.familyId },
          data: { isRevoked: true },
        });
      }
      throw new UnauthorizedException(
        'Invalid or reused refresh token. Please sign in again.',
      );
    }

    if (new Date() > tokenRecord.expiresAt) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    if (tokenRecord.user.isBanned) {
      throw new ForbiddenException('Account has been banned');
    }

    // Mark current token as revoked and issue new one in same family
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { isRevoked: true },
    });

    return this.issueTokens(
      {
        sub: tokenRecord.user.id,
        email: tokenRecord.user.email,
        isAdmin: tokenRecord.user.isAdmin,
      },
      tokenRecord.user.id,
      tokenRecord.familyId,
    );
  }

  // Two-factor setup
  async generate2FASecret(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(
      user.email,
      'Lucy CTF',
      secret,
    );

    // Temporarily save secret
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    return { secret, otpauthUrl };
  }

  async enable2FA(userId: string, dto: Verify2FADto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('Please generate a 2FA secret first');
    }

    const isValid = authenticator.check(dto.code, user.twoFactorSecret);
    if (!isValid) {
      throw new BadRequestException('Invalid authentication code');
    }

    // Generate 8 backup recovery codes
    const plainCodes: string[] = [];
    const hashedCodes: string[] = [];
    for (let i = 0; i < 8; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      plainCodes.push(code);
      hashedCodes.push(
        crypto.createHash('sha256').update(code).digest('hex'),
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorRecoveryCodes: JSON.stringify(hashedCodes),
      },
    });

    return {
      success: true,
      recoveryCodes: plainCodes,
      message: '2FA successfully enabled. Save your recovery codes safely!',
    };
  }

  async disable2FA(userId: string, dto: Verify2FADto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorEnabled) {
      throw new BadRequestException('2FA is not enabled');
    }

    const isValid = this.verify2FAOrRecovery(
      user.twoFactorSecret!,
      user.twoFactorRecoveryCodes,
      dto.code,
    );
    if (!isValid) {
      throw new UnauthorizedException('Invalid code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorRecoveryCodes: null,
      },
    });

    return { success: true, message: '2FA successfully disabled' };
  }

  // Password reset
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (user && !user.isBanned) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: hashedToken,
          passwordResetExpiresAt: expiresAt,
        },
      });

      this.mailService
        .sendPasswordResetEmail(user.email, rawToken)
        .catch(() => {});
    }

    return {
      message:
        'If an account exists with this email, password reset instructions have been sent.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const hashedToken = crypto
      .createHash('sha256')
      .update(dto.token)
      .digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
        passwordResetToken: hashedToken,
        passwordResetExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });

    return { success: true, message: 'Password reset successful. You may now log in.' };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const hashedToken = crypto
      .createHash('sha256')
      .update(dto.token)
      .digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
        emailVerificationToken: hashedToken,
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
      },
    });

    return { success: true, message: 'Email successfully verified' };
  }

  private verify2FAOrRecovery(
    secret: string,
    recoveryJson: string | null,
    code: string,
  ): boolean {
    const trimmed = code.trim();
    if (authenticator.check(trimmed, secret)) {
      return true;
    }

    // Check recovery codes
    if (recoveryJson) {
      try {
        const hashedCodes: string[] = JSON.parse(recoveryJson);
        const inputHash = crypto
          .createHash('sha256')
          .update(trimmed.toUpperCase())
          .digest('hex');
        if (hashedCodes.includes(inputHash)) {
          return true;
        }
      } catch {
        return false;
      }
    }

    return false;
  }

  private async issueTokens(
    payload: JwtPayload,
    userId: string,
    familyId?: string,
  ) {
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'change_me_in_env',
      expiresIn: '15m',
    });

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawRefreshToken)
      .digest('hex');
    const activeFamilyId = familyId || crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        familyId: activeFamilyId,
        expiresAt,
        isRevoked: false,
      },
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }
}
