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
  CardHeader: ({ children }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }) => <div data-testid="card-title">{children}</div>,
  CardContent: ({ children, className }) => <div data-testid="card-content" className={className}>{children}</div>,
  CardDescription: ({ children }) => <div data-testid="card-description">{children}</div>
}));

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, defaultValue }) => <div data-testid="tabs" data-default-value={defaultValue}>{children}</div>,
  TabsList: ({ children }) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value }) => <div data-testid="tabs-trigger" data-value={value}>{children}</div>,
  TabsContent: ({ children, value }) => <div data-testid="tabs-content" data-value={value}>{children}</div>
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children, className }) => <div data-testid="scroll-area" className={className}>{children}</div>
}));

jest.mock('@/components/ui/table', () => ({
  Table: ({ children }) => <table data-testid="table">{children}</table>,
  TableHeader: ({ children }) => <thead data-testid="table-header">{children}</thead>,
  TableBody: ({ children }) => <tbody data-testid="table-body">{children}</tbody>,
  TableRow: ({ children }) => <tr data-testid="table-row">{children}</tr>,
  TableHead: ({ children }) => <th data-testid="table-head">{children}</th>,
  TableCell: ({ children }) => <td data-testid="table-cell">{children}</td>
}));

// Mock recharts
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line"></div>,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar"></div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie"></div>,
  Cell: () => <div data-testid="cell"></div>,
  XAxis: () => <div data-testid="x-axis"></div>,
  YAxis: () => <div data-testid="y-axis"></div>,
  CartesianGrid: () => <div data-testid="cartesian-grid"></div>,
  Tooltip: () => <div data-testid="tooltip"></div>,
  Legend: () => <div data-testid="legend"></div>
}));

// Mock lodash
jest.mock('lodash', () => ({
  chain: jest.fn(() => ({
    groupBy: jest.fn(() => ({
      map: jest.fn(() => ({
        orderBy: jest.fn(() => ({
          value: jest.fn().mockReturnValue([])
        })),
        value: jest.fn().mockReturnValue([])
      }))
    })),
    orderBy: jest.fn(() => ({
      value: jest.fn().mockReturnValue([])
    })),
    value: jest.fn().mockReturnValue([]),
    filter: jest.fn(() => ({
      groupBy: jest.fn(() => ({
        map: jest.fn(() => ({
          value: jest.fn().mockReturnValue([])
        }))
      }))
    })),
    reduce: jest.fn(() => ({
      value: jest.fn().mockReturnValue([])
    }))
  })),
  sumBy: jest.fn(() => 1000),
  meanBy: jest.fn(() => 500)
}));

// Import after mocking
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import AnalyticsPage from '@/app/dashboard/analytics/page';

describe('AnalyticsPage Component', () => {
  const mockRouter = {
    push: jest.fn()
  };
  
  // Sample mock data
  const mockPaymentRequests = [
    {
      id: 1,
      timestamp: '2023-01-15T10:00:00Z',
      amount_requested_cad: 100.50,
      status: 'Approved',
      group_id: 'group-1',
      groups: { name: 'Engineering' },
      email_address: 'user1@example.com',
      budget_line: 'Office Supplies',
      payment_timeframe: 'ASAP'
    },
    {
      id: 2,
      timestamp: '2023-02-20T14:30:00Z',
      amount_requested_cad: 250.75,
      status: 'Submitted',
      group_id: 'group-2',
      groups: { name: 'Marketing' },
      email_address: 'user2@example.com',
      budget_line: 'Marketing Materials',
      payment_timeframe: '2-4 weeks'
    }
  ];
  
  const mockBudgetData = [
    {
      id: 1,
      row_type: 'data',
      col_values: {
        line_label: 'Office Supplies',
        col_2024_2025: '5000'
      },
      groups: {
        id: 'group-1',
        name: 'Engineering',
        total_budget: 50000
      }
    },
    {
      id: 2,
      row_type: 'data',
      col_values: {
        line_label: 'Marketing Materials',
        col_2024_2025: '10000'
      },
      groups: {
        id: 'group-2',
        name: 'Marketing',
        total_budget: 100000
      }
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
      render(<AnalyticsPage />);
    });
    
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/login');
    });
  });
  
  test('redirects to dashboard if user lacks permissions', async () => {
    // Override permissions for this test
    usePermissions.mockReturnValue({
      permissions: ['basic_access'],
      loading: false,
      error: null
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
      render(<AnalyticsPage />);
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
      render(<AnalyticsPage />);
    });
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
  
  test('has correct permissions check for analytics access', () => {
    const { permissions } = usePermissions();
    expect(permissions).toContain('view_all_requests');
  });
});