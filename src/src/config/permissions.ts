export type ProtectedPermission = 
  | 'manage_all_users'
  | 'manage_all_roles'
  | 'view_all_requests'
  | 'manage_all_requests';  

export type ClubPermission =
  | 'manage_club_users'
  | 'manage_club_roles'
  | 'view_club_requests'
  | 'manage_club_requests';

export type UserPermission =
  | 'create_requests';

export type Permission = ProtectedPermission | ClubPermission | UserPermission;

export const PROTECTED_PERMISSIONS: ProtectedPermission[] = [
  'manage_all_users',
  'manage_all_roles',
  'view_all_requests',
  'manage_all_requests'
];