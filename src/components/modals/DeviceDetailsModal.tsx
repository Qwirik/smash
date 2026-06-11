import { useEffect, useState } from 'react';
import { Device, getDeviceHistory, HistoryDataPoint, sendCommand } from '../../api/endpoints';
import { useAppStore } from '../../store/useAppStore';
import { X, Thermometer, Lightbulb, ShieldAlert, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface DeviceDetailsModalProps {
  device: Device | null;
  onClose: () => void;
  onStateChange: () => void; // Triggered when device properties update
}

export function DeviceDetailsModal({ device, onClose, onStateChange }: DeviceDetailsModalProps) {
  if (!device) return null;

  const addToast = useAppStore((state) => state.addToast);
  const primaryColor = useAppStore((state) => state.primaryColor);

  const [history, setHistory] = useState<HistoryDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [sliderValue, setSliderValue] = useState(device.value);
  const [localStatus, setLocalStatus] = useState(device.status);

  // Sync state if drawer is open and model updates externally
  useEffect(() => {
    setSliderValue(device.value);
    setLocalStatus(device.status);
    fetchHistory();
  }, [device.id]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getDeviceHistory(device.id);
      setHistory(data);
    } catch (err) {
      // Handled silently by api layer
    } finally {
      setLoading(false);
    }
  };

  // Slider change handler
  const handleSliderChange = async (value: number) => {
    setSliderValue(value);
    setLocalStatus(value > 0);
    const cmdType = device.type === 'light' ? 'dim:' : 'temp:';
    try {
      await sendCommand(device.name, `${cmdType}${value}`);
      onStateChange();
    } catch (err) {
      // Ignored: dynamic mock already handled
    }
  };

  const handleToggleLocal = async () => {
    const nextStatus = !localStatus;
    setLocalStatus(nextStatus);
    setSliderValue(nextStatus ? (device.type === 'light' ? 80 : 22) : 0);
    try {
      await sendCommand(device.name, nextStatus ? 'relay:on' : 'relay:off');
      onStateChange();
    } catch (err) {
      // Ignored
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex justify-end overflow-hidden select-none">
      {/* Soft Blurry Backdrop standard mask - Animates fade in */}
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 animate-fade-in cursor-pointer"
        onClick={onClose}
      />

      {/* Right Side Drawer Component Container with sleek entry transitions */}
      <div 
        className="relative w-full max-w-lg h-full bg-brand-panel border-l border-brand-border flex flex-col gap-6 text-brand-panel-text p-6 md:p-8 shadow-2xl overflow-y-auto animate-slide-in-right z-10"
        style={{
          borderLeftWidth: 'var(--app-border)',
          transitionSpeed: 'var(--app-transition)',
        }}
      >
        {/* Header section */}
        <div className="flex justify-between items-start border-b border-brand-border pb-4">
          <div className="flex gap-3 items-center">
            <div 
              className="p-3 bg-brand-accent-muted border border-brand-border"
              style={{
                borderRadius: 'calc(var(--app-radius) * 0.8)',
              }}
            >
              {device.type === 'light' && <Lightbulb className="w-6 h-6 text-yellow-400" />}
              {device.type === 'climate' && <Thermometer className="w-6 h-6 text-sky-400" />}
              {device.type === 'security' && <ShieldAlert className="w-6 h-6 text-emerald-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg md:text-xl font-extrabold tracking-tight text-brand-panel-text">{device.name}</h3>
                <span 
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: localStatus ? 'rgba(var(--app-primary), 0.12)' : 'rgba(148, 163, 184, 0.1)',
                    color: localStatus ? 'var(--app-primary)' : 'var(--app-text-muted)'
                  }}
                >
                  {localStatus ? 'ВКЛ' : 'ВЫКЛ'}
                </span>
              </div>
              <p className="text-xs text-brand-muted font-medium mt-1">{device.location} • SmashCore Node</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-brand-accent-muted border border-transparent hover:border-brand-border rounded-brand text-brand-muted hover:text-brand-panel-text transition-all cursor-pointer inline-flex items-center justify-center"
            aria-label="Закрыть"
            style={{ borderRadius: 'var(--app-radius)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Controls content block adjustment with Light Theme support */}
        <div className="flex flex-col gap-6 flex-grow">
          <div className="grid grid-cols-1 gap-5 bg-brand-accent-muted p-4 rounded-brand border border-brand-border" style={{ borderRadius: 'var(--app-radius)' }}>
            {/* Hardware slider controllers */}
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-bold tracking-wider text-brand-muted uppercase flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand-primary" style={{ color: 'var(--app-primary)' }} />
                Аналоговый уровень
              </h4>

              {device.type === 'security' ? (
                <div className="text-xs text-brand-muted flex flex-col gap-2 py-2">
                  <div className="flex items-center gap-2.5 border border-emerald-500/20 bg-emerald-500/5 px-3.5 py-3 rounded-brand">
                    <AlertCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="font-medium leading-relaxed">Узел безопасности SmashCore работает в цифровом режиме постоянной охраны.</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3.5">
                  <div className="flex justify-between items-center text-xs font-bold text-brand-panel-text">
                    <span>{device.type === 'light' ? 'Яркость диммирования' : 'Целевая климат-температура'}</span>
                    <span className="text-brand-primary font-black text-sm" style={{ color: 'var(--app-primary)' }}>
                      {sliderValue}{device.type === 'light' ? '%' : '°C'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={device.type === 'light' ? 10 : 16}
                    max={device.type === 'light' ? 100 : 30}
                    value={sliderValue}
                    onChange={(e) => handleSliderChange(parseInt(e.target.value, 10))}
                    disabled={!localStatus}
                    className="w-full h-1.5 rounded-lg accent-brand-primary cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      accentColor: 'var(--app-primary)',
                    }}
                  />
                  <p className="text-[11px] text-brand-muted font-medium">
                    {localStatus 
                      ? 'Сдвиньте ползунок, чтобы передать команду по сети.' 
                      : 'Включите прибор, чтобы настроить уровень.'}
                  </p>
                </div>
              )}

              {/* General quick toggler or Continuous notification */}
              {device.type === 'security' && (device.name.toLowerCase().includes('датчик') || device.name.toLowerCase().includes('детектор') || device.name.toLowerCase().includes('камера') || device.name.toLowerCase().includes('протеч')) ? (
                <div className="py-2.5 px-4 rounded-brand border border-emerald-500/10 bg-emerald-500/5 text-emerald-500 text-[11px] font-bold text-center select-none" style={{ borderRadius: 'var(--app-radius)' }}>
                  Прибор работает в режиме постоянного защищенного сбора (Питание постоянно)
                </div>
              ) : (
                <button
                  onClick={handleToggleLocal}
                  className="py-2.5 px-4 rounded-brand border font-bold text-xs transition-all text-center cursor-pointer select-none border-brand-border"
                  style={{
                    backgroundColor: localStatus ? 'var(--app-primary)' : 'transparent',
                    borderColor: localStatus ? 'var(--app-primary)' : 'var(--app-card-border)',
                    color: localStatus ? (useAppStore.getState().themeMode === 'light' ? '#ffffff' : '#05070a') : 'var(--app-panel-text)',
                    borderRadius: 'var(--app-radius)'
                  }}
                >
                  {localStatus ? 'Выключить прибор' : 'Включить прибор'}
                </button>
              )}
            </div>

            {/* Quick status report indicators */}
            <div className="flex flex-col justify-between text-[11px] text-brand-muted gap-3 border-t border-brand-border/60 pt-4">
              <h4 className="text-[11px] font-bold tracking-wider text-brand-muted uppercase">
                Статус узла бэкенда
              </h4>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between border-b border-brand-border/40 pb-1.5">
                  <span>Протокол</span>
                  <span className="text-brand-panel-text font-bold font-mono">C++ SmashCore REST v2</span>
                </div>
                <div className="flex justify-between border-b border-brand-border/40 pb-1.5">
                  <span>Отказоустойчивость</span>
                  <span className="text-emerald-500 font-bold font-mono">99.98% OK</span>
                </div>
                <div className="flex justify-between border-b border-brand-border/40 pb-1.5">
                  <span>Время опроса</span>
                  <span className="text-brand-panel-text font-bold font-mono">Прямой опрос</span>
                </div>
                <div className="flex justify-between">
                  <span>Администрация</span>
                  <span className="text-brand-panel-text font-bold font-mono">SYSTEMROOT</span>
                </div>
              </div>
              <div className="text-[9px] text-brand-muted/80 italic text-right mt-1">
                Регистрационный ID: {device.id}
              </div>
            </div>
          </div>

          {/* Telemetry Chart area block */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold tracking-wider text-brand-muted uppercase">
                Временной график телеметрии (Суточная история)
              </h4>
              <button 
                onClick={fetchHistory}
                disabled={loading}
                className="text-xs text-brand-muted hover:text-brand-panel-text transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 border-0 bg-transparent font-bold"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Загрузка...' : 'Обновить'}
              </button>
            </div>

            <div className="h-48 md:h-52 w-full bg-brand-accent-muted p-4 border border-brand-border shadow-inner" style={{ borderRadius: 'var(--app-radius)' }}>
              {loading ? (
                <div className="w-full h-full flex items-center justify-center text-brand-muted text-xs font-semibold">
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Загрузка телеметрии...
                </div>
              ) : history.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-brand-muted text-xs font-semibold">
                  Нет доступных точек телеметрии
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={primaryColor} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.12)" />
                    <XAxis dataKey="time" stroke="var(--app-text-muted)" fontSize={10} tickLine={false} />
                    <YAxis stroke="var(--app-text-muted)" fontSize={10} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--app-panel-bg)', 
                        borderColor: 'var(--app-card-border)',
                        borderRadius: 'var(--app-radius)',
                        color: 'var(--app-panel-text)',
                        fontSize: 11
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke={primaryColor} 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex justify-end pt-4 border-t border-brand-border">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-6 font-bold text-xs text-brand-panel-text bg-brand-accent-muted border border-brand-border rounded-brand hover:brightness-105 transition-all cursor-pointer select-none"
            style={{ borderRadius: 'var(--app-radius)' }}
          >
            Закрыть панель управления
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeviceDetailsModal;
