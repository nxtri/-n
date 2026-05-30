import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { formatCurrency, parseCurrency } from '../../utils/formatters';

const getDisplayValue = (value) => (
  value === '' || value === null || value === undefined ? '' : formatCurrency(value)
);

const getCurrencyValue = (inputValue) => {
  const digits = inputValue.replace(/\D/g, '');
  return digits === '' ? '' : parseCurrency(digits);
};

const getCaretPosition = (displayValue, digitsBeforeCaret) => {
  if (digitsBeforeCaret <= 0) return 0;

  let digitCount = 0;
  for (let index = 0; index < displayValue.length; index += 1) {
    if (/\d/.test(displayValue[index])) digitCount += 1;
    if (digitCount >= digitsBeforeCaret) return index + 1;
  }

  return displayValue.length;
};

const CurrencyInput = ({ value, onChange, placeholder, className, style, required, autoFocus, min }) => {
  const inputRef = useRef(null);
  const isComposingRef = useRef(false);
  const pendingCaretRef = useRef(null);
  const [displayValue, setDisplayValue] = useState(getDisplayValue(value));

  useEffect(() => {
    if (!isComposingRef.current) {
      setDisplayValue(getDisplayValue(value));
    }
  }, [value]);

  useLayoutEffect(() => {
    if (pendingCaretRef.current === null || document.activeElement !== inputRef.current) return;

    inputRef.current.setSelectionRange(pendingCaretRef.current, pendingCaretRef.current);
    pendingCaretRef.current = null;
  }, [displayValue]);

  const commitValue = (inputValue, caretPosition) => {
    const nextValue = getCurrencyValue(inputValue);
    const nextDisplayValue = getDisplayValue(nextValue);
    const digitsBeforeCaret = inputValue.slice(0, caretPosition ?? inputValue.length).replace(/\D/g, '').length;

    setDisplayValue(nextDisplayValue);
    pendingCaretRef.current = getCaretPosition(nextDisplayValue, digitsBeforeCaret);

    if (onChange) {
      onChange({
        target: {
          value: nextValue
        }
      });
    }
  };

  const handleChange = (e) => {
    if (isComposingRef.current || e.nativeEvent?.isComposing) {
      setDisplayValue(e.target.value);
      return;
    }

    commitValue(e.target.value, e.target.selectionStart);
  };

  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionEnd = (e) => {
    isComposingRef.current = false;
    commitValue(e.currentTarget.value, e.currentTarget.selectionStart);
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
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
