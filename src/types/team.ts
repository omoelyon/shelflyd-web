/** Permission keys a business can put in its roles (see the backend's BusinessPermission). */
export type Permission =
  | 'ORDERS_VIEW'
  | 'ORDERS_FULFIL'
  | 'ORDERS_CANCEL'
  | 'PRODUCTS_MANAGE'
  | 'INVENTORY_MANAGE'
  | 'FINANCE_VIEW'
  | 'EXPENSES_MANAGE'
  | 'STOREFRONT_MANAGE'
  | 'SETTINGS_MANAGE'
  | 'INVOICING_MANAGE'
  | 'DOMAIN_MANAGE'
  | 'TEAM_MANAGE'
  | 'AI_ASSISTANT';

export interface PermissionInfo {
  key: Permission;
  module: string;
  label: string;
  description: string;
}

export interface TeamRoleView {
  id: number;
  name: string;
  description: string | null;
  permissions: Permission[];
  /** People on the team with this role. */
  members: number;
}

export interface TeamPerson {
  userId: number;
  name: string | null;
  email: string | null;
  me: boolean;
}

export interface TeamMemberView {
  uuid: string;
  userId: number;
  name: string | null;
  email: string | null;
  roleId: number | null;
  roleName: string;
  joinedAt: string | null;
  me: boolean;
}

export interface TeamInviteView {
  uuid: string;
  email: string;
  roleId: number | null;
  roleName: string;
  status: 'PENDING' | 'ACCEPTED' | 'CANCELLED' | 'EXPIRED';
  invitedBy: string | null;
  sentAt: string | null;
  expiresAt: string | null;
  expired: boolean;
  token: string;
}

/** The signed-in person's access to their business. */
export interface MyAccess {
  businessId: number;
  owner: boolean;
  roleName: string;
  permissions: Permission[];
}

export interface TeamView {
  owner: TeamPerson;
  members: TeamMemberView[];
  invites: TeamInviteView[];
  roles: TeamRoleView[];
  permissionCatalog: PermissionInfo[];
  me: MyAccess;
  canManage: boolean;
}

export interface RoleRequest {
  name: string;
  description?: string;
  permissions: Permission[];
}

/** What an invite link shows before signing in. */
export interface InvitePreview {
  businessName: string;
  businessLogo: string | null;
  roleName: string;
  canDo: string[];
  invitedBy: string | null;
  email: string;
  /** Whether that email already has a Shelflyd account (then "Sign in" leads). */
  hasAccount: boolean;
  status: 'PENDING' | 'ACCEPTED' | 'CANCELLED' | 'EXPIRED';
  expiresAt: string | null;
}
