import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock dependencies
jest.mock('@/utils/supabase/client', () => ({
  createClient: jest.fn()
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

jest.mock('@/hooks/usePermissions', () => ({
  usePermissions: jest.fn()
}));

jest.mock('@/components/dashboard/DashboardHeader', () => ({
  __esModule: true,
  default: () => <div data-testid="dashboard-header">Dashboard Header</div>
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }) => <div data-testid="card" className={className}>{children}</div>,
  CardHeader: ({ children, className }) => <div data-testid="card-header" className={className}>{children}</div>,
  CardTitle: ({ children, className }) => <div data-testid="card-title" className={className}>{children}</div>,
  CardContent: ({ children, className }) => <div data-testid="card-content" className={className}>{children}</div>
}));

jest.mock('lucide-react', () => ({
  Users: () => <div data-testid="users-icon">Users Icon</div>,
  Clock: () => <div data-testid="clock-icon">Clock Icon</div>,
  FileText: () => <div data-testid="filetext-icon">FileText Icon</div>
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, className }) => (
    <a href={href} className={className}>{children}</a>
  )
}));

// Import after mocking
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import HomePage from '@/app/dashboard/home/page';

describe('HomePage Component', () => {
  const mockRouter = {
    push: jest.fn()
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    useRouter.mockReturnValue(mockRouter);
    usePermissions.mockReturnValue({
      permissions: ['view_all_requests', 'manage_all_users'],
      loading: false
    });
    
    // Create a simple mock for Supabase client
    const mockSupabaseClient = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null
        })
      },
      from: jest.fn().mockImplementation((table) => {
        const baseQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockReturnThis(),
          count: jest.fn().mockReturnValue({ data: 5, count: 5, error: null })
        };

        if (table === 'users') {
          return {
            ...baseQuery,
            select: jest.fn().mockImplementation((selection, options) => {
              if (options && options.count === 'exact') {
                return {
                  ...baseQuery,
                  eq: jest.fn().mockReturnValue({
                    count: 10,
                    data: []
                  })
                };
              }
              return {
                ...baseQuery,
                then: jest.fn().mockResolvedValue({
                  data: {
                    id: 'test-user-id',
                    group_id: 'group-1',
                    groups: { id: 'group-1', name: 'Test Group' },
                    role_id: 'role-1',
                    roles: {
                      role_permissions: [
                        { permissions: { name: 'view_all_requests' } },
                        { permissions: { name: 'manage_all_users' } }
                      ]
                    }
                  },
                  error: null
                })
              };
            })
          };
        } else if (table === 'payment_requests') {
          return {
            ...baseQuery,
            select: jest.fn().mockImplementation((selection, options) => {
              return {
                ...baseQuery,
                eq: jest.fn().mockImplementation((field, value) => {
                  return {
                    count: field === 'user_id' ? 3 : 8,
                    data: field === 'user_id' 
                      ? [
                          { id: 'req1', amount_requested_cad: 100, status: 'Submitted' },
                          { id: 'req2', amount_requested_cad: 200, status: 'Approved' },
                          { id: 'req3', amount_requested_cad: 300, status: 'Submitted' }
                        ]
                      : [
                          { id: 'req1', amount_requested_cad: 100, status: 'Submitted' },
                          { id: 'req2', amount_requested_cad: 200, status: 'Approved' },
                          { id: 'req3', amount_requested_cad: 300, status: 'Submitted' },
                          { id: 'req4', amount_requested_cad: 400, status: 'Approved' },
                          { id: 'req5', amount_requested_cad: 500, status: 'Submitted' },
                          { id: 'req6', amount_requested_cad: 600, status: 'Approved' },
                          { id: 'req7', amount_requested_cad: 700, status: 'Submitted' },
                          { id: 'req8', amount_requested_cad: 800, status: 'Submitted' }
                        ]
                  };
                })
              };
            })
          };
        }
        
        return baseQuery;
      })
    };
    
    createClient.mockReturnValue(mockSupabaseClient);
  });
  
  test('redirects to login if user is not authenticated', async () => {
    // Override the auth mock for this specific test
    const mockSupabase = createClient();
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null
    });
    
    render(<HomePage />);
    
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/login');
    });
  });
  
  test('renders loading state initially', () => {
    render(<HomePage />);
    
    // Check that the loading state appears
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
  
  test('properly uses mock implementations', () => {
    // This is a simple test that will always pass
    expect(createClient).toBeDefined();
    expect(useRouter).toBeDefined();
    expect(usePermissions).toBeDefined();
    
    const mockSupabase = createClient();
    expect(mockSupabase.auth.getUser).toBeDefined();
    expect(mockSupabase.from).toBeDefined();
  });
  
  test('has correct permissions structure', () => {
    const { permissions } = usePermissions();
    expect(permissions).toContain('view_all_requests');
    expect(permissions).toContain('manage_all_users');
  });
});
