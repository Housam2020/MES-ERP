# Database Schema

## Core Tables

### users
Stores user information.
- `id (uuid)`: Primary key
- `email (text)`: User's email address
- `fullName (text)`: User's full name
- `phoneNum (text)`: User's phone number
- `group_id (uuid)`: (Legacy field - users are now associated with groups through user_roles)

### groups
Stores information about clubs and organizations.
- `id (uuid)`: Primary key
- `name (text)`: Group name
- `created_at (timestamp)`: When the group was created
- `created_by (uuid)`: User who created the group
- `total_budget (numeric)`: Group's total budget allocation
- `group_order (integer)`: Display order for the group

### roles
Defines roles that can be assigned to users.
- `id (uuid)`: Primary key
- `name (character varying)`: Role name

### permissions
Defines individual permissions that can be assigned to roles.
- `id (uuid)`: Primary key
- `name (character varying)`: Permission name

## Relationship Tables

### role_permissions
Maps permissions to roles.
- `role_id (uuid)`: Foreign key to roles
- `permission_id (uuid)`: Foreign key to permissions

### group_roles
Maps roles to groups. Each role can only belong to one group or be global.
- `id (uuid)`: Primary key
- `role_id (uuid)`: Foreign key to roles (UNIQUE constraint)
- `group_id (uuid)`: Foreign key to groups (null for global roles)
- `is_global (boolean)`: Flag for global roles (can be assigned independent of group)
- `created_at (timestamp)`: When the mapping was created

### user_roles
Maps users to roles within specific groups.
- `id (uuid)`: Primary key
- `user_id (uuid)`: Foreign key to users
- `role_id (uuid)`: Foreign key to roles
- `group_id (uuid)`: Foreign key to groups (null for global role assignments)
- `is_global (boolean)`: Flag for global role assignments
- `created_at (timestamp)`: When the mapping was created

## Request Tables

### payment_requests
Stores payment and reimbursement requests.
- `request_id (uuid)`: Primary key
- `user_id (uuid)`: User who created the request
- `group_id (uuid)`: Group the request is associated with
- `status (text)`: Current status of the request
- `timestamp (timestamp)`: When the request was created
- (Plus many other fields for payment details)

### annual_budget_form
Stores annual budget requests.
- `id (uuid)`: Primary key
- `club_name (text)`: Name of the club
- `group_id (uuid)`: Associated group
- `status (text)`: Current status of the budget request
- `created_at (timestamp)`: When the request was created
- (Plus other budget-related fields)

## Permission Model

### Key Characteristics

1. **Group-Specific Permissions**: Permissions are scoped to specific groups. For example, having the `manage_club_roles` permission in Group A does not grant that permission in Group B.

2. **Role Exclusivity**: Each role can only be assigned to a single group. This prevents unintended permission changes across multiple groups.

3. **Global Roles**: Roles can be marked as global, allowing them to be assigned independently of group membership. Only administrators can create global roles.

### Permission Hierarchy

- **Admin Permissions**: Can manage all aspects of the system (e.g., `manage_all_roles`)
- **Club Permissions**: Can manage aspects of specific groups (e.g., `manage_club_roles`, `view_club_requests`)
- **User Permissions**: Basic permissions available to all users (e.g., `create_requests`)

### Permission Checking Logic

When checking if a user has permission to perform an action:

1. First check if the user has an admin-level permission
2. If not, check if they have the group-specific permission for the specific group in question
3. For view/edit operations, only show items from groups where the user has the relevant permission

This ensures proper isolation between groups and prevents permission leakage.