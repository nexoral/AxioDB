import { CommandType } from '../types/command.types';
import { PERMISSIONS, PermissionKey } from '../../config/Keys/Permissions';

/**
 * Maps each data-plane TCP command to the RBAC permission key required to run it.
 * Mirrors the GUI's per-route `requirePermission(key)` chain (see
 * `source/server/router/Routers/*.routes.ts`) so TCP and GUI enforce identical rules
 * against the same `config` DB users/roles.
 *
 * Commands with no entry here (and not in `TCP_AUTH_EXEMPT_COMMANDS`) still require a
 * successful AUTHENTICATE, but no specific permission - currently only
 * BEGIN/COMMIT/ROLLBACK_TRANSACTION, which fall straight through to the existing
 * `NOT_IMPLEMENTED` response.
 */
export const TCP_COMMAND_PERMISSIONS: Partial<Record<CommandType, PermissionKey>> = {
  [CommandType.CREATE_DB]: PERMISSIONS.DB_CREATE,
  [CommandType.DELETE_DB]: PERMISSIONS.DB_DELETE,
  [CommandType.DB_EXISTS]: PERMISSIONS.DB_VIEW,
  [CommandType.GET_INSTANCE_INFO]: PERMISSIONS.DASHBOARD_VIEW,

  [CommandType.CREATE_COLLECTION]: PERMISSIONS.COLLECTION_CREATE,
  [CommandType.DELETE_COLLECTION]: PERMISSIONS.COLLECTION_DELETE,
  [CommandType.COLLECTION_EXISTS]: PERMISSIONS.COLLECTION_VIEW,
  [CommandType.GET_COLLECTION_INFO]: PERMISSIONS.COLLECTION_VIEW,

  [CommandType.INSERT_DOCUMENT]: PERMISSIONS.DOCUMENT_CREATE,
  [CommandType.INSERT_MANY_DOCUMENTS]: PERMISSIONS.DOCUMENT_CREATE,
  [CommandType.QUERY_DOCUMENTS]: PERMISSIONS.DOCUMENT_QUERY,
  [CommandType.QUERY_BY_ID]: PERMISSIONS.DOCUMENT_VIEW,
  [CommandType.UPDATE_DOCUMENT_BY_ID]: PERMISSIONS.DOCUMENT_UPDATE,
  [CommandType.UPDATE_DOCUMENTS_BY_QUERY]: PERMISSIONS.DOCUMENT_UPDATE,
  [CommandType.DELETE_DOCUMENT_BY_ID]: PERMISSIONS.DOCUMENT_DELETE,
  [CommandType.DELETE_DOCUMENTS_BY_QUERY]: PERMISSIONS.DOCUMENT_DELETE,
  [CommandType.AGGREGATE]: PERMISSIONS.DOCUMENT_AGGREGATE,
  [CommandType.TOTAL_DOCUMENTS]: PERMISSIONS.DOCUMENT_VIEW,

  [CommandType.CREATE_INDEX]: PERMISSIONS.INDEX_CREATE,
  [CommandType.DROP_INDEX]: PERMISSIONS.INDEX_DELETE,
  [CommandType.LIST_INDEXES]: PERMISSIONS.INDEX_VIEW,
};

/** Commands that never require authentication, even when the TCP server has `TCPAuth` enabled. */
export const TCP_AUTH_EXEMPT_COMMANDS: ReadonlySet<CommandType> = new Set([
  CommandType.PING,
  CommandType.DISCONNECT,
  CommandType.AUTHENTICATE,
]);
