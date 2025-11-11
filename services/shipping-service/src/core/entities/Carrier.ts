export class Carrier {
  constructor(
    public id: string,
    public name: string,
    public code: string,
    public apiEndpoint: string,
    public apiKey: string, // Should be encrypted/decrypted
    public isActive: boolean,
    public configuration: Record<string, any> | null,
    public createdAt: Date,
    public updatedAt: Date
  ) {}

  static fromPrisma(data: any): Carrier {
    return new Carrier(
      data.id,
      data.name,
      data.code,
      data.apiEndpoint,
      data.apiKey, // Decryption should happen at repository level
      data.isActive,
      data.configuration as Record<string, any> | null,
      data.createdAt,
      data.updatedAt
    );
  }
}

