export default function AccountSkeleton() {
  return (
    <div
      className="account-skeleton"
      aria-busy="true"
      aria-label="Loading account information"
    >
      <div className="account-skeleton__header">
        <div className="account-skeleton__avatar skeleton-pulse" />
        <div className="account-skeleton__info">
          <div className="account-skeleton__line account-skeleton__line--lg skeleton-pulse" />
          <div className="account-skeleton__line account-skeleton__line--md skeleton-pulse" />
        </div>
      </div>
      <div className="account-skeleton__plans">
        <div className="account-skeleton__line account-skeleton__line--sm skeleton-pulse" />
        <div className="account-skeleton__card skeleton-pulse" />
      </div>
    </div>
  );
}
