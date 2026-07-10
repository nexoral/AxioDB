import Collection from "../Collection/collection.operation";

/**
 * Holds long-lived references to the `config` database's `users`/`roles`/`permissions`
 * collections. Collection instances are reused across requests instead of being
 * recreated per call, since each `Collection` eagerly loads its index cache on
 * construction - recreating it per request would repeatedly reload indexes for
 * no benefit.
 */
class ConfigDatabase {
  private static instance: ConfigDatabase;
  private usersCollection: Collection | undefined;
  private rolesCollection: Collection | undefined;
  private permissionsCollection: Collection | undefined;

  public static getInstance(): ConfigDatabase {
    if (!ConfigDatabase.instance) {
      ConfigDatabase.instance = new ConfigDatabase();
    }
    return ConfigDatabase.instance;
  }

  public setCollections(
    usersCollection: Collection,
    rolesCollection: Collection,
    permissionsCollection: Collection,
  ): void {
    this.usersCollection = usersCollection;
    this.rolesCollection = rolesCollection;
    this.permissionsCollection = permissionsCollection;
  }

  public isInitialized(): boolean {
    return (
      this.usersCollection !== undefined &&
      this.rolesCollection !== undefined &&
      this.permissionsCollection !== undefined
    );
  }

  public getUsersCollection(): Collection {
    if (!this.usersCollection) {
      throw new Error("Config database is not initialized yet");
    }
    return this.usersCollection;
  }

  public getRolesCollection(): Collection {
    if (!this.rolesCollection) {
      throw new Error("Config database is not initialized yet");
    }
    return this.rolesCollection;
  }

  public getPermissionsCollection(): Collection {
    if (!this.permissionsCollection) {
      throw new Error("Config database is not initialized yet");
    }
    return this.permissionsCollection;
  }
}

export default ConfigDatabase.getInstance();
