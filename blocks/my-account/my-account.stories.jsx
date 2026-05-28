import './my-account.css';
import MyAccount from './components/MyAccount.jsx';
import AccountSkeleton from './components/AccountSkeleton.jsx';
import AccountError from './components/AccountError.jsx';

export default {
  title: 'Blocks/MyAccount',
  component: MyAccount,
};

// For stories we need to mock the hook — in production you would use a decorator
export const Default = {
  render: () => <MyAccount userId="user-001" />,
  parameters: {
    // ?mock=true will activate the mock data from the hook
    docs: { description: { story: 'Render with ?mock=true to see real data' } },
  },
};

export const Loading = {
  render: () => <AccountSkeleton />,
};

export const Error = {
  render: () => <AccountError message="Network timeout" />,
};

export const NotAuthenticated = {
  render: () => (
    <div className="account-error" role="alert">
      <p>
        Please <a href="/login">log in</a> to view your account.
      </p>
    </div>
  ),
};
