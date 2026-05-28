/**
 * AccountHeader — avatar, nombre, email y link de perfil.
 */
export default function AccountHeader({ user }) {
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : '?';

  return (
    <header className="account-header">
      <div className="account-header__avatar" aria-hidden="true">
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={`${user.name} avatar`}
            className="account-header__avatar-img"
            width="56"
            height="56"
          />
        ) : (
          <span className="account-header__avatar-initial">{initial}</span>
        )}
      </div>

      <div className="account-header__info">
        <h2 className="account-header__name">{user?.name ?? 'Account'}</h2>
        {user?.email && <p className="account-header__email">{user.email}</p>}
        <a href="/profile" className="account-header__edit-link">
          Edit profile
        </a>
      </div>
    </header>
  );
}
