# Database Schema

This document provides detailed information about the database structure for the MES-ERP system.

## Core Tables

### users
Stores basic user information.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  fullName TEXT,
  phoneNum TEXT,
  reimbursment_or_payment TEXT
);
```

### roles
Defines different roles in the system.

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name CHARACTER VARYING NOT NULL
);
```

### permissions
Defines individual permissions.

```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY,
  name CHARACTER VARYING NOT NULL
);
```

### groups
Represents student clubs/organizations.

```sql
CREATE TABLE groups (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID,
  group_order INTEGER,
  total_budget NUMERIC
);
```

## Junction Tables

### user_roles
Maps users to roles and optionally to groups.

```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  is_global BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT global_role_check CHECK (
    (is_global = true AND group_id IS NULL) OR
    (is_global = false AND group_id IS NOT NULL)
  )
);
```

Key points:
- When `is_global=true`, the role applies system-wide
- When `is_global=false`, the role is specific to a group
- The CHECK constraint ensures proper assignment

### group_roles
Defines which roles belong to which groups.

```sql
CREATE TABLE group_roles (
  id UUID PRIMARY KEY,
  role_id UUID NOT NULL REFERENCES roles(id),
  group_id UUID REFERENCES groups(id),
  is_global BOOLEAN NOT NULL DEFAULT false
);
```

### role_permissions
Maps roles to their permissions.

```sql
CREATE TABLE role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id),
  permission_id UUID NOT NULL REFERENCES permissions(id),
  PRIMARY KEY (role_id, permission_id)
);
```

## Request Tables

### payment_requests
Stores reimbursement requests.

```sql
CREATE TABLE payment_requests (
  request_id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  group_id UUID REFERENCES groups(id),
  amount_requested_cad NUMERIC,
  status TEXT,
  timestamp TIMESTAMP WITH TIME ZONE,
  email_address TEXT,
  full_name TEXT,
  role TEXT,
  budget_line TEXT,
  approved_individual_or_project_name TEXT,
  sport_and_team_name TEXT,
  conference_or_competition_name TEXT,
  conference_competition_type TEXT,
  head_delegate BOOLEAN,
  reimbursement_or_payment TEXT,
  payment_timeframe TEXT,
  preferred_payment_form TEXT,
  receipt TEXT,
  currency_type TEXT,
  additional_payment_info TEXT
);
```

### annual_budget_form
Stores annual budget requests.

```sql
CREATE TABLE annual_budget_form (
  id UUID PRIMARY KEY,
  club_name TEXT,
  requested_mes_funding NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE,
  status TEXT,
  user_id UUID REFERENCES users(id),
  group_id UUID REFERENCES groups(id)
);
```

### annual_budget_form_rows
Stores budget form line items.

```sql
CREATE TABLE annual_budget_form_rows (
  id UUID PRIMARY KEY,
  form_id UUID REFERENCES annual_budget_form(id),
  row_type TEXT, 
  order_index INTEGER,
  col_values JSONB,
  group_id UUID REFERENCES groups(id)
);
```

## Common Queries

### Get all permissions for a user

```sql
SELECT DISTINCT p.name
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
JOIN roles r ON rp.role_id = r.id
JOIN user_roles ur ON r.id = ur.role_id
WHERE ur.user_id = '00000000-0000-0000-0000-000000000000';
```

### Get a user's groups with roles

```sql
SELECT g.name as group_name, r.name as role_name
FROM user_roles ur
JOIN groups g ON ur.group_id = g.id
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = '00000000-0000-0000-0000-000000000000';
```

### Get requests for a user's groups

```sql
SELECT pr.*
FROM payment_requests pr
WHERE pr.group_id IN (
  SELECT ur.group_id
  FROM user_roles ur
  WHERE ur.user_id = '00000000-0000-0000-0000-000000000000'
);
```

## Migration Notes

The database was recently modified to allow users to belong to multiple groups simultaneously by:

1. Removing direct `role_id` and `group_id` fields from the users table
2. Using junction tables (`user_roles`) to establish many-to-many relationships
3. Adding `is_global` flags to distinguish between global and group-specific roles
4. Updating all queries to handle users having multiple groups/roles

This structure provides a flexible permission system where users can have different roles across different groups while maintaining clear permission boundaries.
