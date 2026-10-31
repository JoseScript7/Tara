import React, { useRef, useState, useEffect } from 'react';

export interface OTPInputProps {
  length?: number;
  value?: string;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  error?: string;
  autoFocus?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  value: controlledValue,
  onChange,
  onComplete,
  disabled = false,
  error,
  autoFocus = false,
}) => {
  const [digits, setDigits] = useState<string[]>(() => {
    if (controlledValue) {
      return controlledValue.slice(0, length).split('').concat(Array(Math.max(0, length - controlledValue.length)).fill(''));
    }
    return Array(length).fill('');
  });

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (controlledValue !== undefined) {
      const arr = controlledValue.slice(0, length).split('');
      while (arr.length < length) arr.push('');
      setDigits(arr);
    }
  }, [controlledValue, length]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const updateDigits = (newDigits: string[]) => {
    setDigits(newDigits);
    const combined = newDigits.join('');
    onChange?.(combined);
    if (combined.length === length && !newDigits.includes('')) {
      onComplete?.(combined);
    }
  };

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const char = val.slice(-1); // Take last entered character

    if (!/^\d*$/.test(char)) return; // Digits only

    const next = [...digits];
    next[index] = char;
    updateDigits(next);

    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Move back and clear previous
        const next = [...digits];
        next[index - 1] = '';
        updateDigits(next);
        inputRefs.current[index - 1]?.focus();
      } else {
        const next = [...digits];
        next[index] = '';
        updateDigits(next);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;

    const next = Array(length).fill('');
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    updateDigits(next);

    const focusIndex = Math.min(pasted.length, length - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <div
        role="group"
        aria-label="One-time password input"
        style={{
          display: 'flex',
          gap: 'var(--space-2)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {digits.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => {
              inputRefs.current[idx] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            disabled={disabled}
            onChange={(e) => handleChange(idx, e)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onPaste={idx === 0 ? handlePaste : undefined}
            aria-label={`Digit ${idx + 1} of ${length}`}
            style={{
              width: '46px',
              height: '52px',
              textAlign: 'center',
              fontSize: 'var(--text-xl)',
              fontWeight: 'var(--weight-bold)',
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-ink)',
              backgroundColor: disabled ? 'rgba(21, 22, 21, 0.04)' : '#FFFFFF',
              border: `2px solid ${
                error
                  ? 'var(--color-negative)'
                  : digit
                    ? 'var(--color-ink)'
                    : 'var(--color-panel-border)'
              }`,
              borderRadius: 'var(--radius-md)',
              outline: 'none',
              transition: 'border-color var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out)',
              boxSizing: 'border-box',
            }}
          />
        ))}
      </div>
      {error && (
        <span
          role="alert"
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-negative)',
            textAlign: 'center',
            fontWeight: 'var(--weight-medium)',
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
};
