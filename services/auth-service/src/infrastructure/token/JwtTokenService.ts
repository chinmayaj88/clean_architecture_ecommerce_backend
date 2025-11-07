
import jwt from 'jsonwebtoken';
import { ITokenService } from '../../ports/interfaces/ITokenService';
import { AuthTokenPayload, AuthTokens } from '../../core/entities/AuthToken';
import { getEnvConfig } from '../../config/env';

export class JwtTokenService implements ITokenService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiresIn: string;
  private readonly refreshExpiresIn: string;

  constructor() {
    const config = getEnvConfig();
    this.accessSecret = config.JWT_SECRET;
    this.refreshSecret = config.JWT_REFRESH_SECRET;
    this.accessExpiresIn = config.JWT_ACCESS_TOKEN_EXPIRES_IN;
    this.refreshExpiresIn = config.JWT_REFRESH_TOKEN_EXPIRES_IN;
  }

  async generateTokens(
    payload: Omit<AuthTokenPayload, 'type' | 'iat' | 'exp'>
  ): Promise<AuthTokens> {
    const accessPayload: AuthTokenPayload = {
      ...payload,
      type: 'access',
    };

    const refreshPayload: AuthTokenPayload = {
      ...payload,
      type: 'refresh',
    };

    const accessToken = jwt.sign(
      accessPayload,
      this.accessSecret,
      {
        expiresIn: this.accessExpiresIn,
      } as jwt.SignOptions
    );

    const refreshToken = jwt.sign(
      refreshPayload,
      this.refreshSecret,
      {
        expiresIn: this.refreshExpiresIn,
      } as jwt.SignOptions
    );

    // Parse expiresIn to seconds
    const expiresInSeconds = this.parseExpiresIn(this.accessExpiresIn);

    return {
      accessToken,
      refreshToken,
      expiresIn: expiresInSeconds,
    };
  }

  async verifyAccessToken(token: string): Promise<AuthTokenPayload> {
    try {
      const payload = jwt.verify(token, this.accessSecret) as AuthTokenPayload;
      if (payload.type !== 'access') {
        throw new Error('Invalid token type');
      }
      return payload;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  async verifyRefreshToken(token: string): Promise<AuthTokenPayload> {
    try {
      const payload = jwt.verify(token, this.refreshSecret) as AuthTokenPayload;
      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      return payload;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  decodeToken(token: string): AuthTokenPayload | null {
    try {
      return jwt.decode(token) as AuthTokenPayload;
    } catch {
      return null;
    }
  }

  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])?$/);
    if (!match) {
      return 3600;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return value;
    }
  }
}

