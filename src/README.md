# MES-ERP Reimbursement System

A comprehensive system for managing reimbursement requests, user roles, and group/club permissions.

## Project Overview

The MES-ERP system is designed to allow students in university groups/clubs to submit reimbursement requests. The system features a sophisticated role-based access control system where:

- Users can belong to multiple groups
- Each user can have different roles in different groups
- Permissions are determined by roles
- Different pages are accessible based on permissions

## Technology Stack

- **Frontend**: React with Next.js
- **UI Components**: Shadcn/ui component library
- **Backend/Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS

## Key Features

- **Multi-Group Support**: Users can belong to multiple groups with different roles in each
- **Role-Based Permissions**: Granular access control based on user roles
- **Reimbursement Requests**: Submit and track payment requests
- **Budget Management**: Track and approve budget allocations
- **Analytics Dashboard**: Visualize spending and request data
- **User Management**: Add and manage users and their roles

## Documentation Structure

For more detailed documentation on specific components, please refer to:

- [Database Schema](docs/DATABASE.md) - Detailed information about tables and relationships
- [Authentication System](docs/AUTH.md) - Authentication and authorization flow
- [Analytics Dashboard](components/analytics/README.md) - Analytics visualizations and data processing
- [Reimbursement Forms](components/reimbursement/README.md) - Form components and workflow
- [Role Management](components/roles/README.md) - Role creation and permission system

## Getting Started

### Prerequisites

- Node.js
- npm

### Installation

1. Clone the repository
```bash
git clone https://github.com/your-org/mes-erp.git
cd mes-erp
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.local
```
Update the `.env.local` file with Supabase credentials.

4. Run development server
```bash
npm run dev
```

## Project Structure

```
/
├── app/                  # Next.js pages and app router
│   ├── (auth)/           # Authentication pages
│   ├── dashboard/        # Dashboard pages
│   └── api/              # API endpoints
├── components/           # React components
│   ├── analytics/        # Analytics components & charts
│   ├── dashboard/        # Dashboard UI components
│   ├── reimbursement/    # Reimbursement form components
│   ├── roles/            # Role management components
│   ├── ui/               # Shadcn UI components
│   └── users/            # User management components
├── hooks/                # Custom React hooks
├── utils/                # Utility functions
│   └── supabase/         # Supabase client utilities
├── config/               # Configuration files
└── docs/                 # Additional documentation
```
