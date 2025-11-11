export class EmailTemplate {
  constructor(
    public id: string,
    public name: string,
    public subject: string,
    public bodyHtml: string,
    public bodyText: string | null,
    public variables: Record<string, any> | null,
    public isActive: boolean,
    public createdAt: Date,
    public updatedAt: Date
  ) {}

  static fromPrisma(data: any): EmailTemplate {
    return new EmailTemplate(
      data.id,
      data.name,
      data.subject,
      data.bodyHtml,
      data.bodyText,
      data.variables as Record<string, any> | null,
      data.isActive,
      data.createdAt,
      data.updatedAt
    );
  }

  isAvailable(): boolean {
    return this.isActive;
  }
}




