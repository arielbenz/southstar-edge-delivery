import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import EnrollmentFlow from '../components/EnrollmentFlow.jsx';

const hooks = vi.hoisted(() => ({
  useEnrollmentConfig: vi.fn(),
}));

vi.mock('../useEnrollmentConfig.js', () => ({
  useEnrollmentConfig: hooks.useEnrollmentConfig,
}));

const baseConfig = {
  title: 'Enroll Now',
  subtitle: 'Fast and simple enrollment',
  supportPhone: '1-800-555-0100',
  supportEmail: 'support@ohiong.com',
  step1Title: 'Choose Your Plan',
  step1Description: 'Pick the plan that fits your home.',
  step2Title: 'Your Information',
  step2Description: 'Tell us a bit about yourself.',
  step3Title: 'Review & Confirm',
  step3Description: 'Check your details before submitting.',
  termsUrl: '/docs/terms.pdf',
  privacyUrl: '/docs/privacy.pdf',
  successUrl: '/enrollment/confirmation',
};

describe('EnrollmentFlow', () => {
  beforeEach(() => {
    hooks.useEnrollmentConfig.mockReset();
    hooks.useEnrollmentConfig.mockReturnValue({
      config: baseConfig,
      loading: false,
      error: null,
    });
  });

  test('renderiza el titulo del enrollment', () => {
    render(<EnrollmentFlow configPath="/config/enrollment" />);
    expect(screen.getByText('Enroll Now')).toBeInTheDocument();
  });

  test('renderiza el subtitulo cuando esta presente', () => {
    render(<EnrollmentFlow configPath="/config/enrollment" />);
    expect(screen.getByText('Fast and simple enrollment')).toBeInTheDocument();
  });

  test('no renderiza el subtitulo cuando no esta', () => {
    hooks.useEnrollmentConfig.mockReturnValue({
      config: { ...baseConfig, subtitle: null },
      loading: false,
      error: null,
    });
    const { container } = render(
      <EnrollmentFlow configPath="/config/enrollment" />,
    );
    expect(container.querySelector('.enrollment-flow__subtitle')).toBeNull();
  });

  test('renderiza el StepIndicator con los pasos correctos', () => {
    render(<EnrollmentFlow configPath="/config/enrollment" />);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  test('el primer paso esta activo por defecto', () => {
    render(<EnrollmentFlow configPath="/config/enrollment" />);
    expect(screen.getAllByRole('listitem')[0]).toHaveAttribute(
      'aria-current',
      'step',
    );
  });

  test('renderiza el contenido del step 1', () => {
    render(<EnrollmentFlow configPath="/config/enrollment" />);
    expect(
      screen.getByRole('heading', { level: 2, name: 'Choose Your Plan' }),
    ).toBeInTheDocument();
  });

  test('el boton Back no aparece en el primer paso', () => {
    render(<EnrollmentFlow configPath="/config/enrollment" />);
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
  });

  test('el boton dice Continue en pasos intermedios', () => {
    render(<EnrollmentFlow configPath="/config/enrollment" />);
    expect(
      screen.getByRole('button', { name: 'Continue' }),
    ).toBeInTheDocument();
  });

  test('el boton dice Submit en el ultimo paso', () => {
    render(<EnrollmentFlow configPath="/config/enrollment" />);
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  test('click en Continue avanza al siguiente paso', () => {
    render(<EnrollmentFlow configPath="/config/enrollment" />);
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getAllByRole('listitem')[1]).toHaveAttribute(
      'aria-current',
      'step',
    );
  });

  test('click en Back retrocede al paso anterior', () => {
    render(<EnrollmentFlow configPath="/config/enrollment" />);
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getAllByRole('listitem')[0]).toHaveAttribute(
      'aria-current',
      'step',
    );
  });

  test('renderiza el footer de soporte cuando hay telefono', () => {
    render(<EnrollmentFlow configPath="/config/enrollment" />);
    expect(
      screen.getByRole('link', { name: '1-800-555-0100' }),
    ).toHaveAttribute('href', 'tel:1-800-555-0100');
  });

  test('no renderiza el footer de soporte cuando no hay datos', () => {
    hooks.useEnrollmentConfig.mockReturnValue({
      config: { ...baseConfig, supportPhone: null, supportEmail: null },
      loading: false,
      error: null,
    });
    const { container } = render(
      <EnrollmentFlow configPath="/config/enrollment" />,
    );
    expect(container.querySelector('.enrollment-flow__support')).toBeNull();
  });

  test('renderiza EnrollmentSkeleton cuando loading es true', () => {
    hooks.useEnrollmentConfig.mockReturnValue({
      config: null,
      loading: true,
      error: null,
    });
    render(<EnrollmentFlow configPath="/config/enrollment" />);
    expect(screen.getByRole('generic', { busy: true })).toBeInTheDocument();
  });

  test('renderiza EnrollmentError cuando hay error', () => {
    hooks.useEnrollmentConfig.mockReturnValue({
      config: null,
      loading: false,
      error: new Error('API Error'),
    });
    render(<EnrollmentFlow configPath="/config/enrollment" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('API Error')).toBeInTheDocument();
  });

  test('muestra la pantalla de confirmacion al hacer Submit', () => {
    render(<EnrollmentFlow configPath="/config/enrollment" />);
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(
      screen.getByRole('region', { name: 'Enrollment confirmed' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: /enrolled/i }),
    ).toBeInTheDocument();
  });

  test('la confirmacion muestra el email capturado', () => {
    render(
      <EnrollmentFlow
        configPath="/config/enrollment"
        initialFormData={{ email: 'jane@example.com' }}
        _forceState={{ submitted: true }}
      />,
    );
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });
});
