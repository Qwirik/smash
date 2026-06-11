import React, { useState, useEffect, FormEvent } from 'react';
import { Card } from '../components/ui/Card';
import { useAppStore, CustomScenario } from '../store/useAppStore';
import { getDevices, sendCommand, Device } from '../api/endpoints';
import { 
  Sun, Moon, Sunrise, Sunset, 
  Shield, Film, Home as HomeIcon,
  Sofa, CookingPot, Bed, Server, Thermometer, ArrowUpRight,
  MoveUp, MoveDown, Sliders, CloudSun, Loader2,
  Plus, Zap, HeartPulse, Clock, Sparkles, Trash2, Power,
  Lightbulb, Snowflake, Flame, Coffee, ShieldAlert, Eye,
  GripVertical, Activity, Wifi, Wind, SunDim, Lock, Unlock, Calendar, Video, Cpu
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface WidgetSize {
  cols: number;
  rows: number;
}

const getWidgetSize = (sectionId: string, sizes: Record<string, any>): WidgetSize => {
  const size = sizes[sectionId];
  if (!size) {
    if (sectionId === 'scenarios' || sectionId === 'energy') return { cols: 3, rows: 2 };
    if (sectionId === 'atmosphere' || sectionId === 'security' || sectionId === 'devices' || sectionId === 'weather') return { cols: 2, rows: 1 };
    return { cols: 1, rows: 1 };
  }
  if (typeof size === 'string') {
    if (size === 'small') return { cols: 1, rows: 1 };
    if (size === 'medium') return { cols: 2, rows: 1 };
    if (size === 'large') return { cols: 3, rows: 2 };
  }
  return {
    cols: typeof size.cols === 'number' ? size.cols : 2,
    rows: typeof size.rows === 'number' ? size.rows : 1,
  };
};

export function Dashboard() {
  const primaryColor = useAppStore((state) => state.primaryColor);
  const bgColor = useAppStore((state) => state.bgColor);

  const isDark = (() => {
    const color = bgColor.startsWith('#') ? bgColor.slice(1) : bgColor;
    if (color.length !== 6) return true;
    const r = parseInt(color.slice(0, 2), 16);
    const g = parseInt(color.slice(2, 4), 16);
    const b = parseInt(color.slice(4, 6), 16);
    const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));
    return hsp < 155;
  })();

  const addToast = useAppStore((state) => state.addToast);
  
  // Custom layout states in Zustand
  const dashboardOrder = useAppStore((state) => state.dashboardOrder) || ['scenarios', 'energy', 'atmosphere', 'rooms'];
  const setDashboardOrder = useAppStore((state) => state.setDashboardOrder);
  const dashboardSizes = useAppStore((state) => state.dashboardSizes) || {};
  const setDashboardSizes = useAppStore((state) => state.setDashboardSizes);

  // Authenticated states
  const rooms = useAppStore((state) => state.rooms);
  const customScenarios = useAppStore((state) => state.customScenarios);
  const addCustomScenario = useAppStore((state) => state.addCustomScenario);
  const removeCustomScenario = useAppStore((state) => state.removeCustomScenario);
  const toggleCustomScenario = useAppStore((state) => state.toggleCustomScenario);

  const [greeting, setGreeting] = useState('Добрый день');
  const [greetingIcon, setGreetingIcon] = useState(<Sun className="w-6 h-6 text-yellow-400" />);
  const [activeScenario, setActiveScenario] = useState<'away' | 'movie' | 'active'>('active');
  const [reorderMode, setReorderMode] = useState(false);
  const [showScenarioForm, setShowScenarioForm] = useState(false);

  // Weather States
  const [weatherTemp, setWeatherTemp] = useState<number | null>(null);
  const [weatherHumidity, setWeatherHumidity] = useState<number | null>(null);
  const [weatherCode, setWeatherCode] = useState<number>(0);
  const [weatherLoading, setWeatherLoading] = useState(true);

  // Quick favorite devices tracking
  const [favoriteDevices, setFavoriteDevices] = useState<Device[]>([]);
  const [favLoading, setFavLoading] = useState(false);

  // Security interactive state
  const [securityStatus, setSecurityStatus] = useState<'armed' | 'disarmed' | 'home'>('disarmed');
  const [securityCountdown, setSecurityCountdown] = useState<number | null>(null);

  // Real-time ticking Clock
  const [clockTime, setClockTime] = useState(new Date());

  // New Scenario Builder inputs
  const [newScenName, setNewScenName] = useState('');
  const [newScenTriggerType, setNewScenTriggerType] = useState<'temp' | 'time' | 'motion' | 'manual'>('temp');
  const [newScenTriggerVal, setNewScenTriggerVal] = useState('24');
  const [newScenDevice, setNewScenDevice] = useState('Люстра');
  const [newScenActionType, setNewScenActionType] = useState<'on' | 'off' | 'value'>('on');
  const [newScenActionValue, setNewScenActionValue] = useState(80);
  const [newScenIcon, setNewScenIcon] = useState<string>('lightbulb');

  // Tab and Console commands configuration
  const [scenarioTab, setScenarioTab] = useState<'standard' | 'cli'>('standard');
  const [cliCommand, setCliCommand] = useState('');
  const [cliFeedback, setCliFeedback] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Widget Metadata catalogs
  const WIDGET_METADATA: Record<string, { name: string, description: string, defaultSize: { cols: number; rows: number }, icon: any }> = {
    scenarios: {
      name: 'Сценарный узел',
      description: 'Управление автоматическими правилами и запуск сценариев',
      defaultSize: { cols: 3, rows: 2 },
      icon: Zap
    },
    energy: {
      name: 'Энергопотребление',
      description: 'Аналитический график суточного или недельного расхода кВт·ч',
      defaultSize: { cols: 3, rows: 2 },
      icon: HeartPulse
    },
    atmosphere: {
      name: 'Микроклимат дома',
      description: 'Температура внутри и снаружи с интеграцией метеослужбы',
      defaultSize: { cols: 2, rows: 1 },
      icon: Thermometer
    },
    rooms: {
      name: 'Комнаты и сектора',
      description: 'Сводка по активным приборам в комнатах SmashCore',
      defaultSize: { cols: 1, rows: 2 },
      icon: Sofa
    },
    security: {
      name: 'Купол безопасности',
      description: 'Статус взлома/охраны, симуляция камер и лог герконов',
      defaultSize: { cols: 2, rows: 1 },
      icon: Shield
    },
    devices: {
      name: 'Быстрые приборы',
      description: 'Интерактивные переключатели главных смарт-сенсоров',
      defaultSize: { cols: 2, rows: 1 },
      icon: Cpu
    },
    clock: {
      name: 'Системное время',
      description: 'Атомные цифровые часы с индикацией аптайма ядра',
      defaultSize: { cols: 1, rows: 1 },
      icon: Clock
    },
    weather: {
      name: 'Расширенная погода',
      description: 'Прогноз силы ветра, атмосферного давления и УФ-индекса',
      defaultSize: { cols: 2, rows: 1 },
      icon: CloudSun
    }
  };

  // HTML5 Drag & Drop State
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  // Ticking systems on mount
  useEffect(() => {
    const timer = setInterval(() => {
      setClockTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch favorite devices on mount
  useEffect(() => {
    setFavLoading(true);
    getDevices()
      .then((data) => setFavoriteDevices(Array.isArray(data) ? data : []))
      .catch(() => setFavoriteDevices([]))
      .finally(() => setFavLoading(false));
  }, []);

  const parseCommand = (commandStr: string): CustomScenario | string => {
    const parts = commandStr.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) {
      return 'Укажите команду.';
    }

    const action = parts[0].toLowerCase();
    
    if (action === 'addrule') {
      if (parts.length < 7) {
        return 'Формат: addrule <name> <trig_dev> <cond> <val> <act_dev> <act_cmd>';
      }
      const [_, name, trigDev, cond, val, actDev, actCmd] = parts;
      const cleanName = name.replace(/_/g, ' ');
      const cleanTrigDev = trigDev.replace(/_/g, ' ');
      const cleanActDev = actDev.replace(/_/g, ' ');

      let triggerType: 'temp' | 'motion' | 'time' | 'manual' = 'temp';
      const condLower = cond.toLowerCase();
      const valLower = val.toLowerCase();
      if (condLower === 'движение' || condLower.includes('move') || valLower.includes('mo') || condLower === 'motion') {
        triggerType = 'motion';
      }

      let actionType: 'on' | 'off' | 'value' = 'on';
      let actionVal = 80;
      if (actCmd === 'off') {
        actionType = 'off';
        actionVal = 0;
      } else if (actCmd === 'on') {
        actionType = 'on';
        actionVal = 80;
      } else {
        const parsedNum = parseInt(actCmd, 10);
        if (!isNaN(parsedNum)) {
          actionType = 'value';
          actionVal = parsedNum;
        }
      }

      return {
        id: 'scen-' + Math.random().toString(36).substring(2, 9),
        name: cleanName,
        triggerType,
        triggerValue: triggerType === 'motion' ? 'Движение' : `${cond} ${val}`,
        actionDevice: cleanActDev,
        actionType,
        actionValue: actionVal,
        enabled: true,
      };
    }

    if (action === 'addtimer') {
      if (parts.length < 5) {
        return 'Формат: addtimer <name> <HH:MM> <act_dev> <act_cmd>';
      }
      const [_, name, timeStr, actDev, actCmd] = parts;

      if (!/^\d{2}:\d{2}$/.test(timeStr)) {
        return 'Неверный формат времени. Ожидается HH:MM (например: 22:30)';
      }

      const cleanName = name.replace(/_/g, ' ');
      const cleanActDev = actDev.replace(/_/g, ' ');

      let actionType: 'on' | 'off' | 'value' = 'on';
      let actionVal = 80;
      if (actCmd === 'off') {
        actionType = 'off';
        actionVal = 0;
      } else if (actCmd === 'on') {
        actionType = 'on';
        actionVal = 80;
      } else {
        const parsedNum = parseInt(actCmd, 10);
        if (!isNaN(parsedNum)) {
          actionType = 'value';
          actionVal = parsedNum;
        }
      }

      return {
        id: 'scen-' + Math.random().toString(36).substring(2, 9),
        name: cleanName,
        triggerType: 'time',
        triggerValue: timeStr,
        actionDevice: cleanActDev,
        actionType,
        actionValue: actionVal,
        enabled: true,
      };
    }

    return 'Неизвестная команда. Доступны: addrule, addtimer';
  };

  const handleCreateScenarioCli = (e: FormEvent) => {
    e.preventDefault();
    setCliFeedback(null);
    if (!cliCommand.trim()) {
      setCliFeedback({ type: 'error', text: 'Пожалуйста, введите команду сценария' });
      return;
    }

    const result = parseCommand(cliCommand);
    if (typeof result === 'string') {
      setCliFeedback({ type: 'error', text: result });
      addToast(result, 'error');
    } else {
      addCustomScenario(result);
      addToast(`Добавлен сценарий: "${result.name}"`, 'success');
      setCliFeedback({ type: 'success', text: `Готово! Успешно зарегистрирован сценарий "${result.name}"` });
      setCliCommand('');
    }
  };

  // Dynamic diurnal welcome messages
  useEffect(() => {
    const hours = new Date().getHours();
    if (hours >= 5 && hours < 12) {
      setGreeting('Доброе утро');
      setGreetingIcon(<Sunrise className="w-8 h-8 text-amber-400" />);
    } else if (hours >= 12 && hours < 18) {
      setGreeting('Добрый день');
      setGreetingIcon(<Sun className="w-8 h-8 text-yellow-500 animate-[spin_10s_linear_infinite]" />);
    } else if (hours >= 18 && hours < 23) {
      setGreeting('Добрый вечер');
      setGreetingIcon(<Sunset className="w-8 h-8 text-orange-400" />);
    } else {
      setGreeting('Доброй ночи');
      setGreetingIcon(<Moon className="w-8 h-8 text-sky-300" />);
    }
  }, []);

  // Public Weather integration (Open-Meteo)
  useEffect(() => {
    let active = true;
    async function fetchWeather() {
      try {
        setWeatherLoading(true);
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=55.7558&longitude=37.6173&current=temperature_2m,relative_humidity_2m,weather_code'
        );
        if (!res.ok) throw new Error('Unreachable weather host');
        const data = await res.json();
        if (active && data?.current) {
          setWeatherTemp(Math.round(data.current.temperature_2m));
          setWeatherHumidity(data.current.relative_humidity_2m);
          setWeatherCode(data.current.weather_code);
        }
      } catch (err) {
        // Handled gracefully
      } finally {
        if (active) setWeatherLoading(false);
      }
    }
    fetchWeather();
    return () => { active = false; };
  }, []);

  const triggerScenario = (type: 'away' | 'movie' | 'active', label: string) => {
    setActiveScenario(type);
    addToast(`Сценарий "${label}" активирован по сети`, 'success');
  };

  // Reordering handler
  const shiftTile = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...dashboardOrder];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx >= 0 && targetIdx < newOrder.length) {
      const temp = newOrder[index];
      newOrder[index] = newOrder[targetIdx];
      newOrder[targetIdx] = temp;
      setDashboardOrder(newOrder);
      addToast('Положение плитки изменено', 'success');
    }
  };

  // Size sizing handler
  const setTileSize = (sectionId: string, cols: number, rows: number) => {
    const nextSizes = { ...dashboardSizes, [sectionId]: { cols, rows } };
    setDashboardSizes(nextSizes);
  };

  // Adding new widgets
  const handleAddWidget = (id: string) => {
    if (dashboardOrder.includes(id)) return;
    const defaultSz = WIDGET_METADATA[id]?.defaultSize || { cols: 2, rows: 1 };
    setDashboardOrder([...dashboardOrder, id]);
    setTileSize(id, defaultSz.cols, defaultSz.rows);
    addToast(`Виджет "${WIDGET_METADATA[id]?.name}" успешно добавлен на главный экран!`, 'success');
  };

  // Removing standard / custom widgets
  const handleRemoveWidget = (id: string) => {
    const newOrder = dashboardOrder.filter((w) => w !== id);
    setDashboardOrder(newOrder);
    addToast(`Виджет "${WIDGET_METADATA[id]?.name || id}" скрыт`, 'info');
  };

  // Modern Pointer Events Drag-to-Resize with 2D snapping feedback
  const handleResizeStart = (
    e: React.PointerEvent<HTMLDivElement>,
    sectionId: string,
    direction: 'r' | 'b' | 'br'
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const handleElement = e.currentTarget;
    handleElement.setPointerCapture(e.pointerId);

    const cardElement = handleElement.closest('.dashboard-tile') as HTMLElement;
    if (!cardElement) return;

    const startX = e.clientX;
    const startY = e.clientY;

    const gridContainer = cardElement.parentElement;
    const gridRect = gridContainer ? gridContainer.getBoundingClientRect() : null;
    
    // Gap and column width math in px of the responsive grid
    const colWidth = gridRect ? (gridRect.width - 48) / 3 : 360; 
    const rowHeight = 170; // unit block rows

    const currentSize = getWidgetSize(sectionId, dashboardSizes);
    const startCols = currentSize.cols;
    const startRows = currentSize.rows;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      let nextCols = startCols;
      let nextRows = startRows;

      if (direction === 'r' || direction === 'br') {
        const additionalCols = Math.round(deltaX / colWidth);
        nextCols = Math.max(1, Math.min(3, startCols + additionalCols));
      }

      if (direction === 'b' || direction === 'br') {
        const additionalRows = Math.round(deltaY / rowHeight);
        nextRows = Math.max(1, Math.min(4, startRows + additionalRows));
      }

      if (nextCols !== currentSize.cols || nextRows !== currentSize.rows) {
        setTileSize(sectionId, nextCols, nextRows);
      }
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      handleElement.releasePointerCapture(upEvent.pointerId);
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      addToast(`Размер "${WIDGET_METADATA[sectionId]?.name || sectionId}" зафиксирован`, 'info');
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  };

  // HTML5 drag and drop routines
  const handleDragStart = (index: number) => {
    if (!reorderMode) return;
    setDraggedIdx(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!reorderMode) return;
    e.preventDefault();
  };

  const handleDrop = (targetIndex: number) => {
    if (!reorderMode || draggedIdx === null) return;
    const newOrder = [...dashboardOrder];
    const [removed] = newOrder.splice(draggedIdx, 1);
    newOrder.splice(targetIndex, 0, removed);
    setDashboardOrder(newOrder);
    setDraggedIdx(null);
    addToast('Положение плитки отрегулировано', 'success');
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  const renderScenarioIcon = (iconKey?: string, enabled = false) => {
    const cls = `w-5 h-5 shrink-0 transition-all ${enabled ? 'text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)] animate-pulse' : 'text-slate-500'}`;
    switch (iconKey) {
      case 'lightbulb':
        return <Lightbulb className={cls} />;
      case 'snowflake':
        return <Snowflake className={`${cls} ${enabled ? 'animate-spin-slow text-blue-400 drop-shadow-[0_0_6px_rgba(96,165,250,0.5)]' : ''}`} />;
      case 'shield':
        return <Shield className={cls} />;
      case 'film':
        return <Film className={cls} />;
      case 'home':
        return <HomeIcon className={cls} />;
      case 'clock':
        return <Clock className={cls} />;
      case 'flame':
        return <Flame className={cls} />;
      case 'coffee':
        return <Coffee className={cls} />;
      default:
        return <Clock className={cls} />;
    }
  };

  const handleCreateScenario = (e: FormEvent) => {
    e.preventDefault();
    if (!newScenName.trim()) {
      addToast('Пожалуйста, введите название сценария', 'error');
      return;
    }

    const payload: CustomScenario = {
      id: 'scen-' + Math.random().toString(36).substring(2, 9),
      name: newScenName,
      triggerType: newScenTriggerType,
      triggerValue: newScenTriggerType === 'motion' ? 'Движение' : newScenTriggerVal,
      actionDevice: newScenDevice,
      actionType: newScenActionType,
      actionValue: newScenActionValue,
      enabled: true,
      icon: newScenIcon,
    };

    addCustomScenario(payload);
    addToast(`Сценарий "${newScenName}" успешно сконфигурирован`, 'success');
    setNewScenName('');
    setShowScenarioForm(false);
  };

  const renderWeatherBadge = () => {
    if (weatherLoading) {
      return (
        <div className="flex items-center gap-1.5 py-1 px-2.5 bg-slate-950/40 rounded-full border border-white/5 animate-pulse text-[10px] text-slate-500 font-bold font-mono">
          <Loader2 className="w-2.5 h-2.5 animate-spin" />
          ПОГОДА...
        </div>
      );
    }
    const getWeatherText = (code: number) => {
      if (code === 0) return 'Ясно';
      if ([1, 2, 3].includes(code)) return 'Облачно';
      if ([45, 48].includes(code)) return 'Туман';
      if ([61, 63, 65].includes(code)) return 'Дождь';
      return 'Ясно';
    };
    const tVal = weatherTemp !== null ? weatherTemp : 12;
    const descText = getWeatherText(weatherCode);

    return (
      <div className="flex items-center gap-1.5 py-1 px-2.5 rounded-full border border-blue-500/10 text-[10px] font-bold text-blue-400 select-none bg-blue-500/5">
        <CloudSun className="w-3.5 h-3.5" />
        <span>МСК: {tVal > 0 ? `+${tVal}` : tVal}°C ({descText})</span>
      </div>
    );
  };

  const getColSpanClass = (sectionId: string) => {
    const size = getWidgetSize(sectionId, dashboardSizes);
    if (size.cols === 1) return 'col-span-1';
    if (size.cols === 2) return 'col-span-1 lg:col-span-2';
    return 'col-span-1 lg:col-span-3';
  };

  const getRowSpanClass = (sectionId: string) => {
    const size = getWidgetSize(sectionId, dashboardSizes);
    if (size.rows === 1) return 'row-span-1';
    if (size.rows === 2) return 'row-span-2';
    if (size.rows === 3) return 'row-span-3';
    return 'row-span-4';
  };

  const handleToggleFavDevice = async (device: Device, forceVal?: boolean) => {
    const currentStatus = device.status;
    const nextStatus = forceVal !== undefined ? forceVal : !currentStatus;

    setFavoriteDevices((prev) => 
      prev.map((d) => d.id === device.id ? { ...d, status: nextStatus } : d)
    );

    try {
      const stateCmd = checked ? 'relay:on' : 'relay:off';
      const result = await sendCommand(device.name, stateCmd);
      if (result.success) {
        addToast(`Переключено в эфире: "${device.name}"`, 'success');
      }
    } catch {
      addToast('Нет связи с микроконтроллером', 'error');
    }
  };

  // Interactive security setup
  const toggleSecurityStatus = (mode: 'armed' | 'disarmed' | 'home') => {
    if (mode === 'armed') {
      setSecurityCountdown(5);
      addToast('Запуск пре-контурного таймера защиты крепления...', 'info');
    } else {
      setSecurityCountdown(null);
      setSecurityStatus(mode);
      addToast(`Режим охраны изменен: ${mode === 'home' ? 'Периметр Плюс' : 'Снято с охраны'}`, 'success');
    }
  };

  useEffect(() => {
    if (securityCountdown === null) return;
    if (securityCountdown <= 0) {
      setSecurityStatus('armed');
      setSecurityCountdown(null);
      addToast('МЕШ-СЕТЬ ЗАБЛОКИРОВАНА. Контур безопасности активен!', 'success');
      return;
    }
    const cdNode = setInterval(() => {
      setSecurityCountdown((p) => p !== null ? p - 1 : null);
    }, 1000);
    return () => clearInterval(cdNode);
  }, [securityCountdown]);

  const renderConfigOverlay = (sectionId: string, index: number) => {
    if (!reorderMode) return null;
    const currentSize = getWidgetSize(sectionId, dashboardSizes);
    return (
      <div 
        className="absolute top-2.5 inset-x-2.5 py-1.5 px-3 bg-slate-950/95 border border-white/10 rounded-brand shadow-2xl flex items-center justify-between z-40 hover:border-brand-primary" 
        style={{ borderColor: 'var(--app-primary)', borderRadius: 'var(--app-radius)' }}
      >
        <div className="flex items-center gap-1.5 text-[9px] font-mono font-extrabold text-slate-300 uppercase select-none cursor-grab active:cursor-grabbing">
          <GripVertical className="w-3.5 h-3.5 text-slate-500 animate-pulse" />
          <span>Перетяните или Измените</span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Quick Col Selection */}
          <div className="flex bg-slate-900 rounded p-0.5 border border-white/5 gap-0.5" title="Ширина в колонках">
            {([1, 2, 3] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setTileSize(sectionId, c, currentSize.rows)}
                className="px-1.5 py-0.5 rounded text-[8px] font-bold transition-all cursor-pointer border-0 font-mono"
                style={{
                  backgroundColor: currentSize.cols === c ? 'var(--app-primary)' : 'transparent',
                  color: currentSize.cols === c ? '#000' : '#888',
                }}
              >
                {c}🠔🠖
              </button>
            ))}
          </div>

          {/* Quick Row Selection */}
          <div className="flex bg-slate-900 rounded p-0.5 border border-white/5 gap-0.5" title="Высота в строках">
            {([1, 2, 3, 4] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setTileSize(sectionId, currentSize.cols, r)}
                className="px-1.5 py-0.5 rounded text-[8px] font-bold transition-all cursor-pointer border-0 font-mono"
                style={{
                  backgroundColor: currentSize.rows === r ? 'var(--app-primary)' : 'transparent',
                  color: currentSize.rows === r ? '#000' : '#888',
                }}
              >
                {r}⭥
              </button>
            ))}
          </div>

          {/* Quick Shifts & Remove */}
          <div className="flex items-center gap-1 pl-2 border-l border-white/10">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => shiftTile(index, 'up')}
              className="p-1 rounded bg-slate-900 border border-white/5 text-slate-400 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Сдвинуть левее/выше"
            >
              <MoveUp className="w-2.5 h-2.5" />
            </button>
            <button
              type="button"
              disabled={index === dashboardOrder.length - 1}
              onClick={() => shiftTile(index, 'down')}
              className="p-1 rounded bg-slate-900 border border-white/5 text-slate-400 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Сдвинуть правее/ниже"
            >
              <MoveDown className="w-2.5 h-2.5" />
            </button>
            <button
              type="button"
              onClick={() => handleRemoveWidget(sectionId)}
              className="p-1 rounded bg-red-950/20 border border-red-500/15 text-red-400 hover:text-red-100 transition-all cursor-pointer ml-1"
              title="Скрыть виджет"
            >
              <Trash2 className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const inactiveWidgets = Object.keys(WIDGET_METADATA).filter((id) => !dashboardOrder.includes(id));

  return (
    <div className="flex flex-col gap-6 select-none max-w-7xl mx-auto animate-fade-in text-left">
      
      {/* 1. Header welcome banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/20 p-6 rounded-brand border border-white/5 animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900/65 rounded-brand border border-white/10" style={{ borderRadius: 'var(--app-radius)' }}>
            {greetingIcon}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-brand-panel-text flex items-center gap-1.5">
              {greeting}!
              <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
            </h1>
            <p className="text-sm text-slate-400 mt-1 font-medium">
              Все телеметрические узлы SmashCore функционируют в защищенном режиме.
            </p>
          </div>
        </div>
        
        {/* Layout management triggers */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setReorderMode(!reorderMode)}
            className="py-2.5 px-4 rounded-brand border transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer select-none"
            style={{ 
              borderRadius: 'var(--app-radius)',
              borderColor: reorderMode ? 'var(--app-primary)' : 'var(--app-card-border)',
              backgroundColor: reorderMode ? 'var(--app-primary)' : 'var(--app-accent-muted)',
              color: reorderMode ? (isDark ? '#000' : '#fff') : 'var(--app-primary)'
            }}
          >
            <Sliders className="w-3.5 h-3.5 shrink-0" />
            {reorderMode ? 'Сохранить Панель' : 'ХАБ КОНСТРУКТОРА'}
          </button>
        </div>
      </div>

      {/* 2. Inactive catalog drawer (Shown in reorder edit mode) */}
      {reorderMode && (
        <div className="p-5 bg-brand-accent-muted/20 border border-dashed border-brand-primary/30 rounded-brand animate-fade-in flex flex-col gap-4 text-left">
          <div className="flex justify-between items-center bg-transparent">
            <div>
              <h2 className="text-xs font-black uppercase text-brand-panel-text tracking-widest flex items-center gap-1.5" style={{ color: 'var(--app-primary)' }}>
                <Plus className="w-4 h-4 text-brand-primary" style={{ color: 'var(--app-primary)' }} />
                Палитра Неактивных Виджетов Smarthome
              </h2>
              <span className="text-[10px] text-brand-muted font-bold uppercase mt-1 block">Нажмите кнопку, чтобы мгновенно разместить виджет на основном холсте</span>
            </div>
            <span className="text-[9px] font-mono text-slate-500 font-extrabold">{inactiveWidgets.length} ДОСТУПНО</span>
          </div>

          {inactiveWidgets.length === 0 ? (
            <p className="text-xs text-brand-muted italic py-1 bg-transparent">Все функциональные виджеты панели SmashCore уже развернуты.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 bg-transparent">
              {inactiveWidgets.map((widId) => {
                const widMeta = WIDGET_METADATA[widId];
                const MetaIcon = widMeta.icon;
                return (
                  <div 
                    key={widId}
                    className="p-3 bg-slate-950/60 border border-white/5 rounded flex justify-between items-center hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="p-1 px-1.5 bg-brand-accent-muted rounded text-brand-primary flex items-center justify-center shrink-0" style={{ color: 'var(--app-primary)' }}>
                        <MetaIcon className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-[11px] font-bold text-white truncate">{widMeta.name}</h4>
                        <p className="text-[9px] text-slate-500 truncate mt-0.5">{widMeta.description}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddWidget(widId)}
                      className="p-1.5 bg-brand-primary hover:brightness-110 active:scale-90 text-slate-950 font-black rounded text-[9px] uppercase cursor-pointer border-0 w-8 h-8 flex items-center justify-center font-mono shrink-0"
                      style={{ backgroundColor: 'var(--app-primary)' }}
                      title="Добавить на экран"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Grid: responsive order layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-[minmax(180px,_auto)]">
        {dashboardOrder.map((sectionId, idx) => {
          
          // CSS variables for interactive opacity during drag actions
          const isDraggingThis = draggedIdx === idx;
          const currentSize = getWidgetSize(sectionId, dashboardSizes);

          // SCENARIOS WIDGET
          if (sectionId === 'scenarios') {
            return (
              <div 
                key="scenarios" 
                draggable={reorderMode}
                onDragStart={() => handleDragStart(idx)}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDrop={() => handleDrop(idx)}
                style={{
                  opacity: isDraggingThis ? 0.35 : 1,
                  transform: isDraggingThis ? 'scale(0.98)' : 'none'
                }}
                className={`${getColSpanClass('scenarios')} ${getRowSpanClass('scenarios')} flex flex-col gap-3 relative border dashboard-tile ${reorderMode ? 'border-brand-primary mr-0.5 cursor-grab bg-slate-950/20' : 'border-transparent'} p-2 rounded-brand transition-all`}
              >
                {renderConfigOverlay('scenarios', idx)}
                
                <div className={`flex justify-between items-center pr-2 ${reorderMode ? 'pt-8' : ''}`}>
                  <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Сценарный узел SmashCore
                  </h2>
                  {!reorderMode && (
                    <button
                      type="button"
                      onClick={() => setShowScenarioForm(!showScenarioForm)}
                      className="p-1 px-2.5 bg-slate-900 border border-white/10 hover:border-white/20 rounded-brand text-[10px] font-bold text-slate-300 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                      style={{ borderRadius: 'var(--app-radius)' }}
                    >
                      <Plus className="w-3 h-3" />
                      Создать Сценарий
                    </button>
                  )}
                </div>

                {/* Scenario Builder Form */}
                {showScenarioForm && (
                  <Card className="p-5 border border-yellow-500/20 bg-slate-950/95 shadow-2xl animate-scale-in text-xs">
                    <div className="flex justify-between items-center pb-2.5 border-b border-white/5 mb-3">
                      <div className="flex bg-slate-900 rounded-brand p-1 border border-white/5 gap-1" style={{ borderRadius: 'var(--app-radius)' }}>
                        <button
                          type="button"
                          onClick={() => setScenarioTab('standard')}
                          className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all whitespace-nowrap cursor-pointer border-0`}
                          style={{
                            borderRadius: 'calc(var(--app-radius) * 0.8)',
                            backgroundColor: scenarioTab === 'standard' ? 'var(--app-primary)' : 'transparent',
                            color: scenarioTab === 'standard' ? '#000' : '#888',
                          }}
                        >
                          Конструктор
                        </button>
                        <button
                          type="button"
                          onClick={() => setScenarioTab('cli')}
                          className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all whitespace-nowrap cursor-pointer border-0`}
                          style={{
                            borderRadius: 'calc(var(--app-radius) * 0.8)',
                            backgroundColor: scenarioTab === 'cli' ? 'var(--app-primary)' : 'transparent',
                            color: scenarioTab === 'cli' ? '#000' : '#888',
                          }}
                        >
                          Ввод SmashCLI
                        </button>
                      </div>

                      <button type="button" onClick={() => setShowScenarioForm(false)} className="text-slate-500 hover:text-white font-bold select-none cursor-pointer bg-transparent border-0">Скрыть</button>
                    </div>

                    {scenarioTab === 'standard' ? (
                      <form onSubmit={handleCreateScenario} className="flex flex-col gap-3 text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2 text-left">
                          <div className="flex flex-col gap-1">
                            <label className="font-bold text-slate-400">Название сценария</label>
                            <input
                              type="text"
                              placeholder="Например: Комфортный закат"
                              value={newScenName}
                              onChange={(e) => setNewScenName(e.target.value)}
                              className="bg-slate-950 border border-slate-800 rounded p-2 text-white outline-none"
                              style={{ borderRadius: 'calc(var(--app-radius) * 0.5)' }}
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="font-bold text-slate-400">Выбор Условия (Сенсор)</label>
                            <select
                              value={newScenTriggerType}
                              onChange={(e) => setNewScenTriggerType(e.target.value as any)}
                              className="bg-slate-950 border border-slate-800 rounded p-2 text-white outline-none select"
                              style={{ borderRadius: 'calc(var(--app-radius) * 0.5)' }}
                            >
                              <option value="temp">Температура в гостиной</option>
                              <option value="time">Время на таймере</option>
                              <option value="motion">Датчик движения</option>
                              <option value="manual">Ручной запуск</option>
                            </select>
                          </div>

                          {newScenTriggerType !== 'motion' && newScenTriggerType !== 'manual' && (
                            <div className="flex flex-col gap-1">
                              <label className="font-bold text-slate-400">Порог / Значение срабатывания</label>
                              <input
                               type="text"
                               placeholder={newScenTriggerType === 'temp' ? 'например: > 24' : 'например: 22:30'}
                               value={newScenTriggerVal}
                               onChange={(e) => setNewScenTriggerVal(e.target.value)}
                               className="bg-slate-950 border border-slate-800 rounded p-2 text-white outline-none"
                               style={{ borderRadius: 'calc(var(--app-radius) * 0.5)' }}
                             />
                            </div>
                          )}

                          <div className="flex flex-col gap-1">
                            <label className="font-bold text-slate-400">Управляемый прибор</label>
                            <select
                              value={newScenDevice}
                              onChange={(e) => setNewScenDevice(e.target.value)}
                              className="bg-slate-950 border border-slate-800 rounded p-2 text-white outline-none"
                              style={{ borderRadius: 'calc(var(--app-radius) * 0.5)' }}
                            >
                              <option value="Люстра">Люстра</option>
                              <option value="Подсветка кухни">Подсветка кухни</option>
                              <option value="Кондиционер">Кондиционер</option>
                              <option value="Обогреватель">Обогреватель</option>
                              <option value="Камера во дворе">Камера во дворе</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="font-bold text-slate-400">Действие над прибором</label>
                            <select
                              value={newScenActionType}
                              onChange={(e) => setNewScenActionType(e.target.value as any)}
                              className="bg-slate-950 border border-slate-800 rounded p-2 text-white outline-none"
                              style={{ borderRadius: 'calc(var(--app-radius) * 0.5)' }}
                            >
                              <option value="on">Включить прибор</option>
                              <option value="off">Выключить прибор</option>
                              <option value="value">Задать уровень (диммер / градус)</option>
                            </select>
                          </div>

                          {newScenActionType === 'value' && (
                            <div className="flex flex-col gap-1">
                              <label className="font-bold text-slate-400">Уровень значения (0 - 100)</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={newScenActionValue}
                                onChange={(e) => setNewScenActionValue(parseInt(e.target.value, 10))}
                                className="bg-slate-950 border border-slate-800 rounded p-2 text-white outline-none"
                                style={{ borderRadius: 'calc(var(--app-radius) * 0.5)' }}
                              />
                            </div>
                          )}

                          <div className="flex flex-col gap-1.5 md:col-span-2 mt-1 border-t border-brand-border/30 pt-2.5">
                            <label className="font-bold text-slate-400">Выберите иконку сценария</label>
                            <div className="flex gap-1.5 flex-wrap bg-slate-950 p-2.5 border border-slate-800 rounded" style={{ borderRadius: 'calc(var(--app-radius) * 0.5)' }}>
                              {[
                                { key: 'lightbulb', icon: Lightbulb, label: 'Свет' },
                                { key: 'snowflake', icon: Snowflake, label: 'Холод' },
                                { key: 'shield', icon: Shield, label: 'Охрана' },
                                { key: 'film', icon: Film, label: 'Кино' },
                                { key: 'home', icon: HomeIcon, label: 'Дом' },
                                { key: 'clock', icon: Clock, label: 'Время' },
                                { key: 'flame', icon: Flame, label: 'Тепло' },
                                { key: 'coffee', icon: Coffee, label: 'Кофе' },
                              ].map((item) => {
                                const ItemIcon = item.icon;
                                const isSelected = newScenIcon === item.key;
                                return (
                                  <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => setNewScenIcon(item.key)}
                                    className="p-1.5 px-3 rounded flex items-center gap-1.5 border transition-all cursor-pointer text-[10px]"
                                    style={{
                                      borderRadius: 'calc(var(--app-radius) * 0.4)',
                                      borderColor: isSelected ? 'var(--app-primary)' : 'rgba(255,255,255,0.05)',
                                      backgroundColor: isSelected ? 'rgba(255,255,255,0.03)' : 'transparent',
                                      color: isSelected ? 'var(--app-primary)' : 'var(--app-text-muted)',
                                    }}
                                  >
                                    <ItemIcon className="w-3.5 h-3.5 shrink-0" />
                                    <span>{item.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-white/5">
                          <button
                            type="button"
                            onClick={() => setShowScenarioForm(false)}
                            className="py-1.5 px-3 rounded bg-slate-900 text-slate-400 hover:text-white cursor-pointer border-0"
                            style={{ borderRadius: 'calc(var(--app-radius) * 0.5)' }}
                          >
                            Отмена
                          </button>
                          <button
                            type="submit"
                            className="py-1.5 px-4 rounded bg-brand-primary text-slate-950 font-black cursor-pointer hover:brightness-110 active:scale-95 transition-all border-0"
                            style={{ backgroundColor: 'var(--app-primary)', borderRadius: 'calc(var(--app-radius) * 0.5)' }}
                          >
                            Создать
                          </button>
                        </div>
                      </form>
                    ) : (
                      <form onSubmit={handleCreateScenarioCli} className="flex flex-col gap-3.5 text-xs text-left">
                        <div className="p-3 bg-slate-950 rounded border border-white/5 font-mono text-[11px] text-slate-400 flex flex-col gap-1.5">
                          <span className="font-extrabold text-brand-primary uppercase text-[9px] tracking-wider mb-1 block" style={{ color: 'var(--app-primary)' }}>Доступные шаблоны SmashCLI:</span>
                          <p className="leading-relaxed">
                            <span className="text-white font-bold">addrule</span> &lt;name&gt; &lt;trig_dev&gt; &lt;cond&gt; &lt;val&gt; &lt;act_dev&gt; &lt;act_cmd&gt; — триггерное правило.
                          </p>
                          <p className="leading-relaxed">
                            <span className="text-white font-bold">addtimer</span> &lt;name&gt; &lt;HH:MM&gt; &lt;act_dev&gt; &lt;act_cmd&gt; — по времени.
                          </p>
                          <p className="text-[10px] text-slate-500 italic mt-1 leading-normal">
                            * Пробелы в названиях заменяются нижним подчеркиванием (_), например: Датчик_температуры
                          </p>
                        </div>

                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500 font-mono">Клавиши быстрой вставки:</span>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => setCliCommand('addrule АвтоОхлаждение Термостат > 25 Кондиционер 18')}
                              className="px-2 py-1 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-brand-primary rounded text-[9px] font-mono cursor-pointer transition-colors border-0"
                            >
                              [addrule Охлаждение]
                            </button>
                            <button
                              type="button"
                              onClick={() => setCliCommand('addrule АвтоСвет Датчик_движения движение В_активности Люстра 80')}
                              className="px-2 py-1 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-brand-primary rounded text-[9px] font-mono cursor-pointer transition-colors border-0"
                            >
                              [addrule Движение]
                            </button>
                            <button
                              type="button"
                              onClick={() => setCliCommand('addtimer Ночная_Экономия 23:00 Обогреватель off')}
                              className="px-2 py-1 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-brand-primary rounded text-[9px] font-mono cursor-pointer transition-colors border-0"
                            >
                              [addtimer Таймер Выкл]
                            </button>
                            <button
                              type="button"
                              onClick={() => setCliCommand('addtimer Утренний_Свет 07:00 Люстра 40')}
                              className="px-2 py-1 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-brand-primary rounded text-[9px] font-mono cursor-pointer transition-colors border-0"
                            >
                              [addtimer Таймер Диммер]
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="font-bold text-slate-400 flex justify-between items-center" htmlFor="cli-cmd-input">
                            <span>Терминал ввода SmashCLI</span>
                            <span className="text-[10px] text-slate-500 font-mono">v1.2 active_bus</span>
                          </label>
                          <input
                            id="cli-cmd-input"
                            type="text"
                            placeholder="Наберите addrule ..."
                            value={cliCommand}
                            onChange={(e) => setCliCommand(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded p-2.5 text-white outline-none font-mono text-[11px] focus:border-brand-primary placeholder-slate-700 w-full"
                            style={{ borderRadius: 'calc(var(--app-radius) * 0.5)' }}
                          />
                        </div>

                        {cliFeedback && (
                          <div className={`p-2.5 rounded text-[11px] font-mono select-text font-medium leading-relaxed ${cliFeedback.type === 'success' ? 'bg-emerald-900/15 border border-emerald-500/10 text-emerald-400 animate-slide-in-right' : 'bg-red-950/20 border border-red-500/10 text-red-400 animate-pulse'}`} style={{ borderRadius: 'calc(var(--app-radius) * 0.5)' }}>
                            {cliFeedback.type === 'success' ? '✔ ' : '✘ '} 
                            {cliFeedback.text}
                          </div>
                        )}

                        <div className="flex justify-end gap-2 mt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setCliCommand('');
                              setCliFeedback(null);
                            }}
                            className="py-1.5 px-3 rounded bg-slate-900 text-slate-400 hover:text-white cursor-pointer border-0"
                            style={{ borderRadius: 'calc(var(--app-radius) * 0.5)' }}
                          >
                            Очистить
                          </button>
                          <button
                            type="submit"
                            className="py-1.5 px-4 rounded bg-brand-primary text-slate-950 font-black cursor-pointer hover:brightness-110 active:scale-95 transition-all border-0"
                            style={{ backgroundColor: 'var(--app-primary)', borderRadius: 'calc(var(--app-radius) * 0.5)' }}
                          >
                            Выполнить Команду
                          </button>
                        </div>
                      </form>
                    )}
                  </Card>
                )}

                {/* Scenarios lists rendering */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => triggerScenario('away', 'Я ушел')}
                    className="p-4 border transition-all text-left flex flex-col justify-between h-32 relative group cursor-pointer"
                    style={{
                      borderRadius: 'var(--app-radius)',
                      borderWidth: 'var(--app-border)',
                      borderColor: activeScenario === 'away' ? 'var(--app-primary)' : 'var(--app-card-border)',
                      backgroundColor: activeScenario === 'away' ? 'color-mix(in srgb, var(--app-primary) 10%, transparent)' : 'var(--app-panel-bg)',
                    }}
                  >
                    <Shield className="w-5 h-5 text-red-400" />
                    <div className="mt-2">
                      <h3 className="font-extrabold text-sm text-brand-panel-text">Я ушел</h3>
                      <p className="text-[10px] text-brand-muted mt-0.5">Полная охрана и блокировка тепла</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => triggerScenario('movie', 'Кинозал')}
                    className="p-4 border transition-all text-left flex flex-col justify-between h-32 relative group cursor-pointer"
                    style={{
                      borderRadius: 'var(--app-radius)',
                      borderWidth: 'var(--app-border)',
                      borderColor: activeScenario === 'movie' ? 'var(--app-primary)' : 'var(--app-card-border)',
                      backgroundColor: activeScenario === 'movie' ? 'color-mix(in srgb, var(--app-primary) 10%, transparent)' : 'var(--app-panel-bg)',
                    }}
                  >
                    <Film className="w-5 h-5 text-sky-400" />
                    <div className="mt-2">
                      <h3 className="font-extrabold text-sm text-brand-panel-text">Кинозал</h3>
                      <p className="text-[10px] text-brand-muted mt-0.5">Включить световые дорожки</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => triggerScenario('active', 'Активный день')}
                    className="p-4 border transition-all text-left flex flex-col justify-between h-32 relative group cursor-pointer"
                    style={{
                      borderRadius: 'var(--app-radius)',
                      borderWidth: 'var(--app-border)',
                      borderColor: activeScenario === 'active' ? 'var(--app-primary)' : 'var(--app-card-border)',
                      backgroundColor: activeScenario === 'active' ? 'color-mix(in srgb, var(--app-primary) 10%, transparent)' : 'var(--app-panel-bg)',
                    }}
                  >
                    <HomeIcon className="w-5 h-5 text-emerald-400" />
                    <div className="mt-2">
                      <h3 className="font-extrabold text-sm text-brand-panel-text">Активный день</h3>
                      <p className="text-[10px] text-brand-muted mt-0.5">Баланс яркости и климат контроля</p>
                    </div>
                  </button>

                  {customScenarios.map((scen) => {
                    const renderScenarioIcon = (iconName: string | undefined, triggerType: string, enabled: boolean) => {
                      const iconClass = `w-5 h-5 ${enabled ? 'text-brand-primary animate-pulse' : 'text-slate-500'}`;
                      const customStyles = enabled ? { color: 'var(--app-primary)' } : {};

                      switch (iconName) {
                        case 'zap': return <Zap className={iconClass} style={customStyles} />;
                        case 'clock': return <Clock className={iconClass} style={customStyles} />;
                        case 'thermometer': return <Thermometer className={iconClass} style={customStyles} />;
                        case 'sun': return <Sun className={iconClass} style={customStyles} />;
                        case 'moon': return <Moon className={iconClass} style={customStyles} />;
                        case 'wind': return <Wind className={iconClass} style={customStyles} />;
                        case 'snowflake': return <Snowflake className={iconClass} style={customStyles} />;
                        case 'lightbulb': return <Lightbulb className={iconClass} style={customStyles} />;
                        case 'shield': return <Shield className={iconClass} style={customStyles} />;
                        case 'lock': return <Lock className={iconClass} style={customStyles} />;
                        case 'sofa': return <Sofa className={iconClass} style={customStyles} />;
                        case 'eye': return <Eye className={iconClass} style={customStyles} />;
                        case 'power': return <Power className={iconClass} style={customStyles} />;
                        case 'flame': return <Flame className={iconClass} style={customStyles} />;
                        default:
                          return triggerType === 'time' 
                            ? <Clock className={iconClass} style={customStyles} /> 
                            : <Zap className={iconClass} style={customStyles} />;
                      }
                    };

                    const shownTriggerText = scen.conditions && scen.conditions.length > 0
                      ? `${scen.conditions.length} УСЛ.`
                      : scen.triggerType === 'temp' ? 'ТЕМП' : scen.triggerType.toUpperCase();

                    return (
                      <div 
                        key={scen.id}
                        className="p-4 border bg-slate-900/40 hover:bg-slate-900/60 transition-all flex flex-col justify-between h-32 relative group"
                        style={{
                          borderRadius: 'var(--app-radius)',
                          borderWidth: 'var(--app-border)',
                          borderColor: scen.enabled ? 'rgba(var(--app-primary), 0.25)' : 'rgba(255, 255, 255, 0.05)',
                        }}
                      >
                        <div className="flex justify-between items-start bg-transparent">
                          {renderScenarioIcon(scen.icon, scen.triggerType, scen.enabled)}
                          <div className="flex gap-2 bg-transparent">
                            <button
                              type="button"
                              onClick={() => {
                                toggleCustomScenario(scen.id);
                                addToast(`Сценарий "${scen.name}" ${!scen.enabled ? 'включен' : 'отключен'}`, 'info');
                              }}
                              className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase cursor-pointer border-0 ${scen.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-950 text-slate-600'}`}
                            >
                              {scen.enabled ? 'АКТИВ' : 'ВЫКЛ'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                removeCustomScenario(scen.id);
                                addToast('Сценарий удален', 'info');
                              }}
                              className="p-0.5 text-slate-500 hover:text-red-400 transition-colors cursor-pointer bg-transparent border-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-2 text-left bg-transparent">
                          <h3 className="font-extrabold text-xs text-white truncate leading-none">{scen.name}</h3>
                          <p className="text-[9px] text-slate-400 mt-1 uppercase truncate font-mono">
                            ЕСЛИ: {shownTriggerText} {scen.triggerValue} ➔ ТВ: {scen.actionDevice}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Full RESIZE HANDLES for Drag and Resize */}
                {reorderMode && (
                  <>
                    {/* Right Edge */}
                    <div 
                      className="absolute -right-1.5 top-2 bottom-2 w-3 cursor-ew-resize hover:bg-brand-primary/20 rounded transition-all z-40 flex items-center justify-center group pointer-events-auto"
                      style={{ cursor: 'ew-resize' }}
                      onPointerDown={(e) => handleResizeStart(e, 'scenarios', 'r')}
                    >
                      <div className="w-[2px] h-6 bg-slate-600/60 group-hover:bg-brand-primary rounded" />
                    </div>
                    {/* Bottom Edge */}
                    <div 
                      className="absolute left-2 -bottom-1.5 right-2 h-3 cursor-ns-resize hover:bg-brand-primary/20 rounded transition-all z-40 flex items-center justify-center group pointer-events-auto"
                      style={{ cursor: 'ns-resize' }}
                      onPointerDown={(e) => handleResizeStart(e, 'scenarios', 'b')}
                    >
                      <div className="h-[2px] w-6 bg-slate-600/60 group-hover:bg-brand-primary rounded" />
                    </div>
                    {/* Bottom-Right Corner */}
                    <div 
                      className="absolute -right-1.5 -bottom-1.5 w-5 h-5 cursor-nwse-resize z-50 flex items-center justify-center rounded-full pointer-events-auto bg-slate-900 border border-brand-primary/30 hover:border-brand-primary text-brand-primary shadow-2xl transition-all"
                      style={{ cursor: 'nwse-resize' }}
                      onPointerDown={(e) => handleResizeStart(e, 'scenarios', 'br')}
                      title="Растянуть за угол"
                    >
                      <GripVertical className="w-3 h-3 text-slate-500 hover:text-white" style={{ rotate: '45deg' }} />
                    </div>
                  </>
                )}
              </div>
            );
          }

          // ENERGY WIDGET
          if (sectionId === 'energy') {
            const energyData = [
              { name: 'Пн', kwh: 12.4 },
              { name: 'Вт', kwh: 14.8 },
              { name: 'Ср', kwh: 11.2 },
              { name: 'Чт', kwh: 15.6 },
              { name: 'Пт', kwh: 18.2 },
              { name: 'Сб', kwh: 22.4 },
              { name: 'Вс', kwh: 19.8 },
            ];
            return (
              <div 
                key="energy" 
                draggable={reorderMode}
                onDragStart={() => handleDragStart(idx)}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDrop={() => handleDrop(idx)}
                style={{
                  opacity: isDraggingThis ? 0.35 : 1,
                  transform: isDraggingThis ? 'scale(0.98)' : 'none'
                }}
                className={`${getColSpanClass('energy')} ${getRowSpanClass('energy')} flex flex-col gap-3 relative border dashboard-tile ${reorderMode ? 'border-brand-primary mr-0.5 cursor-grab bg-slate-950/20' : 'border-transparent'} p-2 rounded-brand transition-all`}
              >
                {renderConfigOverlay('energy', idx)}
                
                <div className={`flex justify-between items-center pr-2 ${reorderMode ? 'pt-8' : ''}`}>
                  <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-emerald-400" />
                    Логи энергопотребления (кВт·ч)
                  </h2>
                  <span className="text-[10px] text-slate-500 font-bold uppercase font-mono bg-white/5 px-2 py-0.5 rounded">Среднее по неделе</span>
                </div>
                <Card className="flex-1 min-h-[220px] shadow-xl">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={energyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a303c" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0a0d14', 
                          borderColor: 'rgba(255,255,255,0.1)',
                          borderRadius: 'var(--app-radius)',
                          color: '#fff'
                        }} 
                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                      />
                      <Bar 
                        dataKey="kwh" 
                        fill="var(--app-primary)" 
                        radius={[4, 4, 0, 0]} 
                        maxBarSize={40}
                        style={{ filter: 'drop-shadow(0 0 4px rgba(var(--app-primary), 0.2))' }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                {/* Full RESIZE HANDLES for Drag and Resize */}
                {reorderMode && (
                  <>
                    {/* Right Edge */}
                    <div 
                      className="absolute -right-1.5 top-2 bottom-2 w-3 cursor-ew-resize hover:bg-brand-primary/20 rounded transition-all z-40 flex items-center justify-center group pointer-events-auto"
                      style={{ cursor: 'ew-resize' }}
                      onPointerDown={(e) => handleResizeStart(e, 'energy', 'r')}
                    >
                      <div className="w-[2px] h-6 bg-slate-600/60 group-hover:bg-brand-primary rounded" />
                    </div>
                    {/* Bottom Edge */}
                    <div 
                      className="absolute left-2 -bottom-1.5 right-2 h-3 cursor-ns-resize hover:bg-brand-primary/20 rounded transition-all z-40 flex items-center justify-center group pointer-events-auto"
                      style={{ cursor: 'ns-resize' }}
                      onPointerDown={(e) => handleResizeStart(e, 'energy', 'b')}
                    >
                      <div className="h-[2px] w-6 bg-slate-600/60 group-hover:bg-brand-primary rounded" />
                    </div>
                    {/* Bottom-Right Corner */}
                    <div 
                      className="absolute -right-1.5 -bottom-1.5 w-5 h-5 cursor-nwse-resize z-50 flex items-center justify-center rounded-full pointer-events-auto bg-slate-900 border border-brand-primary/30 hover:border-brand-primary text-brand-primary shadow-2xl transition-all"
                      style={{ cursor: 'nwse-resize' }}
                      onPointerDown={(e) => handleResizeStart(e, 'energy', 'br')}
                      title="Растянуть за угол"
                    >
                      <GripVertical className="w-3 h-3 text-slate-500 hover:text-white" style={{ rotate: '45deg' }} />
                    </div>
                  </>
                )}
              </div>
            );
          }

          // ATMOSPHERE WIDGET
          if (sectionId === 'atmosphere') {
            return (
              <div 
                key="atmosphere" 
                draggable={reorderMode}
                onDragStart={() => handleDragStart(idx)}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDrop={() => handleDrop(idx)}
                style={{
                  opacity: isDraggingThis ? 0.35 : 1,
                  transform: isDraggingThis ? 'scale(0.98)' : 'none'
                }}
                className={`${getColSpanClass('atmosphere')} ${getRowSpanClass('atmosphere')} flex flex-col gap-3 relative border dashboard-tile ${reorderMode ? 'border-brand-primary mr-0.5 cursor-grab bg-slate-950/20' : 'border-transparent'} p-2 rounded-brand transition-all`}
              >
                {renderConfigOverlay('atmosphere', idx)}
                
                <div className={`${reorderMode ? 'pt-8' : ''}`}>
                  <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-1">
                    <Thermometer className="w-4 h-4 text-orange-400" />
                    Микроклимат дома
                  </h2>
                </div>
                <Card hoverEffect className="flex-1 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-brand-border bg-transparent">
                    <span className="text-xs text-brand-muted font-bold tracking-wider uppercase">Термостат</span>
                    {renderWeatherBadge()}
                  </div>
                  <div className="grid grid-cols-2 gap-4 divide-x divide-brand-border text-left bg-transparent">
                    <div className="flex flex-col gap-1.5 pl-1.5 bg-transparent">
                      <span className="text-xs text-brand-muted font-semibold leading-none bg-transparent">Внутри Дома</span>
                      <div className="flex items-baseline gap-1 mt-1 bg-transparent">
                        <span className="text-3xl font-black text-brand-panel-text font-mono bg-transparent">24</span>
                        <span className="text-sm text-brand-muted font-semibold">°C</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold tracking-wide">Регулировка активирована</span>
                    </div>
                    <div className="flex flex-col gap-1.5 pl-4 bg-transparent">
                      <span className="text-xs text-brand-muted font-semibold leading-none">На Улице</span>
                      <div className="flex items-baseline gap-1 mt-1 bg-transparent">
                        <span className="text-3xl font-black text-brand-muted font-mono bg-transparent">
                          {weatherTemp !== null ? (weatherTemp > 0 ? `+${weatherTemp}` : weatherTemp) : '12'}
                        </span>
                        <span className="text-sm text-slate-500 font-semibold">°C</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-semibold">Влажность {weatherHumidity ?? 68}%</span>
                    </div>
                  </div>
                </Card>

                {/* Full RESIZE HANDLES for Drag and Resize */}
                {reorderMode && (
                  <>
                    {/* Right Edge */}
                    <div 
                      className="absolute -right-1.5 top-2 bottom-2 w-3 cursor-ew-resize hover:bg-brand-primary/20 rounded transition-all z-40 flex items-center justify-center group pointer-events-auto"
                      style={{ cursor: 'ew-resize' }}
                      onPointerDown={(e) => handleResizeStart(e, 'atmosphere', 'r')}
                    >
                      <div className="w-[2px] h-6 bg-slate-600/60 group-hover:bg-brand-primary rounded" />
                    </div>
                    {/* Bottom Edge */}
                    <div 
                      className="absolute left-2 -bottom-1.5 right-2 h-3 cursor-ns-resize hover:bg-brand-primary/20 rounded transition-all z-40 flex items-center justify-center group pointer-events-auto"
                      style={{ cursor: 'ns-resize' }}
                      onPointerDown={(e) => handleResizeStart(e, 'atmosphere', 'b')}
                    >
                      <div className="h-[2px] w-6 bg-slate-600/60 group-hover:bg-brand-primary rounded" />
                    </div>
                    {/* Bottom-Right Corner */}
                    <div 
                      className="absolute -right-1.5 -bottom-1.5 w-5 h-5 cursor-nwse-resize z-50 flex items-center justify-center rounded-full pointer-events-auto bg-slate-900 border border-brand-primary/30 hover:border-brand-primary text-brand-primary shadow-2xl transition-all"
                      style={{ cursor: 'nwse-resize' }}
                      onPointerDown={(e) => handleResizeStart(e, 'atmosphere', 'br')}
                      title="Растянуть за угол"
                    >
                      <GripVertical className="w-3 h-3 text-slate-500 hover:text-white" style={{ rotate: '45deg' }} />
                    </div>
                  </>
                )}
              </div>
            );
          }

          // ROOMS SUMMARY WIDGET
          if (sectionId === 'rooms') {
            return (
              <div 
                key="rooms" 
                draggable={reorderMode}
                onDragStart={() => handleDragStart(idx)}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDrop={() => handleDrop(idx)}
                style={{
                  opacity: isDraggingThis ? 0.35 : 1,
                  transform: isDraggingThis ? 'scale(0.98)' : 'none'
                }}
                className={`${getColSpanClass('rooms')} ${getRowSpanClass('rooms')} flex flex-col gap-3 relative border dashboard-tile ${reorderMode ? 'border-brand-primary mr-0.5 cursor-grab bg-slate-950/20' : 'border-transparent'} p-2 rounded-brand transition-all`}
              >
                {renderConfigOverlay('rooms', idx)}
                
                <div className={`${reorderMode ? 'pt-8' : ''}`}>
                  <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-1">
                    <Sofa className="w-4 h-4 text-sky-400" />
                    Сектора и Комнаты
                  </h2>
                </div>
                
                <div className="flex-1 flex flex-col gap-2.5">
                  {rooms.slice(0, 4).map((room) => (
                    <div 
                      key={room.id}
                      className="p-4 bg-brand-input border border-brand-border flex justify-between items-center transition-all hover:bg-brand-accent-muted" 
                      style={{ borderRadius: 'var(--app-radius)' }}
                    >
                      <div className="flex items-center gap-3.5 bg-transparent">
                        <div className="p-2 w-8 h-8 rounded bg-brand-accent-muted flex items-center justify-center font-bold text-xs" style={{ color: 'var(--app-primary)' }}>
                          {room.name.substring(0, 1)}
                        </div>
                        <div className="text-left bg-transparent">
                          <h4 className="font-bold text-sm text-brand-panel-text leading-none bg-transparent">{room.name}</h4>
                          {room.deviceIds.some(id => id.startsWith('climate')) ? (
                            <span className="text-[10px] text-brand-muted mt-1 block font-mono font-medium uppercase animate-fade-in bg-transparent">
                              климат: {room.temperature}°C • влаж: {room.humidity}%
                            </span>
                          ) : (
                            <span className="text-[10px] text-brand-muted mt-1 block font-mono font-medium uppercase bg-transparent">
                              система: {room.deviceIds.length} приборов
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-slate-600 hover:text-brand-panel-text transition-colors bg-transparent" />
                    </div>
                  ))}
                </div>

                {/* Full RESIZE HANDLES for Drag and Resize */}
                {reorderMode && (
                  <>
                    {/* Right Edge */}
                    <div 
                      className="absolute -right-1.5 top-2 bottom-2 w-3 cursor-ew-resize hover:bg-brand-primary/20 rounded transition-all z-40 flex items-center justify-center group pointer-events-auto"
                      style={{ cursor: 'ew-resize' }}
                      onPointerDown={(e) => handleResizeStart(e, 'rooms', 'r')}
                    >
                      <div className="w-[2px] h-6 bg-slate-600/60 group-hover:bg-brand-primary rounded" />
                    </div>
                    {/* Bottom Edge */}
                    <div 
                      className="absolute left-2 -bottom-1.5 right-2 h-3 cursor-ns-resize hover:bg-brand-primary/20 rounded transition-all z-40 flex items-center justify-center group pointer-events-auto"
                      style={{ cursor: 'ns-resize' }}
                      onPointerDown={(e) => handleResizeStart(e, 'rooms', 'b')}
                    >
                      <div className="h-[2px] w-6 bg-slate-600/60 group-hover:bg-brand-primary rounded" />
                    </div>
                    {/* Bottom-Right Corner */}
                    <div 
                      className="absolute -right-1.5 -bottom-1.5 w-5 h-5 cursor-nwse-resize z-50 flex items-center justify-center rounded-full pointer-events-auto bg-slate-900 border border-brand-primary/30 hover:border-brand-primary text-brand-primary shadow-2xl transition-all"
                      style={{ cursor: 'nwse-resize' }}
                      onPointerDown={(e) => handleResizeStart(e, 'rooms', 'br')}
                      title="Растянуть за угол"
                    >
                      <GripVertical className="w-3 h-3 text-slate-500 hover:text-white" style={{ rotate: '45deg' }} />
                    </div>
                  </>
                )}
              </div>
            );
          }

          // WIDGET: QUICK ACTIVE DEVICES
          if (sectionId === 'devices') {
            return (
              <div 
                key="devices"
                draggable={reorderMode}
                onDragStart={() => handleDragStart(idx)}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDrop={() => handleDrop(idx)}
                style={{
                  opacity: isDraggingThis ? 0.35 : 1,
                  transform: isDraggingThis ? 'scale(0.98)' : 'none'
                }}
                className={`${getColSpanClass('devices')} ${getRowSpanClass('devices')} flex flex-col gap-3 relative border dashboard-tile ${reorderMode ? 'border-brand-primary mr-0.5 cursor-grab bg-slate-950/20' : 'border-transparent'} p-2 rounded-brand transition-all`}
              >
                {renderConfigOverlay('devices', idx)}
                
                <div className={`${reorderMode ? 'pt-8' : ''}`}>
                  <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-1">
                    <Cpu className="w-4 h-4 text-brand-primary" style={{ color: 'var(--app-primary)' }} />
                    Быстрые Приборы
                  </h2>
                </div>

                {favLoading ? (
                  <div className="p-12 text-center text-xs text-brand-muted font-bold flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-brand-primary" style={{ color: 'var(--app-primary)' }} />
                    Загрузка...
                  </div>
                ) : (
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {favoriteDevices.slice(0, 6).map((dev) => {
                      const isLg = dev.type === 'light';
                      const isCl = dev.type === 'climate';
                      return (
                        <div 
                          key={dev.id}
                          className="p-3 border rounded-brand flex flex-col justify-between h-24 text-left transition-all relative"
                          style={{
                            borderColor: dev.status ? 'var(--app-primary)' : 'var(--app-card-border)',
                            backgroundColor: dev.status ? 'color-mix(in srgb, var(--app-primary) 8%, var(--app-panel-bg))' : 'var(--app-accent-muted)',
                          }}
                        >
                          <div className="flex justify-between items-start bg-transparent">
                            <span className="p-1 rounded border shrink-0 bg-brand-panel border-brand-border">
                              {isLg ? <Lightbulb className={`w-3.5 h-3.5 ${dev.status ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} /> : isCl ? <Snowflake className={`w-3.5 h-3.5 ${dev.status ? 'text-blue-400 animate-spin-slow' : 'text-slate-500'}`} /> : <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleFavDevice(dev)}
                              className={`p-1 text-[8px] font-extrabold uppercase rounded shrink-0 border-0 cursor-pointer ${dev.status ? 'bg-brand-primary text-slate-950 font-black' : 'bg-brand-panel text-brand-muted border border-brand-border'}`}
                              style={{ 
                                backgroundColor: dev.status ? 'var(--app-primary)' : 'var(--app-input-bg)', 
                                color: dev.status ? (isDark ? '#000': '#fff') : 'var(--app-text-muted)' 
                              }}
                            >
                              {dev.status ? 'ВКЛ' : 'ВЫКЛ'}
                            </button>
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-brand-panel-text truncate block w-full bg-transparent">{dev.name}</span>
                            <span className="text-[8px] font-bold tracking-wider uppercase text-brand-muted mt-0.5 block bg-transparent">
                              {dev.type} {dev.status && dev.value ? `(${dev.value}${isLg ? '%' : '°C'})` : ''}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Full RESIZE HANDLES for Drag and Resize */}
                {reorderMode && (
                  <>
                    {/* Right Edge */}
                    <div 
                      className="absolute -right-1.5 top-2 bottom-2 w-3 cursor-ew-resize hover:bg-brand-primary/20 rounded transition-all z-40 flex items-center justify-center group pointer-events-auto"
                      style={{ cursor: 'ew-resize' }}
                      onPointerDown={(e) => handleResizeStart(e, 'devices', 'r')}
                    >
                      <div className="w-[2px] h-6 bg-slate-600/60 group-hover:bg-brand-primary rounded" />
                    </div>
                    {/* Bottom Edge */}
                    <div 
                      className="absolute left-2 -bottom-1.5 right-2 h-3 cursor-ns-resize hover:bg-brand-primary/20 rounded transition-all z-40 flex items-center justify-center group pointer-events-auto"
                      style={{ cursor: 'ns-resize' }}
                      onPointerDown={(e) => handleResizeStart(e, 'devices', 'b')}
                    >
                      <div className="h-[2px] w-6 bg-slate-600/60 group-hover:bg-brand-primary rounded" />
                    </div>
                    {/* Bottom-Right Corner */}
                    <div 
                      className="absolute -right-1.5 -bottom-1.5 w-5 h-5 cursor-nwse-resize z-50 flex items-center justify-center rounded-full pointer-events-auto bg-slate-900 border border-brand-primary/30 hover:border-brand-primary text-brand-primary shadow-2xl transition-all"
                      style={{ cursor: 'nwse-resize' }}
                      onPointerDown={(e) => handleResizeStart(e, 'devices', 'br')}
                      title="Растянуть за угол"
                    >
                      <GripVertical className="w-3 h-3 text-slate-500 hover:text-white" style={{ rotate: '45deg' }} />
                    </div>
                  </>
                )}
              </div>
            );
          }

          // WIDGET: LOCK & CAMERA SECURITY HUB
          if (sectionId === 'security') {
            return (
              <div 
                key="security"
                draggable={reorderMode}
                onDragStart={() => handleDragStart(idx)}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDrop={() => handleDrop(idx)}
                style={{
                  opacity: isDraggingThis ? 0.35 : 1,
                  transform: isDraggingThis ? 'scale(0.98)' : 'none'
                }}
                className={`${getColSpanClass('security')} ${getRowSpanClass('security')} flex flex-col gap-3 relative border dashboard-tile ${reorderMode ? 'border-brand-primary mr-0.5 cursor-grab bg-slate-950/20' : 'border-transparent'} p-2 rounded-brand transition-all`}
              >
                {renderConfigOverlay('security', idx)}
                
                <div className={`${reorderMode ? 'pt-8' : ''}`}>
                  <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    Купол Безопасности
                  </h2>
                </div>

                <Card className="flex-1 flex flex-col gap-3 text-left">
                  <div className="flex items-center justify-between bg-transparent">
                    <div className="flex items-center gap-2 bg-transparent">
                      <span className={`w-2.5 h-2.5 rounded-full ${securityStatus === 'armed' ? 'bg-red-500 animate-ping' : securityStatus === 'home' ? 'bg-amber-400' : 'bg-emerald-500 animate-pulse'}`} />
                      <span className="text-[10px] font-black uppercase font-mono tracking-wider text-brand-panel-text bg-transparent">
                        {securityStatus === 'armed' ? 'ПОД ПОЛНОЙ ОХРАНОЙ' : securityStatus === 'home' ? 'ПЕРИМЕТР АКТИВЕН' : 'СНЯТО С ОХРАНЫ'}
                      </span>
                    </div>

                    <div className="flex gap-1.5 bg-transparent">
                      <button 
                        onClick={() => toggleSecurityStatus('disarmed')} 
                        className={`text-[9px] px-2 py-1 uppercase font-bold rounded cursor-pointer border-0 ${securityStatus === 'disarmed' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-brand-panel text-brand-muted border border-brand-border'}`}
                        style={{
                          backgroundColor: securityStatus === 'disarmed' ? undefined : 'var(--app-input-bg)',
                          color: securityStatus === 'disarmed' ? undefined : 'var(--app-text-muted)'
                        }}
                      >
                        Снять
                      </button>
                      <button 
                        onClick={() => toggleSecurityStatus('home')} 
                        className={`text-[9px] px-2 py-1 uppercase font-bold rounded cursor-pointer border-0 ${securityStatus === 'home' ? 'bg-amber-500/15 text-amber-400' : 'bg-brand-panel text-brand-muted border border-brand-border'}`}
                        style={{
                          backgroundColor: securityStatus === 'home' ? undefined : 'var(--app-input-bg)',
                          color: securityStatus === 'home' ? undefined : 'var(--app-text-muted)'
                        }}
                      >
                        Защита
                      </button>
                      <button 
                        onClick={() => toggleSecurityStatus('armed')} 
                        className={`text-[9px] px-2 py-1 uppercase font-bold rounded cursor-pointer border-0 ${securityStatus === 'armed' || securityCountdown !== null ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-brand-panel text-brand-muted border border-brand-border'}`}
                        style={{
                          backgroundColor: (securityStatus === 'armed' || securityCountdown !== null) ? undefined : 'var(--app-input-bg)',
                          color: (securityStatus === 'armed' || securityCountdown !== null) ? undefined : 'var(--app-text-muted)'
                        }}
                      >
                        {securityCountdown !== null ? `(${securityCountdown}с)` : 'АКТИВ'}
                      </button>
                    </div>
                  </div>

                  {/* Panoramic surveillance feed simulation */}
                  <div className="relative flex-1 min-h-[112px] bg-slate-950 border border-brand-border rounded-brand overflow-hidden flex items-center justify-center font-mono select-none">
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-transparent">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[9px] text-red-400 font-bold uppercase tracking-wider">CAM_01 периметр [LIVE]</span>
                    </div>
                    <div className="absolute top-2 right-2 text-[9px] text-slate-500 font-bold bg-transparent">FPS: 24.0</div>
                    <div className="absolute inset-x-0 h-[1.5px] bg-emerald-500/10 shadow-[0_0_8px_rgba(16,185,129,0.3)] animate-[scan_3s_infinite_linear] pointer-events-none" />
                    <Video className="w-8 h-8 text-slate-800 animate-pulse" />
                    <span className="text-[10px] text-emerald-400 font-bold tracking-wider uppercase ml-1 animate-pulse bg-transparent">ТРАФИК СКАНИРОВАНИЯ СТАБИЛЕН</span>
                  </div>
                </Card>

                {/* Full RESIZE HANDLES for Drag and Resize */}
                {reorderMode && (
                  <>
                    {/* Right Edge */}
                    <div 
                      className="absolute -right-1.5 top-2 bottom-2 w-3 cursor-ew-resize hover:bg-brand-primary/20 rounded transition-all z-40 flex items-center justify-center group pointer-events-auto"
                      style={{ cursor: 'ew-resize' }}
                      onPointerDown={(e) => handleResizeStart(e, 'security', 'r')}
                    >
                      <div className="w-[2px] h-6 bg-slate-600/60 group-hover:bg-brand-primary rounded" />
                    </div>
                    {/* Bottom Edge */}
                    <div 
                      className="absolute left-2 -bottom-1.5 right-2 h-3 cursor-ns-resize hover:bg-brand-primary/20 rounded transition-all z-40 flex items-center justify-center group pointer-events-auto"
                      style={{ cursor: 'ns-resize' }}
                      onPointerDown={(e) => handleResizeStart(e, 'security', 'b')}
                    >
                      <div className="h-[2px] w-6 bg-slate-600/60 group-hover:bg-brand-primary rounded" />
                    </div>
                    {/* Bottom-Right Corner */}
                    <div 
                      className="absolute -right-1.5 -bottom-1.5 w-5 h-5 cursor-nwse-resize z-50 flex items-center justify-center rounded-full pointer-events-auto bg-slate-900 border border-brand-primary/30 hover:border-brand-primary text-brand-primary shadow-2xl transition-all"
                      style={{ cursor: 'nwse-resize' }}
                      onPointerDown={(e) => handleResizeStart(e, 'security', 'br')}
                      title="Растянуть за угол"
                    >
                      <GripVertical className="w-3 h-3 text-slate-500 hover:text-white" style={{ rotate: '45deg' }} />
                    </div>
                  </>
                )}
              </div>
            );
          }

          // WIDGET: SYSTEM INFO & DIGITAL CLOCK
          if (sectionId === 'clock') {
            return (
              <div 
                key="clock"
                draggable={reorderMode}
                onDragStart={() => handleDragStart(idx)}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDrop={() => handleDrop(idx)}
                style={{
                  opacity: isDraggingThis ? 0.35 : 1,
                  transform: isDraggingThis ? 'scale(0.98)' : 'none'
                }}
                className={`${getColSpanClass('clock')} ${getRowSpanClass('clock')} flex flex-col gap-3 relative border dashboard-tile ${reorderMode ? 'border-brand-primary mr-0.5 cursor-grab bg-slate-950/20' : 'border-transparent'} p-2 rounded-brand transition-all`}
              >
                {renderConfigOverlay('clock', idx)}
                
                <div className={`${reorderMode ? 'pt-8' : ''}`}>
                  <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    Системные Часы SmashCore
                  </h2>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center p-5 bg-brand-input border border-brand-border rounded-brand text-center relative overflow-hidden min-h-[160px]">
                  <span className="text-3xl font-mono font-black text-brand-panel-text tracking-widest bg-transparent">
                    {clockTime.toLocaleTimeString()}
                  </span>
                  <span className="text-[10px] text-brand-muted uppercase font-mono mt-1 font-bold bg-transparent">
                    {clockTime.toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>

                  <div className="w-full mt-4 flex flex-col gap-2.5 bg-transparent">
                    <div className="flex justify-between text-[9px] text-brand-muted font-bold font-mono uppercase bg-transparent">
                      <span>ЗАГРУЗКА ЯДРA процессора</span>
                      <span className="text-[10px] text-brand-primary font-black bg-transparent" style={{ color: 'var(--app-primary)' }}>14.2%</span>
                    </div>
                    <div className="w-full bg-brand-accent-muted rounded-full h-1 overflow-hidden p-0">
                      <div className="bg-brand-primary h-full rounded" style={{ width: '14.2%', backgroundColor: 'var(--app-primary)' }} />
                    </div>
                  </div>
                </div>

                {/* Full RESIZE HANDLES for Drag and Resize */}
                {reorderMode && (
                  <>
                    {/* Right Edge */}
                    <div 
                      className="absolute -right-1.5 top-2 bottom-2 w-3 cursor-ew-resize hover:bg-brand-primary/20 rounded transition-all z-40 flex items-center justify-center group pointer-events-auto"
                      style={{ cursor: 'ew-resize' }}
                      onPointerDown={(e) => handleResizeStart(e, 'clock', 'r')}
                    >
                      <div className="w-[2px] h-6 bg-slate-600/60 group-hover:bg-brand-primary rounded" />
                    </div>
                    {/* Bottom Edge */}
                    <div 
                      className="absolute left-2 -bottom-1.5 right-2 h-3 cursor-ns-resize hover:bg-brand-primary/20 rounded transition-all z-40 flex items-center justify-center group pointer-events-auto"
                      style={{ cursor: 'ns-resize' }}
                      onPointerDown={(e) => handleResizeStart(e, 'clock', 'b')}
                    >
                      <div className="h-[2px] w-6 bg-slate-600/60 group-hover:bg-brand-primary rounded" />
                    </div>
                    {/* Bottom-Right Corner */}
                    <div 
                      className="absolute -right-1.5 -bottom-1.5 w-5 h-5 cursor-nwse-resize z-50 flex items-center justify-center rounded-full pointer-events-auto bg-slate-900 border border-brand-primary/30 hover:border-brand-primary text-brand-primary shadow-2xl transition-all"
                      style={{ cursor: 'nwse-resize' }}
                      onPointerDown={(e) => handleResizeStart(e, 'clock', 'br')}
                      title="Растянуть за угол"
                    >
                      <GripVertical className="w-3 h-3 text-slate-500 hover:text-white" style={{ rotate: '45deg' }} />
                    </div>
                  </>
                )}
              </div>
            );
          }

          // WIDGET: EXTENDED METEO INFO
          if (sectionId === 'weather') {
            return (
              <div 
                key="weather"
                draggable={reorderMode}
                onDragStart={() => handleDragStart(idx)}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDrop={() => handleDrop(idx)}
                style={{
                  opacity: isDraggingThis ? 0.35 : 1,
                  transform: isDraggingThis ? 'scale(0.98)' : 'none'
                }}
                className={`${getColSpanClass('weather')} ${getRowSpanClass('weather')} flex flex-col gap-3 relative border dashboard-tile ${reorderMode ? 'border-brand-primary mr-0.5 cursor-grab bg-slate-950/20' : 'border-transparent'} p-2 rounded-brand transition-all`}
              >
                {renderConfigOverlay('weather', idx)}
                
                <div className={`${reorderMode ? 'pt-8' : ''}`}>
                  <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-1">
                    <CloudSun className="w-4 h-4 text-cyan-400 animate-pulse" />
                    Расширенная Погода
                  </h2>
                </div>

                <div className="flex-1 p-4 bg-brand-input border border-brand-border rounded-brand flex flex-col justify-between gap-4 text-left">
                  <div className="grid grid-cols-3 gap-3 bg-transparent">
                    <div className="p-2.5 bg-brand-panel rounded border border-brand-border text-center flex flex-col gap-1">
                      <Wind className="w-4 h-4 text-cyan-400 mx-auto" />
                      <span className="text-[8px] text-brand-muted uppercase font-black">Скорость ветра</span>
                      <span className="text-xs font-bold text-brand-panel-text font-mono">4.8 м/с</span>
                    </div>

                    <div className="p-2.5 bg-brand-panel rounded border border-brand-border text-center flex flex-col gap-1">
                      <SunDim className="w-4 h-4 text-amber-400 mx-auto animate-pulse" />
                      <span className="text-[8px] text-brand-muted uppercase font-black">УФ-Индекс</span>
                      <span className="text-xs font-bold text-brand-panel-text font-mono">1.5 Низкий</span>
                    </div>

                    <div className="p-2.5 bg-brand-panel rounded border border-brand-border text-center flex flex-col gap-1">
                      <Activity className="w-4 h-4 text-pink-400 mx-auto" />
                      <span className="text-[8px] text-brand-muted uppercase font-black">Давление</span>
                      <span className="text-xs font-bold text-brand-panel-text font-mono">754 мм</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-transparent pt-1.5 border-t border-brand-border text-[10px]">
                    <span className="text-brand-muted font-bold uppercase font-mono">Метеостанция Шереметьево</span>
                    <span className="text-[9px] uppercase tracking-wider text-brand-primary font-black" style={{ color: 'var(--app-primary)' }}>Стабильно</span>
                  </div>
                </div>

                {/* Full RESIZE HANDLES for Drag and Resize */}
                {reorderMode && (
                  <>
                    {/* Right Edge */}
                    <div 
                      className="absolute -right-1.5 top-2 bottom-2 w-3 cursor-ew-resize hover:bg-brand-primary/20 rounded transition-all z-40 flex items-center justify-center group pointer-events-auto"
                      style={{ cursor: 'ew-resize' }}
                      onPointerDown={(e) => handleResizeStart(e, 'weather', 'r')}
                    >
                      <div className="w-[2px] h-6 bg-slate-600/60 group-hover:bg-brand-primary rounded" />
                    </div>
                    {/* Bottom Edge */}
                    <div 
                      className="absolute left-2 -bottom-1.5 right-2 h-3 cursor-ns-resize hover:bg-brand-primary/20 rounded transition-all z-40 flex items-center justify-center group pointer-events-auto"
                      style={{ cursor: 'ns-resize' }}
                      onPointerDown={(e) => handleResizeStart(e, 'weather', 'b')}
                    >
                      <div className="h-[2px] w-6 bg-slate-600/60 group-hover:bg-brand-primary rounded" />
                    </div>
                    {/* Bottom-Right Corner */}
                    <div 
                      className="absolute -right-1.5 -bottom-1.5 w-5 h-5 cursor-nwse-resize z-50 flex items-center justify-center rounded-full pointer-events-auto bg-slate-900 border border-brand-primary/30 hover:border-brand-primary text-brand-primary shadow-2xl transition-all"
                      style={{ cursor: 'nwse-resize' }}
                      onPointerDown={(e) => handleResizeStart(e, 'weather', 'br')}
                      title="Растянуть за угол"
                    >
                      <GripVertical className="w-3 h-3 text-slate-500 hover:text-white" style={{ rotate: '45deg' }} />
                    </div>
                  </>
                )}
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* Network health box indicators */}
      <div 
        className="p-4.5 flex flex-col md:flex-row items-center justify-between gap-4 border text-sm font-semibold relative overflow-hidden mt-2"
        style={{
          borderRadius: 'var(--app-radius)',
          borderColor: 'rgba(59, 130, 246, 0.25)',
          backgroundColor: 'rgba(59, 130, 246, 0.05)',
          boxShadow: '0 0 10px rgba(59, 130, 246, 0.05)',
        }}
      >
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
        <div className="flex items-center gap-3.5 bg-transparent">
          <Server className="w-5 h-5 text-blue-400 flex-shrink-0 animate-pulse bg-transparent" />
          <p className="text-blue-200 text-xs sm:text-sm font-medium tracking-wide bg-transparent">
            Локальная сеть SmashCore Smart Mesh функционирует стабильно.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-extrabold text-blue-400 font-mono bg-transparent">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          В ЭФИРЕ (OK)
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
