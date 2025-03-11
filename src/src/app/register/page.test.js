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
import RegisterPage from '@/app/register/page';

describe('RegisterPage Component', () => {
  const mockRouter = {
    push: jest.fn()
  };
  
  const mockSupabase = {
    auth: {
      signUp: jest.fn()
    },
    from: jest.fn()
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup router mock
    useRouter.mockReturnValue(mockRouter);
    
    // Setup Supabase client mock
    createClient.mockReturnValue(mockSupabase);
  });
  
  test('renders register form correctly', () => {
    render(<RegisterPage />);
    
    expect(screen.getByTestId('card-title')).toHaveTextContent('Register');
    expect(screen.getByTestId('email')).toBeInTheDocument();
    expect(screen.getByTestId('password')).toBeInTheDocument();
    expect(screen.getByTestId('button')).toHaveTextContent('Register');
    expect(screen.getByTestId('link')).toHaveTextContent('Login');
  });
  
  test('handles successful registration with session', async () => {
    // Mock successful registration with session
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { 
        user: { id: 'test-user-id', email: 'test@example.com' },
        session: { access_token: 'mock-token' }
      },
      error: null
    });
    
    // Mock role fetch
    mockSupabase.from.mockImplementation((table) => {
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
      if (table === 'users') {
        return {
          insert: jest.fn().mockResolvedValue({
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
    
    render(<RegisterPage />);
    
    // Fill in the form
    fireEvent.change(screen.getByTestId('email'), {
      target: { value: 'test@example.com' }
    });
    
    fireEvent.change(screen.getByTestId('password'), {
      target: { value: 'password123' }
    });
    
    // Submit the form
    fireEvent.submit(screen.getByTestId('button'));
    
    // Wait for the registration process to complete
    await waitFor(() => {
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
    
    // Verify user creation in the database
    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('users');
    });
    
    // Check if redirected to dashboard
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/home');
    });
  });
  
  test('handles successful registration without session (email confirmation required)', async () => {
    // Mock successful registration without session (needs email confirmation)
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { 
        user: { id: 'test-user-id', email: 'test@example.com' },
        session: null
      },
      error: null
    });
    
    // Mock role fetch
    mockSupabase.from.mockImplementation((table) => {
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
      if (table === 'users') {
        return {
          insert: jest.fn().mockResolvedValue({
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
    
    render(<RegisterPage />);
    
    // Fill in the form
    fireEvent.change(screen.getByTestId('email'), {
      target: { value: 'test@example.com' }
    });
    
    fireEvent.change(screen.getByTestId('password'), {
      target: { value: 'password123' }
    });
    
    // Submit the form
    fireEvent.submit(screen.getByTestId('button'));
    
    // Wait for the error message about email confirmation
    await waitFor(() => {
      expect(screen.getByText('Please check your email to confirm your registration.')).toBeInTheDocument();
    });
    
    // Check that router was not called (no redirect)
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
  
  test('handles registration error', async () => {
    // Mock registration error
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: new Error('Email already in use')
    });
    
    render(<RegisterPage />);
    
    // Fill in the form
    fireEvent.change(screen.getByTestId('email'), {
      target: { value: 'existing@example.com' }
    });
    
    fireEvent.change(screen.getByTestId('password'), {
      target: { value: 'password123' }
    });
    
    // Submit the form
    fireEvent.submit(screen.getByTestId('button'));
    
    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText('Error registering user. Please try again.')).toBeInTheDocument();
    });
    
    // Check router was not called
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
  
  test('handles error when inserting user into database', async () => {
    // Mock successful auth registration but database error
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { 
        user: { id: 'test-user-id', email: 'test@example.com' },
        session: { access_token: 'mock-token' }
      },
      error: null
    });
    
    // Mock role fetch but user insert error
    mockSupabase.from.mockImplementation((table) => {
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
      if (table === 'users') {
        return {
          insert: jest.fn().mockResolvedValue({
            error: new Error('Database constraint violation')
          })
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis()
      };
    });
    
    render(<RegisterPage />);
    
    // Fill in the form
    fireEvent.change(screen.getByTestId('email'), {
      target: { value: 'test@example.com' }
    });
    
    fireEvent.change(screen.getByTestId('password'), {
      target: { value: 'password123' }
    });
    
    // Submit the form
    fireEvent.submit(screen.getByTestId('button'));
    
    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText('Error registering user. Please try again.')).toBeInTheDocument();
    });
    
    // Check router was not called
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});