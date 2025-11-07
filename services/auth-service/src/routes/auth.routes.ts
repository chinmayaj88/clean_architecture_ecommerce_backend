/**
 * Auth Routes
 * OpenAPI-driven routes for authentication endpoints
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../application/controllers/AuthController';
import { validate } from '../middleware/validator.middleware';
import { authRateLimiter } from '../middleware/rateLimiter.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { Container } from '../di/container';

/**
 * Create auth routes
 */
export function createAuthRoutes(controller: AuthController): Router {
  const router = Router();

  /**
   * @openapi
   * /api/v1/auth/register:
   *   post:
   *     summary: Register a new user
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *                 minLength: 8
   *     responses:
   *       201:
   *         description: User registered successfully
   *       400:
   *         description: Validation error or email already exists
   */
  router.post(
    '/register',
    authRateLimiter,
    validate([
      body('email')
        .isEmail()
        .withMessage('Invalid email format')
        .normalizeEmail(),
      body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/[A-Z]/)
        .withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/)
        .withMessage('Password must contain at least one lowercase letter')
        .matches(/[0-9]/)
        .withMessage('Password must contain at least one number'),
    ]),
    (req, res, next) => {
      controller.register(req, res).catch(next);
    }
  );

  /**
   * @openapi
   * /api/v1/auth/login:
   *   post:
   *     summary: Login user
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Login successful
   *       401:
   *         description: Invalid credentials
   */
  router.post(
    '/login',
    authRateLimiter,
    validate([
      body('email').isEmail().withMessage('Invalid email format').normalizeEmail(),
      body('password').notEmpty().withMessage('Password is required'),
    ]),
    (req, res, next) => {
      controller.login(req, res).catch(next);
    }
  );

  /**
   * @openapi
   * /api/v1/auth/refresh:
   *   post:
   *     summary: Refresh access token
   *     tags: [Auth]
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               refreshToken:
   *                 type: string
   *     responses:
   *       200:
   *         description: Token refreshed successfully
   *       401:
   *         description: Invalid refresh token
   */
  router.post('/refresh', (req, res, next) => {
    controller.refreshToken(req, res).catch(next);
  });

  /**
   * @openapi
   * /api/v1/auth/logout:
   *   post:
   *     summary: Logout user
   *     tags: [Auth]
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               refreshToken:
   *                 type: string
   *     responses:
   *       200:
   *         description: Logged out successfully
   */
  router.post('/logout', (req, res, next) => {
    controller.logout(req, res).catch(next);
  });

  /**
   * @openapi
   * /api/v1/auth/forgot-password:
   *   post:
   *     summary: Request password reset
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *     responses:
   *       200:
   *         description: Password reset email sent (if account exists)
   */
  router.post(
    '/forgot-password',
    authRateLimiter,
    validate([body('email').isEmail().withMessage('Invalid email format').normalizeEmail()]),
    (req, res, next) => {
      controller.forgotPassword(req, res).catch(next);
    }
  );

  /**
   * @openapi
   * /api/v1/auth/reset-password:
   *   post:
   *     summary: Reset password using token
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - token
   *               - password
   *             properties:
   *               token:
   *                 type: string
   *               password:
   *                 type: string
   *                 minLength: 8
   *     responses:
   *       200:
   *         description: Password reset successfully
   *       400:
   *         description: Invalid token or validation error
   */
  router.post(
    '/reset-password',
    authRateLimiter,
    validate([
      body('token').notEmpty().withMessage('Reset token is required'),
      body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/[A-Z]/)
        .withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/)
        .withMessage('Password must contain at least one lowercase letter')
        .matches(/[0-9]/)
        .withMessage('Password must contain at least one number'),
    ]),
    (req, res, next) => {
      controller.resetPassword(req, res).catch(next);
    }
  );

  /**
   * @openapi
   * /api/v1/auth/verify-email:
   *   post:
   *     summary: Verify email using token
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - token
   *             properties:
   *               token:
   *                 type: string
   *     responses:
   *       200:
   *         description: Email verified successfully
   *       400:
   *         description: Invalid token
   */
  router.post(
    '/verify-email',
    validate([body('token').notEmpty().withMessage('Verification token is required')]),
    (req, res, next) => {
      controller.verifyEmail(req, res).catch(next);
    }
  );

  /**
   * @openapi
   * /api/v1/auth/resend-verification:
   *   post:
   *     summary: Resend verification email
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *     responses:
   *       200:
   *         description: Verification email sent
   *       400:
   *         description: User not found or already verified
   */
  router.post(
    '/resend-verification',
    authRateLimiter,
    validate([body('email').isEmail().withMessage('Invalid email format').normalizeEmail()]),
    (req, res, next) => {
      controller.resendVerificationEmail(req, res).catch(next);
    }
  );

  // Protected routes (require authentication)
  const tokenService = Container.getInstance().getTokenService();

  /**
   * @openapi
   * /api/v1/auth/change-password:
   *   post:
   *     summary: Change password (requires authentication)
   *     tags: [Auth]
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - currentPassword
   *               - newPassword
   *             properties:
   *               currentPassword:
   *                 type: string
   *               newPassword:
   *                 type: string
   *                 minLength: 8
   *     responses:
   *       200:
   *         description: Password changed successfully
   *       400:
   *         description: Invalid current password or validation error
   *       401:
   *         description: Authentication required
   */
  router.post(
    '/change-password',
    authenticate(tokenService),
    validate([
      body('currentPassword').notEmpty().withMessage('Current password is required'),
      body('newPassword')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/[A-Z]/)
        .withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/)
        .withMessage('Password must contain at least one lowercase letter')
        .matches(/[0-9]/)
        .withMessage('Password must contain at least one number'),
    ]),
    (req, res, next) => {
      controller.changePassword(req as any, res).catch(next);
    }
  );

  /**
   * @openapi
   * /api/v1/auth/deactivate:
   *   post:
   *     summary: Deactivate account (requires authentication)
   *     tags: [Auth]
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - password
   *             properties:
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Account deactivated successfully
   *       400:
   *         description: Invalid password
   *       401:
   *         description: Authentication required
   */
  router.post(
    '/deactivate',
    authenticate(tokenService),
    validate([body('password').notEmpty().withMessage('Password is required for confirmation')]),
    (req, res, next) => {
      controller.deactivateAccount(req as any, res).catch(next);
    }
  );

  return router;
}

