export interface RolePermission {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  module: string;
  isActive: boolean;
}

export interface WorkspaceRole {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isDefault: boolean;
  isActive: boolean;
  permissions: {
    permission: RolePermission;
  }[];
}

export interface CreateRoleRequest {
  code: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  permissionIds: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface AssignRolePermissionsRequest {
  permissionIds: string[];
}