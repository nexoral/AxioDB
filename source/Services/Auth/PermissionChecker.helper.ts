/**
 * In-process cache of roleName -> permission keys, avoiding a disk read on every
 * single request. Hydrated once at server bootstrap (AuthSeeder) and kept in sync
 * whenever a new role is created (AuthService.createRole).
 */
class PermissionChecker {
  private static instance: PermissionChecker;
  private readonly rolePermissions: Map<string, string[]> = new Map();

  public static getInstance(): PermissionChecker {
    if (!PermissionChecker.instance) {
      PermissionChecker.instance = new PermissionChecker();
    }
    return PermissionChecker.instance;
  }

  public setRolePermissions(roleName: string, permissions: string[]): void {
    this.rolePermissions.set(roleName, permissions);
  }

  public deleteRole(roleName: string): void {
    this.rolePermissions.delete(roleName);
  }

  public hydrate(roles: { roleName: string; permissions: string[] }[]): void {
    for (const role of roles) {
      this.rolePermissions.set(role.roleName, role.permissions);
    }
  }

  public getPermissionsForRole(roleName: string): string[] {
    return this.rolePermissions.get(roleName) ?? [];
  }

  public roleHasPermission(roleName: string, permissionKey: string): boolean {
    return this.getPermissionsForRole(roleName).includes(permissionKey);
  }

  public roleExists(roleName: string): boolean {
    return this.rolePermissions.has(roleName);
  }

  public listRoleNames(): string[] {
    return Array.from(this.rolePermissions.keys());
  }
}

export default PermissionChecker.getInstance();
