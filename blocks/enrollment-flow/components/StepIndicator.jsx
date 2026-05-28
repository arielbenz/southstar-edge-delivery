export default function StepIndicator({ steps, currentStep }) {
  return (
    <div className="enrollment-flow__steps" role="list">
      {steps.map((step, i) => (
        <div
          key={step.number}
          className={[
            'enrollment-flow__step',
            i < currentStep ? 'enrollment-flow__step--completed' : '',
            i === currentStep ? 'enrollment-flow__step--active' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          role="listitem"
          aria-current={i === currentStep ? 'step' : undefined}
        >
          <div className="enrollment-flow__step-circle">
            {i < currentStep ? '✓' : step.number}
          </div>
          <span className="enrollment-flow__step-label">{step.title}</span>
        </div>
      ))}
    </div>
  );
}
