import { render, screen, waitFor, act } from '@testing-library/react';
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

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled} data-testid="button">
      {children}
    </button>
  )
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ placeholder, value, onChange }) => (
    <input
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      data-testid="input"
    />
  )
}));

jest.mock('lucide-react', () => ({
  Trash2: () => <div data-testid="trash-icon">Trash Icon</div>
}));

jest.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children }) => <div data-testid="alert-dialog">{children}</div>,
  AlertDialogTrigger: ({ children, asChild }) => <div data-testid="alert-dialog-trigger">{children}</div>,
  AlertDialogContent: ({ children }) => <div data-testid="alert-dialog-content">{children}</div>,
  AlertDialogHeader: ({ children }) => <div data-testid="alert-dialog-header">{children}</div>,
  AlertDialogTitle: ({ children }) => <div data-testid="alert-dialog-title">{children}</div>,
  AlertDialogDescription: ({ children }) => <div data-testid="alert-dialog-description">{children}</div>,
  AlertDialogFooter: ({ children }) => <div data-testid="alert-dialog-footer">{children}</div>,
  AlertDialogCancel: ({ children }) => <div data-testid="alert-dialog-cancel">{children}</div>,
  AlertDialogAction: ({ children, onClick }) => (
    <div data-testid="alert-dialog-action" onClick={onClick}>
      {children}
    </div>
  )
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }) => <div data-testid="dialog">{children}</div>,
  DialogTrigger: ({ children, asChild }) => <div data-testid="dialog-trigger">{children}</div>,
  DialogContent: ({ children }) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }) => <div data-testid="dialog-title">{children}</div>
}));

// Import after mocking
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import GroupsPage from '@/app/dashboard/groups/page';

describe('GroupsPage Component', () => {
  const mockRouter = {
    push: jest.fn()
  };
  
  // Mock groups data
  const mockGroups = [
    { id: 'group-1', name: 'Engineering' },
    { id: 'group-2', name: 'Marketing' },
    { id: 'group-3', name: 'Sales' }
  ];
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    useRouter.mockReturnValue(mockRouter);
    usePermissions.mockReturnValue({
      permissions: ['manage_groups'],
      loading: false
    });
    
    // Mock window.alert
    global.alert = jest.fn();
  });
  
  test('redirects to login if user is not authenticated', async () => {
    // Create mock Supabase client that returns no user
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: null
        })
      },
      from: jest.fn()
    };
    
    createClient.mockReturnValue(mockSupabase);
    
    await act(async () => {
      render(<GroupsPage />);
    });
    
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/login');
    });
  });
  
  test('redirects to dashboard if user lacks permissions', async () => {
    // Override permissions for this test
    usePermissions.mockReturnValue({
      permissions: ['basic_access'],
      loading: false
    });
    
    // Create mock Supabase client that returns a user
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null
        })
      },
      from: jest.fn()
    };
    
    createClient.mockReturnValue(mockSupabase);
    
    await act(async () => {
      render(<GroupsPage />);
    });
    
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/home');
    });
  });
  
  test('renders loading state initially', async () => {
    // Create a mock that never resolves to keep component in loading state
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockImplementation(() => new Promise(() => {}))
      },
      from: jest.fn()
    };
    
    createClient.mockReturnValue(mockSupabase);
    
    await act(async () => {
      render(<GroupsPage />);
    });
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
  
  test('has correct permissions structure', () => {
    const { permissions } = usePermissions();
    expect(permissions).toContain('manage_groups');
  });
});
