import { useState, useEffect, FormEvent } from 'react';
import { useAppStore, RoomInfo } from '../store/useAppStore';
import { Card } from '../components/ui/Card';
import { getDevices, Device } from '../api/endpoints';
import { RoomDetailsDrawer } from '../components/modals/RoomDetailsDrawer';
import { 
  Sofa, CookingPot, Bed, Bath, Trees, HelpCircle,
  Plus, Trash2, Thermometer, Droplets, Cpu, ListCollapse,
  Lightbulb, Snowflake, ShieldAlert, Eye, Flame, AlertCircle, X, Check
} from 'lucide-react';

export function Rooms() {
  const rooms = useAppStore((state) => state.rooms);
  const addRoom = useAppStore((state) => state.addRoom);
  const removeRoom = useAppStore((state) => state.removeRoom);
  const addDeviceToRoom = useAppStore((state) => state.addDeviceToRoom);
  const removeDeviceFromRoom = useAppStore((state) => state.removeDeviceFromRoom);
  const addToast = useAppStore((state) => state.addToast);
  const themeMode = useAppStore((state) => state.themeMode);
  
  // Custom right-slide room drawer
  const selectedRoomId = useAppStore((state) => state.selectedRoomId);
  const setSelectedRoomId = useAppStore((state) => state.setSelectedRoomId);

  // States
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  
  // Local confirmation state for room deletion
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Fetch device list once on mount
  useEffect(() => {
    const fetchDevicesList = async () => {
      try {
        const data = await getDevices();
        setAllDevices(Array.isArray(data) ? data : []);
      } catch (err) {
        // Fallback or silent error representation
        setAllDevices([]);
      }
    };
    fetchDevicesList();
  }, []);

  const getRoomIcon = (name: string) => {
    const lName = name.toLowerCase();
    if (lName.includes('гостиная') || lName.includes('зал')) {
      return <Sofa className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />;
    }
    if (lName.includes('кухня')) {
      return <CookingPot className="w-5 h-5 text-amber-500 dark:text-amber-400" />;
    }
    if (lName.includes('спальня')) {
      return <Bed className="w-5 h-5 text-pink-500 dark:text-pink-400" />;
    }
    if (lName.includes('ванная') || lName.includes('санузел') || lName.includes('туалет')) {
      return <Bath className="w-5 h-5 text-sky-500 dark:text-sky-400" />;
    }
    if (lName.includes('улица') || lName.includes('двор') || lName.includes('сад')) {
      return <Trees className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />;
    }
    return <HelpCircle className="w-5 h-5 text-slate-500 dark:text-slate-400" />;
  };

  const getMiniDeviceIcon = (type: string) => {
    switch (type) {
      case 'light':
        return <Lightbulb className="w-3.5 h-3.5 text-amber-500" />;
      case 'climate':
        return <Thermometer className="w-3.5 h-3.5 text-sky-500" />;
      case 'security':
        return <ShieldAlert className="w-3.5 h-3.5 text-emerald-500" />;
      default:
        return <Cpu className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const handleCreateRoom = (e: FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) {
      addToast('Пожалуйста, укажите название комнаты', 'error');
      return;
    }
    addRoom(newRoomName, newRoomDesc || 'Умный сектор контроля');
    addToast(`Комната "${newRoomName}" успешно добавлена`, 'success');
    setNewRoomName('');
    setNewRoomDesc('');
    setShowAddForm(false);
  };

  const handleDeleteRoom = (id: string, name: string) => {
    removeRoom(id);
    addToast(`Комната "${name}" удалена`, 'info');
    setConfirmDeleteId(null);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto select-none animate-fade-in text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-brand-panel-text flex items-center gap-3">
            <ListCollapse className="w-8 h-8 text-brand-primary" style={{ color: 'var(--app-primary)' }} />
            Управление комнатами и секторами
          </h1>
          <p className="text-sm text-brand-muted mt-1 font-medium">
            Конфигурируйте пространственные зоны вашего дома и считывайте климатический статус каждой комнаты.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="py-2.5 px-4 bg-brand-primary font-extrabold text-xs rounded-brand hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer select-none border-0"
          style={{ 
            borderRadius: 'var(--app-radius)',
            backgroundColor: 'var(--app-primary)',
            color: themeMode === 'light' ? '#ffffff' : '#05070a'
          }}
        >
          <Plus className="w-4 h-4" />
          {showAddForm ? 'Скрыть форму' : 'Добавить комнату'}
        </button>
      </div>

      {showAddForm && (
        <Card className="max-w-xl animate-scale-in">
          <form onSubmit={handleCreateRoom} className="flex flex-col gap-4">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-brand-panel-text">Новая комната</h3>
            <div className="flex flex-col gap-2">
              <label htmlFor="room-name" className="text-xs font-bold text-brand-muted">Название комнаты (например: Детская, Кабинет)</label>
              <input
                id="room-name"
                type="text"
                placeholder="Детская комната"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="w-full bg-brand-input border border-brand-border focus:border-brand-primary rounded-brand py-2.5 px-4 text-xs text-brand-panel-text outline-none transition-colors"
                style={{ borderRadius: 'var(--app-radius)' }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="room-desc" className="text-xs font-bold text-brand-muted">Описание или назначение</label>
              <input
                id="room-desc"
                type="text"
                placeholder="Для отдыха детей и контроля температуры"
                value={newRoomDesc}
                onChange={(e) => setNewRoomDesc(e.target.value)}
                className="w-full bg-brand-input border border-brand-border focus:border-brand-primary rounded-brand py-2.5 px-4 text-xs text-brand-panel-text outline-none transition-colors"
                style={{ borderRadius: 'var(--app-radius)' }}
              />
            </div>
            <div className="flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="py-2.5 px-4 bg-brand-accent-muted text-xs font-bold text-brand-muted hover:text-brand-panel-text rounded-brand border border-brand-border transition-all cursor-pointer"
                style={{ borderRadius: 'var(--app-radius)' }}
              >
                Отмена
              </button>
              <button
                type="submit"
                className="py-2.5 px-5 bg-brand-primary font-extrabold text-xs rounded-brand transition-all cursor-pointer border-0"
                style={{ 
                  borderRadius: 'var(--app-radius)',
                  backgroundColor: 'var(--app-primary)',
                  color: themeMode === 'light' ? '#ffffff' : '#05070a'
                }}
              >
                Сохранить
              </button>
            </div>
          </form>
        </Card>
      )}

      {rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-brand-panel border border-brand-border rounded-brand p-8">
          <Sofa className="w-12 h-12 text-brand-muted mb-3" />
          <h3 className="font-bold text-brand-panel-text text-md">Нет активных комнат</h3>
          <p className="text-xs text-brand-muted mt-1 max-w-xs text-center">
            Используйте кнопку в правом верхнем углу, чтобы разместить новые сектора в доме.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up mt-2">
          {rooms.map((room) => {
            const hasClimate = room.deviceIds.some((id) => {
              const dev = allDevices.find(d => d.id === id);
              return dev && dev.type === 'climate';
            });
            return (
              <Card 
                key={room.id} 
                hoverEffect 
                onClick={() => setSelectedRoomId(room.id)}
                className="min-h-[20rem] h-auto flex flex-col justify-between relative group overflow-hidden cursor-pointer"
              >
                {/* Absolutly positioned custom confirm overlay instead of blocker alert popup */}
              {confirmDeleteId === room.id && (
                <div className="absolute inset-0 bg-brand-panel/95 backdrop-blur-md z-30 flex flex-col items-center justify-center gap-4 text-center p-6 rounded-brand animate-fade-in border border-red-500/30">
                  <span className="p-3 bg-red-500/10 rounded-full text-red-500">
                    <Trash2 className="w-6 h-6" />
                  </span>
                  <div className="flex flex-col gap-1 px-2">
                    <h4 className="font-bold text-sm text-brand-panel-text">Удалить комнату?</h4>
                    <p className="text-[11px] text-brand-muted leading-snug">Все привязанные к "{room.name}" устройства будут отвязаны.</p>
                  </div>
                  <div className="flex gap-2.5 w-full max-w-[200px] mt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(null);
                      }}
                      className="flex-1 py-2 px-3 bg-brand-accent-muted text-brand-panel-text text-xs font-bold rounded-brand border border-brand-border cursor-pointer hover:bg-brand-accent-muted/80 transition-colors"
                      style={{ borderRadius: 'var(--app-radius)' }}
                    >
                      Отмена
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRoom(room.id, room.name);
                      }}
                      className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-brand shadow cursor-pointer border-0 transition-colors"
                      style={{ borderRadius: 'var(--app-radius)' }}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-start">
                <div 
                  className="p-3 bg-brand-accent-muted border border-brand-border rounded-brand flex items-center justify-center"
                  style={{ borderRadius: 'calc(var(--app-radius) * 0.8)' }}
                >
                  {getRoomIcon(room.name)}
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDeleteId(room.id);
                  }}
                  className="p-2 bg-brand-accent-muted hover:bg-red-500/10 text-brand-muted hover:text-red-500 border border-brand-border rounded-brand transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                  style={{ borderRadius: 'calc(var(--app-radius) * 0.7)' }}
                  title="Удалить сектор"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-4 flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-brand-panel-text text-lg leading-tight">
                    {room.name}
                  </h3>
                  <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                    {room.description}
                  </p>
                </div>

                {/* Sub-component block: List of devices inside the room */}
                <div className="mt-3.5">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1.5">Устройства в секторе:</h4>
                  {room.deviceIds.length === 0 ? (
                    <p className="text-[11px] text-brand-muted/70 italic">Устройства отсутствуют</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                      {room.deviceIds.map((devId) => {
                        const dev = allDevices.find(d => d.id === devId);
                        if (!dev) return null;
                        return (
                          <span 
                            key={devId}
                            className="inline-flex items-center gap-1.5 text-[10px] bg-brand-accent-muted text-brand-panel-text border border-brand-border pl-2 pr-1.5 py-1 rounded-full group/tag animate-fade-in"
                          >
                            {getMiniDeviceIcon(dev.type)}
                            <span className="truncate max-w-[90px] font-medium">{dev.name}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeDeviceFromRoom(room.id, devId);
                                addToast(`Устройство "${dev.name}" отключено от сектора`, 'info');
                              }}
                              className="text-brand-muted hover:text-red-500 font-bold ml-1 cursor-pointer hover:bg-white/5 dark:hover:bg-black/25 w-3.5 h-3.5 rounded-full inline-flex items-center justify-center border-0 text-[10px]"
                              title="Отключить устройство"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Dropdown connector tool to satisfy Task 2 and 3 validation */}
                <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                  <select
                    value=""
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      if (selectedId) {
                        const otherRoom = rooms.find(r => r.deviceIds.includes(selectedId));
                        if (otherRoom) {
                          addToast(`Ошибка: данное устройство уже занято комнатой "${otherRoom.name}"!`, 'error');
                          return;
                        }
                        
                        addDeviceToRoom(room.id, selectedId);
                        const devName = allDevices.find(d => d.id === selectedId)?.name || selectedId;
                        addToast(`"${devName}" подключено к сектору "${room.name}"`, 'success');
                      }
                    }}
                    className="w-full bg-brand-input border border-brand-border hover:border-brand-primary/50 text-brand-panel-text text-[11px] font-bold rounded-brand py-2 px-2.5 outline-none cursor-pointer transition-all appearance-none"
                    style={{ borderRadius: 'calc(var(--app-radius) * 0.8)' }}
                  >
                    <option value="" disabled>+ Подключить прибор...</option>
                    {allDevices.map((d) => {
                      // Determine assignment
                      const otherRoom = rooms.find(r => r.deviceIds.includes(d.id));
                      const isAssigned = !!otherRoom;
                      return (
                        <option 
                          key={d.id} 
                          value={d.id}
                          disabled={isAssigned}
                          className="text-brand-panel-text bg-brand-panel"
                        >
                          {d.name} {isAssigned ? `🔒 (Занят: ${otherRoom.name})` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Dynamic status footer representing room microclimate */}
              <div className="flex items-center justify-between mt-4.5 pt-3 border-t border-brand-border text-xs text-brand-muted font-bold">
                <div className="flex items-center gap-3">
                  {hasClimate ? (
                    <>
                      <div className="flex items-center gap-1">
                        <Thermometer className="w-3.5 h-3.5 text-orange-400" />
                        <span className="font-bold text-brand-panel-text font-mono">{room.temperature}°C</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Droplets className="w-3.5 h-3.5 text-blue-400" />
                        <span className="font-bold text-brand-panel-text font-mono">{room.humidity}%</span>
                      </div>
                    </>
                  ) : (
                    <span className="text-[9px] uppercase tracking-wider text-brand-muted font-bold font-mono">Климат не установлен</span>
                  )}
                </div>

                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-brand bg-brand-accent-muted text-[10px] uppercase font-mono tracking-wider font-bold text-brand-muted border border-brand-border">
                  <Cpu className="w-3 h-3 text-indigo-400" />
                  <span>{room.deviceIds.length} приборов</span>
                </div>
              </div>
            </Card>
          )})}
        </div>
      )}

      {/* Slide-out Room Details panel */}
      <RoomDetailsDrawer 
        roomId={selectedRoomId} 
        onClose={() => setSelectedRoomId(null)} 
      />
    </div>
  );
}

export default Rooms;
