/**
 * Data Transfer Objects (DTOs) for Auth Service
 * Used for API request/response validation
 */

import { z } from 'zod';

/**
 * Register user request
 */
export const RegisterRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

/**
 * Login request
 */
export const LoginRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

/**
 * Refresh token request
 */
export const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;

/**
 * Auth response
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    roles: string[];
  };
}

/**
 * Logout request
 */
export const LogoutRequestSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type LogoutRequest = z.infer<typeof LogoutRequestSchema>;

/**
 * Forgot password request
 */
export const ForgotPasswordRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>;

/**
 * Reset password request
 */
export const ResetPasswordRequestSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;

/**
 * Verify email request
 */
export const VerifyEmailRequestSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export type VerifyEmailRequest = z.infer<typeof VerifyEmailRequestSchema>;

/**
 * Resend verification email request
 */
export const ResendVerificationEmailRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export type ResendVerificationEmailRequest = z.infer<typeof ResendVerificationEmailRequestSchema>;

/**
 * Change password request
 */
export const ChangePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;

/**
 * Deactivate account request
 */
export const DeactivateAccountRequestSchema = z.object({
  password: z.string().min(1, 'Password is required for confirmation'),
});

export type DeactivateAccountRequest = z.infer<typeof DeactivateAccountRequestSchema>;

