import { useAppStore } from '../../store/useAppStore';
import { 
  LayoutDashboard, Cpu, Settings, Lock, Unlock, 
  ChevronLeft, ChevronRight, LogOut, ListCollapse, Zap
} from 'lucide-react';

interface SidebarProps {
  activePage: 'dashboard' | 'devices' | 'settings' | 'rooms' | 'scenarios';
  onChangePage: (page: 'dashboard' | 'devices' | 'settings' | 'rooms' | 'scenarios') => void;
  onOpenSecurity: () => void;
}

export function Sidebar({ activePage, onChangePage, onOpenSecurity }: SidebarProps) {
  const isUnlocked = useAppStore((state) => state.isUnlocked);
  const setUnlocked = useAppStore((state) => state.setUnlocked);
  const addToast = useAppStore((state) => state.addToast);
  
  // Rooms sub-navigation
  const rooms = useAppStore((state) => state.rooms);
  const selectedRoomId = useAppStore((state) => state.selectedRoomId);
  const setSelectedRoomId = useAppStore((state) => state.setSelectedRoomId);
  
  // Auth state
  const user = useAppStore((state) => state.user);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const logout = useAppStore((state) => state.logout);

  // Sidebar collapse
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);
  const setSidebarCollapsed = useAppStore((state) => state.setSidebarCollapsed);

  const handleLockClick = () => {
    if (isUnlocked) {
      setUnlocked(false);
      addToast('Панель успешно заблокирована', 'info');
    } else {
      onOpenSecurity();
    }
  };

  const navItems = [
    { id: 'dashboard' as const, label: 'Панель', icon: LayoutDashboard },
    { id: 'rooms' as const, label: 'Комнаты', icon: ListCollapse },
    { id: 'devices' as const, label: 'Устройства', icon: Cpu },
    { id: 'scenarios' as const, label: 'Сценарии', icon: Zap },
    { id: 'settings' as const, label: 'Настройки', icon: Settings },
  ];

  return (
    <aside 
      className={`${sidebarCollapsed ? 'w-20 p-3' : 'w-64 p-4 md:p-6'} transition-all duration-300 fixed left-0 top-0 bottom-0 z-30 border-r flex flex-col justify-between bg-brand-panel backdrop-blur-xl border-brand-border`}
      style={{ borderRightWidth: 'var(--app-border)' }}
    >
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-brand-border relative">
          <div className="flex items-center gap-3 flex-shrink-0 select-none">
            <div 
              className="w-10 h-10 rounded-brand flex items-center justify-center font-black text-slate-950 text-lg shadow-lg shadow-brand-primary/20 flex-shrink-0"
              style={{ 
                backgroundColor: 'var(--app-primary)',
                borderRadius: 'calc(var(--app-radius) * 0.8)',
              }}
            >
              S
            </div>
            {!sidebarCollapsed && (
              <div className="animate-fade-in transition-all">
                <span className="font-bold tracking-wider text-brand-panel-text text-md block leading-none">SMASHCORE</span>
                <span className="text-[10px] text-brand-muted font-mono tracking-widest font-semibold uppercase">Smart Node v2</span>
              </div>
            )}
          </div>

          {/* Toggle button to shrink/enlarge */}
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`${sidebarCollapsed ? 'absolute -right-1 top-1/2 -translate-y-1/2 p-0.5 bg-brand-panel' : 'p-1 bg-brand-input'} rounded border border-brand-border text-brand-muted hover:text-brand-panel-text transition-all cursor-pointer hidden sm:block z-10`}
            title={sidebarCollapsed ? "Развернуть меню" : "Свернуть меню"}
          >
            {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <div key={item.id} className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => onChangePage(item.id)}
                  className={`w-full py-3 flex items-center ${
                    sidebarCollapsed ? 'justify-center hover:scale-110 px-0' : 'px-4 hover:translate-x-1.5 gap-3.5'
                  } rounded-brand font-medium text-sm text-left transition-all outline-none select-none cursor-pointer hover:text-brand-panel-text`}
                  style={{
                    borderRadius: 'var(--app-radius)',
                    backgroundColor: isActive ? 'var(--app-accent-muted)' : 'transparent',
                    color: isActive ? 'var(--app-primary)' : 'var(--app-text-muted)',
                    boxShadow: isActive ? 'inset 1px 0 0 var(--app-primary)' : 'none',
                  }}
                  disabled={!isAuthenticated && item.id !== 'dashboard'}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <div className={`flex items-center justify-center ${sidebarCollapsed ? 'w-full' : 'w-5 h-5'} flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {!sidebarCollapsed && (
                    <span className="animate-fade-in overflow-hidden whitespace-nowrap text-ellipsis">
                      {item.label}
                    </span>
                  )}
                </button>

                {/* Collapse rooms dynamic deep-links list removed */}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Profile & Security indicators */}
      <div className="flex flex-col gap-4 pt-4 border-t border-brand-border overflow-hidden">
        {/* Lock Switch button (only visible or iconified) */}
        {isAuthenticated && (
          <button
            type="button"
            onClick={handleLockClick}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center p-2.5' : 'justify-between py-2.5 px-4'} rounded-brand bg-brand-input border transition-all cursor-pointer select-none text-xs font-semibold`}
            style={{
              borderRadius: 'var(--app-radius)',
              borderColor: isUnlocked ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
              backgroundColor: isUnlocked ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
              color: isUnlocked ? '#10b981' : '#ef4444',
            }}
            title={sidebarCollapsed ? (isUnlocked ? "Панель открыта" : "Панель заблокирована") : undefined}
          >
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center w-full' : 'gap-2'}`}>
              {isUnlocked ? <Unlock className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-red-400" />}
              {!sidebarCollapsed && <span className="animate-fade-in overflow-hidden whitespace-nowrap text-ellipsis">{isUnlocked ? 'Панель открыта' : 'Панель заблокирована'}</span>}
            </div>
            {!sidebarCollapsed && (
              <span 
                className="text-[10px] px-1.5 py-0.5 rounded uppercase font-bold text-[9px] scale-90"
                style={{
                  backgroundColor: isUnlocked ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'
                }}
              >
                {isUnlocked ? 'OK' : 'Lock'}
              </span>
            )}
          </button>
        )}

        {/* Profile Card Capsule */}
        <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} gap-3 overflow-hidden`}>
          {isAuthenticated && user ? (
            <>
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="relative flex-shrink-0">
                  <div 
                    className="w-10 h-10 rounded-full bg-brand-input border overflow-hidden flex items-center justify-center font-bold text-brand-panel-text uppercase text-xs"
                    style={{ borderColor: 'var(--app-primary)' }}
                  >
                    {user.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border border-slate-950 rounded-full" />
                </div>
                {!sidebarCollapsed && (
                  <div className="overflow-hidden animate-fade-in text-left">
                    <h4 className="text-sm font-semibold text-brand-panel-text leading-none truncate">{user.name}</h4>
                    <span className="text-[10px] text-brand-muted font-medium truncate block mt-1">Администратор</span>
                  </div>
                )}
              </div>

              {!sidebarCollapsed && (
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    addToast('Вы вышли из учетной записи', 'info');
                  }}
                  className="p-1 px-1.5 rounded hover:bg-red-950/20 text-brand-muted hover:text-red-400 transition-colors cursor-pointer"
                  title="Выйти из аккаунта"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </>
          ) : (
            <div className="w-full">
              {!sidebarCollapsed ? (
                <div className="text-xs text-brand-muted text-center animate-fade-in font-medium">Авторизация не пройдена</div>
              ) : (
                <div className="w-4 h-4 rounded-full bg-red-500/10 border border-red-500/30 mx-auto" title="Вы вышли" />
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
