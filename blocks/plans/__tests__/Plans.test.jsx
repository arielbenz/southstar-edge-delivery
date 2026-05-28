import { render, screen, fireEvent } from '@testing-library/react';
import Plans from '../components/Plans.jsx';
import { mockPlans } from '../usePlansData.js';

describe('Plans', () => {
  test('renderiza los planes correctamente', () => {
    render(<Plans plans={mockPlans} />);
    expect(screen.getByText('Fixed Rate 12-Month')).toBeInTheDocument();
    expect(screen.getByText('Fixed Rate 24-Month')).toBeInTheDocument();
    expect(screen.getByText('Variable Rate Monthly')).toBeInTheDocument();
  });

  test('el filtro Fixed Rate oculta los planes variable', () => {
    render(<Plans plans={mockPlans} />);
    const fixedBtn = screen.getByRole('button', { name: /Fixed Rate/i });
    fireEvent.click(fixedBtn);
    expect(screen.queryByText('Variable Rate Monthly')).not.toBeInTheDocument();
    expect(screen.getByText('Fixed Rate 12-Month')).toBeInTheDocument();
  });

  test('el plan featured tiene la clase y el badge "Most Popular"', () => {
    render(<Plans plans={mockPlans} />);
    expect(screen.getByText('Most Popular')).toBeInTheDocument();
    // El card del plan featured tiene la clase BEM correspondiente
    const badge = screen.getByText('Most Popular');
    expect(badge.closest('.plan-card')).toHaveClass('plan-card--featured');
  });

  test('muestra mensaje cuando no hay planes que coincidan con el filtro', () => {
    // Pasar un plan que no contiene 'fixed' ni 'variable' en el nombre
    // para que al activar el filtro "Fixed Rate" no haya resultados.
    // plans.length > 0 evita que el hook cargue los mockPlans.
    const specialPlan = [
      {
        id: 'special',
        planName: 'Budget Bundle',
        rate: '55',
        term: '12',
        featured: false,
        featuresHtml: '',
      },
    ];
    render(<Plans plans={specialPlan} />);
    const fixedBtn = screen.getByRole('button', { name: /Fixed Rate/i });
    fireEvent.click(fixedBtn);
    expect(screen.getByText(/No plans match/i)).toBeInTheDocument();
  });
});
