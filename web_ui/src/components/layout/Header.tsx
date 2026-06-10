import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Search, Lock, Unlock, Clock, Server, Eye, ShieldCheck, Key } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenSecurity: () => void;
}

export function Header({ searchQuery, onSearchChange, onOpenSecurity }: HeaderProps) {
  const isUnlocked = useAppStore((state) => state.isUnlocked);
  const setUnlocked = useAppStore((state) => state.setUnlocked);
  const serverUrl = useAppStore((state) => state.serverUrl);
  const addToast = useAppStore((state) => state.addToast);
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);

  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('ru-RU', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSecurityClick = () => {
    if (isUnlocked) {
      setUnlocked(false);
      addToast('Панель успешно заблокирована', 'info');
    } else {
      onOpenSecurity();
    }
  };

  return (
    <header 
      className="h-16 border-b flex justify-between items-center px-8 sticky top-0 transition-all duration-300 z-50 bg-brand-panel border-brand-border shadow-md backdrop-blur-md w-full"
      style={{ 
        borderBottomWidth: 'var(--app-border)'
      }}
    >
      {/* Search Input bar */}
      <div className="flex items-center gap-2.5 max-w-sm w-full relative">
        <Search className="w-4 h-4 text-brand-muted absolute left-3 pointer-events-none" />
        <input
          type="text"
          placeholder="Поиск устройств или комнат..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-brand-input border border-brand-border rounded-brand py-1.5 pl-10 pr-4 text-xs font-medium text-brand-panel-text focus:outline-none placeholder-brand-muted/70 transition-all focus:border-brand-primary"
          style={{ 
            borderRadius: 'var(--app-radius)',
            borderColor: searchQuery ? 'var(--app-primary)' : 'var(--app-card-border)',
          }}
        />
      </div>

      {/* Information status center */}
      <div className="flex items-center gap-6">
        {/* Core Address label */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-brand-accent-muted border border-brand-border rounded text-[10px] font-semibold text-brand-muted font-mono">
          <Server className="w-3.5 h-3.5 text-brand-primary" style={{ color: 'var(--app-primary)' }} />
          <span className="truncate max-w-[120px]">{serverUrl}</span>
        </div>

        {/* Live dynamic localized Clock */}
        <div className="flex items-center gap-2 text-sm font-semibold font-mono tracking-wider text-brand-panel-text">
          <Clock className="w-4 h-4 text-brand-primary" style={{ color: 'var(--app-primary)' }} />
          <span>{time || '00:00:00'}</span>
        </div>

        {/* Top bar quick Lock and unlock mechanism */}
        <button
          type="button"
          onClick={handleSecurityClick}
          className="flex items-center gap-2 py-1.5 px-3 bg-brand-input border text-xs font-semibold rounded-brand transition-all cursor-pointer select-none"
          style={{
            borderRadius: 'var(--app-radius)',
            borderColor: isUnlocked ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)',
            backgroundColor: isUnlocked ? 'rgba(16, 185, 129, 0.04)' : 'rgba(239, 68, 68, 0.04)',
            color: isUnlocked ? '#10b981' : '#ef4444',
          }}
          aria-label={isUnlocked ? 'Заблокировать систему' : 'Разблокировать систему'}
        >
          {isUnlocked ? (
            <>
              <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">Безопасность ОК</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 text-red-500" />
              <span className="hidden sm:inline">Ввести PIN</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}

export default Header;
