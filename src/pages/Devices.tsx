import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { getDevices, Device, sendCommand } from '../api/endpoints';
import { Card } from '../components/ui/Card';
import { Toggle } from '../components/ui/Toggle';
import { DeviceDetailsModal } from '../components/modals/DeviceDetailsModal';
import { SecurityModal } from '../components/modals/SecurityModal';
import { 
  Lightbulb, Snowflake, ShieldAlert, Eye, Flame, SearchX, 
  RotateCw, PlusCircle, CheckCircle, HelpCircle, Filter, Cpu, EyeOff
} from 'lucide-react';

interface DevicesProps {
  searchQuery: string;
}

export function Devices({ searchQuery }: DevicesProps) {
  const pollingInterval = useAppStore((state) => state.pollingInterval);
  const isUnlocked = useAppStore((state) => state.isUnlocked);
  const addToast = useAppStore((state) => state.addToast);

  // States
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'light' | 'climate' | 'security'>('all');
  const [isInfoOpen, setIsInfoOpen] = useState(true); // Open by default on desktop, collapsible
  
  // Modals controllers
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSecurityGateOpen, setIsSecurityGateOpen] = useState(false);
  const [pendingDevice, setPendingDevice] = useState<Device | null>(null);

  // Poll devices hook
  useEffect(() => {
    fetchDevices(true);

    const intervalMs = pollingInterval * 1000;
    const poll = setInterval(() => {
      fetchDevices(false);
    }, intervalMs);

    return () => clearInterval(poll);
  }, [pollingInterval]);

  const fetchDevices = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const data = await getDevices();
      setDevices(Array.isArray(data) ? data : []);
    } catch (err) {
      // Handled gracefully
      setDevices([]);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const isContinuousDevice = (device: Device): boolean => {
    const nameLower = device.name.toLowerCase();
    return (
      device.type === 'security' && 
      (nameLower.includes('датчик') || nameLower.includes('детектор') || nameLower.includes('камера') || nameLower.includes('протеч'))
    );
  };

  // Switch Toggle handler
  const handleToggleDevice = async (device: Device, checked: boolean) => {
    if (isContinuousDevice(device)) {
      addToast('Приборы непрерывного мониторинга не подлежат отключению', 'error');
      return;
    }

    // Optimistic UI updates
    setDevices((prev) =>
      prev.map((d) => (d.id === device.id ? { ...d, status: checked, value: checked ? (d.type === 'light' ? 80 : 22) : 0 } : d))
    );

    try {
      const stateCmd = checked ? 'relay:on' : 'relay:off';
      const result = await sendCommand(device.name, stateCmd);
      if (result.success) {
        addToast(`Передана команда переключения: "${device.name}"`, 'success');
      }
    } catch (err) {
      // Revert if error occurs — though our mock endpoint catches and acts as offline success
    }
  };

  // Card click security wrapper
  const handleCardClick = (device: Device) => {
    if (!isUnlocked) {
      setPendingDevice(device);
      setIsSecurityGateOpen(true);
    } else {
      setSelectedDevice(device);
      setIsDetailOpen(true);
    }
  };

  const handleSecurityGateSuccess = () => {
    setIsSecurityGateOpen(false);
    if (pendingDevice) {
      setSelectedDevice(pendingDevice);
      setIsDetailOpen(true);
      setPendingDevice(null);
    }
  };

  // Filters items matches
  const filteredDevices = devices.filter((device) => {
    if (!device) return false;

    if (activeFilter !== 'all' && device.type !== activeFilter) {
      return false;
    }
    if (searchQuery.trim() !== '') {
      const search = searchQuery.toLowerCase();
      const matchName = (device.name || '').toLowerCase().includes(search);
      const matchLoc = (device.location || '').toLowerCase().includes(search);
      return matchName || matchLoc;
    }
    return true;
  });

  // Assign appropriate icon designs
  const getDeviceIcon = (device: Device) => {
    const nameLower = device.name.toLowerCase();
    
    if (device.type === 'light') {
      return <Lightbulb className={`w-6 h-6 ${device.status ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'text-slate-500'}`} />;
    }
    
    if (device.type === 'climate') {
      if (nameLower.includes('кондиционер')) {
        return <Snowflake className={`w-6 h-6 ${device.status ? 'text-blue-400 animate-spin-slow' : 'text-slate-500'}`} />;
      }
      return <Flame className={`w-6 h-6 ${device.status ? 'text-orange-400' : 'text-slate-500'}`} />;
    }
    
    if (device.type === 'security') {
      if (nameLower.includes('датчик')) {
        return <Eye className={`w-6 h-6 ${device.status ? 'text-emerald-400' : 'text-slate-500'}`} />;
      }
      return <ShieldAlert className={`w-6 h-6 ${device.status ? 'text-emerald-500 drop-shadow-[0_0_5px_rgba(16,185,129,0.4)]' : 'text-slate-500'}`} />;
    }

    return <HelpCircle className="w-6 h-6 text-slate-500" />;
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 min-h-[82vh] w-full select-none text-left">
      {/* 1. Main Devices Layout Area (occupies full width by default) */}
      <div className="flex-1 flex flex-col gap-6 w-full">
        {/* Dynamic header and controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          {/* Filters buttons set */}
          <div className="flex gap-1 bg-brand-panel p-1 rounded-brand border border-brand-border" style={{ borderRadius: 'var(--app-radius)' }}>
            {(['all', 'light', 'climate', 'security'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setActiveFilter(mode)}
                className="text-[10px] font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-brand transition-all cursor-pointer outline-none select-none"
                style={{
                  backgroundColor: activeFilter === mode ? 'var(--app-primary)' : 'transparent',
                  color: activeFilter === mode ? (useAppStore.getState().themeMode === 'light' ? '#ffffff' : '#0f172b') : 'var(--app-text-muted)',
                  borderRadius: 'calc(var(--app-radius) * 0.8)',
                }}
              >
                {mode === 'all' ? 'Все' : mode === 'light' ? 'Свет' : mode === 'climate' ? 'Климат' : 'Защита'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Toggle info panel button */}
            <button
              type="button"
              onClick={() => setIsInfoOpen(!isInfoOpen)}
              className="text-xs font-bold bg-brand-panel border border-brand-border py-2.5 px-4 rounded-brand flex items-center gap-2 transition-all cursor-pointer select-none"
              style={{
                borderRadius: 'var(--app-radius)',
                borderColor: isInfoOpen ? 'var(--app-primary)' : 'var(--app-card-border)',
                color: isInfoOpen ? 'var(--app-primary)' : 'var(--app-panel-text)',
              }}
            >
              <HelpCircle className="w-4 h-4" />
              <span>{isInfoOpen ? 'Скрыть справку' : 'Справка'}</span>
            </button>

            {/* Refresh button */}
            <button
              type="button"
              onClick={() => fetchDevices(true)}
              className="text-xs font-bold bg-brand-panel border border-brand-border py-2.5 px-4 rounded-brand flex items-center gap-2.5 transition-all text-brand-panel-text hover:brightness-110 cursor-pointer select-none"
              style={{ borderRadius: 'var(--app-radius)' }}
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Обновить</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-brand-muted gap-3 flex-1">
            <RotateCw className="w-8 h-8 animate-spin" style={{ color: 'var(--app-primary)' }} />
            <span className="font-semibold text-xs tracking-wider uppercase">Опрос по шине SmashCore...</span>
          </div>
        ) : filteredDevices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-brand-panel border border-brand-border p-8 flex-1" style={{ borderRadius: 'var(--app-radius)' }}>
            <SearchX className="w-12 h-12 text-brand-muted/40 mb-3" />
            <h3 className="font-bold text-brand-panel-text text-md">Приборы по запросу не обнаружены</h3>
            <p className="text-xs text-brand-muted mt-1 max-w-xs">
              Запрашиваемые сенсоры отсутствуют. Попробуйте сбросить поисковую строку.
            </p>
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[72vh] w-full p-2.5 -m-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4.5 pr-1.5">
              {filteredDevices.map((device) => {
                const continuous = isContinuousDevice(device);
                return (
                  <Card
                    key={device.id}
                    onClick={() => handleCardClick(device)}
                    hoverEffect
                    className="group relative"
                  >
                    <div className="flex justify-between items-start">
                      <div 
                        className="p-3 bg-brand-accent-muted rounded-brand flex items-center justify-center transition-transform group-hover:scale-110 border border-brand-border"
                        style={{ borderRadius: 'calc(var(--app-radius) * 0.8)' }}
                      >
                        {getDeviceIcon(device)}
                      </div>
                      
                      {/* Hiding switcher power toggles for devices that can't be shut down */}
                      {continuous ? (
                        <span className="text-[8px] tracking-widest font-extrabold uppercase py-1 px-2.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 select-none animate-pulse" style={{ borderRadius: 'var(--app-radius)' }}>
                          Постоянный Сбор
                        </span>
                      ) : (
                        <div onClick={(e) => e.stopPropagation()}>
                          <Toggle
                            checked={device.status}
                            onChange={(checked) => handleToggleDevice(device, checked)}
                          />
                        </div>
                      )}
                    </div>

                    <div className="mt-4">
                      <h3 className="font-extrabold text-brand-panel-text text-sm truncate pr-2 group-hover:text-brand-primary transition-colors">
                        {device.name}
                      </h3>
                      <p className="text-[10px] text-brand-muted font-bold mt-1.5 uppercase tracking-wider">{device.location}</p>
                    </div>

                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-brand-border text-[10px] text-brand-muted">
                      <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <span 
                          className={`w-1.5 h-1.5 rounded-full ${device.status ? 'bg-emerald-500' : 'bg-slate-400'}`} 
                        />
                        {device.status ? 'Актив' : 'Выкл'}
                      </span>
                      
                      {device.status && device.value > 0 && (
                        <span className="font-black font-mono px-2 py-0.5 rounded bg-brand-accent-muted text-brand-panel-text">
                          {device.value}{device.type === 'light' ? '%' : '°C'}
                        </span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. Side explanatory Information Panel - slides/appears on the right side */}
      {isInfoOpen && (
        <div 
          className="w-full xl:w-[320px] bg-brand-panel border border-brand-border p-6 rounded-brand flex flex-col gap-6 flex-shrink-0 animate-slide-in-right self-start"
          style={{ borderRadius: 'var(--app-radius)' }}
        >
          <div className="flex items-center justify-between border-b border-brand-border pb-3">
            <h3 className="font-extrabold text-brand-panel-text text-sm tracking-tight uppercase flex items-center gap-2">
              <Cpu className="w-4.5 h-4.5 text-brand-primary" style={{ color: 'var(--app-primary)' }} />
              Сенсоры и Датчики
            </h3>
            <button 
              type="button"
              onClick={() => setIsInfoOpen(false)}
              className="text-xs text-brand-muted hover:text-brand-panel-text font-bold cursor-pointer transition-colors"
            >
              ✕
            </button>
          </div>
          
          <p className="text-xs text-brand-muted leading-relaxed font-medium">
            Умная шина SmashCore непрерывно собирает показатели датчиков. Для оптимальной организации полезной площади вы можете свернуть этот блок, растянув плитки на всю ширину.
          </p>

          <div className="flex flex-col gap-3.5 text-[11px] text-brand-muted font-mono leading-relaxed">
            <div className="flex items-start gap-2 pt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
              <span>
                <strong className="text-brand-panel-text">КРИТИЧЕСКИЕ ДАТЧИКИ</strong>
                <br />Приборы защиты и предохранения работают постоянно и не могут быть выключены.
              </span>
            </div>
            <div className="flex items-start gap-2 pt-1 border-t border-brand-border/60">
              <span className="w-2 h-2 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
              <span>
                <strong className="text-brand-panel-text">ПЕРИОД ОПРОСА</strong>
                <br />Обновление данных происходит автоматически раз в {pollingInterval} сек.
              </span>
            </div>
            <div className="flex items-start gap-2 pt-1 border-t border-brand-border/60">
              <span className="w-2 h-2 rounded-full bg-amber-500 mt-1 flex-shrink-0" />
              <span>
                <strong className="text-brand-panel-text">ПИН-КОД ЗАЩИТА</strong>
                <br />Изменение ключевых параметров сенсоров требует разблокировки общей панели.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Global telemetric analytics details modal */}
      <DeviceDetailsModal
        device={selectedDevice}
        onClose={() => {
          setSelectedDevice(null);
          setIsDetailOpen(false);
        }}
        onStateChange={() => fetchDevices(false)}
      />

      {/* Embedded local security lock gate check */}
      <SecurityModal
        isOpen={isSecurityGateOpen}
        onClose={() => {
          setIsSecurityGateOpen(false);
          setPendingDevice(null);
        }}
        onSuccess={handleSecurityGateSuccess}
        titleOverride="Доступ к телеметрии защищен"
      />
    </div>
  );
}

export default Devices;
