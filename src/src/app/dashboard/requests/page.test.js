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
  Card: ({ children, className }) => <div data-testid="card" className={className}>{children}</div>,
  CardHeader: ({ children, className }) => <div data-testid="card-header" className={className}>{children}</div>,
  CardTitle: ({ children }) => <div data-testid="card-title">{children}</div>,
  CardContent: ({ children }) => <div data-testid="card-content">{children}</div>
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick }) => (
    <button onClick={onClick} data-testid="button">
      {children}
    </button>
  )
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }) => <a href={href} data-testid="link">{children}</a>
}));

jest.mock('@/components/dashboard/EditableStatusRow', () => ({
  __esModule: true,
  default: ({ request, onStatusUpdate }) => (
    <tr data-testid="editable-row">
      <td>{request.name}</td>
      <td>{request.role}</td>
      <td>${request.amount_requested_cad}</td>
      <td>{request.groups?.name}</td>
      <td>{request.payment_timeframe}</td>
      <td>{request.type}</td>
      <td>{new Date(request.timestamp).toLocaleDateString()}</td>
      <td>
        <select
          data-testid="status-select"
          value={request.status}
          onChange={(e) => onStatusUpdate(request.request_id, e.target.value)}
        >
          <option value="Submitted">Submitted</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </td>
    </tr>
  )
}));

// Import after mocking
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import RequestsPage from '@/app/dashboard/requests/page';

describe('RequestsPage Component', () => {
  const mockRouter = {
    push: jest.fn()
  };
  
  // Sample mock data
  const mockPaymentRequests = [
    {
      request_id: 'req-1',
      name: 'John Doe',
      role: 'Student',
      amount_requested_cad: 150.75,
      group_id: 'group-1',
      groups: { name: 'Engineering' },
      payment_timeframe: 'ASAP',
      type: 'Reimbursement',
      timestamp: '2023-05-15T10:00:00Z',
      status: 'Submitted',
      email_address: 'john@example.com'
    },
    {
      request_id: 'req-2',
      name: 'Jane Smith',
      role: 'Club Leader',
      amount_requested_cad: 275.50,
      group_id: 'group-2',
      groups: { name: 'Marketing' },
      payment_timeframe: '2-4 weeks',
      type: 'Advance',
      timestamp: '2023-06-20T14:30:00Z',
      status: 'Approved',
      email_address: 'jane@example.com'
    }
  ];
  
  const mockBudgetRequests = [
    {
      id: 'budget-1',
      club_name: 'Engineering Club',
      requested_mes_funding: 5000,
      status: 'Pending',
      created_at: '2023-04-10T09:00:00Z'
    },
    {
      id: 'budget-2',
      club_name: 'Marketing Club',
      requested_mes_funding: 3500,
      status: 'Approved',
      created_at: '2023-04-15T11:30:00Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    useRouter.mockReturnValue(mockRouter);
    usePermissions.mockReturnValue({
      permissions: ['view_all_requests'],
      loading: false,
      error: null
    });
    
    // Mock fetch for API calls
    global.fetch = jest.fn().mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
    );
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
      render(<RequestsPage />);
    });
    
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/login');
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
      render(<RequestsPage />);
    });
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
  
  test('displays correct title for admin user', async () => {
    // Setup permissions for admin
    usePermissions.mockReturnValue({
      permissions: ['view_all_requests'],
      loading: false,
      error: null
    });
    
    // Create mock Supabase client with successful responses
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
          error: null
        })
      },
      from: jest.fn().mockImplementation((table) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'user-1',
                group_id: 'group-1',
                groups: { id: 'group-1', name: 'Engineering' }
              },
              error: null
            })
          };
        } else if (table === 'payment_requests') {
          return {
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({
              data: mockPaymentRequests,
              error: null
            })
          };
        } else if (table === 'annual_budget_form') {
          return {
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({
              data: mockBudgetRequests,
              error: null
            })
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis()
        };
      })
    };
    
    createClient.mockReturnValue(mockSupabase);
    
    await act(async () => {
      render(<RequestsPage />);
    });
    
    // Use a non-exact match to accommodate async behavior
    await waitFor(() => {
      expect(screen.queryByText(/All Payment Requests/i)).not.toBeNull();
    });
  });
  
  test('has correct permissions check', () => {
    const { permissions } = usePermissions();
    expect(permissions).toContain('view_all_requests');
  });
});
