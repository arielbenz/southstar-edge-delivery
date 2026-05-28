import { useAccountData } from '../useAccountData.js';
import AccountHeader from './AccountHeader.jsx';
import PlanList from './PlanList.jsx';
import AccountSkeleton from './AccountSkeleton.jsx';
import AccountError from './AccountError.jsx';

/**
 * MyAccount — root component for the My Account block.
 */
export default function MyAccount({ userId }) {
  const { user, plans, loading, error } = useAccountData(userId);

  if (loading) return <AccountSkeleton />;
  if (error) return <AccountError message={error} />;

  return (
    <div className="my-account">
      <AccountHeader user={user} />
      <PlanList plans={plans} />
    </div>
  );
}
