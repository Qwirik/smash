import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Card } from '../components/ui/Card';
import { SecurityModal } from '../components/modals/SecurityModal';
import { ColorPickerWithInput } from '../components/ColorPickerWithInput';
import { EspConnector } from '../components/EspConnector';
import { 
  Network, ShieldCheck, Palette, Key, 
  RotateCcw, Save, Cpu, Lock, Sliders, Sun, Moon, Sparkles
} from 'lucide-react';

export function Settings() {
  const isUnlocked = useAppStore((state) => state.isUnlocked);
  const addToast = useAppStore((state) => state.addToast);
  const [activeTab, setActiveTab] = useState<'ui' | 'esp'>('ui');

  // Store actions and parameters
  const serverUrl = useAppStore((state) => state.serverUrl);
  const apiKey = useAppStore((state) => state.apiKey);
  const setNetwork = useAppStore((state) => state.setNetwork);

  const setPinCode = useAppStore((state) => state.setPinCode);
  const setUnlocked = useAppStore((state) => state.setUnlocked);

  // Theme states
  const themeMode = useAppStore((state) => state.themeMode) || 'dark';
  const setThemeMode = useAppStore((state) => state.setThemeMode);
  
  const bgColor = useAppStore((state) => state.bgColor);
  const primaryColor = useAppStore((state) => state.primaryColor);
  const textColor = useAppStore((state) => state.textColor);
  const borderColor = useAppStore((state) => state.borderColor);
  const setThemeColors = useAppStore((state) => state.setThemeColors);

  // Advanced custom style colors
  const textMutedColor = useAppStore((state) => state.textMutedColor);
  const accentMutedColor = useAppStore((state) => state.accentMutedColor);
  const panelBgColor = useAppStore((state) => state.panelBgColor);
  const inputBgColor = useAppStore((state) => state.inputBgColor);
  const bgType = useAppStore((state) => state.bgType);
  const bgGradientStart = useAppStore((state) => state.bgGradientStart);
  const bgGradientEnd = useAppStore((state) => state.bgGradientEnd);
  const setThemeColorsAdvanced = useAppStore((state) => state.setThemeColorsAdvanced);

  const borderWidth = useAppStore((state) => state.borderWidth);
  const borderRadius = useAppStore((state) => state.borderRadius);
  const transitionSpeed = useAppStore((state) => state.transitionSpeed);
  const setGeometry = useAppStore((state) => state.setGeometry);

  const pollingInterval = useAppStore((state) => state.pollingInterval);
  const setPollingInterval = useAppStore((state) => state.setPollingInterval);

  // Scenario Builder Accent Colors
  const logicAccent = useAppStore((state) => state.logicAccent);
  const actionAccent = useAppStore((state) => state.actionAccent);
  const actionBtnColor = useAppStore((state) => state.actionBtnColor);
  const codeHighlightColor = useAppStore((state) => state.codeHighlightColor);
  const setLogicAccent = useAppStore((state) => state.setLogicAccent);
  const setActionAccent = useAppStore((state) => state.setActionAccent);
  const setActionBtnColor = useAppStore((state) => state.setActionBtnColor);
  const setCodeHighlightColor = useAppStore((state) => state.setCodeHighlightColor);

  // Local Page controllers
  const [localUrl, setLocalUrl] = useState(serverUrl);
  const [localKey, setLocalKey] = useState(apiKey);
  const [activeColorSelector, setActiveColorSelector] = useState<
    | 'primary'
    | 'bg'
    | 'text'
    | 'border'
    | 'textMuted'
    | 'accentMuted'
    | 'panelBg'
    | 'inputBg'
    | 'bgGradientStart'
    | 'bgGradientEnd'
    | 'logicAccent'
    | 'actionAccent'
    | 'actionBtnColor'
    | 'codeHighlightColor'
  >('primary');
  
  // Security Modal trigger just for settings (if locked or re-setting)
  const [isLocalSecurityOpen, setIsLocalSecurityOpen] = useState(false);
  const [localSecurityTitle, setLocalSecurityTitle] = useState('');

  // Protect configuration tab if lock is active
  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center select-none max-w-md mx-auto animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-red-950/20 border border-red-900/40 flex items-center justify-center text-red-500 mb-6 animate-pulse">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-brand-panel-text mb-2">Настройки заблокированы</h2>
        <p className="text-sm text-brand-muted mb-6 leading-relaxed">
          Для конфигурирования системных параметров, сетевых линков и внешнего вида требуется ввести ваш 4-значный ПИН-код верификации.
        </p>
        <button
          type="button"
          onClick={() => {
            setLocalSecurityTitle('Авторизация настроек');
            setIsLocalSecurityOpen(true);
          }}
          className="py-3 px-6 text-white font-extrabold text-sm rounded-brand transition-all shadow-lg hover:brightness-110 cursor-pointer select-none"
          style={{ 
            borderRadius: 'var(--app-radius)',
            backgroundColor: 'var(--app-primary)',
            color: '#fff',
          }}
        >
          Разблокировать настройки
        </button>

        <SecurityModal
          isOpen={isLocalSecurityOpen}
          onClose={() => setIsLocalSecurityOpen(false)}
          onSuccess={() => setIsLocalSecurityOpen(false)}
          titleOverride={localSecurityTitle}
        />
      </div>
    );
  }

  // Network handler
  const handleSaveNetwork = () => {
    setNetwork(localUrl, localKey);
    addToast('Параметры соединения с SmashCore сохранены', 'success');
  };

  // Setup/Reset PIN flow
  const handleResetPinClick = () => {
    setPinCode(null);
    setUnlocked(false);
    setLocalSecurityTitle('Установите новый PIN');
    setIsLocalSecurityOpen(true);
    addToast('Старый PIN сброшен. Пожалуйста, введите новый.', 'info');
  };

  // Preset themes switcher
  const handleThemeModeChange = (mode: 'dark' | 'light' | 'custom') => {
    setThemeMode(mode);
    addToast(`Тема переключена на: ${mode === 'dark' ? 'Темную' : mode === 'light' ? 'Светлую' : 'Кастомную'}`, 'success');
  };

  // Restore factory defaults
  const restoreFactoryDefaults = () => {
    setThemeColors('#0f171c', '#00f0ff', '#f8fafc', '#1e293b');
    setThemeMode('dark');
    setGeometry(1, 12, 300);
    setPollingInterval(5);
    setLocalUrl('http://localhost:8080');
    setLocalKey('');
    setNetwork('http://localhost:8080', '');
    setLogicAccent('#F5A623');
    setActionAccent('#10B981');
    setActionBtnColor('#0F6CBD');
    setCodeHighlightColor('#10B981');
    addToast('Сброшено до заводских установок SmashCore', 'info');
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto select-none animate-fade-in text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-brand-panel-text flex items-center gap-3">
            <Cpu className="w-8 h-8 text-brand-primary" style={{ color: 'var(--app-primary)' }} />
            Системная конфигурация
          </h1>
          <p className="text-sm text-brand-muted mt-1">Откалибруйте параметры интерфейса, геометрию окон и порты сетевой связи.</p>
        </div>
        
        <button
          type="button"
          onClick={restoreFactoryDefaults}
          className="py-2.5 px-4 bg-brand-panel border border-brand-border text-xs font-bold text-brand-muted hover:text-red-400 hover:border-red-950/55 transition-all rounded-brand flex items-center gap-2 cursor-pointer select-none"
          style={{ borderRadius: 'var(--app-radius)' }}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Сброс настроек
        </button>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-2 bg-brand-input border border-brand-border/40 p-1 rounded-brand max-w-md" style={{ borderRadius: 'var(--app-radius)' }}>
        <button
          type="button"
          onClick={() => setActiveTab('ui')}
          className="flex-grow py-2 px-4 text-xs font-bold uppercase rounded-brand tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer outline-none select-none"
          style={{
            backgroundColor: activeTab === 'ui' ? 'var(--app-primary)' : 'transparent',
            color: activeTab === 'ui' ? '#000000' : 'var(--app-text-muted)',
            borderRadius: 'calc(var(--app-radius) * 0.8)',
          }}
        >
          <Sliders className="w-4 h-4" />
          Интерфейс
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('esp')}
          className="flex-grow py-2 px-4 text-xs font-bold uppercase rounded-brand tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer outline-none select-none"
          style={{
            backgroundColor: activeTab === 'esp' ? 'var(--app-primary)' : 'transparent',
            color: activeTab === 'esp' ? '#000000' : 'var(--app-text-muted)',
            borderRadius: 'calc(var(--app-radius) * 0.8)',
          }}
        >
          <Cpu className="w-4 h-4" />
          Мост ESP32 (Native)
        </button>
      </div>

      {activeTab === 'ui' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 2. Security Config */}
          <div className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase text-brand-muted tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-primary" style={{ color: 'var(--app-primary)' }} />
            Защита и шифрование данных
          </h2>
          <Card>
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-4 border border-emerald-500/20 bg-emerald-500/5 p-4 rounded-brand" style={{ borderRadius: 'var(--app-radius)' }}>
                <ShieldCheck className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-xs text-brand-panel-text uppercase tracking-widest leading-none">Локальная криптография</h4>
                  <p className="text-[10px] text-emerald-500 mt-1.5 leading-normal">
                    Документы настроек защищены локальным верификатором. Изменение PIN-кода аннулирует активную разблокировку.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 mt-2">
                <span className="text-xs font-bold text-brand-panel-text">Сброс ПИН-кода администратора</span>
                <p className="text-[10px] text-brand-muted leading-normal">
                  Потребуется ввести новый 4-значный код верификации для входа в заблокированные разделы истории и команд.
                </p>
                <button
                  type="button"
                  onClick={handleResetPinClick}
                  className="py-2.5 px-4 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/30 text-xs font-semibold rounded-brand flex items-center justify-center gap-2 transition-all cursor-pointer select-none"
                  style={{ borderRadius: 'var(--app-radius)' }}
                >
                  <Key className="w-4 h-4" />
                  Переустановить PIN
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* 3. Theme Colors Customization */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase text-brand-muted tracking-wider flex items-center gap-2">
            <Palette className="w-4 h-4 text-brand-primary" style={{ color: 'var(--app-primary)' }} />
            Выбор Темы Оформления и Палитры
          </h2>
          <Card>
            <div className="flex flex-col gap-5">
              {/* Presets switcher */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-extrabold text-brand-muted">Выберите профиль темы</label>
                <div className="grid grid-cols-3 gap-2 bg-brand-input p-1 rounded-brand border border-brand-border" style={{ borderRadius: 'var(--app-radius)' }}>
                  <button
                    type="button"
                    onClick={() => handleThemeModeChange('light')}
                    className="py-2.5 rounded-brand text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    style={{
                      borderRadius: 'calc(var(--app-radius) * 0.8)',
                      backgroundColor: themeMode === 'light' ? 'var(--app-primary)' : 'transparent',
                      color: themeMode === 'light' ? '#000' : 'var(--app-text-muted)',
                    }}
                  >
                    <Sun className="w-4 h-4" />
                    Светлая
                  </button>
                  <button
                    type="button"
                    onClick={() => handleThemeModeChange('dark')}
                    className="py-2.5 rounded-brand text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    style={{
                      borderRadius: 'calc(var(--app-radius) * 0.8)',
                      backgroundColor: themeMode === 'dark' ? 'var(--app-primary)' : 'transparent',
                      color: themeMode === 'dark' ? '#000' : 'var(--app-text-muted)',
                    }}
                  >
                    <Moon className="w-4 h-4" />
                    Темная
                  </button>
                  <button
                    type="button"
                    onClick={() => handleThemeModeChange('custom')}
                    className="py-2.5 rounded-brand text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    style={{
                      borderRadius: 'calc(var(--app-radius) * 0.8)',
                      backgroundColor: themeMode === 'custom' ? 'var(--app-primary)' : 'transparent',
                      color: themeMode === 'custom' ? '#000' : 'var(--app-text-muted)',
                    }}
                  >
                    <Sparkles className="w-4 h-4" />
                    Кастомная
                  </button>
                </div>
              </div>

              {/* Background Style Switcher */}
              <div className="flex flex-col gap-2 border-t border-brand-border pt-4">
                <label className="text-xs font-extrabold text-brand-muted">Режим заднего фона (Background Type)</label>
                <div className="grid grid-cols-3 gap-2 bg-brand-input p-1 rounded-brand border border-brand-border" style={{ borderRadius: 'var(--app-radius)' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setThemeColorsAdvanced({ bgType: 'solid' });
                      addToast('Выбран сплошной фон', 'success');
                    }}
                    className="py-2.5 rounded-brand text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    style={{
                      borderRadius: 'calc(var(--app-radius) * 0.8)',
                      backgroundColor: bgType === 'solid' ? 'var(--app-primary)' : 'transparent',
                      color: bgType === 'solid' ? '#000' : 'var(--app-text-muted)',
                    }}
                  >
                    Однотонный
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setThemeColorsAdvanced({ bgType: 'gradient' });
                      addToast('Выбран градиентный фон', 'success');
                    }}
                    className="py-2.5 rounded-brand text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    style={{
                      borderRadius: 'calc(var(--app-radius) * 0.8)',
                      backgroundColor: bgType === 'gradient' ? 'var(--app-primary)' : 'transparent',
                      color: bgType === 'gradient' ? '#000' : 'var(--app-text-muted)',
                    }}
                  >
                    Градиент
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setThemeColorsAdvanced({ bgType: 'animated' });
                      addToast('Выбран анимированный фон', 'success');
                    }}
                    className="py-2.5 rounded-brand text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    style={{
                      borderRadius: 'calc(var(--app-radius) * 0.8)',
                      backgroundColor: bgType === 'animated' ? 'var(--app-primary)' : 'transparent',
                      color: bgType === 'animated' ? '#000' : 'var(--app-text-muted)',
                    }}
                  >
                    Анимированный
                  </button>
                </div>
              </div>

              {/* Color pickers: visible when 'custom' theme mode or overrides */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-brand-border pt-4">
                <div className="flex flex-col gap-3">
                  <h4 className="text-[10px] text-brand-muted uppercase font-bold tracking-wider mb-1">Ручная палитра (Кастомная тема)</h4>

                  {/* Group 1: Typo */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-brand-muted/80 font-bold uppercase">Цвет текста (Шрифты):</span>
                    <button
                      type="button"
                      onClick={() => setActiveColorSelector('text')}
                      className="text-left py-2 px-3 rounded-brand border text-[11px] font-medium flex items-center justify-between transition-all cursor-pointer outline-none select-none"
                      style={{
                        borderRadius: 'var(--app-radius)',
                        borderColor: activeColorSelector === 'text' ? 'var(--app-primary)' : 'var(--app-card-border)',
                        backgroundColor: activeColorSelector === 'text' ? 'var(--app-accent-muted)' : 'transparent',
                        color: activeColorSelector === 'text' ? 'var(--app-primary)' : 'var(--app-panel-text)',
                      }}
                    >
                      <span>Основной шрифт (Text)</span>
                      <div className="w-3.5 h-3.5 rounded-full border border-brand-border shadow-inner" style={{ backgroundColor: textColor }} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveColorSelector('textMuted')}
                      className="text-left py-2 px-3 rounded-brand border text-[11px] font-medium flex items-center justify-between transition-all cursor-pointer outline-none select-none"
                      style={{
                        borderRadius: 'var(--app-radius)',
                        borderColor: activeColorSelector === 'textMuted' ? 'var(--app-primary)' : 'var(--app-card-border)',
                        backgroundColor: activeColorSelector === 'textMuted' ? 'var(--app-accent-muted)' : 'transparent',
                        color: activeColorSelector === 'textMuted' ? 'var(--app-primary)' : 'var(--app-panel-text)',
                      }}
                    >
                      <span>Вспомогательный шрифт (Muted Text)</span>
                      <div className="w-3.5 h-3.5 rounded-full border border-brand-border shadow-inner" style={{ backgroundColor: textMutedColor }} />
                    </button>
                  </div>

                  {/* Group 2: Accent */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-brand-muted/80 font-bold uppercase">Акценты (Accent Color):</span>
                    <button
                      type="button"
                      onClick={() => setActiveColorSelector('primary')}
                      className="text-left py-2 px-3 rounded-brand border text-[11px] font-medium flex items-center justify-between transition-all cursor-pointer outline-none select-none"
                      style={{
                        borderRadius: 'var(--app-radius)',
                        borderColor: activeColorSelector === 'primary' ? 'var(--app-primary)' : 'var(--app-card-border)',
                        backgroundColor: activeColorSelector === 'primary' ? 'var(--app-accent-muted)' : 'transparent',
                        color: activeColorSelector === 'primary' ? 'var(--app-primary)' : 'var(--app-panel-text)',
                      }}
                    >
                      <span>Основной подсвет (Primary)</span>
                      <div className="w-3.5 h-3.5 rounded-full border border-brand-border shadow-inner" style={{ backgroundColor: primaryColor }} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveColorSelector('accentMuted')}
                      className="text-left py-2 px-3 rounded-brand border text-[11px] font-medium flex items-center justify-between transition-all cursor-pointer outline-none select-none"
                      style={{
                        borderRadius: 'var(--app-radius)',
                        borderColor: activeColorSelector === 'accentMuted' ? 'var(--app-primary)' : 'var(--app-card-border)',
                        backgroundColor: activeColorSelector === 'accentMuted' ? 'var(--app-accent-muted)' : 'transparent',
                        color: activeColorSelector === 'accentMuted' ? 'var(--app-primary)' : 'var(--app-panel-text)',
                      }}
                    >
                      <span>Вспомогательный подсвет (Muted Accent)</span>
                      <div className="w-3.5 h-3.5 rounded-full border border-brand-border shadow-inner" style={{ backgroundColor: accentMutedColor }} />
                    </button>
                  </div>

                  {/* Group 3: Auxiliary elements */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-brand-muted/80 font-bold uppercase">Вспомогательные элементы (Nodes & Panels):</span>
                    <button
                      type="button"
                      onClick={() => setActiveColorSelector('panelBg')}
                      className="text-left py-2 px-3 rounded-brand border text-[11px] font-medium flex items-center justify-between transition-all cursor-pointer outline-none select-none"
                      style={{
                        borderRadius: 'var(--app-radius)',
                        borderColor: activeColorSelector === 'panelBg' ? 'var(--app-primary)' : 'var(--app-card-border)',
                        backgroundColor: activeColorSelector === 'panelBg' ? 'var(--app-accent-muted)' : 'transparent',
                        color: activeColorSelector === 'panelBg' ? 'var(--app-primary)' : 'var(--app-panel-text)',
                      }}
                    >
                      <span>Фон панелей и карт (Panel Bg)</span>
                      <div className="w-3.5 h-3.5 rounded-full border border-brand-border shadow-inner" style={{ backgroundColor: panelBgColor }} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveColorSelector('inputBg')}
                      className="text-left py-2 px-3 rounded-brand border text-[11px] font-medium flex items-center justify-between transition-all cursor-pointer outline-none select-none"
                      style={{
                        borderRadius: 'var(--app-radius)',
                        borderColor: activeColorSelector === 'inputBg' ? 'var(--app-primary)' : 'var(--app-card-border)',
                        backgroundColor: activeColorSelector === 'inputBg' ? 'var(--app-accent-muted)' : 'transparent',
                        color: activeColorSelector === 'inputBg' ? 'var(--app-primary)' : 'var(--app-panel-text)',
                      }}
                    >
                      <span>Фон полей ввода (Input Bg)</span>
                      <div className="w-3.5 h-3.5 rounded-full border border-brand-border shadow-inner" style={{ backgroundColor: inputBgColor }} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveColorSelector('border')}
                      className="text-left py-2 px-3 rounded-brand border text-[11px] font-medium flex items-center justify-between transition-all cursor-pointer outline-none select-none"
                      style={{
                        borderRadius: 'var(--app-radius)',
                        borderColor: activeColorSelector === 'border' ? 'var(--app-primary)' : 'var(--app-card-border)',
                        backgroundColor: activeColorSelector === 'border' ? 'var(--app-accent-muted)' : 'transparent',
                        color: activeColorSelector === 'border' ? 'var(--app-primary)' : 'var(--app-panel-text)',
                      }}
                    >
                      <span>Зазоры и рамки (Borders)</span>
                      <div className="w-3.5 h-3.5 rounded-full border border-brand-border shadow-inner" style={{ backgroundColor: borderColor }} />
                    </button>
                  </div>

                  {/* Group 4: Canvas backgrounds */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-brand-muted/80 font-bold uppercase">Цвет Canvas-фона:</span>
                    {bgType === 'gradient' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setActiveColorSelector('bgGradientStart')}
                          className="text-left py-2 px-3 rounded-brand border text-[11px] font-medium flex items-center justify-between transition-all cursor-pointer outline-none select-none"
                          style={{
                            borderRadius: 'var(--app-radius)',
                            borderColor: activeColorSelector === 'bgGradientStart' ? 'var(--app-primary)' : 'var(--app-card-border)',
                            backgroundColor: activeColorSelector === 'bgGradientStart' ? 'var(--app-accent-muted)' : 'transparent',
                            color: activeColorSelector === 'bgGradientStart' ? 'var(--app-primary)' : 'var(--app-panel-text)',
                          }}
                        >
                          <span>Старт градиента (Start Color)</span>
                          <div className="w-3.5 h-3.5 rounded-full border border-brand-border shadow-inner" style={{ backgroundColor: bgGradientStart }} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveColorSelector('bgGradientEnd')}
                          className="text-left py-2 px-3 rounded-brand border text-[11px] font-medium flex items-center justify-between transition-all cursor-pointer outline-none select-none"
                          style={{
                            borderRadius: 'var(--app-radius)',
                            borderColor: activeColorSelector === 'bgGradientEnd' ? 'var(--app-primary)' : 'var(--app-card-border)',
                            backgroundColor: activeColorSelector === 'bgGradientEnd' ? 'var(--app-accent-muted)' : 'transparent',
                            color: activeColorSelector === 'bgGradientEnd' ? 'var(--app-primary)' : 'var(--app-panel-text)',
                          }}
                        >
                          <span>Финиш градиента (End Color)</span>
                          <div className="w-3.5 h-3.5 rounded-full border border-brand-border shadow-inner" style={{ backgroundColor: bgGradientEnd }} />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveColorSelector('bg')}
                        className="text-left py-2 px-3 rounded-brand border text-[11px] font-medium flex items-center justify-between transition-all cursor-pointer outline-none select-none"
                        style={{
                          borderRadius: 'var(--app-radius)',
                          borderColor: activeColorSelector === 'bg' ? 'var(--app-primary)' : 'var(--app-card-border)',
                          backgroundColor: activeColorSelector === 'bg' ? 'var(--app-accent-muted)' : 'transparent',
                          color: activeColorSelector === 'bg' ? 'var(--app-primary)' : 'var(--app-panel-text)',
                        }}
                      >
                        <span>Разрешение фона (Single Bg Color)</span>
                        <div className="w-3.5 h-3.5 rounded-full border border-brand-border shadow-inner" style={{ backgroundColor: bgColor }} />
                      </button>
                    )}
                  </div>

                  {/* Group 5: Scenario Builder Custom Colors */}
                  <div className="flex flex-col gap-1.5 pt-4 border-t border-brand-border">
                    <span className="text-[10px] text-brand-muted/80 font-bold uppercase">Цвета Конструктора Сценариев:</span>
                    <button
                      type="button"
                      onClick={() => setActiveColorSelector('logicAccent')}
                      className="text-left py-2 px-3 rounded-brand border text-[11px] font-medium flex items-center justify-between transition-all cursor-pointer outline-none select-none"
                      style={{
                        borderRadius: 'var(--app-radius)',
                        borderColor: activeColorSelector === 'logicAccent' ? 'var(--app-primary)' : 'var(--app-card-border)',
                        backgroundColor: activeColorSelector === 'logicAccent' ? 'var(--app-accent-muted)' : 'transparent',
                        color: activeColorSelector === 'logicAccent' ? 'var(--app-primary)' : 'var(--app-panel-text)',
                      }}
                    >
                      <span>Акцент логики (Рамка)</span>
                      <div className="w-3.5 h-3.5 rounded-full border border-brand-border shadow-inner" style={{ backgroundColor: logicAccent }} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveColorSelector('actionAccent')}
                      className="text-left py-2 px-3 rounded-brand border text-[11px] font-medium flex items-center justify-between transition-all cursor-pointer outline-none select-none"
                      style={{
                        borderRadius: 'var(--app-radius)',
                        borderColor: activeColorSelector === 'actionAccent' ? 'var(--app-primary)' : 'var(--app-card-border)',
                        backgroundColor: activeColorSelector === 'actionAccent' ? 'var(--app-accent-muted)' : 'transparent',
                        color: activeColorSelector === 'actionAccent' ? 'var(--app-primary)' : 'var(--app-panel-text)',
                      }}
                    >
                      <span>Акцент действия (Рамка)</span>
                      <div className="w-3.5 h-3.5 rounded-full border border-brand-border shadow-inner" style={{ backgroundColor: actionAccent }} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveColorSelector('actionBtnColor')}
                      className="text-left py-2 px-3 rounded-brand border text-[11px] font-medium flex items-center justify-between transition-all cursor-pointer outline-none select-none"
                      style={{
                        borderRadius: 'var(--app-radius)',
                        borderColor: activeColorSelector === 'actionBtnColor' ? 'var(--app-primary)' : 'var(--app-card-border)',
                        backgroundColor: activeColorSelector === 'actionBtnColor' ? 'var(--app-accent-muted)' : 'transparent',
                        color: activeColorSelector === 'actionBtnColor' ? 'var(--app-primary)' : 'var(--app-panel-text)',
                      }}
                    >
                      <span>Цвет кнопок действий</span>
                      <div className="w-3.5 h-3.5 rounded-full border border-brand-border shadow-inner" style={{ backgroundColor: actionBtnColor }} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveColorSelector('codeHighlightColor')}
                      className="text-left py-2 px-3 rounded-brand border text-[11px] font-medium flex items-center justify-between transition-all cursor-pointer outline-none select-none"
                      style={{
                        borderRadius: 'var(--app-radius)',
                        borderColor: activeColorSelector === 'codeHighlightColor' ? 'var(--app-primary)' : 'var(--app-card-border)',
                        backgroundColor: activeColorSelector === 'codeHighlightColor' ? 'var(--app-accent-muted)' : 'transparent',
                        color: activeColorSelector === 'codeHighlightColor' ? 'var(--app-primary)' : 'var(--app-panel-text)',
                      }}
                    >
                      <span>Цвет подсветки кода</span>
                      <div className="w-3.5 h-3.5 rounded-full border border-brand-border shadow-inner" style={{ backgroundColor: codeHighlightColor }} />
                    </button>
                  </div>
                </div>

                {/* React colorful overlay */}
                <div>
                  {activeColorSelector === 'primary' && (
                    <ColorPickerWithInput
                      color={primaryColor}
                      label="Основной акцент (Primary)"
                      onChange={(color) => setThemeColorsAdvanced({ primaryColor: color })}
                    />
                  )}
                  {activeColorSelector === 'accentMuted' && (
                    <ColorPickerWithInput
                      color={accentMutedColor}
                      label="Вспомогательный акцент (Accent Muted)"
                      onChange={(color) => setThemeColorsAdvanced({ accentMutedColor: color })}
                    />
                  )}
                  {activeColorSelector === 'bg' && (
                    <ColorPickerWithInput
                      color={bgColor}
                      label="Цвет полотна фона (Bg Color)"
                      onChange={(color) => setThemeColorsAdvanced({ bgColor: color })}
                    />
                  )}
                  {activeColorSelector === 'text' && (
                    <ColorPickerWithInput
                      color={textColor}
                      label="Основной шрифт (Text)"
                      onChange={(color) => setThemeColorsAdvanced({ textColor: color })}
                    />
                  )}
                  {activeColorSelector === 'textMuted' && (
                    <ColorPickerWithInput
                      color={textMutedColor}
                      label="Вспомогательный шрифт (Muted Text)"
                      onChange={(color) => setThemeColorsAdvanced({ textMutedColor: color })}
                    />
                  )}
                  {activeColorSelector === 'panelBg' && (
                    <ColorPickerWithInput
                      color={panelBgColor}
                      label="Фон панелей и карт (Panel Bg)"
                      onChange={(color) => setThemeColorsAdvanced({ panelBgColor: color })}
                    />
                  )}
                  {activeColorSelector === 'inputBg' && (
                    <ColorPickerWithInput
                      color={inputBgColor}
                      label="Фон полей ввода (Input Bg)"
                      onChange={(color) => setThemeColorsAdvanced({ inputBgColor: color })}
                    />
                  )}
                  {activeColorSelector === 'border' && (
                    <ColorPickerWithInput
                      color={borderColor}
                      label="Зазоры и рамки (Borders)"
                      onChange={(color) => setThemeColorsAdvanced({ borderColor: color })}
                    />
                  )}
                  {activeColorSelector === 'bgGradientStart' && (
                    <ColorPickerWithInput
                      color={bgGradientStart}
                      label="Старт градиента (Start Color)"
                      onChange={(color) => setThemeColorsAdvanced({ bgGradientStart: color })}
                    />
                  )}
                  {activeColorSelector === 'bgGradientEnd' && (
                    <ColorPickerWithInput
                      color={bgGradientEnd}
                      label="Финиш градиента (End Color)"
                      onChange={(color) => setThemeColorsAdvanced({ bgGradientEnd: color })}
                    />
                  )}
                  {activeColorSelector === 'logicAccent' && (
                    <ColorPickerWithInput
                      color={logicAccent}
                      label="Акцент логики (Рамка)"
                      onChange={(color) => {
                        setLogicAccent(color);
                        setThemeMode('custom');
                      }}
                    />
                  )}
                  {activeColorSelector === 'actionAccent' && (
                    <ColorPickerWithInput
                      color={actionAccent}
                      label="Акцент действия (Рамка)"
                      onChange={(color) => {
                        setActionAccent(color);
                        setThemeMode('custom');
                      }}
                    />
                  )}
                  {activeColorSelector === 'actionBtnColor' && (
                    <ColorPickerWithInput
                      color={actionBtnColor}
                      label="Цвет кнопок действий"
                      onChange={(color) => {
                        setActionBtnColor(color);
                        setThemeMode('custom');
                      }}
                    />
                  )}
                  {activeColorSelector === 'codeHighlightColor' && (
                    <ColorPickerWithInput
                      color={codeHighlightColor}
                      label="Цвет подсветки кода"
                      onChange={(color) => {
                        setCodeHighlightColor(color);
                        setThemeMode('custom');
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* 4. Geometry Settings */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase text-brand-muted tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-brand-primary" style={{ color: 'var(--app-primary)' }} />
            Геометрическая физика (Smash Frame)
          </h2>
          <Card>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-brand-panel-text">Скругление углов (Border Radius)</span>
                  <span className="font-mono text-brand-primary font-bold" style={{ color: 'var(--app-primary)' }}>{borderRadius}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="32"
                  value={borderRadius}
                  onChange={(e) => setGeometry(borderWidth, parseInt(e.target.value, 10), transitionSpeed)}
                  className="w-full h-1.5 rounded cursor-pointer"
                  style={{ accentColor: 'var(--app-primary)' }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-brand-panel-text">Толщина рамок (Border Width)</span>
                  <span className="font-mono text-brand-primary font-bold" style={{ color: 'var(--app-primary)' }}>{borderWidth}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="4"
                  value={borderWidth}
                  onChange={(e) => setGeometry(parseInt(e.target.value, 10), borderRadius, transitionSpeed)}
                  className="w-full h-1.5 rounded cursor-pointer"
                  style={{ accentColor: 'var(--app-primary)' }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-brand-panel-text">Скорость анимаций (Transitions)</span>
                  <span className="font-mono text-brand-primary font-bold" style={{ color: 'var(--app-primary)' }}>{transitionSpeed}ms</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  value={transitionSpeed}
                  onChange={(e) => setGeometry(borderWidth, borderRadius, parseInt(e.target.value, 10))}
                  className="w-full h-1.5 rounded cursor-pointer"
                  style={{ accentColor: 'var(--app-primary)' }}
                />
              </div>

              <div className="flex flex-col gap-2 border-t border-brand-border pt-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-brand-panel-text">Интервал опроса SmashCore</span>
                  <span className="font-mono text-brand-primary font-bold" style={{ color: 'var(--app-primary)' }}>каждые {pollingInterval}с</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="60"
                  value={pollingInterval}
                  onChange={(e) => setPollingInterval(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 rounded cursor-pointer"
                  style={{ accentColor: 'var(--app-primary)' }}
                />
              </div>
            </div>
          </Card>
        </div>

      </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* 1. Network Settings */}
          <div className="flex flex-col gap-3 max-w-3xl">
            <h2 className="text-xs font-semibold uppercase text-brand-muted tracking-wider flex items-center gap-2">
              <Network className="w-4 h-4 text-brand-primary" style={{ color: 'var(--app-primary)' }} />
              Сетевое ядро (REST-API)
            </h2>
            <Card>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-brand-muted" htmlFor="server-url">Адрес хоста C++ SmashCore</label>
                  <input
                    id="server-url"
                    type="text"
                    value={localUrl}
                    onChange={(e) => setLocalUrl(e.target.value)}
                    className="w-full bg-brand-input border border-brand-border focus:border-brand-primary rounded-brand py-2.5 px-4 text-xs font-mono text-brand-panel-text outline-none"
                    style={{ borderRadius: 'var(--app-radius)' }}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-brand-muted" htmlFor="api-key">Ключ безопасности X-API-Key</label>
                  <input
                    id="api-key"
                    type="password"
                    value={localKey}
                    placeholder="••••••••••••••••"
                    onChange={(e) => setLocalKey(e.target.value)}
                    className="w-full bg-brand-input border border-brand-border focus:border-brand-primary rounded-brand py-2.5 px-4 text-xs font-mono text-brand-panel-text outline-none"
                    style={{ borderRadius: 'var(--app-radius)' }}
                  />
                  <p className="text-[10px] text-brand-muted/80 leading-normal">
                    Ключ шифруется и передается в HTTP-заголовках для верификации вызовов SmashCore на микроконтроллере ESP32.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSaveNetwork}
                  className="py-2.5 px-4 mt-2 bg-brand-input hover:brightness-105 border border-brand-border font-semibold text-xs text-brand-panel-text rounded-brand flex items-center justify-center gap-2 transition-all cursor-pointer select-none"
                  style={{ borderRadius: 'var(--app-radius)' }}
                >
                  <Save className="w-4 h-4 text-brand-primary" style={{ color: 'var(--app-primary)' }} />
                  Привязать сетевой линк
                </button>
              </div>
            </Card>
          </div>

          <EspConnector />
        </div>
      )}

      <SecurityModal
        isOpen={isLocalSecurityOpen}
        onClose={() => setIsLocalSecurityOpen(false)}
        onSuccess={() => setIsLocalSecurityOpen(false)}
        titleOverride={localSecurityTitle}
      />
    </div>
  );
}

export default Settings;
