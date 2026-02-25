import { render, screen } from '@testing-library/react';

import { createTheme } from '@grafana/data';

import { ParameterCell } from './ParameterCell';

const theme = createTheme();

describe('ParameterCell', () => {
  it('should render a single parameter with one subtype', () => {
    const value = [
      {
        parameterId: '1-1',
        parameterName: 'Water Quality',
        subtypes: [{ subtypeId: '1-1-sub-0', subtypeName: 'Temp' }],
      },
    ];

    render(<ParameterCell value={value} field={{} as any} rowIdx={0} theme={theme} />);
    expect(screen.getByText('Water Quality (Temp)')).toBeInTheDocument();
  });

  it('should render a single parameter with multiple subtypes', () => {
    const value = [
      {
        parameterId: '2-1',
        parameterName: 'Air Quality',
        subtypes: [
          { subtypeId: '2-1-sub-0', subtypeName: 'CO2' },
          { subtypeId: '2-1-sub-1', subtypeName: 'O2' },
        ],
      },
    ];

    render(<ParameterCell value={value} field={{} as any} rowIdx={0} theme={theme} />);
    expect(screen.getByText('Air Quality (CO2, O2)')).toBeInTheDocument();
  });

  it('should render multiple parameters', () => {
    const value = [
      {
        parameterId: '1-1',
        parameterName: 'Water Quality',
        subtypes: [{ subtypeId: '1-1-sub-0', subtypeName: 'Temp' }],
      },
      {
        parameterId: '2-1',
        parameterName: 'Air Quality',
        subtypes: [{ subtypeId: '2-1-sub-0', subtypeName: 'CO2' }],
      },
    ];

    render(<ParameterCell value={value} field={{} as any} rowIdx={0} theme={theme} />);
    expect(screen.getByText('Water Quality (Temp); Air Quality (CO2)')).toBeInTheDocument();
  });

  it('should render parameter without subtypes', () => {
    const value = [
      {
        parameterId: '3-1',
        parameterName: 'Pressure',
        subtypes: [],
      },
    ];

    render(<ParameterCell value={value} field={{} as any} rowIdx={0} theme={theme} />);
    expect(screen.getByText('Pressure')).toBeInTheDocument();
  });

  it('should parse JSON string', () => {
    const value =
      '[{"parameterId":"1-1","parameterName":"Water Quality","subtypes":[{"subtypeId":"1-1-sub-0","subtypeName":"Temp"}]}]';

    render(<ParameterCell value={value} field={{} as any} rowIdx={0} theme={theme} />);
    expect(screen.getByText('Water Quality (Temp)')).toBeInTheDocument();
  });

  it('should handle empty array', () => {
    const value: any[] = [];

    render(<ParameterCell value={value} field={{} as any} rowIdx={0} theme={theme} />);
    expect(screen.getByText('')).toBeInTheDocument();
  });

  it('should fallback to string for invalid structure', () => {
    const value = 'not a valid parameter structure';

    render(<ParameterCell value={value} field={{} as any} rowIdx={0} theme={theme} />);
    expect(screen.getByText('not a valid parameter structure')).toBeInTheDocument();
  });

  it('should handle null value', () => {
    const value = null;

    render(<ParameterCell value={value} field={{} as any} rowIdx={0} theme={theme} />);
    expect(screen.getByText('')).toBeInTheDocument();
  });

  it('should handle parameter with no parameterName', () => {
    const value = [
      {
        parameterId: '4-1',
        subtypes: [{ subtypeId: '4-1-sub-0', subtypeName: 'SubOnly' }],
      },
    ];

    render(<ParameterCell value={value} field={{} as any} rowIdx={0} theme={theme} />);
    expect(screen.getByText('(SubOnly)')).toBeInTheDocument();
  });

  it('should handle subtypes with no subtypeName', () => {
    const value = [
      {
        parameterId: '5-1',
        parameterName: 'Test Parameter',
        subtypes: [{ subtypeId: '5-1-sub-0' }],
      },
    ];

    render(<ParameterCell value={value} field={{} as any} rowIdx={0} theme={theme} />);
    expect(screen.getByText('Test Parameter')).toBeInTheDocument();
  });

  it('should handle mixed valid and empty subtypes', () => {
    const value = [
      {
        parameterId: '6-1',
        parameterName: 'Mixed Parameter',
        subtypes: [{ subtypeId: '6-1-sub-0', subtypeName: 'Valid' }, { subtypeId: '6-1-sub-1' }],
      },
    ];

    render(<ParameterCell value={value} field={{} as any} rowIdx={0} theme={theme} />);
    expect(screen.getByText('Mixed Parameter (Valid)')).toBeInTheDocument();
  });
});



















































