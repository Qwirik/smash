import React, { useState } from 'react';
import { useAppStore, LogicalNode } from '../store/useAppStore';
import { Card } from '../components/ui/Card';
import { Toggle } from '../components/ui/Toggle';
import { 
  Zap, Clock, Trash2, Sparkles, Plus, AlertCircle, Search, Sliders,
  HelpCircle, Settings, ArrowRight, ShieldCheck, Activity, Info
} from 'lucide-react';
import { ScenarioEditModal, ICON_OPTIONS } from '../components/modals/ScenarioEditModal';

// Recursive renderer for scenario tree logic overview
const renderVisualTreeBadges = (node: LogicalNode): React.ReactNode => {
  if (node.type === 'condition') {
    return (
      <div 
        className="inline-flex items-center gap-1 border px-2 py-0.5 rounded text-[10px] font-mono shadow-inner transition-all"
        style={{
          backgroundColor: 'var(--app-input-bg)',
          borderColor: 'var(--app-card-border)',
          color: 'var(--app-panel-text)'
        }}
      >
        <span className="opacity-75 font-semibold" style={{ color: 'var(--app-text-muted)' }}>{node.sensorDevice}</span>
        <span className="text-cyan-600 dark:text-[#00f0ff] font-bold">
          {node.parameter === 'temperature' ? 't°' : node.parameter === 'humidity' ? 'rh%' : node.parameter === 'motion' ? 'движ' : node.parameter === 'status' ? 'стат' : node.parameter}
        </span>
        <span className="text-yellow-600 dark:text-yellow-400 font-extrabold">{node.operator}</span>
        <span className="font-black" style={{ color: 'var(--app-panel-text)' }}>{node.value}</span>
      </div>
    );
  }
  if (node.type === 'timer') {
    return (
      <div className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-mono text-amber-600 dark:text-amber-300 leading-tight">
        <Clock className="w-3.5 h-3.5 text-amber-500" />
        <span>Задержка {node.duration}с</span>
      </div>
    );
  }
  
  if (!node.nodes || node.nodes.length === 0) {
    return <span className="text-slate-600 dark:text-slate-400 text-[10.5px] italic font-mono">[Пустая группа]</span>;
  }
  
  const isOr = node.logicalOperator === 'OR';
  return (
    <div className={`flex flex-col gap-1 pl-2.5 py-0.5 border-l border-dashed ${isOr ? 'border-amber-500/40 bg-amber-500/[0.01]' : 'border-cyan-500/40 bg-cyan-500/[0.01]'} rounded w-full`}>
      <span className={`text-[8px] font-black uppercase tracking-wider font-mono ${isOr ? 'text-amber-600 dark:text-amber-400' : 'text-cyan-600 dark:text-cyan-400'}`}>
        Группа ({isOr ? 'ИЛИ' : 'И'}):
      </span>
      <div className="flex flex-wrap items-center gap-1.5 w-full">
        {node.nodes.map((child, idx) => (
          <React.Fragment key={child.id || idx}>
            {renderVisualTreeBadges(child)}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export function ScenariosBuilder() {
  const customScenarios = useAppStore((state) => state.customScenarios);
  const removeCustomScenario = useAppStore((state) => state.removeCustomScenario);
  const toggleCustomScenario = useAppStore((state) => state.toggleCustomScenario);
  const addToast = useAppStore((state) => state.addToast);

  // Scenario Edit Modal systems
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  
  // Search query state
  const [searchQuery, setSearchQuery] = useState('');

  // Statistics calculations
  const totalScenarios = customScenarios.length;
  const activeScenarios = customScenarios.filter(s => s.enabled).length;
  const multiConditionCount = customScenarios.filter(s => s.conditions && s.conditions.length > 1).length;
  const timedCount = customScenarios.filter(s => s.triggerType === 'time' || (s.conditions && s.conditions.some(c => c.parameter === 'time'))).length;

  // Filtered list
  const filteredScenarios = customScenarios.filter((scen) => {
    const q = searchQuery.toLowerCase();
    const matchesName = scen.name.toLowerCase().includes(q);
    const matchesDevice = scen.actionDevice.toLowerCase().includes(q);
    const matchesTrigVal = scen.triggerValue.toLowerCase().includes(q);
    
    // Check inside conditions sensor devices
    const matchesConditions = scen.conditions?.some(c => 
      c.sensorDevice.toLowerCase().includes(q) || 
      c.parameter.toLowerCase().includes(q)
    ) || false;

    return matchesName || matchesDevice || matchesTrigVal || matchesConditions;
  });

  return (
    <div className="flex flex-col gap-6 md:gap-8 w-full select-none animate-fade-in text-slate-900 dark:text-slate-100">
      
      {/* Header Panel with Create Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-brand-panel/40 p-6 rounded-brand border border-brand-border/55" style={{ borderRadius: 'var(--app-radius)' }}>
        <div className="text-left">
          <h1 className="text-3xl font-black tracking-tight text-brand-panel-text flex items-center gap-2">
            Сценарии Автоматизации
            <Sparkles className="w-6 h-6 text-yellow-400" />
          </h1>
          <p className="text-xs text-brand-muted mt-1.5 font-semibold">
            Визуальный логический центр SmashCore. Связывайте датчики, настраивайте задержки и управляйте вашим домом по умным правилам.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSelectedScenarioId(null);
            setModalOpen(true);
          }}
          className="px-5 py-3.5 bg-brand-primary text-slate-950 font-black text-xs uppercase tracking-widest rounded-brand hover:brightness-110 flex items-center gap-2 cursor-pointer shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0"
          style={{ 
            borderRadius: 'var(--app-radius)',
            backgroundColor: 'var(--app-primary)'
          }}
        >
          <Plus className="w-4.5 h-4.5" style={{ strokeWidth: 3 }} />
          Создать сценарий
        </button>
      </div>

      {/* Bento Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total */}
        <div className="p-4 bg-brand-panel/60 border border-brand-border rounded-brand text-left flex items-start justify-between" style={{ borderRadius: 'var(--app-radius)' }}>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-muted">Всего сценариев</span>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{totalScenarios}</div>
            <span className="text-[9px] text-slate-400 mt-1 block">Конфигураций в системе</span>
          </div>
          <div className="p-2 bg-brand-accent-muted border border-brand-border rounded text-blue-500 dark:text-blue-400" style={{ borderRadius: 'calc(var(--app-radius) * 0.5)' }}>
            <Sliders className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Active */}
        <div className="p-4 bg-brand-panel/60 border border-brand-border rounded-brand text-left flex items-start justify-between" style={{ borderRadius: 'var(--app-radius)' }}>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-primary" style={{ color: 'var(--app-primary)' }}>Активно правил</span>
            <div className="text-3xl font-extrabold text-[#00c87f] dark:text-[#00f59b] mt-1">{activeScenarios}</div>
            <span className="text-[9px] text-slate-400 mt-1 block">Следят за событиями в реальном времени</span>
          </div>
          <div className="p-2 bg-brand-accent-muted border border-[#00c87f]/30 dark:border-[#00f59b]/20 rounded text-[#00c87f] dark:text-[#00f59b]" style={{ borderRadius: 'calc(var(--app-radius) * 0.5)' }}>
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        {/* Card 3: Complex logic */}
        <div className="p-4 bg-brand-panel/60 border border-brand-border rounded-brand text-left flex items-start justify-between" style={{ borderRadius: 'var(--app-radius)' }}>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-muted">Сложная логика</span>
            <div className="text-3xl font-extrabold text-cyan-600 dark:text-cyan-400 mt-1">{multiConditionCount}</div>
            <span className="text-[9px] text-slate-400 mt-1 block">Сценариев И / ИЛИ</span>
          </div>
          <div className="p-2 bg-brand-accent-muted border border-brand-border rounded text-cyan-600 dark:text-cyan-400" style={{ borderRadius: 'calc(var(--app-radius) * 0.5)' }}>
            <Zap className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Timed */}
        <div className="p-4 bg-brand-panel/60 border border-brand-border rounded-brand text-left flex items-start justify-between" style={{ borderRadius: 'var(--app-radius)' }}>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-muted">По времени</span>
            <div className="text-3xl font-extrabold text-yellow-600 dark:text-yellow-400 mt-1">{timedCount}</div>
            <span className="text-[9px] text-slate-400 mt-1 block">Задействуют таймер или часы</span>
          </div>
          <div className="p-2 bg-brand-accent-muted border border-brand-border rounded text-yellow-600 dark:text-yellow-400" style={{ borderRadius: 'calc(var(--app-radius) * 0.5)' }}>
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main wide area: Actions list */}
      <Card className="p-6">
        
        {/* Log title with real-time searching inputs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-brand-border/40 mb-6">
          <div className="text-left">
            <h3 className="font-extrabold text-sm text-brand-panel-text uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-primary" style={{ color: 'var(--app-primary)' }} />
              Загруженные цепочки автоматизации
            </h3>
            <p className="text-[10px] text-brand-muted font-semibold mt-0.5">Локальная прошивка SmashCore ActiveNode синхронизирована</p>
          </div>

          {/* Search box overlay */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-brand-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Поиск по имени, устройству или датчику..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-brand-input border border-brand-border rounded-brand pl-9 pr-4 py-2 text-xs text-brand-panel-text placeholder-brand-muted/60 font-semibold focus:outline-none focus:border-brand-primary transition-all"
              style={{ borderRadius: 'calc(var(--app-radius) * 0.8)' }}
            />
          </div>
        </div>

        {/* Custom Scenarios Visualizer */}
        {filteredScenarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <AlertCircle className="w-12 h-12 text-brand-muted/70" />
            <div className="text-sm text-brand-muted font-bold font-mono uppercase tracking-widest mt-1">Ничего не найдено</div>
            <p className="text-xs text-slate-500 max-w-[340px] leading-relaxed">
              {searchQuery ? `Нет результатов для запроса "${searchQuery}". Попробуйте очистить фильтр или изменить критерии.` : 'Сценарии ещё не созданы. Нажмите на кнопку "+ Создать сценарий" выше.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredScenarios.map((scen) => {
              const ScenarioIconComp = scen.icon && ICON_OPTIONS[scen.icon] ? ICON_OPTIONS[scen.icon] : (scen.triggerType === 'time' ? Clock : Zap);
              const customConds = scen.conditions || [];
              const customActions = scen.actions || [];

              return (
                <div
                  key={scen.id}
                  className="flex flex-col p-5 bg-brand-input/20 rounded-brand border border-brand-border hover:border-brand-primary/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl text-left"
                  style={{ borderRadius: 'var(--app-radius)' }}
                >
                  {/* Top line summary */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-brand-border/30">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div 
                        className={`p-2.5 rounded border transition-all ${
                          scen.enabled 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-[#00f59b] shadow-[#00f59b]/5 shadow-lg' 
                            : 'bg-brand-accent-muted border-brand-border text-brand-muted/85'
                        }`}
                        style={{ borderRadius: 'calc(var(--app-radius) * 0.7)' }}
                      >
                        <ScenarioIconComp className={`w-4 h-4 ${scen.enabled ? 'animate-pulse' : ''}`} />
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-extrabold text-[13px] text-brand-panel-text tracking-wide truncate leading-tight uppercase font-mono">{scen.name}</h4>
                        <span className="text-[9px] text-brand-muted font-bold block uppercase tracking-wider mt-0.5">
                          {scen.triggerType === 'manual' ? 'РУЧНОЙ ЗАПУСК' : scen.triggerType === 'time' ? 'ПО ТАЙМЕРУ' : 'АВТОМАТИКА ДАТЧИКОВ'}
                        </span>
                      </div>
                    </div>

                    {/* Right action controls */}
                    <div className="flex items-center gap-3">
                      <Toggle
                        checked={scen.enabled}
                        onChange={() => {
                          toggleCustomScenario(scen.id);
                          addToast(scen.enabled ? `Сценарий "${scen.name}" временно отключен` : `Сценарий "${scen.name}" активен`, 'info');
                        }}
                      />
                      
                      <div className="flex items-center bg-brand-input border border-brand-border rounded p-1" style={{ borderRadius: 'calc(var(--app-radius) * 0.5)' }}>
                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedScenarioId(scen.id);
                            setModalOpen(true);
                          }}
                          className="p-1 px-[7px] rounded hover:bg-brand-accent-muted text-brand-muted hover:text-brand-panel-text transition-all cursor-pointer border-0 bg-transparent outline-none"
                          title="Редактировать сценарий"
                        >
                          <Settings className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => {
                            removeCustomScenario(scen.id);
                            addToast(`Сценарий "${scen.name}" успешно удален`, 'info');
                          }}
                          className="p-1 px-[7px] rounded hover:bg-red-500/10 text-rose-500 hover:text-rose-600 dark:hover:text-red-400 transition-all cursor-pointer border-0 bg-transparent outline-none"
                          title="Удалить сценарий"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Factorio-style block visualization summary (Conditions Plate) */}
                  <div className="flex flex-col gap-3 py-3.5 flex-grow font-sans">
                    
                    {/* IF Block */}
                    <div className="flex flex-col gap-1.5 text-left w-full">
                      <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest font-mono" style={{ color: 'var(--app-primary)' }}>ЕСЛИ (BLOCKS CONTEXT):</span>
                      
                      {scen.logicalTree ? (
                        <div className="p-3 bg-brand-input border border-brand-border/30 rounded-brand overflow-x-auto w-full" style={{ borderRadius: 'calc(var(--app-radius) * 0.7)' }}>
                          {renderVisualTreeBadges(scen.logicalTree)}
                        </div>
                      ) : customConds.length === 0 ? (
                        <div className="px-3 py-2 bg-brand-input text-[10px] text-brand-muted font-bold border border-dashed border-brand-border/40 rounded italic" style={{ borderRadius: 'calc(var(--app-radius) * 0.4)' }}>
                          Условия отсутствуют. Запуск по кнопке "Выполнить в один клик".
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-brand-input/50 border border-brand-border/30 rounded" style={{ borderRadius: 'calc(var(--app-radius) * 0.6)' }}>
                          {customConds.map((c, idx) => {
                            const showJoint = idx < customConds.length - 1;
                            const jointOperator = c.joint || 'AND';

                            return (
                              <React.Fragment key={c.id}>
                                <div className="inline-flex flex-wrap items-center gap-1 bg-brand-input border border-brand-border/90 px-2 py-1 rounded text-[10px] font-mono shadow-inner text-brand-panel-text">
                                  <span className="text-[10px] text-brand-muted/90 font-semibold">{c.sensorDevice}</span>
                                  <span className="text-cyan-600 dark:text-[#00f0ff] font-bold">{c.parameter === 'temperature' ? 't°' : c.parameter === 'humidity' ? 'rh%' : c.parameter}</span>
                                  <span className="text-yellow-600 dark:text-yellow-400 font-extrabold">{c.operator}</span>
                                  <span className="text-brand-panel-text font-black">{c.value}</span>
                                  {c.duration && c.duration > 0 && (
                                    <span className="text-[10px] text-orange-600 dark:text-orange-400 font-bold flex items-center gap-0.5 ml-1 bg-orange-500/10 px-1 py-0.5 rounded border border-orange-500/15">
                                      ⏱ {c.duration}с
                                    </span>
                                  )}
                                </div>
                                {showJoint && (
                                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${jointOperator === 'OR' ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/20' : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20'}`}>
                                    {jointOperator === 'AND' ? 'И' : 'ИЛИ'}
                                  </span>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Arrow Path Connector */}
                    <div className="flex justify-center my-0.5">
                      <div className="h-4 w-px bg-brand-border/80 border-dashed border-l relative">
                        <ArrowRight className="w-3 h-3 text-brand-muted absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90" />
                      </div>
                    </div>

                    {/* THEN Block */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <span className="text-[10px] font-black text-emerald-600 dark:text-[#00f59b] uppercase tracking-widest font-mono">ТОГДА ПРОИЗВЕСТИ:</span>
                      
                      {customActions.length > 0 ? (
                        <div className="flex flex-col gap-1.5 p-2 bg-brand-input/50 border border-brand-border/30 rounded" style={{ borderRadius: 'calc(var(--app-radius) * 0.6)' }}>
                          {customActions.map((act) => (
                            <div key={act.id} className="flex items-center gap-1 px-2.5 py-1.5 bg-brand-input border border-brand-border/70 rounded text-[10px] font-mono text-brand-panel-text">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-[#00f59b] animate-pulse mr-1"></span>
                              <span className="text-brand-panel-text font-extrabold">{act.device}</span>
                              <span className="text-brand-muted">отправить команду</span>
                              <span className="text-cyan-600 dark:text-[#00f0ff] font-bold uppercase tracking-wider">
                                {act.commandType === 'on' ? 'ВКЛЮЧИТЬ (ON)' : act.commandType === 'off' ? 'ВЫКЛЮЧИТЬ (OFF)' : `УСТАНОВИТЬ ${act.value}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 p-2 bg-brand-input/50 border border-brand-border/30 rounded text-[10px] font-mono text-brand-panel-text" style={{ borderRadius: 'calc(var(--app-radius) * 0.6)' }}>
                          <span className="w-2 h-2 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-pulse mr-1"></span>
                          <span className="text-brand-panel-text font-extrabold">{scen.actionDevice}</span>
                          <span className="text-brand-muted">выполнить</span>
                          <span className="text-brand-primary font-bold uppercase" style={{ color: 'var(--app-primary)' }}>
                            {scen.actionType === 'on' ? 'ВКЛЮЧИТЬ' : scen.actionType === 'off' ? 'ВЫКЛЮЧИТЬ' : `УСТАНОВИТЬ ${scen.actionValue}`}
                          </span>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-brand-border/40 text-[10px] text-brand-muted/80 leading-relaxed font-semibold flex items-center gap-2">
          <Info className="w-4 h-4 text-brand-primary flex-shrink-0" style={{ color: 'var(--app-primary)' }} />
          <span>Вы можете быстро протестировать выполнение любого запущенного правила или временно приостановить его с помощью активного переключателя (Toggle Switch) на панели сценария.</span>
        </div>

      </Card>

      {/* Dynamic Modal Scenario Edit System */}
      <ScenarioEditModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        scenarioId={selectedScenarioId}
      />

    </div>
  );
}

export default ScenariosBuilder;
