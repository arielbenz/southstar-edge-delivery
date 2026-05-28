export default function StepContent({ step, config, formData, onChange }) {
  if (!step) return null;

  return (
    <div className="enrollment-flow__step-content">
      <h2 className="enrollment-flow__step-title">{step.title}</h2>
      {step.description && (
        <p className="enrollment-flow__step-description">{step.description}</p>
      )}

      <div className="enrollment-flow__fields">
        {step.number === 1 && (
          <div className="enrollment-flow__field">
            <label htmlFor="plan-select">Plan</label>
            <select
              id="plan-select"
              value={formData.planId ?? ''}
              onChange={(e) => onChange({ planId: e.target.value })}
            >
              <option value="">Select a plan...</option>
              <option value="fixed-12">Fixed Rate 12 Month</option>
              <option value="fixed-24">Fixed Rate 24 Month</option>
              <option value="variable">Variable Rate</option>
            </select>
          </div>
        )}
        {step.number === 2 && (
          <>
            <div className="enrollment-flow__field">
              <label htmlFor="first-name">First name</label>
              <input
                id="first-name"
                type="text"
                value={formData.firstName ?? ''}
                onChange={(e) => onChange({ firstName: e.target.value })}
                placeholder="Jane"
              />
            </div>
            <div className="enrollment-flow__field">
              <label htmlFor="last-name">Last name</label>
              <input
                id="last-name"
                type="text"
                value={formData.lastName ?? ''}
                onChange={(e) => onChange({ lastName: e.target.value })}
                placeholder="Smith"
              />
            </div>
            <div className="enrollment-flow__field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={formData.email ?? ''}
                onChange={(e) => onChange({ email: e.target.value })}
                placeholder="jane@example.com"
              />
            </div>
          </>
        )}
        {step.number === 3 && (
          <div className="enrollment-flow__review">
            <dl>
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
              {formData.email && (
                <>
                  <dt>Email</dt>
                  <dd>{formData.email}</dd>
                </>
              )}
            </dl>
            {config.termsUrl && (
              <p className="enrollment-flow__terms">
                By submitting you agree to our{' '}
                <a href={config.termsUrl} target="_blank" rel="noopener">
                  Terms and Conditions
                </a>
                {config.privacyUrl && (
                  <>
                    {' '}
                    and{' '}
                    <a href={config.privacyUrl} target="_blank" rel="noopener">
                      Privacy Policy
                    </a>
                  </>
                )}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
