import { Router } from 'express';
import { EmailTemplateController } from '../application/controllers/EmailTemplateController';
import {
  validateCreateTemplate,
  validateUpdateTemplate,
  validateTemplateId,
  handleValidationErrors,
} from '../middleware/validator.middleware';
import { globalRateLimiter } from '../middleware/rateLimiter.middleware';

export function createTemplateRoutes(templateController: EmailTemplateController): Router {
  const router = Router();

  // Apply rate limiting to all routes
  router.use(globalRateLimiter);

  // Create template
  router.post(
    '/',
    validateCreateTemplate,
    handleValidationErrors,
    templateController.createTemplate.bind(templateController)
  );

  // Get all templates
  router.get(
    '/',
    templateController.getTemplates.bind(templateController)
  );

  // Get template by ID
  router.get(
    '/:id',
    validateTemplateId,
    handleValidationErrors,
    templateController.getTemplate.bind(templateController)
  );

  // Update template
  router.put(
    '/:id',
    validateTemplateId,
    validateUpdateTemplate,
    handleValidationErrors,
    templateController.updateTemplate.bind(templateController)
  );

  // Delete template
  router.delete(
    '/:id',
    validateTemplateId,
    handleValidationErrors,
    templateController.deleteTemplate.bind(templateController)
  );

  return router;
}

