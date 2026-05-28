export default function EnrollmentConfirmation({ formData = {}, config = {} }) {
  return (
    <div className="enrollment-flow enrollment-flow--confirmed">
      <div
        className="enrollment-flow__confirmation"
        role="region"
        aria-label="Enrollment confirmed"
      >
        <div className="enrollment-flow__confirmation-icon" aria-hidden="true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
        </div>

        <h1 className="enrollment-flow__confirmation-title">
          You&rsquo;re enrolled!
        </h1>

        {formData.email && (
          <p className="enrollment-flow__confirmation-message">
            A confirmation has been sent to <strong>{formData.email}</strong>.
          </p>
        )}

        {(formData.planId || formData.firstName) && (
          <dl className="enrollment-flow__confirmation-details">
            {formData.planId && (
              <>
                <dt>Plan</dt>
                <dd>{formData.planId}</dd>
              </>
            )}
            {formData.firstName && (
              <>
                <dt>Name</dt>
                <dd>
                  {formData.firstName} {formData.lastName}
                </dd>
              </>
            )}
          </dl>
        )}

        {config.loginUrl && (
          <a
            href={config.loginUrl}
            className="enrollment-flow__btn enrollment-flow__btn--next enrollment-flow__btn--link"
          >
            Go to my account
          </a>
        )}
      </div>
    </div>
  );
}
