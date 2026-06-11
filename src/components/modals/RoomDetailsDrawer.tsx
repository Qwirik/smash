import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore, RoomInfo } from '../../store/useAppStore';
import { getDevices, Device, sendCommand } from '../../api/endpoints';
import { 
  Sofa, CookingPot, Bed, Bath, Trees, HelpCircle,
  Thermometer, Droplets, Cpu, Trash2, X, Plus, Sparkles, Check,
  Power, Sliders, Lightbulb, Snowflake, ShieldAlert, Eye, Flame, Lock
} from 'lucide-react';

interface RoomDetailsDrawerProps {
  roomId: string | null;
  onClose: () => void;
}

export function RoomDetailsDrawer({ roomId, onClose }: RoomDetailsDrawerProps) {
  const rooms = useAppStore((state) => state.rooms);
  const addDeviceToRoom = useAppStore((state) => state.addDeviceToRoom);
  const removeDeviceFromRoom = useAppStore((state) => state.removeDeviceFromRoom);
  const addToast = useAppStore((state) => state.addToast);
  const themeMode = useAppStore((state) => state.themeMode);

  const room = rooms.find((r) => r.id === roomId);

  // Local state for all system devices
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);

  // Load devices on open
  useEffect(() => {
    if (roomId) {
      setLoading(true);
      getDevices()
        .then((data) => {
          setAllDevices(Array.isArray(data) ? data : []);
        })
        .catch(() => setAllDevices([]))
        .finally(() => setLoading(false));
    }
  }, [roomId, rooms]); // Reload if room devices mapping changes

  if (!roomId || !room) return null;

  const roomDevices = allDevices.filter((d) => room.deviceIds.includes(d.id));
  const availableDevices = allDevices.filter((d) => !room.deviceIds.includes(d.id));

  const getRoomIcon = (name: string) => {
    const lName = name.toLowerCase();
    if (lName.includes('гостиная') || lName.includes('зал')) {
      return <Sofa className="w-6 h-6 text-indigo-400" />;
    }
    if (lName.includes('кухня')) {
      return <CookingPot className="w-6 h-6 text-amber-400" />;
    }
    if (lName.includes('спальня')) {
      return <Bed className="w-6 h-6 text-pink-400" />;
    }
    if (lName.includes('ванная') || lName.includes('санузел') || lName.includes('туалет')) {
      return <Bath className="w-6 h-6 text-sky-400" />;
    }
    if (lName.includes('улица') || lName.includes('двор') || lName.includes('сад')) {
      return <Trees className="w-6 h-6 text-emerald-400" />;
    }
    return <HelpCircle className="w-6 h-6 text-slate-400" />;
  };

  const getDeviceIcon = (device: Device) => {
    const nameLower = device.name.toLowerCase();
    if (device.type === 'light') {
      return <Lightbulb className={`w-5 h-5 ${device.status ? 'text-amber-400' : 'text-slate-500'}`} />;
    }
    if (device.type === 'climate') {
      if (nameLower.includes('кондиционер')) {
        return <Snowflake className={`w-5 h-5 ${device.status ? 'text-blue-400' : 'text-slate-500'}`} />;
      }
      return <Flame className={`w-5 h-5 ${device.status ? 'text-orange-400' : 'text-slate-500'}`} />;
    }
    if (device.type === 'security') {
      if (nameLower.includes('датчик')) {
        return <Eye className={`w-5 h-5 ${device.status ? 'text-emerald-400' : 'text-slate-500'}`} />;
      }
      return <ShieldAlert className={`w-5 h-5 ${device.status ? 'text-emerald-500' : 'text-slate-500'}`} />;
    }
    return <Cpu className="w-5 h-5 text-slate-500" />;
  };

  // Switch device toggle directly in the drawer
  const handleToggleDeviceDrawer = async (device: Device, checked: boolean) => {
    // Optimistic UI update
    setAllDevices((prev) =>
      prev.map((d) => (d.id === device.id ? { ...d, status: checked, value: checked ? (d.type === 'light' ? 80 : 22) : 0 } : d))
    );

    try {
      const stateCmd = checked ? 'reley_on' : 'reley_off';
      const result = await sendCommand(device.id, stateCmd);
      if (result.success) {
        addToast(`Успешно переключено: "${device.name}"`, 'success');
      }
    } catch (err) {
      // Graceful fallback
    }
  };

  // Change device dim/temp slider directly in the drawer
  const handleSliderChangeDrawer = async (device: Device, val: number) => {
    setAllDevices((prev) =>
      prev.map((d) => (d.id === device.id ? { ...d, value: val, status: val > 0 } : d))
    );

    try {
      const prefix = device.type === 'light' ? 'dim:' : 'temp:';
      await sendCommand(device.id, `${prefix}${val}`);
    } catch (err) {
      // Graceful fallback
    }
  };

  const handleAddDevice = (dev: Device) => {
    // Find if device is already assigned to some other room
    const otherRoom = rooms.find((r) => r.deviceIds.includes(dev.id));
    if (otherRoom) {
      addToast(`Устройство "${dev.name}" уже привязано к комнате "${otherRoom.name}"!`, 'error');
      return;
    }

    addDeviceToRoom(room.id, dev.id);
    addToast(`Устройство "${dev.name}" успешно добавлено в сектор "${room.name}"`, 'success');
  };

  const handleRemoveDevice = (devId: string, devName: string) => {
    removeDeviceFromRoom(room.id, devId);
    addToast(`Устройство "${devName}" отключено от сектора "${room.name}"`, 'info');
  };

  // Determine if room has climate sensor
  const hasClimate = room.deviceIds.some((id) => {
    const dev = allDevices.find((d) => d.id === id);
    return dev && dev.type === 'climate';
  });

  return createPortal(
    <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-brand-panel backdrop-blur-2xl border-l border-brand-border z-[150] shadow-2xl flex flex-col justify-between animate-slide-in-right text-left">
      {/* Background soft blob */}
      <div 
        className="absolute -top-20 -right-20 w-44 h-44 rounded-full blur-[80px] opacity-10 pointer-events-none"
        style={{ backgroundColor: 'var(--app-primary)' }}
      />

      {/* Header element */}
      <div className="p-6 border-b border-brand-border flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-brand-accent-muted border border-brand-border rounded-brand">
            {getRoomIcon(room.name)}
          </div>
          <div>
            <h2 className="text-lg font-black text-brand-panel-text leading-none">{room.name}</h2>
            <span className="text-[10px] text-brand-muted font-bold tracking-wider uppercase mt-1.5 block">Детали сектора SmashCore</span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-brand-input border border-brand-border flex items-center justify-center text-brand-muted hover:text-brand-panel-text transition-all cursor-pointer font-bold"
          title="Закрыть панель"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body content scrollable */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 relative z-10">
        {/* Description card */}
        <div className="p-4 bg-brand-input/40 border border-brand-border/50 rounded-brand text-xs font-semibold leading-relaxed text-brand-muted">
          <span className="text-brand-panel-text font-bold block mb-1">ОПИСАНИЕ СЕКТОРА</span>
          {room.description || 'Климатический узел SmashCore.'}
        </div>

        {/* Dynamic Microclimate readings (Shown ONLY if room has climate devices as requested) */}
        {hasClimate ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-brand-input border border-brand-border rounded-brand flex items-center gap-3">
              <Thermometer className="w-8 h-8 text-orange-400" />
              <div>
                <span className="text-[10px] text-brand-muted uppercase font-bold tracking-wider leading-none">Температура</span>
                <span className="text-xl font-black text-brand-panel-text font-mono mt-1 block">{room.temperature}°C</span>
              </div>
            </div>
            <div className="p-4 bg-brand-input border border-brand-border rounded-brand flex items-center gap-3">
              <Droplets className="w-8 h-8 text-blue-400" />
              <div>
                <span className="text-[10px] text-brand-muted uppercase font-bold tracking-wider leading-none">Влажность</span>
                <span className="text-xl font-black text-brand-panel-text font-mono mt-1 block">{room.humidity}%</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-brand-accent-muted/40 border border-brand-border rounded-brand text-[10px] font-bold text-brand-muted uppercase flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-slate-500" />
            <span>Датчики климата не найдены в секторе</span>
          </div>
        )}

        {/* Current Devices section */}
        <div>
          <h3 className="text-xs font-extrabold text-brand-panel-text uppercase tracking-wider mb-3 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-brand-primary" style={{ color: 'var(--app-primary)' }} />
            Активные приборы ({room.deviceIds.length})
          </h3>

          {loading ? (
            <div className="text-center py-6 text-brand-muted text-xs font-semibold">Опрос устройств...</div>
          ) : roomDevices.length === 0 ? (
            <div className="p-6 bg-brand-input border border-dashed border-brand-border text-center rounded-brand text-xs text-brand-muted font-medium">
              Нет подключенных приборов в этой комнате. Установите связь ниже.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {roomDevices.map((dev) => (
                <div 
                  key={dev.id}
                  className="p-3.5 bg-brand-input border border-brand-border rounded-brand flex flex-col gap-3 transition-colors hover:border-brand-primary/45"
                >
                  <div className="flex justify-between items-center bg-transparent">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-brand-accent-muted rounded border border-brand-border">
                        {getDeviceIcon(dev)}
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-brand-panel-text truncate max-w-[150px]">{dev.name}</h4>
                        <span className="text-[9px] text-brand-muted uppercase font-bold tracking-wider mt-0.5 block">{dev.type}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Control button */}
                      <button
                        onClick={() => handleToggleDeviceDrawer(dev, !dev.status)}
                        className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded border cursor-pointer border-0 ${
                          dev.status 
                            ? 'bg-brand-primary text-slate-950 font-black' 
                            : 'bg-brand-accent-muted text-brand-muted hover:text-brand-panel-text'
                        }`}
                        style={{
                          backgroundColor: dev.status ? 'var(--app-primary)' : undefined,
                          color: dev.status ? '#000' : undefined
                        }}
                      >
                        {dev.status ? 'ВКЛ' : 'ВЫКЛ'}
                      </button>

                      {/* Remove anchor button */}
                      <button
                        onClick={() => handleRemoveDevice(dev.id, dev.name)}
                        className="p-1.5 border border-brand-border text-brand-muted hover:text-red-500 rounded bg-brand-input cursor-pointer"
                        title="Отвязать от комнаты"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Range adjusters if active lights / climate */}
                  {dev.status && (dev.type === 'light' || dev.type === 'climate') && (
                    <div className="flex items-center gap-3 border-t border-brand-border/60 pt-2.5">
                      <Sliders className="w-3 h-3 text-brand-muted" />
                      <input
                        type="range"
                        min={dev.type === 'light' ? 0 : 16}
                        max={dev.type === 'light' ? 100 : 30}
                        value={dev.value}
                        onChange={(e) => handleSliderChangeDrawer(dev, parseInt(e.target.value, 10))}
                        className="flex-1 h-1 bg-brand-accent-muted rounded-lg appearance-none cursor-pointer accent-brand"
                        style={{ accentColor: 'var(--app-primary)' }}
                      />
                      <span className="text-[10px] font-black font-mono text-brand-panel-text w-8 text-right">
                        {dev.value}{dev.type === 'light' ? '%' : '°C'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Link/Add Devices section */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-extrabold text-brand-panel-text uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-green-500" />
              Привязать прибор
            </h3>
            <span className="text-[9px] text-brand-muted font-bold font-mono">СВОБОДНЫЕ СЕНСОРЫ</span>
          </div>

          <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
            {loading ? (
              <div className="text-center py-4 text-brand-muted text-xs">Загрузка...</div>
            ) : availableDevices.length === 0 ? (
              <p className="text-[11px] text-brand-muted italic py-1.5">Все системные устройства уже заняты!</p>
            ) : (
              availableDevices.map((dev) => {
                // Check if already bound to another room
                const otherRoom = rooms.find((r) => r.deviceIds.includes(dev.id));
                const isAssigned = !!otherRoom;

                return (
                  <div 
                    key={dev.id}
                    className="p-2.5 bg-brand-input/60 border border-brand-border/60 rounded-brand flex justify-between items-center hover:border-brand-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1 px-1.5 bg-brand-accent-muted rounded border border-brand-border">
                        {getDeviceIcon(dev)}
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-bold text-brand-panel-text leading-tight block truncate max-w-[160px]">{dev.name}</span>
                        <span className="text-[9px] text-brand-muted mt-0.5 block">
                          {isAssigned ? `🔒 (Занят: ${otherRoom.name})` : 'Доступно для привязки'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddDevice(dev)}
                      disabled={isAssigned}
                      className={`py-1.5 px-3 rounded text-[10px] uppercase font-black transition-all border-0 flex items-center gap-1 cursor-pointer ${
                        isAssigned 
                          ? 'bg-brand-accent-muted/65 text-brand-muted cursor-not-allowed' 
                          : 'bg-emerald-500 text-slate-950 hover:brightness-110'
                      }`}
                    >
                      {isAssigned ? <Lock className="w-3 h-3" /> : <Plus className="w-3.5 h-3.5" />}
                      <span>{isAssigned ? 'Занят' : 'Связать'}</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Footer controls */}
      <div className="p-6 border-t border-brand-border bg-brand-input/40 relative z-10 flex gap-4">
        <button
          onClick={onClose}
          className="flex-1 py-3 bg-brand-accent-muted hover:bg-brand-accent-muted/80 text-brand-panel-text font-black text-xs uppercase tracking-wider rounded-brand transition-all text-center border border-brand-border cursor-pointer select-none"
          style={{ borderRadius: 'var(--app-radius)' }}
        >
          Готово
        </button>
      </div>
    </div>,
    document.body
  );
}

export default RoomDetailsDrawer;
