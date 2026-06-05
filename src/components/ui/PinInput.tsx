import React, { useRef, useState, useEffect } from 'react';

interface PinInputProps {
  length?: number;
  onChange: (pin: string) => void;
  onComplete: (pin: string) => void;
}

export function PinInput({ length = 4, onChange, onComplete }: PinInputProps) {
  const [pin, setPin] = useState<string[]>(Array(length).fill(''));
  const inputsRef = useRef<HTMLInputElement[]>([]);

  useEffect(() => {
    // Auto focus the initial pin field on mounting
    inputsRef.current[0]?.focus();
  }, []);

  const handleChange = (value: string, index: number) => {
    // Only accept numeric entries
    const sanitized = value.replace(/[^0-9]/g, '');
    if (!sanitized) return;

    const newPin = [...pin];
    newPin[index] = sanitized.substring(sanitized.length - 1);
    setPin(newPin);

    const pinStr = newPin.join('');
    onChange(pinStr);

    if (pinStr.length === length) {
      onComplete(pinStr);
    } else if (index < length - 1) {
      // Step focus forward
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      const newPin = [...pin];
      if (pin[index] !== '') {
        newPin[index] = '';
        setPin(newPin);
        onChange(newPin.join(''));
      } else if (index > 0) {
        // Clear previous cell and focus backward
        newPin[index - 1] = '';
        setPin(newPin);
        onChange(newPin.join(''));
        inputsRef.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, length);
    if (!pasted) return;

    const newPin = pasted.split('').concat(Array(length - pasted.length).fill('')).slice(0, length);
    setPin(newPin);
    onChange(pasted);

    if (pasted.length === length) {
      onComplete(pasted);
    } else {
      inputsRef.current[Math.min(pasted.length, length - 1)]?.focus();
    }
  };

  return (
    <div className="flex justify-center gap-4">
      {Array(length)
        .fill(0)
        .map((_, i) => (
          <input
            key={i}
            ref={(el) => {
              if (el) inputsRef.current[i] = el;
            }}
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={pin[i]}
            onChange={(e) => handleChange(e.target.value, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            onPaste={handlePaste}
            className="w-14 h-14 bg-slate-950 text-white border-2 text-center text-2xl font-bold rounded-brand focus:outline-none transition-all"
            style={{
              borderColor: pin[i] ? 'var(--app-primary)' : 'rgba(255, 255, 255, 0.15)',
              boxShadow: pin[i] ? '0 0 10px rgba(var(--app-primary), 0.25)' : 'none',
              borderWidth: 'var(--app-border)',
            }}
            aria-label={`ПИН-код цифра ${i + 1}`}
          />
        ))}
    </div>
  );
}

export default PinInput;
