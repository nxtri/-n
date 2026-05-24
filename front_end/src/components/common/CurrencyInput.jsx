import React from 'react';
import { formatCurrency, parseCurrency } from '../../utils/formatters';

const CurrencyInput = ({ value, onChange, placeholder, className, style, required, autoFocus, min }) => {
  const handleChange = (e) => {
    // Only allow digits and dots
    const rawValue = e.target.value.replace(/[^\d.]/g, '');
    
    // Parse back to number
    const numberValue = parseCurrency(rawValue);

    // Call original onChange with mocked event to maintain compatibility
    if (onChange) {
      onChange({
        target: {
          value: numberValue === 0 && e.target.value === '' ? '' : numberValue
        }
      });
    }
  };

  const displayValue = value === '' || value === null || value === undefined ? '' : formatCurrency(value);

  return (
    <input
      type="text"
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      style={style}
      required={required}
      autoFocus={autoFocus}
      min={min}
    />
  );
};

export default CurrencyInput;
