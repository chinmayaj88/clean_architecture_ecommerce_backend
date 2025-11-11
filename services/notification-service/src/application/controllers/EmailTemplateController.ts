import { Response } from 'express';
import { IEmailTemplateRepository } from '../../ports/interfaces/IEmailTemplateRepository';
import { RequestWithId } from '../../middleware/requestId.middleware';
import { AppError } from '../../middleware/errorHandler.middleware';
import { sendSuccess, sendCreated } from '../utils/response.util';

export class EmailTemplateController {
  constructor(
    private readonly emailTemplateRepository: IEmailTemplateRepository
  ) {}

  /**
   * Create an email template
   * POST /api/v1/templates
   */
  async createTemplate(req: RequestWithId, res: Response): Promise<void> {
    try {
      const template = await this.emailTemplateRepository.create({
        name: req.body.name,
        subject: req.body.subject,
        bodyHtml: req.body.bodyHtml,
        bodyText: req.body.bodyText || null,
        variables: req.body.variables || null,
        isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      });

      sendCreated(res, 'Email template created successfully', template);
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        throw new AppError(409, 'Template with this name already exists');
      }
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, error instanceof Error ? error.message : 'Failed to create email template');
    }
  }

  /**
   * Get all email templates
   * GET /api/v1/templates
   */
  async getTemplates(_req: RequestWithId, res: Response): Promise<void> {
    try {
      const templates = await this.emailTemplateRepository.findAll();
      sendSuccess(res, 'Templates retrieved successfully', templates);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, error instanceof Error ? error.message : 'Failed to get templates');
    }
  }

  /**
   * Get email template by ID
   * GET /api/v1/templates/:id
   */
  async getTemplate(req: RequestWithId, res: Response): Promise<void> {
    try {
      const templateId = req.params.id;
      const template = await this.emailTemplateRepository.findById(templateId);

      if (!template) {
        throw new AppError(404, 'Template not found');
      }

      sendSuccess(res, 'Template retrieved successfully', template);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, error instanceof Error ? error.message : 'Failed to get template');
    }
  }

  /**
   * Update an email template
   * PUT /api/v1/templates/:id
   */
  async updateTemplate(req: RequestWithId, res: Response): Promise<void> {
    try {
      const templateId = req.params.id;
      const template = await this.emailTemplateRepository.findById(templateId);

      if (!template) {
        throw new AppError(404, 'Template not found');
      }

      const updatedTemplate = await this.emailTemplateRepository.update(templateId, {
        name: req.body.name,
        subject: req.body.subject,
        bodyHtml: req.body.bodyHtml,
        bodyText: req.body.bodyText,
        variables: req.body.variables,
        isActive: req.body.isActive,
      });

      sendSuccess(res, 'Template updated successfully', updatedTemplate);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        throw new AppError(409, 'Template with this name already exists');
      }
      throw new AppError(500, error instanceof Error ? error.message : 'Failed to update template');
    }
  }

  /**
   * Delete an email template
   * DELETE /api/v1/templates/:id
   */
  async deleteTemplate(req: RequestWithId, res: Response): Promise<void> {
    try {
      const templateId = req.params.id;
      const template = await this.emailTemplateRepository.findById(templateId);

      if (!template) {
        throw new AppError(404, 'Template not found');
      }

      await this.emailTemplateRepository.delete(templateId);
      sendSuccess(res, 'Template deleted successfully', null);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, error instanceof Error ? error.message : 'Failed to delete template');
    }
  }
}

