// Auth controller - handles HTTP requests and calls use cases

import { Request, Response } from 'express';
import { RegisterUserUseCase } from '../../core/use-cases/RegisterUserUseCase';
import { LoginUseCase } from '../../core/use-cases/LoginUseCase';
import { RefreshTokenUseCase } from '../../core/use-cases/RefreshTokenUseCase';
import { LogoutUseCase } from '../../core/use-cases/LogoutUseCase';
import { ForgotPasswordUseCase } from '../../core/use-cases/ForgotPasswordUseCase';
import { ResetPasswordUseCase } from '../../core/use-cases/ResetPasswordUseCase';
import { VerifyEmailUseCase } from '../../core/use-cases/VerifyEmailUseCase';
import { ResendVerificationEmailUseCase } from '../../core/use-cases/ResendVerificationEmailUseCase';
import { ChangePasswordUseCase } from '../../core/use-cases/ChangePasswordUseCase';
import { DeactivateAccountUseCase } from '../../core/use-cases/DeactivateAccountUseCase';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import {
  RegisterRequest,
  LoginRequest,
  RefreshTokenRequest,
  LogoutRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  ResendVerificationEmailRequest,
  ChangePasswordRequest,
  DeactivateAccountRequest,
} from '../../ports/dtos/AuthDTOs';
import {
  sendSuccess,
  sendCreated,
  sendBadRequest,
  sendUnauthorized,
} from '../utils/response.util';

export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly resendVerificationEmailUseCase: ResendVerificationEmailUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly deactivateAccountUseCase: DeactivateAccountUseCase
  ) {}

  // Register new user
  async register(req: Request, res: Response): Promise<void> {
    try {
      const request: RegisterRequest = {
        email: req.body.email,
        password: req.body.password,
      };

      const result = await this.registerUserUseCase.execute(request);

      // Store refresh token in httpOnly cookie for security
      this.setRefreshTokenCookie(res, result.refreshToken);

      sendCreated(res, 'User registered successfully', {
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
        user: result.user,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      sendBadRequest(res, message, error instanceof Error ? error.message : undefined);
    }
  }

  // User login
  async login(req: Request, res: Response): Promise<void> {
    try {
      const request: LoginRequest & { ipAddress?: string; userAgent?: string } = {
        email: req.body.email,
        password: req.body.password,
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
      };

      const result = await this.loginUseCase.execute(request);

      // Store refresh token in cookie
      this.setRefreshTokenCookie(res, result.refreshToken);

      sendSuccess(res, 200, 'Login successful', {
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
        user: result.user,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      sendUnauthorized(res, message, error instanceof Error ? error.message : undefined);
    }
  }

  // Refresh access token
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      // Try to get refresh token from cookie, body, or header
      const refreshToken =
        req.cookies?.refreshToken || req.body.refreshToken || req.headers['x-refresh-token'];

      if (!refreshToken) {
        sendBadRequest(res, 'Refresh token is required');
        return;
      }

      const request: RefreshTokenRequest = { refreshToken };

      const result = await this.refreshTokenUseCase.execute(request);

      // Update refresh token cookie
      this.setRefreshTokenCookie(res, result.refreshToken);

      sendSuccess(res, 200, 'Token refreshed successfully', {
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
        user: result.user,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Token refresh failed';
      sendUnauthorized(res, message, error instanceof Error ? error.message : undefined);
    }
  }

  // Logout
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken =
        req.cookies?.refreshToken || req.body.refreshToken || req.headers['x-refresh-token'];

      if (!refreshToken) {
        sendBadRequest(res, 'Refresh token is required');
        return;
      }

      const request: LogoutRequest = { refreshToken };

      await this.logoutUseCase.execute(request);

      // Remove refresh token cookie
      this.clearRefreshTokenCookie(res);

      sendSuccess(res, 200, 'Logged out successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Logout failed';
      sendBadRequest(res, message, error instanceof Error ? error.message : undefined);
    }
  }

  // Helper to set refresh token cookie
  private setRefreshTokenCookie(res: Response, token: string): void {
    const config = require('../../config/env').getEnvConfig();
    const maxAge = this.parseExpiresIn(config.JWT_REFRESH_TOKEN_EXPIRES_IN) * 1000;

    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: config.COOKIE_SECURE,
      sameSite: 'strict',
      maxAge,
      path: '/',
      domain: config.COOKIE_DOMAIN,
    });
  }

  // Helper to clear refresh token cookie
  private clearRefreshTokenCookie(res: Response): void {
    const config = require('../../config/env').getEnvConfig();

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: config.COOKIE_SECURE,
      sameSite: 'strict',
      path: '/',
      domain: config.COOKIE_DOMAIN,
    });
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

  // Request password reset
  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const request: ForgotPasswordRequest = {
        email: req.body.email,
      };

      await this.forgotPasswordUseCase.execute(request);

      // Don't reveal if email exists (security best practice)
      sendSuccess(res, 200, 'If an account exists with this email, a password reset link has been sent.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process request';
      sendBadRequest(res, message, error instanceof Error ? error.message : undefined);
    }
  }

  // Reset password with token
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const request: ResetPasswordRequest = {
        token: req.body.token,
        password: req.body.password,
      };

      await this.resetPasswordUseCase.execute(request);

      sendSuccess(res, 200, 'Password has been reset successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password reset failed';
      sendBadRequest(res, message, error instanceof Error ? error.message : undefined);
    }
  }

  // Verify email address
  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const request: VerifyEmailRequest = {
        token: req.body.token,
      };

      await this.verifyEmailUseCase.execute(request);

      sendSuccess(res, 200, 'Email verified successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Email verification failed';
      sendBadRequest(res, message, error instanceof Error ? error.message : undefined);
    }
  }

  // Resend verification email
  async resendVerificationEmail(req: Request, res: Response): Promise<void> {
    try {
      const request: ResendVerificationEmailRequest = {
        email: req.body.email,
      };

      await this.resendVerificationEmailUseCase.execute(request);

      sendSuccess(res, 200, 'Verification email sent successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send verification email';
      sendBadRequest(res, message, error instanceof Error ? error.message : undefined);
    }
  }

  // Change password (requires auth)
  async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendUnauthorized(res, 'Authentication required');
        return;
      }

      const request: ChangePasswordRequest = {
        currentPassword: req.body.currentPassword,
        newPassword: req.body.newPassword,
      };

      await this.changePasswordUseCase.execute(req.user.userId, request);

      sendSuccess(res, 200, 'Password changed successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password change failed';
      sendBadRequest(res, message, error instanceof Error ? error.message : undefined);
    }
  }

  // Deactivate account (requires auth)
  async deactivateAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendUnauthorized(res, 'Authentication required');
        return;
      }

      const request: DeactivateAccountRequest = {
        password: req.body.password,
      };

      await this.deactivateAccountUseCase.execute(req.user.userId, request);

      // Remove refresh token since account is deactivated
      this.clearRefreshTokenCookie(res);

      sendSuccess(res, 200, 'Account deactivated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Account deactivation failed';
      sendBadRequest(res, message, error instanceof Error ? error.message : undefined);
    }
  }
}

