import React, { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

function isColorDark(hex: string): boolean {
  const color = hex.startsWith('#') ? hex.slice(1) : hex;
  if (color.length !== 6) return true;
  const r = parseInt(color.slice(0, 2), 16);
  const g = parseInt(color.slice(2, 4), 16);
  const b = parseInt(color.slice(4, 6), 16);
  const hsp = Math.sqrt(
    0.299 * (r * r) +
    0.587 * (g * g) +
    0.114 * (b * b)
  );
  return hsp < 155; // threshold for dark vs light color tone
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const themeMode = useAppStore((state) => state.themeMode);
  const bgColor = useAppStore((state) => state.bgColor);
  const primaryColor = useAppStore((state) => state.primaryColor);
  const textColor = useAppStore((state) => state.textColor);
  const borderColor = useAppStore((state) => state.borderColor);
  const borderWidth = useAppStore((state) => state.borderWidth);
  const borderRadius = useAppStore((state) => state.borderRadius);
  const transitionSpeed = useAppStore((state) => state.transitionSpeed);

  // Extended Custom Style colors
  const textMutedColor = useAppStore((state) => state.textMutedColor);
  const accentMutedColor = useAppStore((state) => state.accentMutedColor);
  const panelBgColor = useAppStore((state) => state.panelBgColor);
  const inputBgColor = useAppStore((state) => state.inputBgColor);
  const bgType = useAppStore((state) => state.bgType);
  const bgGradientStart = useAppStore((state) => state.bgGradientStart);
  const bgGradientEnd = useAppStore((state) => state.bgGradientEnd);

  // Scenario Builder Colors variables
  const logicAccent = useAppStore((state) => state.logicAccent);
  const actionAccent = useAppStore((state) => state.actionAccent);
  const actionBtnColor = useAppStore((state) => state.actionBtnColor);
  const codeHighlightColor = useAppStore((state) => state.codeHighlightColor);

  useEffect(() => {
    const root = document.documentElement;

    // Background type setup
    if (bgType === 'gradient') {
      root.style.setProperty('--app-bg', bgGradientStart);
      root.style.setProperty('--app-bg-full', `linear-gradient(135deg, ${bgGradientStart}, ${bgGradientEnd})`);
    } else {
      root.style.setProperty('--app-bg', bgColor);
      root.style.setProperty('--app-bg-full', bgColor);
    }

    root.style.setProperty('--app-primary', primaryColor);
    root.style.setProperty('--app-text', textColor);
    root.style.setProperty('--app-border-color', borderColor);
    root.style.setProperty('--app-radius', `${borderRadius}px`);
    root.style.setProperty('--app-border', `${borderWidth}px`);
    root.style.setProperty('--app-transition', `${transitionSpeed}ms`);

    // Scenario custom properties config variables
    root.style.setProperty('--scenario-logic-accent', logicAccent);
    root.style.setProperty('--scenario-action-accent', actionAccent);
    root.style.setProperty('--scenario-action-btn-color', actionBtnColor);
    root.style.setProperty('--scenario-code-highlight-color', codeHighlightColor);

    if (themeMode === 'custom') {
      root.style.setProperty('--app-panel-bg', panelBgColor);
      root.style.setProperty('--app-panel-text', textColor);
      root.style.setProperty('--app-text-muted', textMutedColor);
      root.style.setProperty('--app-input-bg', inputBgColor);
      root.style.setProperty('--app-card-border', borderColor);
      root.style.setProperty('--app-accent-muted', accentMutedColor);
      
      const isDark = isColorDark(panelBgColor);
      if (isDark) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    } else {
      const isDark = isColorDark(bgColor);
      if (isDark) {
        // Modern High-Contrast Premium Dark Variables
        root.style.setProperty('--app-panel-bg', 'rgba(15, 23, 42, 0.65)');
        root.style.setProperty('--app-panel-text', '#ffffff');
        root.style.setProperty('--app-text-muted', 'rgba(148, 163, 184, 0.95)'); // visible slate-400
        root.style.setProperty('--app-input-bg', 'rgba(10, 15, 22, 0.85)');
        root.style.setProperty('--app-card-border', borderColor || 'rgba(255, 255, 255, 0.08)');
        root.style.setProperty('--app-accent-muted', 'rgba(255, 255, 255, 0.05)');
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        // Sleek Minimalist Premium Light Variables
        root.style.setProperty('--app-panel-bg', 'rgba(255, 255, 255, 0.92)');
        root.style.setProperty('--app-panel-text', '#0f172a'); // slate-900
        root.style.setProperty('--app-text-muted', 'rgba(71, 85, 105, 0.95)'); // visible slate-600
        root.style.setProperty('--app-input-bg', '#ffffff');
        root.style.setProperty('--app-card-border', borderColor || 'rgba(15, 23, 42, 0.09)');
        root.style.setProperty('--app-accent-muted', 'rgba(15, 23, 42, 0.04)');
        root.classList.add('light');
        root.classList.remove('dark');
      }
    }
  }, [
    themeMode, bgColor, primaryColor, textColor, borderColor, borderWidth, borderRadius, transitionSpeed,
    textMutedColor, accentMutedColor, panelBgColor, inputBgColor, bgType, bgGradientStart, bgGradientEnd,
    logicAccent, actionAccent, actionBtnColor, codeHighlightColor
  ]);

  return <>{children}</>;
}

export default ThemeProvider;
