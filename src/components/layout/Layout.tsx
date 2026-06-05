import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SecurityModal } from '../modals/SecurityModal';
import { useAppStore } from '../../store/useAppStore';
import { ToastContainer } from '../ui/Toast';
import { LogIn, KeyRound, Mail, Sparkles } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activePage: 'dashboard' | 'devices' | 'settings' | 'rooms' | 'scenarios';
  onChangePage: (page: 'dashboard' | 'devices' | 'settings' | 'rooms' | 'scenarios') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function Layout({ 
  children, 
  activePage, 
  onChangePage, 
  searchQuery, 
  onSearchChange 
}: LayoutProps) {
  const isUnlocked = useAppStore((state) => state.isUnlocked);
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);
  const setSidebarCollapsed = useAppStore((state) => state.setSidebarCollapsed);
  const bgType = useAppStore((state) => state.bgType);
  
  // Auth state from store
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const login = useAppStore((state) => state.login);
  const addToast = useAppStore((state) => state.addToast);

  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [pendingPage, setPendingPage] = useState<'dashboard' | 'devices' | 'settings' | 'rooms' | 'scenarios' | null>(null);

  // Form states for custom Auth UI
  const [authEmail, setAuthEmail] = useState('');
  const [authName, setAuthName] = useState('');

  // Auto-collapse sidebar when on the "devices" sensor page to maximize screen space!
  useEffect(() => {
    if (activePage === 'devices') {
      setSidebarCollapsed(true);
    } else {
      setSidebarCollapsed(false);
    }
  }, [activePage, setSidebarCollapsed]);

  const handlePageChange = (newPage: 'dashboard' | 'devices' | 'settings' | 'rooms' | 'scenarios') => {
    // If the target requires PIN-unlock and user hasn't unlocked yet, intercept.
    if ((newPage === 'settings' || newPage === 'rooms' || newPage === 'devices' || newPage === 'scenarios') && !isUnlocked && isAuthenticated) {
      setPendingPage(newPage);
      setIsSecurityOpen(true);
    } else {
      onChangePage(newPage);
    }
  };

  const handleSecuritySuccess = () => {
    setIsSecurityOpen(false);
    if (pendingPage) {
      onChangePage(pendingPage);
      setPendingPage(null);
    }
  };

  const handleSecurityClose = () => {
    setIsSecurityOpen(false);
    setPendingPage(null);
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim() || !authName.trim()) {
      addToast('Пожалуйста, введите имя и электронную почту', 'error');
      return;
    }
    login(authEmail, authName);
    addToast(`Добро пожаловать, ${authName}!`, 'success');
  };

  return (
    <div className="min-h-screen relative flex">
      {/* Dynamic Animated background ambient blob to match premium vibes */}
      {bgType === 'animated' && (
        <>
          <div 
            className="fixed -top-40 -right-40 w-96 h-96 rounded-full blur-[150px] opacity-15 pointer-events-none transition-all duration-1000 z-0 animate-pulse"
            style={{ backgroundColor: 'var(--app-primary)' }}
          />
          <div 
            className="fixed bottom-10 left-10 w-80 h-80 rounded-full blur-[120px] opacity-10 pointer-events-none transition-all duration-1000 z-0"
            style={{ backgroundColor: 'var(--app-primary)' }}
          />
        </>
      )}

      {/* Persistent Sidebar */}
      <Sidebar 
        activePage={activePage} 
        onChangePage={handlePageChange} 
        onOpenSecurity={() => {
          setPendingPage(null);
          setIsSecurityOpen(true);
        }}
      />

      <div className={`flex-1 ${sidebarCollapsed ? 'pl-20' : 'pl-64'} transition-all duration-300 flex flex-col min-h-screen z-10`}>
        {/* Persistent Header */}
        <Header 
          searchQuery={searchQuery} 
          onSearchChange={onSearchChange} 
          onOpenSecurity={() => {
            setPendingPage(null);
            setIsSecurityOpen(true);
          }}
        />

        {/* Primary Page Canvas standard wrapper */}
        <main className="flex-grow p-6 md:p-8 relative w-full">
          {isAuthenticated ? (
            children
          ) : (
            /* Immersive Custom Auth Panel */
            <div className="flex items-center justify-center min-h-[75vh] animate-fade-in select-none">
              <div 
                className="glass-panel max-w-md w-full p-8 rounded-brand border-white/10 flex flex-col gap-6 text-white text-center shadow-2xl relative"
                style={{ borderRadius: 'var(--app-radius)' }}
              >
                <div 
                  className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center mx-auto"
                  style={{ backgroundColor: 'rgba(var(--app-primary), 0.1)' }}
                >
                  <LogIn className="w-8 h-8 text-brand-primary" style={{ color: 'var(--app-primary)' }} />
                </div>

                <div>
                  <h2 className="text-2xl font-black tracking-tight flex items-center justify-center gap-1.5">
                    Авторизация SmashCore
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                  </h2>
                  <p className="text-xs text-slate-400 mt-2">
                    Пожалуйста, войдите под своей учетной записью для разблокировки управления умным домом.
                  </p>
                </div>

                <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4 text-left">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="auth-name" className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5" />
                      Ваше Имя
                    </label>
                    <input
                      id="auth-name"
                      type="text"
                      required
                      placeholder="Иван Андреевич"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-brand-primary rounded-brand py-2.5 px-4 text-xs text-white outline-none"
                      style={{ borderRadius: 'var(--app-radius)' }}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="auth-email" className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      Электронная почта
                    </label>
                    <input
                      id="auth-email"
                      type="email"
                      required
                      placeholder="g.ivan.andreevich@gmail.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-brand-primary rounded-brand py-2.5 px-4 text-xs text-white outline-none"
                      style={{ borderRadius: 'var(--app-radius)' }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-brand-primary text-slate-950 font-black text-xs uppercase tracking-wider rounded-brand transition-all hover:brightness-110 cursor-pointer select-none"
                    style={{ 
                      borderRadius: 'var(--app-radius)',
                      backgroundColor: 'var(--app-primary)'
                    }}
                  >
                    Авторизоваться
                  </button>
                </form>

                <p className="text-[10px] text-slate-500 italic">
                  Безопасное автономное шифрование SmashCore ActiveNode v2.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* High-priority overlay intercept security modal */}
      <SecurityModal 
        isOpen={isSecurityOpen}
        onClose={handleSecurityClose}
        onSuccess={handleSecuritySuccess}
      />

      {/* Toast notifications portal */}
      <ToastContainer />
    </div>
  );
}

export default Layout;
