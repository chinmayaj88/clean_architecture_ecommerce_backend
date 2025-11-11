export enum ZoneType {
  COUNTRY = 'country',
  STATE = 'state',
  POSTAL_CODE = 'postal_code',
  CUSTOM = 'custom',
}

export class ShippingZone {
  constructor(
    public id: string,
    public name: string,
    public type: ZoneType,
    public countries: string[],
    public states: string[] | null,
    public postalCodes: string[] | null,
    public isActive: boolean,
    public createdAt: Date,
    public updatedAt: Date
  ) {}

  static fromPrisma(data: any): ShippingZone {
    return new ShippingZone(
      data.id,
      data.name,
      data.type as ZoneType,
      data.countries as string[],
      data.states as string[] | null,
      data.postalCodes as string[] | null,
      data.isActive,
      data.createdAt,
      data.updatedAt
    );
  }

  /**
   * Check if a country matches this zone
   */
  matchesCountry(countryCode: string): boolean {
    return this.countries.includes(countryCode);
  }

  /**
   * Check if a state matches this zone
   */
  matchesState(stateCode: string): boolean {
    if (!this.states || this.states.length === 0) {
      return false;
    }
    return this.states.includes(stateCode);
  }

  /**
   * Check if a postal code matches this zone
   */
  matchesPostalCode(postalCode: string): boolean {
    if (!this.postalCodes || this.postalCodes.length === 0) {
      return false;
    }
    return this.postalCodes.some(pattern => {
      // Support wildcard patterns (e.g., "10*" matches "10001", "10002", etc.)
      if (pattern.endsWith('*')) {
        const prefix = pattern.slice(0, -1);
        return postalCode.startsWith(prefix);
      }
      return postalCode === pattern;
    });
  }
}

