import { AxioDB } from "../Indexation.operation";
import Collection from "../Collection/collection.operation";
import PasswordHasher from "./PasswordHasher.helper";
import ConfigDatabase from "./ConfigDatabase.service";
import PermissionChecker from "./PermissionChecker.helper";
import {
  UserDocument,
  RoleDocument,
  PermissionDocument,
} from "../../config/Interfaces/Auth/auth.interface";
import {
  CONFIG_PERMISSIONS_COLLECTION,
  CONFIG_ROLES_COLLECTION,
  CONFIG_USERS_COLLECTION,
  DEFAULT_ADMIN_PASSWORD,
  DEFAULT_ADMIN_USERNAME,
  PERMISSION_CATALOGUE,
  PREDEFINED_ROLES,
  RESERVED_DB_NAME,
  SUPER_ADMIN_ROLE,
} from "../../config/Keys/Permissions";

/**
 * Idempotently creates the `config` database and its `users`/`roles`/`permissions`
 * collections on first control-server start, then hydrates PermissionChecker's
 * in-memory role->permissions cache on every boot (including subsequent restarts,
 * where seeding itself is a no-op but the cache still needs rebuilding).
 */
export default class AuthSeeder {
  private readonly axioDBInstance: AxioDB;

  constructor(axioDBInstance: AxioDB) {
    this.axioDBInstance = axioDBInstance;
  }

  public async seedIfNeeded(): Promise<void> {
    const configDB = await this.axioDBInstance.createDB(RESERVED_DB_NAME);

    const usersCollection = await configDB.createCollection(CONFIG_USERS_COLLECTION);
    const rolesCollection = await configDB.createCollection(CONFIG_ROLES_COLLECTION);
    const permissionsCollection = await configDB.createCollection(
      CONFIG_PERMISSIONS_COLLECTION,
    );

    ConfigDatabase.setCollections(usersCollection, rolesCollection, permissionsCollection);

    // totalDocuments() counts the collection's "indexes" subfolder as an entry, so it
    // reports a non-zero count even when no real document has been inserted yet - use
    // an actual document query (filtered to real .axiodb files) to detect prior seeding.
    const existingUsers = await usersCollection.query({}).Limit(1).exec();
    const alreadySeeded =
      "data" in existingUsers &&
      Array.isArray(existingUsers.data?.documents) &&
      existingUsers.data.documents.length > 0;

    if (!alreadySeeded) {
      await this.seedPermissions(permissionsCollection);
      await this.seedRoles(rolesCollection);
      await this.seedDefaultAdmin(usersCollection);
    }

    await this.hydratePermissionCache(rolesCollection);
  }

  private async seedPermissions(permissionsCollection: Collection): Promise<void> {
    const documents: PermissionDocument[] = PERMISSION_CATALOGUE.map((entry) => ({
      key: entry.key,
      group: entry.group,
      description: entry.description,
    }));
    await permissionsCollection.insertMany(documents);
  }

  private async seedRoles(rolesCollection: Collection): Promise<void> {
    const now = new Date().toISOString();
    const documents: RoleDocument[] = PREDEFINED_ROLES.map((role) => ({
      roleName: role.roleName,
      permissions: role.permissions,
      isSystemRole: true,
      createdAt: now,
    }));
    await rolesCollection.insertMany(documents);
  }

  private async seedDefaultAdmin(usersCollection: Collection): Promise<void> {
    const passwordHash = await PasswordHasher.hashPassword(DEFAULT_ADMIN_PASSWORD);
    const document: UserDocument = {
      username: DEFAULT_ADMIN_USERNAME,
      passwordHash,
      role: SUPER_ADMIN_ROLE,
      mustChangePassword: true,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    await usersCollection.insert(document);
  }

  private async hydratePermissionCache(rolesCollection: Collection): Promise<void> {
    const result = await rolesCollection.query({}).Limit(1000).exec();
    if ("data" in result && result.data && Array.isArray(result.data.documents)) {
      const roles = result.data.documents as RoleDocument[];
      PermissionChecker.hydrate(
        roles.map((role) => ({ roleName: role.roleName, permissions: role.permissions })),
      );
    }
  }
}
