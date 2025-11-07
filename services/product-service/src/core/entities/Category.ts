export class Category {
  constructor(
    public id: string,
    public name: string,
    public slug: string,
    public description: string | null,
    public parentId: string | null,
    public level: number,
    public sortOrder: number,
    public imageUrl: string | null,
    public isActive: boolean,
    public createdAt: Date,
    public updatedAt: Date
  ) {}
}

