/**
 * PlanCard — tarjeta individual de un plan de gas natural.
 */
export default function PlanCard({ plan }) {
  const { id, planName, rate, term, featuresHtml, featured } = plan;
  const enrollUrl = `/enroll?plan=${id}`;

  return (
    <div
      className={`plan-card${featured ? ' plan-card--featured' : ''}`}
      role="listitem"
    >
      {featured && (
        <div className="plan-card__badge" aria-label="Most Popular plan">
          Most Popular
        </div>
      )}

      <div className="plan-card__header">
        <h3 className="plan-card__name">{planName}</h3>
        {rate && (
          <div
            className="plan-card__rate"
            aria-label={`Rate: ${rate} cents per CCF`}
          >
            <span className="plan-card__rate-value">{rate}</span>
            <span className="plan-card__rate-unit">¢/CCF</span>
          </div>
        )}
        {term && <p className="plan-card__term">{term} month term</p>}
      </div>

      {featuresHtml && (
        <div
          className="plan-card__features"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: featuresHtml }}
        />
      )}

      <div className="plan-card__footer">
        <a
          href={enrollUrl}
          className="button button--primary plan-card__cta"
          aria-label={`Enroll in ${planName}`}
        >
          Enroll Now
        </a>
      </div>
    </div>
  );
}
