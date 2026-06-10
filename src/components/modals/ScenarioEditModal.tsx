import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore, CustomScenario, ScenarioCondition, ScenarioAction, LogicalNode } from '../../store/useAppStore';
import { getDevices, Device, createRule, createTimer } from '../../api/endpoints';
import { 
  X, Plus, Trash2, HelpCircle, Terminal, Check, Settings,
  Zap, Clock, Thermometer, Sun, Moon, Wind, Snowflake, Lightbulb, 
  Shield, Lock, Sofa, Fan, Eye, Music, Power, Play, Sliders, Flame, Sparkles
} from 'lucide-react';

// Pre-defined icons for selection
export const ICON_OPTIONS: Record<string, React.ComponentType<any>> = {
  zap: Zap,
  clock: Clock,
  thermometer: Thermometer,
  sun: Sun,
  moon: Moon,
  wind: Wind,
  snowflake: Snowflake,
  lightbulb: Lightbulb,
  shield: Shield,
  lock: Lock,
  sofa: Sofa,
  fan: Fan,
  eye: Eye,
  music: Music,
  power: Power,
  play: Play,
  sliders: Sliders,
  flame: Flame,
};

interface ScenarioEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenarioId: string | null; // Null means creating
}

export function ScenarioEditModal({ isOpen, onClose, scenarioId }: ScenarioEditModalProps) {
  if (!isOpen) return null;

  const customScenarios = useAppStore((state) => state.customScenarios);
  const addCustomScenario = useAppStore((state) => state.addCustomScenario);
  const updateCustomScenario = useAppStore((state) => state.updateCustomScenario);
  const addToast = useAppStore((state) => state.addToast);

  // Retrieve builder accent colors from global store
  const logicAccent = useAppStore((state) => state.logicAccent);
  const actionAccent = useAppStore((state) => state.actionAccent);
  const actionBtnColor = useAppStore((state) => state.actionBtnColor);
  const codeHighlightColor = useAppStore((state) => state.codeHighlightColor);

  const editingScenario = customScenarios.find((s) => s.id === scenarioId) || null;

  // Form State values
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('zap');
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  
  // AST logical tree structure state - Default is an empty root group
  const [logicalTree, setLogicalTree] = useState<LogicalNode>({
    id: 'root-group',
    type: 'group',
    logicalOperator: 'AND',
    nodes: []
  });

  const [actions, setActions] = useState<ScenarioAction[]>([]);
  
  // Devices loaded from the controller API
  const [devices, setDevices] = useState<Device[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [showJsonPayload, setShowJsonPayload] = useState(false);

  // Load devices list
  useEffect(() => {
    async function load() {
      try {
        const list = await getDevices();
        setDevices(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Failed to load devices for editing modal', err);
        setDevices([]);
      } finally {
        setLoadingDevices(false);
      }
    }
    load();
  }, [isOpen]);

  // Sync state with editing target or defaults
  useEffect(() => {
    if (editingScenario) {
      setName(editingScenario.name);
      setSelectedIcon(editingScenario.icon || 'zap');
      
      // Handle recursive upgrade of old flat format or loading existing logical Tree
      if (editingScenario.logicalTree) {
        setLogicalTree(editingScenario.logicalTree);
      } else if (editingScenario.conditions && editingScenario.conditions.length > 0) {
        // Upgrade legacy flat conditions list to our cool group structure
        const legacyNodes: LogicalNode[] = editingScenario.conditions.map((c) => ({
          id: c.id || 'old-cond-' + Math.random().toString(36).substring(2, 9),
          type: 'condition',
          sensorDevice: c.sensorDevice,
          parameter: c.parameter,
          operator: c.operator,
          value: c.value
        }));
        setLogicalTree({
          id: 'root-group',
          type: 'group',
          logicalOperator: 'AND',
          nodes: legacyNodes
        });
      } else {
        setLogicalTree({
          id: 'root-group',
          type: 'group',
          logicalOperator: 'AND',
          nodes: []
        });
      }
      
      if (editingScenario.actions && editingScenario.actions.length > 0) {
        setActions(editingScenario.actions);
      } else {
        // Map old singular values for backwards compatibility
        setActions([
          {
            id: 'act-' + Math.random().toString(36).substring(2, 9),
            device: editingScenario.actionDevice || (devices.length > 0 ? devices[0].name : 'Люстра'),
            commandType: editingScenario.actionType || 'on',
            value: editingScenario.actionValue || 100
          }
        ]);
      }
    } else {
      setName('');
      setSelectedIcon('zap');
      setLogicalTree({
        id: 'root-group',
        type: 'group',
        logicalOperator: 'AND',
        nodes: []
      });
      setActions([
        {
          id: 'act-' + Math.random().toString(36).substring(2, 9),
          device: devices.length > 0 ? devices[0].name : 'Люстра',
          commandType: 'on',
          value: 100
        }
      ]);
    }
  }, [scenarioId, editingScenario, isOpen, devices.length]);

  // Recursively modify node in the tree helpers
  const updateTreeNode = (tree: LogicalNode, targetId: string, updates: Partial<LogicalNode>): LogicalNode => {
    if (tree.id === targetId) {
      return { ...tree, ...updates };
    }
    if (tree.type === 'group' && tree.nodes) {
      return {
        ...tree,
        nodes: tree.nodes.map(n => updateTreeNode(n, targetId, updates))
      };
    }
    return tree;
  };

  // Recursively add a node to a target group
  const addNodeToGroup = (tree: LogicalNode, targetGroupId: string, newNode: LogicalNode): LogicalNode => {
    if (tree.id === targetGroupId) {
      return {
        ...tree,
        nodes: [...(tree.nodes || []), newNode]
      };
    }
    if (tree.type === 'group' && tree.nodes) {
      return {
        ...tree,
        nodes: tree.nodes.map(n => addNodeToGroup(n, targetGroupId, newNode))
      };
    }
    return tree;
  };

  // Recursively remove a node from the tree
  const removeTreeNode = (tree: LogicalNode, targetId: string): LogicalNode | null => {
    if (tree.id === targetId) {
      return null; // Signals this node should be removed from parent list
    }
    if (tree.type === 'group' && tree.nodes) {
      return {
        ...tree,
        nodes: tree.nodes
          .map(n => removeTreeNode(n, targetId))
          .filter((n): n is LogicalNode => n !== null)
      };
    }
    return tree;
  };

  // UI Event Handlers
  const handleAddNode = (parentGroupId: string, type: 'condition' | 'timer' | 'group', currentDepth?: number) => {
    if (type === 'group' && currentDepth !== undefined && currentDepth >= 2) {
      addToast('Достигнут максимум вложенности (Max Depth = 2)! Невозможно добавить подгруппу.', 'error');
      return;
    }
    let newNode: LogicalNode;
    if (type === 'condition') {
      newNode = {
        id: 'cond-' + Math.random().toString(36).substring(2, 9),
        type: 'condition',
        sensorDevice: devices.length > 0 ? devices[0].name : 'Датчик температуры',
        parameter: 'temperature',
        operator: '>',
        value: '22'
      };
    } else if (type === 'timer') {
      newNode = {
        id: 'timer-' + Math.random().toString(36).substring(2, 9),
        type: 'timer',
        duration: 10
      };
    } else {
      newNode = {
        id: 'group-' + Math.random().toString(36).substring(2, 9),
        type: 'group',
        logicalOperator: 'AND',
        nodes: []
      };
    }
    setLogicalTree(prevTree => addNodeToGroup(prevTree, parentGroupId, newNode));
    addToast(
      type === 'condition' ? 'Добавлен блок условия сравнения' :
      type === 'timer' ? 'Добавлен независимый таймер/задержка' : 'Создана вложенная логическая группа [',
      'info'
    );
  };

  const handleUpdateNodeValue = (nodeId: string, k: keyof LogicalNode, v: any) => {
    setLogicalTree(prevTree => {
      // Create updates slice
      const updates: Partial<LogicalNode> = { [k]: v };
      
      // Auto adjust fields for smooth UX parameter changes
      if (k === 'parameter') {
        if (v === 'motion') {
          updates.value = 'В движении';
          updates.operator = '==';
        } else if (v === 'status') {
          updates.value = 'ON';
          updates.operator = '==';
        } else if (v === 'temperature') {
          updates.value = '22';
          updates.operator = '>';
        } else if (v === 'humidity') {
          updates.value = '50';
          updates.operator = '>';
        } else if (v === 'time') {
          updates.value = '18:00';
          updates.operator = '==';
        }
      }
      return updateTreeNode(prevTree, nodeId, updates);
    });
  };

  const handleToggleJointOperator = (groupId: string, currentOp: 'AND' | 'OR') => {
    const nextOp = currentOp === 'AND' ? 'OR' : 'AND';
    setLogicalTree(prevTree => updateTreeNode(prevTree, groupId, { logicalOperator: nextOp }));
    addToast(`Оператор группы изменён на ${nextOp === 'AND' ? 'И' : 'ИЛИ'}`, 'info');
  };

  const handleRemoveNodeGlobal = (nodeId: string) => {
    if (nodeId === 'root-group') {
      addToast('Нельзя удалить корневую логическую группу!', 'error');
      return;
    }
    setLogicalTree(prevTree => {
      const updated = removeTreeNode(prevTree, nodeId);
      return updated || { id: 'root-group', type: 'group', logicalOperator: 'AND', nodes: [] };
    });
    addToast('Узел успешно удален из цепи бэкенда', 'info');
  };

  // Adding action blocks inside THEN list
  const handleAddAction = () => {
    const newAction: ScenarioAction = {
      id: 'act-' + Math.random().toString(36).substring(2, 9),
      device: devices.length > 0 ? devices[0].name : 'Люстра',
      commandType: 'on',
      value: 100
    };
    setActions([...actions, newAction]);
    addToast('Добавлен блок действия (команда)', 'info');
  };

  const handleUpdateAction = (actId: string, k: keyof ScenarioAction, v: any) => {
    setActions(
      actions.map((act) => {
        if (act.id === actId) {
          return { ...act, [k]: v };
        }
        return act;
      })
    );
  };

  const handleRemoveAction = (actId: string) => {
    setActions(actions.filter((act) => act.id !== actId));
    addToast('Блок действия удален', 'info');
  };

  // AST Flattening helper for backwards compatibility display lists or trigger classification
  const flattenTreeToConditions = (node: LogicalNode): ScenarioCondition[] => {
    if (node.type === 'condition') {
      return [{
        id: node.id,
        sensorDevice: node.sensorDevice || 'Датчик температуры',
        parameter: node.parameter || 'temperature',
        operator: node.operator || '>',
        value: node.value || '22',
        joint: 'AND'
      }];
    }
    if (node.type === 'group' && node.nodes) {
      return node.nodes.flatMap(flattenTreeToConditions);
    }
    return []; // Timer nodes skipped in condition arrays
  };

  const generateShortTriggerLabel = (node: LogicalNode): string => {
    if (node.type === 'condition') {
      const localizedParam = 
        node.parameter === 'temperature' ? 't°' :
        node.parameter === 'humidity' ? 'rh%' :
        node.parameter === 'motion' ? 'движ' :
        node.parameter === 'status' ? 'стат' : node.parameter;
      return `${node.sensorDevice} ${localizedParam}${node.operator}${node.value}`;
    }
    if (node.type === 'timer') {
      return `таймер ${node.duration}с`;
    }
    const childrenLabels = (node.nodes || []).map(generateShortTriggerLabel).filter(Boolean);
    if (childrenLabels.length === 0) return '';
    if (childrenLabels.length === 1) return childrenLabels[0];
    const op = node.logicalOperator || 'AND';
    return `(${childrenLabels.join(` ${op === 'AND' ? 'И' : 'ИЛИ'} `)})`;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('Пожалуйста, введите имя сценария', 'error');
      return;
    }
    if (actions.length === 0) {
      addToast('Пожалуйста, добавьте хотя бы одно действие', 'error');
      return;
    }

    // Determine basic trigger characteristics
    const flatConds = flattenTreeToConditions(logicalTree);
    let triggerValueStr = generateShortTriggerLabel(logicalTree) || 'Пустая цепь';
    
    // Auto truncate if label gets too long
    if (triggerValueStr.length > 55) {
      triggerValueStr = triggerValueStr.substring(0, 52) + '...';
    }

    let composedTriggerType: 'temp' | 'time' | 'motion' | 'manual' | 'multi' = 'manual';
    if (flatConds.length === 0) {
      triggerValueStr = 'Вручную';
      composedTriggerType = 'manual';
    } else if (flatConds.length === 1) {
      const primary = flatConds[0];
      if (primary.parameter === 'temperature') composedTriggerType = 'temp';
      else if (primary.parameter === 'time') composedTriggerType = 'time';
      else if (primary.parameter === 'motion') composedTriggerType = 'motion';
      else composedTriggerType = 'multi';
    } else {
      composedTriggerType = 'multi';
    }

    const primaryAction = actions[0];

    const compiledScenario: CustomScenario = {
      id: scenarioId || 'scen-' + Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      triggerType: composedTriggerType,
      triggerValue: triggerValueStr,
      actionDevice: primaryAction.device,
      actionType: primaryAction.commandType,
      actionValue: primaryAction.value,
      enabled: editingScenario ? editingScenario.enabled : true,
      icon: selectedIcon,
      conditions: flatConds, // Backward compatibility flat condition mapping
      actions: actions,
      logicalTree: logicalTree  // Recursive tree payload AST
    };

    // Simulated rule API bindings
    if (flatConds.length > 0) {
      const primary = flatConds[0];
      const payload = {
        name: name.trim().replace(/\s+/g, '_'),
        trig_dev: primary.sensorDevice,
        cond: primary.operator,
        val: parseFloat(primary.value) || 0,
        act_dev: primaryAction.device,
        act_cmd: primaryAction.commandType === 'value' ? `dim_${primaryAction.value}` : primaryAction.commandType === 'on' ? 'relay_on' : 'relay_off'
      };
      
      try {
        await createRule(payload);
      } catch (err) {
        console.warn('Silent local fallback for API firmware sync');
      }
    }

    if (scenarioId) {
      updateCustomScenario(scenarioId, compiledScenario);
      addToast(`Сценарий "${name}" успешно сохранен`, 'success');
    } else {
      addCustomScenario(compiledScenario);
      addToast(`Новый сценарий "${name}" успешно загружен в Node!`, 'success');
    }
    onClose();
  };

  // Recursive serialization of Tree for AST Payload Contrast
  const serializeTreeToContract = (node: LogicalNode): any => {
    if (node.type === 'condition') {
      return {
        type: 'condition',
        device: node.sensorDevice,
        parameter: node.parameter,
        operator: node.operator,
        value: node.value
      };
    }
    if (node.type === 'timer') {
      return {
        type: 'timer',
        duration: node.duration || 10
      };
    }
    // Group logic output
    return {
      type: 'group',
      operator: node.logicalOperator || 'AND',
      nodes: (node.nodes || []).map(serializeTreeToContract)
    };
  };

  const getSimulatedJsonPayload = () => {
    return {
      id: scenarioId || 'scen-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      name: name.trim() || 'Без названия',
      icon: selectedIcon,
      enabled: editingScenario ? editingScenario.enabled : true,
      AST_tree: serializeTreeToContract(logicalTree),
      actions_list: actions.map((act) => ({
        device: act.device,
        command: act.commandType === 'value' ? `dim_${act.value}` : act.commandType === 'on' ? 'relay_on' : 'relay_off',
        level_value: act.commandType === 'value' ? act.value : null
      }))
    };
  };

  // Recursive simulation CLI generator with visual parenthesis groups representation
  const getSimulatedCliCommand = () => {
    const formattedName = name.trim().replace(/\s+/g, '_') || '<имя_сценария>';
    const primary = actions[0] || { device: '<устройство>', commandType: 'on', value: 100 };
    const act = primary.commandType === 'value' ? `dim_${primary.value}` : primary.commandType === 'on' ? 'relay_on' : 'relay_off';
    const target = primary.device.replace(/\s+/g, '_');

    const getCliCommandForNode = (node: LogicalNode): string => {
      if (node.type === 'condition') {
        const sensorPart = (node.sensorDevice || '').replace(/\s+/g, '_');
        const paramPart = node.parameter || '';
        const opPart = node.operator || '';
        const valPart = (node.value || '').replace(/\s+/g, '_');
        return `[${sensorPart}.${paramPart}${opPart}${valPart}]`;
      }
      if (node.type === 'timer') {
        return `[timer.delay(${node.duration}s)]`;
      }
      const childrenCli = (node.nodes || []).map(getCliCommandForNode).filter(Boolean);
      if (childrenCli.length === 0) return '';
      if (childrenCli.length === 1) return childrenCli[0];
      const op = node.logicalOperator || 'AND';
      return `(${childrenCli.join(` _${op}_ `)})`;
    };

    const conditionTokens = getCliCommandForNode(logicalTree);
    if (!conditionTokens) {
      return `addmanual ${formattedName} ${target} ${act}`;
    }

    return `addmultirule ${formattedName} cond:${conditionTokens} action:${target}.${act} icon:${selectedIcon}`;
  };

  // RECURSIVE NODE COMPONENT RENDERER
  const renderLogicalNodeRec = (node: LogicalNode, depth: number = 0, parentGroupId: string = ''): React.ReactNode => {
    if (node.type === 'condition') {
      return (
        <div 
          key={node.id} 
          style={{ 
            borderLeftColor: logicAccent,
            backgroundColor: 'var(--app-input-bg)',
            borderColor: 'var(--app-card-border)'
          }}
          className="flex flex-col gap-3 p-4 rounded border-l-4 border hover:border-slate-400 dark:hover:border-slate-500 transition-all text-left animate-fade-in"
        >
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center w-full">
            
            {/* Condition badge key */}
            <div 
              style={{ color: logicAccent, borderColor: `${logicAccent}30`, backgroundColor: `${logicAccent}10` }}
              className="sm:col-span-1.5 flex items-center justify-center font-mono text-[9px] font-black py-1 px-1.5 rounded border uppercase"
            >
              УСЛОВИЕ
            </div>

            {/* Sensor dropdown Selector */}
            <div className="sm:col-span-4 text-xs font-semibold" style={{ color: 'var(--app-panel-text)' }}>
              <select
                value={node.sensorDevice}
                onChange={(e) => handleUpdateNodeValue(node.id, 'sensorDevice', e.target.value)}
                style={{ 
                  backgroundColor: 'var(--app-panel-bg)', 
                  borderColor: 'var(--app-card-border)', 
                  color: 'var(--app-panel-text)' 
                }}
                className="w-full rounded p-2 text-[11px] focus:outline-none cursor-pointer font-extrabold font-mono border"
              >
                <option value="Датчик температуры">Датчик температуры</option>
                <option value="Датчик влажности">Датчик влажности</option>
                <option value="Сенсор движения">Сенсор движения</option>
                <option value="Камера двора">Камера двора</option>
                <option value="Люстра">Люстра</option>
                <option value="Кондиционер">Кондиционер</option>
                <option value="Обогреватель">Обогреватель</option>
                <option value="Датчик протечки ванны">Датчик протечки ванны</option>
                {devices.map((d) => (
                  <option key={d.id} value={d.name}>{d.name} ({d.location})</option>
                ))}
              </select>
            </div>

            {/* Parameter selection */}
            <div className="sm:col-span-3">
              <select
                value={node.parameter}
                onChange={(e) => handleUpdateNodeValue(node.id, 'parameter', e.target.value)}
                style={{ 
                  backgroundColor: 'var(--app-panel-bg)', 
                  borderColor: 'var(--app-card-border)', 
                  color: 'var(--app-panel-text)' 
                }}
                className="w-full rounded p-2 text-[11px] focus:outline-none cursor-pointer font-bold font-mono border"
              >
                <option value="temperature">Температура (°C)</option>
                <option value="humidity">Влажность (%)</option>
                <option value="motion">Движение</option>
                <option value="status">Активность (Статус)</option>
                <option value="time">Абсолютное время</option>
              </select>
            </div>

            {/* Operator comparative sign */}
            <div className="sm:col-span-1.5">
              <select
                value={node.operator}
                onChange={(e) => handleUpdateNodeValue(node.id, 'operator', e.target.value)}
                disabled={node.parameter === 'motion' || node.parameter === 'status' || node.parameter === 'time'}
                style={{ 
                  backgroundColor: 'var(--app-panel-bg)', 
                  borderColor: 'var(--app-card-border)', 
                  color: 'var(--app-panel-text)' 
                }}
                className="w-full rounded p-2 text-[11px] font-black text-center disabled:opacity-40 focus:outline-none cursor-pointer font-mono border"
              >
                <option value=">">&gt;</option>
                <option value="<">&lt;</option>
                <option value="==">==</option>
                <option value="!=">!=</option>
              </select>
            </div>

            {/* Dynamic Value control */}
            <div className="sm:col-span-2">
              {node.parameter === 'motion' ? (
                <select
                  value={node.value}
                  onChange={(e) => handleUpdateNodeValue(node.id, 'value', e.target.value)}
                  style={{ 
                    backgroundColor: 'var(--app-panel-bg)', 
                    borderColor: 'var(--app-card-border)', 
                    color: 'var(--app-panel-text)' 
                  }}
                  className="w-full rounded p-2 text-[11px] focus:outline-none font-bold font-mono border"
                >
                  <option value="В движении">Движение</option>
                  <option value="Иммобилизация">Покой</option>
                </select>
              ) : node.parameter === 'status' ? (
                <select
                  value={node.value}
                  onChange={(e) => handleUpdateNodeValue(node.id, 'value', e.target.value)}
                  style={{ 
                    backgroundColor: 'var(--app-panel-bg)', 
                    borderColor: 'var(--app-card-border)', 
                    color: 'var(--app-panel-text)' 
                  }}
                  className="w-full rounded p-2 text-[11px] focus:outline-none font-bold font-mono border"
                >
                  <option value="ON">Вкл (ON)</option>
                  <option value="OFF">Выкл (OFF)</option>
                </select>
              ) : node.parameter === 'time' ? (
                <input
                  type="time"
                  value={node.value}
                  onChange={(e) => handleUpdateNodeValue(node.id, 'value', e.target.value)}
                  style={{ 
                    backgroundColor: 'var(--app-panel-bg)', 
                    borderColor: 'var(--app-card-border)', 
                    color: 'var(--app-panel-text)' 
                  }}
                  className="w-full rounded p-1.5 text-[11px] text-center font-mono border focus:outline-none"
                />
              ) : (
                <input
                  type="text"
                  placeholder="22"
                  value={node.value}
                  onChange={(e) => handleUpdateNodeValue(node.id, 'value', e.target.value)}
                  style={{ 
                    backgroundColor: 'var(--app-panel-bg)', 
                    borderColor: 'var(--app-card-border)', 
                    color: 'var(--app-panel-text)' 
                  }}
                  className="w-full rounded p-2 text-[11px] text-center font-mono tracking-tight focus:outline-none font-bold border"
                />
              )}
            </div>

            {/* Trash button delete element */}
            <div className="sm:col-span-0.5 flex justify-end">
              <button
                type="button"
                onClick={() => handleRemoveNodeGlobal(node.id)}
                className="p-1.5 rounded hover:bg-rose-500/10 text-rose-400 hover:text-rose-500 hover:scale-105 transition-all cursor-pointer border-0 bg-transparent pr-1"
                title="Удалить узел условия"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (node.type === 'timer') {
      return (
        <div 
          key={node.id} 
          style={{ 
            borderLeftColor: logicAccent,
            backgroundColor: 'var(--app-input-bg)',
            borderColor: 'var(--app-card-border)'
          }}
          className="flex items-center justify-between p-4 rounded border-l-4 border hover:border-slate-400 dark:hover:border-slate-500 transition-all text-left animate-fade-in"
        >
          <div className="flex flex-wrap items-center gap-3 w-full">
            {/* Timer Badge */}
            <div 
              style={{ color: logicAccent, borderColor: `${logicAccent}30`, backgroundColor: `${logicAccent}10` }}
              className="flex items-center justify-center font-mono text-[9px] font-black py-1 px-1.5 rounded border"
            >
              ТАЙМЕР УЗЕЛ (TIMER DELAY)
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold font-mono" style={{ color: 'var(--app-panel-text)' }}>
              <Clock className="w-4 h-4" style={{ color: logicAccent }} />
              <span>Задержать поток цепи и удерживать состояние в течение</span>
              
              <input 
                type="number"
                min="1"
                max="3600"
                value={node.duration || 10}
                onChange={(e) => handleUpdateNodeValue(node.id, 'duration', parseInt(e.target.value, 10) || 10)}
                style={{ 
                  backgroundColor: 'var(--app-panel-bg)', 
                  borderColor: 'var(--app-card-border)', 
                  color: 'var(--app-panel-text)' 
                }}
                className="w-16 rounded px-2 py-1 text-center font-bold focus:outline-none font-mono text-xs border"
              />

              <span style={{ color: 'var(--app-text-muted)' }}>секунд</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleRemoveNodeGlobal(node.id)}
            className="p-1.5 rounded hover:bg-rose-500/10 text-rose-400 hover:text-rose-500 hover:scale-105 transition-all cursor-pointer border-0 bg-transparent"
            title="Удалить узел таймера"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      );
    }

    // Group Logical Container Block recursion [Visual parentheses]
    if (node.type === 'group') {
      const isOrOperator = node.logicalOperator === 'OR';
      const headingText = depth === 0 ? "КОРНЕВАЯ ГРУППА ФИЛЬТРА" : `ЛОГИЧЕСКАЯ ПОДГРУППА (УРОВЕНЬ ${depth})`;

      return (
        <div 
          key={node.id}
          style={{ 
            backgroundColor: 'var(--app-panel-bg)', 
            borderColor: 'var(--app-card-border)' 
          }}
          className="flex flex-col gap-3 p-1.5 md:p-3 rounded transition-all text-left animate-fade-in border hover:border-slate-400 dark:hover:border-slate-500"
        >
          {/* Group bracket header layout */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b" style={{ borderColor: 'var(--app-card-border)' }}>
            <div className="flex items-center gap-2 bg-transparent text-left">
              {/* Bracket symbol indicator */}
              <span className="font-mono text-lg font-black" style={{ color: logicAccent }}>[</span>
              <div className="text-left font-mono">
                <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--app-panel-text)' }}>
                  {headingText}
                </span>
                <span className="text-[8.5px] block font-sans" style={{ color: 'var(--app-text-muted)' }}>Все вложенные ноды соединяются оператором группы ниже</span>
              </div>
            </div>

            {/* Operator switch selector and Group deletion */}
            <div className="flex items-center gap-2.5 font-mono">
              
              {/* Logical Operator toggle button inside group header */}
              <div 
                className="flex items-center border p-0.5 shadow-sm" 
                style={{ 
                  borderRadius: '4px',
                  backgroundColor: 'var(--app-input-bg)',
                  borderColor: 'var(--app-card-border)'
                }}
              >
                <button
                  type="button"
                  onClick={() => handleToggleJointOperator(node.id, node.logicalOperator || 'AND')}
                  style={{
                    backgroundColor: !isOrOperator ? 'var(--app-primary)' : 'transparent',
                    color: !isOrOperator ? '#000000' : 'var(--app-text-muted)',
                    borderColor: !isOrOperator ? 'var(--app-primary)' : 'transparent',
                  }}
                  className="px-2 py-1 font-black text-[9px] uppercase tracking-widest transition-all cursor-pointer border rounded font-mono"
                >
                  И (AND)
                </button>
                
                <button
                  type="button"
                  onClick={() => handleToggleJointOperator(node.id, node.logicalOperator || 'AND')}
                  style={{
                    backgroundColor: isOrOperator ? 'var(--app-primary)' : 'transparent',
                    color: isOrOperator ? '#000000' : 'var(--app-text-muted)',
                    borderColor: isOrOperator ? 'var(--app-primary)' : 'transparent',
                  }}
                  className="px-2 py-1 font-black text-[9px] uppercase tracking-widest transition-all cursor-pointer border rounded font-mono"
                >
                  ИЛИ (OR)
                </button>
              </div>

              {/* Delete logic group button, forbidden for absolute root */}
              {node.id !== 'root-group' && (
                <button
                  type="button"
                  onClick={() => handleRemoveNodeGlobal(node.id)}
                  style={{ 
                    backgroundColor: 'var(--app-input-bg)', 
                    borderColor: 'var(--app-card-border)', 
                    color: 'var(--app-text-muted)' 
                  }}
                  className="p-1.5 rounded hover:bg-rose-500/10 hover:text-rose-500 transition-all cursor-pointer border shadow-sm flex items-center gap-1 text-[9px] font-bold font-mono"
                  title="Удалить всю логическую группу"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>УДАЛИТЬ ГРУППУ</span>
                </button>
              )}
            </div>
          </div>

          {/* Bracket Inner Content Block with Visual Offset bracket styling */}
          <div className="relative flex flex-col gap-3 py-1 mt-1 pl-4 md:pl-6 border-l-2 border-dashed" style={{ borderColor: 'var(--app-card-border)' }}>
            {/* Visual brace indicator left line accent */}
            <div 
              style={{ backgroundColor: logicAccent }}
              className="absolute top-0 bottom-0 left-0 w-[3px] rounded opacity-60" 
            />

            {/* Recurse nodes list inside bracket */}
            {(!node.nodes || node.nodes.length === 0) ? (
              <div 
                style={{ backgroundColor: 'var(--app-input-bg)', borderColor: 'var(--app-card-border)' }}
                className="py-5 text-center flex flex-col items-center justify-center border border-dashed rounded p-4"
              >
                <span className="text-[9.5px] font-bold uppercase font-mono tracking-wider" style={{ color: 'var(--app-panel-text)' }}>Группа пуста (нет вложенных условий)</span>
                <span className="text-[8.5px] mt-0.5 font-sans" style={{ color: 'var(--app-text-muted)' }}>Добавьте дочерние блоки с помощью панели инструментов группы ниже:</span>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {node.nodes.map(child => renderLogicalNodeRec(child, depth + 1, node.id))}
              </div>
            )}

            {/* In-group dynamic tool actions footer */}
            <div className="flex flex-wrap items-center gap-2 mt-1 pt-2 border-t" style={{ borderColor: 'var(--app-card-border)' }}>
              <span className="text-[9px] font-mono font-extrabold uppercase mr-1" style={{ color: 'var(--app-text-muted)' }}>вставить внутрь:</span>
              
              <button
                type="button"
                onClick={() => handleAddNode(node.id, 'condition')}
                style={{ 
                  backgroundColor: 'var(--app-input-bg)', 
                  borderColor: 'var(--app-card-border)', 
                  color: 'var(--app-panel-text)' 
                }}
                className="px-2.5 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 text-[9.5px] font-extrabold uppercase rounded flex items-center gap-1 cursor-pointer transition-all active:scale-95 duration-150 shadow-sm border"
              >
                <Plus className="w-3 h-3" style={{ color: logicAccent }} />
                <span>+ Условие</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddNode(node.id, 'timer')}
                style={{ 
                  backgroundColor: 'var(--app-input-bg)', 
                  borderColor: 'var(--app-card-border)', 
                  color: 'var(--app-panel-text)' 
                }}
                className="px-2.5 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 text-[9.5px] font-extrabold uppercase rounded flex items-center gap-1 cursor-pointer transition-all active:scale-95 duration-150 shadow-sm border"
              >
                <Plus className="w-3 h-3" style={{ color: logicAccent }} />
                <span>+ Таймер задержки</span>
              </button>

              <button
                type="button"
                disabled={depth >= 2}
                title={depth >= 2 ? "Достигнут максимум вложенности" : "Добавить вложенную группу []"}
                onClick={() => handleAddNode(node.id, 'group', depth)}
                style={{ 
                  backgroundColor: 'var(--app-input-bg)', 
                  borderColor: 'var(--app-card-border)', 
                  color: 'var(--app-panel-text)' 
                }}
                className={`px-2.5 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 text-[9.5px] font-extrabold uppercase rounded flex items-center gap-1 transition-all duration-150 shadow-sm border ${
                  depth >= 2 
                    ? 'opacity-40 cursor-not-allowed' 
                    : 'cursor-pointer active:scale-95'
                }`}
              >
                <Plus className="w-3 h-3" style={{ color: logicAccent }} />
                <span>+ Вложенную группу []</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const SelectedIconComponent = ICON_OPTIONS[selectedIcon] || Zap;

  // Render automatic syntax elements variables
  const formattedName = name.trim().replace(/\s+/g, '_') || '<имя_сценария>';
  const primaryAct = actions[0] || { device: 'Люстра', commandType: 'on', value: 100 };
  const actCmd = primaryAct.commandType === 'value' ? `dim_${primaryAct.value}` : primaryAct.commandType === 'on' ? 'relay_on' : 'relay_off';
  const targetDev = primaryAct.device.replace(/\s+/g, '_');

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none select-none">
      {/* Soft Light Backdrop overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300 animate-fade-in cursor-pointer"
        onClick={onClose}
      />

      {/* Main Modal container */}
      <div 
        className="relative w-full max-w-3xl mx-4 my-8 flex flex-col shadow-2xl overflow-hidden animate-scale-up-center z-10"
        style={{
          borderWidth: 'var(--app-border)',
          borderColor: 'var(--app-card-border)',
          borderStyle: 'solid',
          borderRadius: 'var(--app-radius)',
          backgroundColor: 'var(--app-panel-bg)',
          color: 'var(--app-panel-text)'
        }}
      >
        {/* Header bar - Elegant theme-aware colors */}
        <div 
          className="flex justify-between items-center p-5 border-b"
          style={{
            backgroundColor: 'var(--app-accent-muted)',
            borderColor: 'var(--app-card-border)',
          }}
        >
          <div className="flex gap-2.5 items-center bg-transparent">
            <div 
              className="p-2.5 rounded-lg shadow-sm border"
              style={{
                backgroundColor: 'var(--app-input-bg)',
                borderColor: 'var(--app-card-border)',
                color: 'var(--app-panel-text)',
              }}
            >
              <SelectedIconComponent className="w-5 h-5" />
            </div>
            <div className="text-left bg-transparent">
              <h3 
                className="text-sm font-extrabold tracking-tight uppercase font-mono flex items-center gap-2"
                style={{ color: 'var(--app-panel-text)' }}
              >
                Редактор Сценариев SmashCore Node
                <Sparkles className="w-4 h-4" style={{ color: logicAccent }} />
              </h3>
              <p 
                className="text-[10px] font-bold mt-0.5 uppercase tracking-wide leading-none"
                style={{ color: 'var(--app-text-muted)' }}
              >
                Конструирование AST бэкенд правил, независимых таймеров задержки и рекурсивных вложений
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-all cursor-pointer bg-transparent border-0 opacity-70 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10"
              style={{ color: 'var(--app-panel-text)' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Form body */}
        <form 
          onSubmit={handleSave} 
          className="flex flex-col flex-grow text-left overflow-y-auto max-h-[75vh] relative"
          style={{ backgroundColor: 'var(--app-panel-bg)' }}
        >
          <div className="p-6 flex flex-col gap-6">
            
            {/* Name/Icon Config Block */}
            <div 
              className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 rounded-lg border"
              style={{
                backgroundColor: 'var(--app-accent-muted)',
                borderColor: 'var(--app-card-border)',
              }}
            >
              
              {/* Name field */}
              <div className="md:col-span-8 flex flex-col gap-1.5 text-left">
                <label htmlFor="modal-scen-name" className="text-[10px] font-black uppercase tracking-wider font-mono" style={{ color: 'var(--app-text-muted)' }}>Имя и название сценария (CLI Alias)</label>
                <input
                  id="modal-scen-name"
                  type="text"
                  required
                  placeholder="Например: АВТО_КЛИМАТ_НОЧЬ"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs placeholder-slate-450 transition-all focus:outline-none font-bold font-mono rounded border"
                  style={{
                    backgroundColor: 'var(--app-input-bg)',
                    borderColor: 'var(--app-card-border)',
                    color: 'var(--app-panel-text)',
                  }}
                />
              </div>

              {/* Icon Picker Block */}
              <div className="md:col-span-4 flex flex-col gap-1.5 text-left relative">
                <span className="text-[10px] font-black uppercase tracking-wider font-mono" style={{ color: 'var(--app-text-muted)' }}>Выбрать иконку</span>
                
                <button
                  type="button"
                  onClick={() => setIconPickerOpen(!iconPickerOpen)}
                  className="w-full px-3 py-2.5 text-xs flex items-center justify-between transition-all cursor-pointer font-mono font-bold rounded border"
                  style={{
                    backgroundColor: 'var(--app-input-bg)',
                    borderColor: 'var(--app-card-border)',
                    color: 'var(--app-panel-text)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <SelectedIconComponent className="w-4 h-4" style={{ color: logicAccent }} />
                    <span className="text-[10.5px] uppercase">{selectedIcon}</span>
                  </div>
                  <span className="text-[9px]" style={{ color: actionBtnColor }}>
                    {iconPickerOpen ? 'Скрыть ▴' : 'выбрать ▾'}
                  </span>
                </button>

                {/* Dropdown Icon grid layout popup */}
                {iconPickerOpen && (
                  <div 
                    className="absolute top-[64px] right-0 left-0 p-2 grid grid-cols-6 gap-2 z-[120] shadow-2xl animate-fade-in rounded-lg border animate-scale-up-center"
                    style={{
                      backgroundColor: 'var(--app-panel-bg)',
                      borderColor: 'var(--app-card-border)',
                      color: 'var(--app-panel-text)',
                    }}
                  >
                    {Object.entries(ICON_OPTIONS).map(([key, IconComp]) => {
                      const isSelected = selectedIcon === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setSelectedIcon(key);
                            setIconPickerOpen(false);
                            addToast(`Назначен значок "${key}"`, 'success');
                          }}
                          style={{ 
                            borderColor: isSelected ? logicAccent : 'var(--app-card-border)',
                            backgroundColor: isSelected ? 'var(--app-accent-muted)' : 'transparent',
                            color: 'var(--app-panel-text)'
                          }}
                          className={`p-2 flex items-center justify-center rounded transition-all cursor-pointer relative border outline-none opacity-80 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10`}
                          title={key}
                        >
                          <IconComp className="w-4 h-4" />
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 bg-black text-white dark:bg-white dark:text-black rounded-full p-[1px]">
                              <Check className="w-2.5 h-2.5" style={{ strokeWidth: 4 }} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
              {/* AST CONDITIONS BLOCK WITH RECURSIVE GROUP RENDERING (IF ZONE) */}
            <div 
              style={{ borderColor: logicAccent, borderLeftWidth: '4px', backgroundColor: 'var(--app-accent-muted)' }}
              className="relative border p-5 rounded-lg flex flex-col gap-4 text-left shadow-sm"
            >
              {/* Double Yellow Dots Accent circles top-right */}
              <div className="absolute top-4 right-4 flex gap-1 pointer-events-none">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: logicAccent }} />
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: logicAccent, opacity: 0.5 }} />
              </div>

              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--app-card-border)' }}>
                <div className="text-left">
                  <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 font-mono" style={{ color: 'var(--app-panel-text)' }}>
                    <Sliders className="w-4.5 h-4.5" style={{ color: logicAccent }} />
                    БЛОЧНЫЙ ДЕСКРИПТОР ДЕРЕВА ЛОГИКИ (IF AST ZONE):
                  </h4>
                  <p className="text-[10px] font-bold mt-0.5 uppercase" style={{ color: 'var(--app-text-muted)' }}>Внутреннее гнездо условий, таймеров и логико-математических групп</p>
                </div>
              </div>

              {/* Start recursive render from the root group node */}
              <div className="flex flex-col gap-3">
                {renderLogicalNodeRec(logicalTree, 0)}
              </div>
            </div>

            {/* ACTIONS BLOCK (THEN ZONE) */}
            <div 
              style={{ borderColor: actionAccent, borderLeftWidth: '4px', backgroundColor: 'var(--app-accent-muted)' }}
              className="relative border p-5 rounded-lg flex flex-col gap-4 text-left shadow-sm"
            >
              {/* Double Action Dots Accent circles top-right */}
              <div className="absolute top-4 right-4 flex gap-1 pointer-events-none">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: actionAccent }} />
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: actionAccent, opacity: 0.5 }} />
              </div>

              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--app-card-border)' }}>
                <div className="text-left">
                  <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 font-mono" style={{ color: actionAccent }}>
                    <Power className="w-4.5 h-4.5 animate-pulse" />
                    ТОГДА СДЕЛАТЬ (THEN DO ACTION CONVEYOR):
                  </h4>
                  <p className="text-[10px] font-bold mt-0.5 uppercase" style={{ color: 'var(--app-text-muted)' }}>Последовательный конвейер выполнения команд физической шины</p>
                </div>
                
                <button
                  type="button"
                  onClick={handleAddAction}
                  style={{ backgroundColor: actionBtnColor }}
                  className="px-3 py-2 text-white text-[10px] font-black uppercase tracking-wider rounded flex items-center gap-1 cursor-pointer transition-all active:scale-95 duration-200 hover:brightness-110 shadow-sm border border-transparent"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + добавить команду
                </button>
              </div>

              {/* Actions List block wrapper */}
              {actions.length === 0 ? (
                <div 
                  className="py-6 text-center border border-dashed rounded italic text-[10px] uppercase font-mono tracking-wider animate-fade-in"
                  style={{
                    backgroundColor: 'var(--app-panel-bg)',
                    borderColor: 'var(--app-card-border)',
                    color: 'var(--app-text-muted)',
                  }}
                >
                  Конвейер пуст. Добавьте хотя бы одно исполнительное устройство.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {actions.map((act, index) => (
                    <div 
                      key={act.id}
                      style={{ 
                        borderLeftColor: actionAccent,
                        backgroundColor: 'var(--app-input-bg)',
                        borderColor: 'var(--app-card-border)',
                      }}
                      className="flex flex-col sm:flex-row items-center gap-x-3 gap-y-2 p-3 rounded border-l-4 border hover:border-slate-400 dark:hover:border-slate-500 transition-all text-left"
                    >
                      <div className="flex items-center gap-2 sm:w-auto w-full">
                        <span 
                          className="w-5 h-5 flex items-center justify-center font-mono text-[9px] font-bold rounded shadow-sm border"
                          style={{
                            backgroundColor: 'var(--app-panel-bg)',
                            borderColor: 'var(--app-card-border)',
                            color: 'var(--app-text-muted)',
                          }}
                        >
                          {index + 1}
                        </span>
                      </div>

                      {/* Device Selection dropdown */}
                      <div className="flex-1 w-full min-w-[150px]">
                        <select
                          value={act.device}
                          onChange={(e) => handleUpdateAction(act.id, 'device', e.target.value)}
                          className="w-full rounded p-2 text-xs font-extrabold font-mono border focus:outline-none"
                          style={{
                            backgroundColor: 'var(--app-panel-bg)',
                            borderColor: 'var(--app-card-border)',
                            color: 'var(--app-panel-text)',
                          }}
                        >
                          {loadingDevices ? (
                            <option>Загрузка умного реестра...</option>
                          ) : (
                            devices.map((d) => (
                              <option key={d.id} value={d.name}>{d.name} ({d.location})</option>
                            ))
                          )}
                        </select>
                      </div>

                      {/* Mode selection */}
                      <div className="w-full sm:w-[150px] min-w-[120px]">
                        <select
                          value={act.commandType}
                          onChange={(e) => handleUpdateAction(act.id, 'commandType', e.target.value)}
                          className="w-full rounded p-2 text-xs font-bold font-mono border focus:outline-none"
                          style={{
                            backgroundColor: 'var(--app-panel-bg)',
                            borderColor: 'var(--app-card-border)',
                            color: 'var(--app-panel-text)',
                          }}
                        >
                          <option value="on">Реле ВКЛ (ON)</option>
                          <option value="off">Реле ВЫКЛ (OFF)</option>
                          <option value="value">Задать уровень (VALUE)</option>
                        </select>
                      </div>

                      {/* Level configuration slider */}
                      <div className="w-full sm:w-[180px] min-w-[120px] flex items-center gap-2">
                        {act.commandType === 'value' ? (
                          <div className="flex items-center w-full gap-2">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={act.value}
                              onChange={(e) => handleUpdateAction(act.id, 'value', parseInt(e.target.value, 10))}
                              style={{ accentColor: actionBtnColor }}
                              className="flex-1 h-7 cursor-pointer"
                            />
                            <span className="font-mono text-xs font-black min-w-[28px] text-right" style={{ color: actionBtnColor }}>{act.value}</span>
                          </div>
                        ) : (
                          <span 
                            className="text-[10px] font-mono uppercase font-bold text-center w-full py-1.5 rounded shadow-sm border"
                            style={{
                              backgroundColor: 'var(--app-panel-bg)',
                              borderColor: 'var(--app-card-border)',
                              color: 'var(--app-text-muted)',
                            }}
                          >
                            Бинарный запуск
                          </span>
                        )}
                      </div>

                      {/* Trash action button */}
                      <div className="sm:w-auto w-full flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveAction(act.id)}
                          className="p-1.5 rounded hover:bg-red-500/10 text-slate-400 hover:text-red-500 hover:scale-105 transition-all cursor-pointer border-0 bg-transparent outline-none"
                          title="Удалить команду из цепи"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CLI Compiler Preview Block */}
            <div className="flex flex-col gap-2.5">
              <div 
                className="p-4 border font-mono text-[10px] shadow-inner flex flex-col gap-1.5 rounded-lg"
                style={{
                  backgroundColor: 'var(--app-input-bg)',
                  borderColor: 'var(--app-card-border)',
                }}
              >
                <div className="flex items-center gap-1.5 bg-transparent">
                  <Terminal className="w-4 h-4 text-slate-500 animate-pulse" />
                  <span className="font-bold uppercase tracking-widest text-[9px] font-mono" style={{ color: 'var(--app-text-muted)' }}>Автоматический код CLI (SmashCore Node Compiler):</span>
                </div>
                <div className="font-mono text-[13px] break-all select-all font-semibold select-text text-left bg-transparent leading-relaxed pr-1" style={{ color: 'var(--app-panel-text)' }}>
                  <span className="text-[#10b981] mr-1.5 font-bold">addmanual</span> 
                  <span style={{ color: codeHighlightColor }} className="mr-1.5">&lt;{formattedName}&gt;</span>
                  <span className="mr-1.5" style={{ color: 'var(--app-text-muted)' }}>{targetDev}</span>
                  <span className="font-bold" style={{ color: codeHighlightColor }}>{actCmd}</span>
                </div>
              </div>

              {/* JSON payload system toggle button */}
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono" style={{ color: 'var(--app-text-muted)' }}>C++ Backend Contract (AST JSON Schema):</span>
                <button
                  type="button"
                  onClick={() => setShowJsonPayload(!showJsonPayload)}
                  className="text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1 cursor-pointer bg-transparent border-0 hover:opacity-80 transition-all font-sans"
                  style={{ color: actionBtnColor }}
                >
                  <span>{showJsonPayload ? 'Скрыть AST Payload' : 'Показать AST Payload'}</span>
                  <span className="font-mono text-[9px] border px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--app-accent-muted)', borderColor: 'var(--app-card-border)', color: 'var(--app-panel-text)' }}>{showJsonPayload ? '✕' : '👁'}</span>
                </button>
              </div>

              {/* Live formatted JSON contract */}
              {showJsonPayload && (
                <div 
                  className="p-3 border font-mono text-[9.5px] shadow-inner flex flex-col gap-1 animate-fade-in text-left max-h-[180px] overflow-y-auto rounded-lg"
                  style={{
                    backgroundColor: 'var(--app-input-bg)',
                    borderColor: 'var(--app-card-border)',
                  }}
                >
                  <pre className="font-mono leading-tight select-all cursor-text leading-relaxed" style={{ color: 'var(--app-panel-text)' }}>
                    {JSON.stringify(getSimulatedJsonPayload(), null, 2)}
                  </pre>
                </div>
              )}
            </div>

          </div>

          {/* Action buttons (Save/Close) */}
          <div 
            className="p-5 mt-auto flex items-center justify-end gap-3 border-t"
            style={{
              backgroundColor: 'var(--app-accent-muted)',
              borderColor: 'var(--app-card-border)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded border cursor-pointer transition-all font-mono"
              style={{
                backgroundColor: 'var(--app-panel-bg)',
                borderColor: 'var(--app-card-border)',
                color: 'var(--app-panel-text)',
              }}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-6 py-3 text-white font-extrabold text-xs uppercase tracking-widest rounded transition-all duration-300 hover:brightness-110 shadow-md cursor-pointer flex items-center gap-2 font-mono"
              style={{ 
                borderRadius: '6px',
                backgroundColor: actionBtnColor
              }}
            >
              {scenarioId ? 'Сохранить изменения' : 'Создать сценарий'}
            </button>
          </div>

        </form>
      </div>
    </div>,
    document.body
  );
}

export default ScenarioEditModal;
