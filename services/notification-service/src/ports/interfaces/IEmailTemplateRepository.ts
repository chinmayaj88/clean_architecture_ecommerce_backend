import { EmailTemplate } from '../../core/entities/EmailTemplate';

export interface CreateEmailTemplateData {
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string | null;
  variables?: Record<string, any> | null;
  isActive?: boolean;
}

export interface IEmailTemplateRepository {
  create(data: CreateEmailTemplateData): Promise<EmailTemplate>;
  findById(id: string): Promise<EmailTemplate | null>;
  findByName(name: string): Promise<EmailTemplate | null>;
  findAll(): Promise<EmailTemplate[]>;
  update(id: string, data: Partial<CreateEmailTemplateData>): Promise<EmailTemplate>;
  delete(id: string): Promise<void>;
  activate(id: string): Promise<EmailTemplate>;
  deactivate(id: string): Promise<EmailTemplate>;
}




