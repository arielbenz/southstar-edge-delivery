import './enrollment-flow.css';
import EnrollmentFlow from './components/EnrollmentFlow.jsx';
import { mockEnrollmentConfig } from './useEnrollmentConfig.js';

function withMockSearch(Story) {
  const url = new URL(window.location.href);
  url.search = '?mock=true';
  window.history.replaceState({}, '', url);
  return <Story />;
}

export default {
  title: 'Blocks/EnrollmentFlow',
  component: EnrollmentFlow,
  decorators: [withMockSearch],
};

export const Default = {
  args: {
    configPath: '/config/enrollment',
    configOverride: mockEnrollmentConfig,
  },
};

export const Step2 = {
  args: {
    configPath: '/config/enrollment',
    configOverride: mockEnrollmentConfig,
    initialStep: 1,
  },
};

export const Step3Review = {
  args: {
    configPath: '/config/enrollment',
    configOverride: mockEnrollmentConfig,
    initialStep: 2,
    initialFormData: {
      planId: 'fixed-12',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
    },
  },
};

export const Loading = {
  args: {
    configPath: '/config/enrollment',
    _forceState: { loading: true },
  },
};

export const Error = {
  args: {
    configPath: '/config/enrollment',
    _forceState: {
      error: new globalThis.Error('Unable to load enrollment configuration.'),
    },
  },
};

export const SinSoporte = {
  args: {
    configPath: '/config/enrollment',
    configOverride: {
      ...mockEnrollmentConfig,
      supportPhone: null,
      supportEmail: null,
    },
  },
};

export const SoloDosPasos = {
  args: {
    configPath: '/config/enrollment',
    configOverride: {
      ...mockEnrollmentConfig,
      step3Title: null,
      step3Description: null,
    },
  },
};

export const Confirmation = {
  args: {
    configPath: '/config/enrollment',
    configOverride: mockEnrollmentConfig,
    initialFormData: {
      planId: 'fixed-12',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
    },
    _forceState: { submitted: true },
  },
};
