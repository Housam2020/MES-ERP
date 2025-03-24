# Authentication and Authorization System

This document explains the authentication and authorization flow in the MES-ERP system.

## Authentication Overview

The MES-ERP system uses Supabase Auth for user authentication, with a custom role-based permission system built on top.

### Authentication Flow

1. User registers/logs in via Supabase Auth
2. On successful authentication, user data is made available via Supabase client
3. Middleware checks user session and redirects if necessary
4. Custom hooks load user permissions based on their roles

## Key Components

### Authentication Middleware (`middleware.ts`)

The middleware:
- Checks for a valid user session on protected routes
- Redirects unauthenticated users to the login page
- Loads user permissions and checks route-specific access requirements
- Redirects users without required permissions to the dashboard home

```javascript
// Sample middleware check
const pathPermissions = {
  "/dashboard/analytics": ['view_all_requests', 'view_club_requests'],
  "/dashboard/requests": ['create_requests'],
  "/dashboard/users": ['manage_all_users', 'manage_club_users'],
  "/dashboard/roles": ['manage_all_roles', 'manage_club_roles'],
  "/dashboard/home": null // Basic access
};

// Check if user has required permissions for path
const requiredPermissions = pathPermissions[path];
if (requiredPermissions && !hasRequiredPermissions) {
  return NextResponse.redirect(new URL("/dashboard/home", request.url));
}
```

### Permissions Hook (`usePermissions.js`)

The `usePermissions` hook is used throughout the application to:
- Fetch and cache all permissions for the current user
- Aggregate permissions from all of a user's roles
- Provide a loading and error state for UI feedback

```javascript
// Usage example
const { permissions, loading, error } = usePermissions();

// Example implementation
const usePermissions = () => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPermissions() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;
        
        // Get user roles from junction table
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select(`
            role_id,
            roles(
              role_permissions(
                permissions(name)
              )
            )
          `)
          .eq('user_id', user.id);
        
        // Extract unique permissions
        const allPermissions = new Set();
        userRoles?.forEach(ur => {
          ur.roles?.role_permissions?.forEach(rp => {
            allPermissions.add(rp.permissions.name);
          });
        });
        
        setPermissions(Array.from(allPermissions));
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPermissions();
  }, []);
  
  return { permissions, loading, error };
};
```

## Permission Structure

### Permission Categories

1. **Admin Permissions (Protected)**
   - `manage_all_users` - Ability to manage all users in the system
   - `manage_all_roles` - Ability to manage all roles in the system
   - `view_all_requests` - Ability to view all requests across groups
   - `manage_groups` - Ability to create and manage groups

2. **Club Permissions**
   - `manage_club_users` - Manage users within specific groups
   - `manage_club_roles` - Manage roles within specific groups
   - `view_club_requests` - View requests for specific groups
   - `manage_club_requests` - Approve/reject requests for specific groups

3. **User Permissions**
   - `create_requests` - Create reimbursement requests

### Role Types

1. **Global Roles**
   - Apply system-wide (e.g., mes-admin)
   - Not tied to any specific group
   - Assigned with `is_global = true` in user_roles

2. **Group-Specific Roles**
   - Only apply within specific groups (e.g., club-admin)
   - Assigned with `is_global = false` and specific `group_id` in user_roles

## Role Assignment Process

1. User is created in the system
2. Admin assigns roles to the user:
   - Global roles apply across the system
   - Group-specific roles apply only within those groups
3. Each role grants specific permissions via the role_permissions table

## Implementation Details

### Permission Checking in Components

Components conditionally render based on permissions:

```jsx
// Example component with permission check
function UserManagementButton() {
  const { permissions } = usePermissions();
  
  if (!permissions.includes('manage_all_users') && 
      !permissions.includes('manage_club_users')) {
    return null;
  }
  
  return <Button>Manage Users</Button>;
}
```

### API Route Protection

API routes are protected using server-side permission checks:

```javascript
// Example API route with permission check
export async function POST(req) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401 
    });
  }
  
  // Check if user has required permission
  const { data: permissions } = await supabase
    .from('user_permissions_view')
    .select('permission_name')
    .eq('user_id', user.id);
    
  const hasPermission = permissions.some(p => 
    p.permission_name === 'manage_all_users' || 
    p.permission_name === 'manage_club_users'
  );
  
  if (!hasPermission) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { 
      status: 403 
    });
  }
  
  // Process request...
}
```

## User Registration and Default Roles

When a new user registers:

1. A record is created in the Supabase Auth system
2. A corresponding record is created in the `users` table
3. The user is assigned a default "user" role with global scope:
   ```sql
   INSERT INTO user_roles (user_id, role_id, is_global)
   VALUES 
     ('new-user-uuid', 
      (SELECT id FROM roles WHERE name = 'user'), 
      true);
   ```

## Troubleshooting

### Common Issues

1. **Permissions not loading**
   - Check Supabase connection
   - Verify user is properly authenticated
   - Check for database schema issues in user_roles or role_permissions

2. **User unable to access routes**
   - Verify correct role assignments in user_roles table
   - Check permission assignments in role_permissions table
   - Ensure middleware is correctly checking permissions

3. **Group-specific permissions not working**
   - Verify the is_global flag is set correctly
   - Check that group_id is properly set in user_roles
   - Ensure queries are filtering by both user and group
