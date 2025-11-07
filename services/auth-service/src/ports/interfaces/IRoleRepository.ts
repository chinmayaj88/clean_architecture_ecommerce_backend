/**
 * Role Repository Interface - Port
 * Defines the contract for role data access
 */

import { Role, CreateRoleData } from '../../core/entities/Role';

export interface IRoleRepository {
  /**
   * Create a new role
   */
  create(data: CreateRoleData): Promise<Role>;

  /**
   * Find role by ID
   */
  findById(id: string): Promise<Role | null>;

  /**
   * Find role by name
   */
  findByName(name: string): Promise<Role | null>;

  /**
   * Get all roles
   */
  findAll(): Promise<Role[]>;

  /**
   * Assign role to user
   */
  assignRoleToUser(userId: string, roleId: string): Promise<void>;

  /**
   * Remove role from user
   */
  removeRoleFromUser(userId: string, roleId: string): Promise<void>;

  /**
   * Get user roles
   */
  getUserRoles(userId: string): Promise<string[]>;
}

