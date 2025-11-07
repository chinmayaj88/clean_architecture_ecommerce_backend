/**
 * Role Entity - Core Domain Model
 * Represents a role for RBAC (Role-Based Access Control)
 */

export interface Role {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRoleData {
  name: string;
  description?: string;
}

