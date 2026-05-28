import { render, screen, waitFor } from '@testing-library/react';
import MyAccount from '../components/MyAccount.jsx';
import { mockUser, mockPlans } from '../useAccountData.js';

// Tests run with NODE_ENV=test, so IS_MOCK=true in useAccountData

describe('MyAccount', () => {
  test('renders the skeleton while loading', () => {
    render(<MyAccount userId="user-001" />);
    expect(
      screen.getByLabelText(/Loading account information/i),
    ).toBeInTheDocument();
  });

  test('shows user data when loaded', async () => {
    render(<MyAccount userId="user-001" />);
    await waitFor(
      () => {
        expect(screen.getByText(mockUser.name)).toBeInTheDocument();
      },
      { timeout: 1000 },
    );
    expect(screen.getByText(mockUser.email)).toBeInTheDocument();
  });

  test('correctly separates active from completed plans', async () => {
    render(<MyAccount userId="user-001" />);
    await waitFor(
      () => {
        expect(screen.getByText('Fixed Rate 24-Month')).toBeInTheDocument();
      },
      { timeout: 1000 },
    );
    // Active plan appears in "Current Plan"
    expect(screen.getByText('Active')).toBeInTheDocument();
    // Completed plan may be in "Past Plans" (collapsed)
    expect(screen.getByText(/Past Plans/i)).toBeInTheDocument();
  });
});
