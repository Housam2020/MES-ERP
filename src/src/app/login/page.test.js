import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

jest.mock('@/utils/supabase/client', () => ({
  createClient: jest.fn()
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, type, className }) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      type={type} 
      className={className}
      data-testid="button"
    >
      {children}
    </button>
  )
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ id, type, value, onChange, required }) => (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      required={required}
      data-testid={id}
    />
  )
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ htmlFor, children }) => (
    <label htmlFor={htmlFor} data-testid={`label-${htmlFor}`}>
      {children}
    </label>
  )
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }) => <div data-testid="card" className={className}>{children}</div>,
  CardHeader: ({ children }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }) => <div data-testid="card-title">{children}</div>,
  CardContent: ({ children }) => <div data-testid="card-content">{children}</div>
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, className }) => (
    <a href={href} className={className} data-testid="link">
      {children}
    </a>
  )
}));

// Import after mocking
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import LoginPage from '@/app/login/page';

describe('LoginPage Component', () => {
  const mockRouter = {
    push: jest.fn(),
    refresh: jest.fn()
  };
  
  const mockSupabase = {
    auth: {
      signInWithPassword: jest.fn()
    },
    from: jest.fn()
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup router mock
    useRouter.mockReturnValue(mockRouter);
    
    // Setup Supabase client mock
    createClient.mockReturnValue(mockSupabase);
    
    // Setup window.localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn()
      },
      writable: true
    });
  });
  
  test('renders login form correctly', async () => {
    await act(async () => {
      render(<LoginPage />);
    });
    
    expect(screen.getByTestId('card-title')).toHaveTextContent('Login');
    expect(screen.getByTestId('email')).toBeInTheDocument();
    expect(screen.getByTestId('password')).toBeInTheDocument();
    expect(screen.getByTestId('button')).toHaveTextContent('Login');
    expect(screen.getByTestId('link')).toHaveTextContent('Register');
  });
  
  test('handles successful login', async () => {
    // Mock successful login
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null
    });
    
    // Mock user fetch
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'users') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'test-user-id',
              email: 'test@example.com',
              role_id: 'role-1',
              roles: {
                name: 'user',
                role_permissions: [
                  { permissions: { name: 'basic_access' } }
                ]
              }
            },
            error: null
          })
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis()
      };
    });
    
    await act(async () => {
      render(<LoginPage />);
    });
    
    // Fill in the form
    fireEvent.change(screen.getByTestId('email'), {
      target: { value: 'test@example.com' }
    });
    
    fireEvent.change(screen.getByTestId('password'), {
      target: { value: 'password123' }
    });
    
    // Submit the form
    fireEvent.submit(screen.getByTestId('button'));
    
    // Wait for the login process to complete
    await waitFor(() => {
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
    
    // Check if redirected to dashboard
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/home');
      expect(mockRouter.refresh).toHaveBeenCalled();
    });
  });
  
  test('handles login failure', async () => {
    // Mock failed login
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: new Error('Invalid login credentials')
    });
    
    await act(async () => {
      render(<LoginPage />);
    });
    
    // Fill in the form
    fireEvent.change(screen.getByTestId('email'), {
      target: { value: 'wrong@example.com' }
    });
    
    fireEvent.change(screen.getByTestId('password'), {
      target: { value: 'wrongpassword' }
    });
    
    // Submit the form
    fireEvent.submit(screen.getByTestId('button'));
    
    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
    
    // Check router was not called
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
  
  test('handles new user creation', async () => {
    // Mock successful login but user not in database yet
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'new-user-id' } },
      error: null
    });
    
    // Mock user fetch - user not found
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'users') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('User not found')
          }),
          insert: jest.fn().mockReturnValue({
            error: null
          })
        };
      }
      if (table === 'roles') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: 'default-role-id' },
            error: null
          })
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis()
      };
    });
    
    await act(async () => {
      render(<LoginPage />);
    });
    
    // Fill in the form
    fireEvent.change(screen.getByTestId('email'), {
      target: { value: 'new@example.com' }
    });
    
    fireEvent.change(screen.getByTestId('password'), {
      target: { value: 'newpassword' }
    });
    
    // Submit the form
    fireEvent.submit(screen.getByTestId('button'));
    
    // Wait for the redirect
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/home');
      expect(mockRouter.refresh).toHaveBeenCalled();
    });
  });
});