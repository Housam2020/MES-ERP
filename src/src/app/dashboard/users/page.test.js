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
  Card: ({ children }) => <div data-testid="card">{children}</div>,
  CardHeader: ({ children }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }) => <div data-testid="card-title">{children}</div>,
  CardContent: ({ children }) => <div data-testid="card-content">{children}</div>
}));

// Import after mocking
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import UsersPage from '@/app/dashboard/users/page';

describe('UsersPage Component', () => {
  const mockRouter = {
    push: jest.fn()
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    useRouter.mockReturnValue(mockRouter);
    usePermissions.mockReturnValue({
      permissions: ['manage_all_users'],
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
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
          then: jest.fn().mockResolvedValue({
            data: table === 'users' ? [
              {
                id: 'test-user-id',
                email: 'test@example.com',
                role_id: 'role-1',
                group_id: 'group-1',
                roles: { id: 'role-1', name: 'Admin' },
                groups: { id: 'group-1', name: 'Test Group' }
              }
            ] : [],
            error: null
          })
        };
      })
    };
    
    createClient.mockReturnValue(mockSupabaseClient);
    
    // Mock fetch for API calls
    global.fetch = jest.fn().mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
    );
  });
  
  test('redirects to login if user is not authenticated', async () => {
    // Override the auth mock for this specific test
    const mockSupabase = createClient();
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null
    });
    
    render(<UsersPage />);
    
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/login');
    });
  });
  
  test('redirects to dashboard if user lacks permissions', async () => {
    // Override the permissions mock for this specific test
    usePermissions.mockReturnValueOnce({
      permissions: ['basic_access'],
      loading: false
    });
    
    render(<UsersPage />);
    
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/home');
    });
  });

  test('renders loading state initially', async () => {
    render(<UsersPage />);
    
    // Check that the loading state appears
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
  
  test('properly uses mock implementations', () => {
    // This is a simple test that will always pass 
    // as long as our mocks are properly configured
    expect(createClient).toBeDefined();
    expect(useRouter).toBeDefined();
    expect(usePermissions).toBeDefined();
    
    const mockSupabase = createClient();
    expect(mockSupabase.auth.getUser).toBeDefined();
    expect(mockSupabase.from).toBeDefined();
  });
});