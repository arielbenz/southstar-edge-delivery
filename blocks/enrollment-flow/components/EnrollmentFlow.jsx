import { useEffect, useState } from 'react';
import EnrollmentConfirmation from './EnrollmentConfirmation.jsx';
import EnrollmentError from './EnrollmentError.jsx';
import EnrollmentSkeleton from './EnrollmentSkeleton.jsx';
import StepContent from './StepContent.jsx';
import StepIndicator from './StepIndicator.jsx';
import { useEnrollmentConfig } from '../useEnrollmentConfig.js';

export function buildSteps(config) {
  return [1, 2, 3]
    .map((n) => ({
      number: n,
      title: config[`step${n}Title`],
      description: config[`step${n}Description`],
    }))
    .filter((step) => step.title);
}

export default function EnrollmentFlow({
  configPath,
  configOverride,
  initialStep = 0,
  initialFormData = {},
  _forceState,
}) {
  const {
    config: loadedConfig,
    loading: hookLoading,
    error: hookError,
  } = useEnrollmentConfig(configPath);
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [formData, setFormData] = useState(initialFormData);
  const [submitted, setSubmitted] = useState(false);

  const config = configOverride ?? loadedConfig;
  const loading = _forceState?.loading ?? (!configOverride && hookLoading);
  const error = _forceState?.error ?? (!configOverride ? hookError : null);
  const isSubmitted = _forceState?.submitted ?? submitted;
  const steps = config ? buildSteps(config) : [];

  useEffect(() => {
    if (!steps.length) return;
    setCurrentStep((prev) => Math.min(prev, steps.length - 1));
  }, [steps.length]);

  const handleChange = (partial) => {
    setFormData((prev) => ({ ...prev, ...partial }));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleNext = () => {
    if (currentStep === steps.length - 1) {
      setSubmitted(true);
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  if (loading) {
    return <EnrollmentSkeleton />;
  }

  if (error) {
    return <EnrollmentError message={error.message} />;
  }

  if (!config) {
    return null;
  }

  if (isSubmitted) {
    return <EnrollmentConfirmation formData={formData} config={config} />;
  }

  return (
    <div className="enrollment-flow">
      <header className="enrollment-flow__header">
        <h1 className="enrollment-flow__title">{config.title}</h1>
        {config.subtitle && (
          <p className="enrollment-flow__subtitle">{config.subtitle}</p>
        )}
      </header>

      <StepIndicator steps={steps} currentStep={currentStep} />

      <div className="enrollment-flow__body">
        <StepContent
          step={steps[currentStep]}
          config={config}
          formData={formData}
          onChange={handleChange}
        />
      </div>

      <nav className="enrollment-flow__nav">
        {currentStep > 0 && (
          <button
            className="enrollment-flow__btn enrollment-flow__btn--back"
            onClick={handleBack}
          >
            Back
          </button>
        )}
        <button
          className="enrollment-flow__btn enrollment-flow__btn--next"
          onClick={handleNext}
        >
          {currentStep === steps.length - 1 ? 'Submit' : 'Continue'}
        </button>
      </nav>

      {config.supportPhone && (
        <footer className="enrollment-flow__support">
          <p>
            Need help? Call{' '}
            <a href={`tel:${config.supportPhone}`}>{config.supportPhone}</a>
            {config.supportEmail && (
              <>
                {' '}
                or email{' '}
                <a href={`mailto:${config.supportEmail}`}>
                  {config.supportEmail}
                </a>
              </>
            )}
          </p>
        </footer>
      )}
    </div>
  );
}
