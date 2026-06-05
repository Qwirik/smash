import { useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';

const toHexForPicker = (color: string): string => {
  if (!color) return '#000000';
  const trimmed = color.trim();
  if (trimmed.startsWith('#')) {
    return trimmed;
  }
  // Try to parse rgb or rgba
  const match = trimmed.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (match) {
    const r = parseInt(match[1], 10);
    const g = parseInt(match[2], 10);
    const b = parseInt(match[3], 10);
    return '#' + [r, g, b].map(x => {
      const hex = Math.min(255, Math.max(0, x)).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }
  return '#000000';
};

interface ColorPickerWithInputProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
}

export function ColorPickerWithInput({ color, onChange, label }: ColorPickerWithInputProps) {
  const [typedColor, setTypedColor] = useState(color);

  useEffect(() => {
    setTypedColor(color);
  }, [color]);

  const handleTextChange = (val: string) => {
    setTypedColor(val);
    onChange(val);
  };

  return (
    <div className="flex flex-col gap-3 p-3 bg-brand-input rounded-brand border border-brand-border" style={{ borderRadius: 'var(--app-radius)' }}>
      {label && (
        <span className="text-[10px] font-mono font-black text-brand-muted uppercase leading-none">
          {label}
        </span>
      )}
      <div className="flex items-center justify-center overflow-hidden rounded-brand w-full">
        <HexColorPicker
          color={toHexForPicker(color)}
          onChange={(newColor) => {
            setTypedColor(newColor);
            onChange(newColor);
          }}
        />
      </div>
      <div className="flex flex-col gap-1.5 mt-1 w-full text-left">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-mono font-black text-brand-muted uppercase leading-none animate-pulse" htmlFor="color-txt-input">
            Код цвета (HEX / RGBA / RGB)
          </label>
          <div 
            className="w-4.5 h-4.5 rounded-full border border-brand-border shadow-inner transition-transform duration-300 hover:scale-125 hover:shadow-lg"
            style={{ backgroundColor: color }}
          />
        </div>
        <input
          id="color-txt-input"
          type="text"
          className="w-full bg-brand-panel text-brand-panel-text border border-brand-border px-3 py-2.5 rounded text-xs font-mono outline-none focus:border-brand-primary placeholder-brand-muted/70 transition-all duration-300 focus:ring-2 focus:ring-brand-primary/20 active:scale-95"
          style={{ borderRadius: 'calc(var(--app-radius) * 0.5)' }}
          value={typedColor}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="например: #00f0ff или rgba(0, 240, 255, 1)"
        />
      </div>
    </div>
  );
}

export default ColorPickerWithInput;
