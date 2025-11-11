export declare class UserRoleService {
  static assignUserRole(email: string, preferredRole?: string): Promise<{
    userType: string;
    currentRole: string;
  }>;
  static detectUserRole(email: string): string;
  static updateUserRole(userId: string, newRole: string): Promise<boolean>;
}