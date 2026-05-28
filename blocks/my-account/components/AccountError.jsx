export default function AccountError({ message }) {
  return (
    <div className="account-error" role="alert" aria-live="assertive">
      <p className="account-error__message">
        There was an error loading your account.
        {message && <span className="account-error__detail"> ({message})</span>}
      </p>
      <button
        type="button"
        className="button account-error__retry"
        onClick={() => window.location.reload()}
      >
        Try Again
      </button>
    </div>
  );
}
