import Handlebars from 'handlebars';
import { EmailTemplate } from '../../core/entities/EmailTemplate';
import { createLogger } from '../logging/logger';

const logger = createLogger();

export interface RenderedTemplate {
  subject: string;
  bodyHtml: string;
  bodyText: string | null;
}

export class TemplateRenderer {
  /**
   * Render email template with variables
   */
  static render(template: EmailTemplate, variables: Record<string, any>): RenderedTemplate {
    try {
      // Compile subject template
      const subjectTemplate = Handlebars.compile(template.subject);
      const subject = subjectTemplate(variables);

      // Compile HTML body template
      const htmlTemplate = Handlebars.compile(template.bodyHtml);
      const bodyHtml = htmlTemplate(variables);

      // Compile text body template if available
      let bodyText: string | null = null;
      if (template.bodyText) {
        const textTemplate = Handlebars.compile(template.bodyText);
        bodyText = textTemplate(variables);
      } else {
        // Generate plain text from HTML if not provided
        bodyText = this.stripHtml(bodyHtml);
      }

      return {
        subject,
        bodyHtml,
        bodyText,
      };
    } catch (error) {
      logger.error('Template rendering failed', {
        templateId: template.id,
        templateName: template.name,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error(`Failed to render template: ${template.name}`);
    }
  }

  /**
   * Strip HTML tags from HTML string
   */
  private static stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  /**
   * Register Handlebars helpers
   */
  static registerHelpers(): void {
    // Format currency
    Handlebars.registerHelper('currency', (amount: number, currency: string = 'USD') => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(amount);
    });

    // Format date
    Handlebars.registerHelper('date', (date: Date | string, format?: string) => {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (format === 'short') {
        return d.toLocaleDateString();
      }
      return d.toLocaleString();
    });

    // Conditional helper
    Handlebars.registerHelper('if_eq', (a: any, b: any, options: any) => {
      if (a === b) {
        return options.fn(this);
      }
      return options.inverse(this);
    });
  }
}

// Register helpers on module load
TemplateRenderer.registerHelpers();



