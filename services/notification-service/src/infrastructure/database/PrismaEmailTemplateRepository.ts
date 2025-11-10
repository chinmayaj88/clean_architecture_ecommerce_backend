import { PrismaClient } from '@prisma/client';
import { IEmailTemplateRepository, CreateEmailTemplateData } from '../../ports/interfaces/IEmailTemplateRepository';
import { EmailTemplate } from '../../core/entities/EmailTemplate';

export class PrismaEmailTemplateRepository implements IEmailTemplateRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateEmailTemplateData): Promise<EmailTemplate> {
    const created = await (this.prisma as any).emailTemplate.create({
      data: {
        name: data.name,
        subject: data.subject,
        bodyHtml: data.bodyHtml,
        bodyText: data.bodyText || null,
        variables: data.variables || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    return EmailTemplate.fromPrisma(created);
  }

  async findById(id: string): Promise<EmailTemplate | null> {
    const template = await (this.prisma as any).emailTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return null;
    }

    return EmailTemplate.fromPrisma(template);
  }

  async findByName(name: string): Promise<EmailTemplate | null> {
    const template = await (this.prisma as any).emailTemplate.findUnique({
      where: { name },
    });

    if (!template) {
      return null;
    }

    return EmailTemplate.fromPrisma(template);
  }

  async findAll(): Promise<EmailTemplate[]> {
    const templates = await (this.prisma as any).emailTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return templates.map((t: any) => EmailTemplate.fromPrisma(t));
  }

  async update(id: string, data: Partial<CreateEmailTemplateData>): Promise<EmailTemplate> {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.subject !== undefined) {
      updateData.subject = data.subject;
    }
    if (data.bodyHtml !== undefined) {
      updateData.bodyHtml = data.bodyHtml;
    }
    if (data.bodyText !== undefined) {
      updateData.bodyText = data.bodyText;
    }
    if (data.variables !== undefined) {
      updateData.variables = data.variables;
    }
    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    const updated = await (this.prisma as any).emailTemplate.update({
      where: { id },
      data: updateData,
    });

    return EmailTemplate.fromPrisma(updated);
  }

  async delete(id: string): Promise<void> {
    await (this.prisma as any).emailTemplate.delete({
      where: { id },
    });
  }

  async activate(id: string): Promise<EmailTemplate> {
    const updated = await (this.prisma as any).emailTemplate.update({
      where: { id },
      data: { isActive: true, updatedAt: new Date() },
    });

    return EmailTemplate.fromPrisma(updated);
  }

  async deactivate(id: string): Promise<EmailTemplate> {
    const updated = await (this.prisma as any).emailTemplate.update({
      where: { id },
      data: { isActive: false, updatedAt: new Date() },
    });

    return EmailTemplate.fromPrisma(updated);
  }
}

