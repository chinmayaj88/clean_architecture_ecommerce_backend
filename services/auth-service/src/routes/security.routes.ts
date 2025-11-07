/**
 * Security Routes
 * Routes for device management, session management, and login history
 */

import { Router } from 'express';
import { param, query, body } from 'express-validator';
import { SecurityController } from '../application/controllers/SecurityController';
import { validate } from '../middleware/validator.middleware';
import { authRateLimiter } from '../middleware/rateLimiter.middleware';
import { authenticate } from '../middleware/auth.middleware';

/**
 * Create security routes
 */
export function createSecurityRoutes(controller: SecurityController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authenticate());
  router.use(authRateLimiter);

  /**
   * @openapi
   * /api/v1/security/devices:
   *   get:
   *     summary: Get all devices for authenticated user
   *     tags: [Security]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: includeInactive
   *         schema:
   *           type: boolean
   *         description: Include inactive devices
   *     responses:
   *       200:
   *         description: Devices retrieved successfully
   */
  router.get(
    '/devices',
    validate([
      query('includeInactive').optional().isBoolean().withMessage('includeInactive must be a boolean'),
    ]),
    (req, res, next) => {
      controller.getDevices(req as any, res).catch(next);
    }
  );

  /**
   * @openapi
   * /api/v1/security/devices/{deviceId}:
   *   put:
   *     summary: Update device (name, trust status)
   *     tags: [Security]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: deviceId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               deviceName:
   *                 type: string
   *               isTrusted:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Device updated successfully
   */
  router.put(
    '/devices/:deviceId',
    validate([
      param('deviceId').isString().notEmpty(),
      body('deviceName').optional().isString(),
      body('isTrusted').optional().isBoolean(),
    ]),
    (req, res, next) => {
      controller.updateDevice(req as any, res).catch(next);
    }
  );

  /**
   * @openapi
   * /api/v1/security/devices/{deviceId}/revoke:
   *   post:
   *     summary: Revoke device (logout from specific device)
   *     tags: [Security]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: deviceId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Device revoked successfully
   */
  router.post(
    '/devices/:deviceId/revoke',
    validate([param('deviceId').isString().notEmpty()]),
    (req, res, next) => {
      controller.revokeDevice(req as any, res).catch(next);
    }
  );

  /**
   * @openapi
   * /api/v1/security/login-history:
   *   get:
   *     summary: Get login history for authenticated user
   *     tags: [Security]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [success, failed, blocked]
   *       - in: query
   *         name: isSuspicious
   *         schema:
   *           type: boolean
   *     responses:
   *       200:
   *         description: Login history retrieved successfully
   */
  router.get(
    '/login-history',
    validate([
      query('limit').optional().isInt({ min: 1, max: 100 }),
      query('offset').optional().isInt({ min: 0 }),
      query('status').optional().isIn(['success', 'failed', 'blocked']),
      query('isSuspicious').optional().isBoolean(),
    ]),
    (req, res, next) => {
      controller.getLoginHistory(req as any, res).catch(next);
    }
  );

  /**
   * @openapi
   * /api/v1/security/sessions:
   *   get:
   *     summary: Get active sessions for authenticated user
   *     tags: [Security]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: activeOnly
   *         schema:
   *           type: boolean
   *           default: true
   *     responses:
   *       200:
   *         description: Sessions retrieved successfully
   */
  router.get(
    '/sessions',
    validate([
      query('activeOnly').optional().isBoolean(),
    ]),
    (req, res, next) => {
      controller.getSessions(req as any, res).catch(next);
    }
  );

  /**
   * @openapi
   * /api/v1/security/sessions/{sessionId}/revoke:
   *   post:
   *     summary: Revoke a specific session
   *     tags: [Security]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: sessionId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Session revoked successfully
   */
  router.post(
    '/sessions/:sessionId/revoke',
    validate([param('sessionId').isString().notEmpty()]),
    (req, res, next) => {
      controller.revokeSession(req as any, res).catch(next);
    }
  );

  /**
   * @openapi
   * /api/v1/security/sessions/revoke-all:
   *   post:
   *     summary: Revoke all sessions (logout from all devices)
   *     tags: [Security]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: All sessions revoked successfully
   */
  router.post(
    '/sessions/revoke-all',
    (req, res, next) => {
      controller.revokeAllSessions(req as any, res).catch(next);
    }
  );

  /**
   * @openapi
   * /api/v1/security/mfa/enable:
   *   post:
   *     summary: Enable MFA for authenticated user
   *     tags: [Security]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: MFA enabled successfully
   */
  router.post(
    '/mfa/enable',
    validate([
      body('password').optional().isString(),
    ]),
    (req, res, next) => {
      controller.enableMFA(req as any, res).catch(next);
    }
  );

  /**
   * @openapi
   * /api/v1/security/mfa/verify:
   *   post:
   *     summary: Verify MFA code
   *     tags: [Security]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - code
   *             properties:
   *               code:
   *                 type: string
   *     responses:
   *       200:
   *         description: MFA code verified successfully
   */
  router.post(
    '/mfa/verify',
    validate([
      body('code').isString().notEmpty().withMessage('MFA code is required'),
    ]),
    (req, res, next) => {
      controller.verifyMFA(req as any, res).catch(next);
    }
  );

  /**
   * @openapi
   * /api/v1/security/mfa/disable:
   *   post:
   *     summary: Disable MFA for authenticated user
   *     tags: [Security]
   *     security:
   *       - bearerAuth: []
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
   *         description: MFA disabled successfully
   */
  router.post(
    '/mfa/disable',
    validate([
      body('password').isString().notEmpty().withMessage('Password is required'),
    ]),
    (req, res, next) => {
      controller.disableMFA(req as any, res).catch(next);
    }
  );

  /**
   * @openapi
   * /api/v1/security/suspicious-login/detect:
   *   post:
   *     summary: Detect suspicious login patterns
   *     tags: [Security]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Suspicious login detection completed
   */
  router.post(
    '/suspicious-login/detect',
    (req, res, next) => {
      controller.detectSuspiciousLogin(req as any, res).catch(next);
    }
  );

  return router;
}

