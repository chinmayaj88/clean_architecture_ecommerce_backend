/**
 * Auth Service Client Interface - Port
 * For making authenticated calls to auth-service for RBAC
 */

export interface IAuthServiceClient {
  /**
   * Verify JWT token and get user info
   */
  verifyToken(token: string): Promise<{ userId: string; email: string; roles: string[] } | null>;
  
  /**
   * Check if user has specific role
   */
  hasRole(userId: string, role: string): Promise<boolean>;
  
  /**
   * Get user roles
   */
  getUserRoles(userId: string): Promise<string[]>;
}

