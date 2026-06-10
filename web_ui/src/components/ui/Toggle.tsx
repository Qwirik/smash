interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, disabled = false }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        // Stop bubbling so clicking the toggle doesn't trigger card modal events
        e.stopPropagation();
        if (!disabled) {
          onChange(!checked);
        }
      }}
      disabled={disabled}
      className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full transition-colors ease-in-out duration-200 outline-none select-none items-center p-0.5 ${
        disabled ? 'opacity-40 cursor-not-allowed' : ''
      }`}
      style={{
        backgroundColor: checked ? 'var(--app-primary)' : 'var(--app-accent-muted, rgba(255, 255, 255, 0.15))',
        boxShadow: checked ? '0 0 10px rgba(var(--app-primary), 0.3)' : 'none'
      }}
      aria-label="Переключатель состояния"
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-slate-900 transition-transform ease-in-out duration-200 shadow-md ${
          checked ? 'translate-x-[24px] bg-white' : 'translate-x-0 bg-slate-300'
        }`}
      />
    </button>
  );
}

export default Toggle;
