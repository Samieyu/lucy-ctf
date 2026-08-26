import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt-payload.interface';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });

    if (existing) {
      throw new ConflictException('Email or username already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        passwordHash,
      },
    });

    return this.issueTokens({
      sub: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens({
      sub: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  }

  private issueTokens(payload: JwtPayload) {
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'change_me_in_env',
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'change_me_in_env',
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }
}
