
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegisterPage from './RegisterPage';
import api from '../api';
import { AuthContext } from '../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';

jest.mock('../api', () => ({
  register: jest.fn(),
}));

describe('RegisterPage (simple)', () => {
  const loginMock = jest.fn();

  function setup() {
    return render(
      <AuthContext.Provider value={{ login: loginMock }}>
        <BrowserRouter>
          <RegisterPage />
        </BrowserRouter>
      </AuthContext.Provider>
    );
  }

  beforeEach(() => {
    api.register.mockReset();
    loginMock.mockReset();
  });

  it('shows validation error for invalid email', async () => {
    setup();
    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
      target: { value: 'not-an-email' },
    });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    expect(await screen.findByText(/invalid email address/i)).toBeInTheDocument();
  });

  it('shows validation error when passwords do not match', async () => {
    setup();
    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: 'pass1' },
    });
    fireEvent.change(screen.getByPlaceholderText(/confirm your password/i), {
      target: { value: 'pass2' },
    });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('calls register API on valid submit', async () => {
    api.register.mockResolvedValueOnce();
    loginMock.mockResolvedValueOnce();

    setup();
    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: 'Test1234' },
    });
    fireEvent.change(screen.getByPlaceholderText(/confirm your password/i), {
      target: { value: 'Test1234' },
    });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(api.register).toHaveBeenCalledWith('user@example.com', 'Test1234', 'Test1234');
      expect(loginMock).toHaveBeenCalledWith('user@example.com', 'Test1234');
    });
  });
});
