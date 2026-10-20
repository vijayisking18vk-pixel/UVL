import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  StartupStage,
  WorkflowStatus,
  PlaygroundStartup,
  PlaygroundWorkflow,
  PlaygroundEdge
} from '../../types';
import {
  Workflow,
  Plus,
  Trash2,
  Link as LinkIcon,
  CheckCircle2,
  Clock,
  Circle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronDown,
  Layers,
  ArrowRight,
  Filter,
  Check,
  X,
  Move,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { sound } from '../../utils/sound';

const STAGE_OPTIONS: StartupStage[] = ['Idea', 'Validation', 'MVP', 'Launched', 'Scaling'];

const STARTUP_COLORS = [
  '#2563EB', // Blue
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EF4444', // Rose
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#64748B'  // Slate
];

const WORKFLOW_TEMPLATES = [
  { name: 'Idea Validation', icon: '💡' },
  { name: 'Market Research', icon: '📊' },
  { name: 'MVP Build', icon: '🛠️' },
  { name: 'Fundraising', icon: '💰' },
  { name: 'Launch', icon: '🚀' },
  { name: 'Hiring', icon: '👥' },
  { name: 'Marketing', icon: '📣' },
  { name: 'Customer Support', icon: '🎧' }
];

export const PlaygroundView: React.FC = () => {
  const {
    startups,
    workflows,
    edges,
    startupStats,
    addStartup,
    updateStartup,
    deleteStartup,
    addWorkflow,
    updateWorkflow,
    updateWorkflowStatus,
    deleteWorkflow,
    addEdge,
    deleteEdge,
    updateNodePosition,
    autoArrangeNodes,
    clearPlayground
  } = useWorkspace();

  // ----------------------------------------------------
  // LOCAL UI STATE
  // ----------------------------------------------------
  // Add Startup form state
  const [newStartupName, setNewStartupName] = useState('');
  const [newStartupStage, setNewStartupStage] = useState<StartupStage>('Idea');
  const [newStartupColor, setNewStartupColor] = useState(STARTUP_COLORS[0]);

  // Custom workflow input state
  const [customWorkflowName, setCustomWorkflowName] = useState('');

  // Interactive selection & linking
  const [selectedNode, setSelectedNode] = useState<{ id: string; type: 'startup' | 'workflow' } | null>(null);
  const [linkingSourceId, setLinkingSourceId] = useState<string | null>(null);
  const [highlightedStartupId, setHighlightedStartupId] = useState<string | null>(null);

  // Status Board filter & panel collapse
  const [statusBoardFilter, setStatusBoardFilter] = useState<string>('all');
  const [statusBoardExpanded, setStatusBoardExpanded] = useState<boolean>(true);

  // Modals
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [prereqWarning, setPrereqWarning] = useState<{
    open: boolean;
    workflowId: string;
    workflowName: string;
    blockedBy: string[];
  }>({
    open: false,
    workflowId: '',
    workflowName: '',
    blockedBy: []
  });

  // Canvas Dragging State (Mouse & Touch)
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingNode, setDraggingNode] = useState<{
    id: string;
    type: 'startup' | 'workflow';
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  } | null>(null);

  // ----------------------------------------------------
  // KEYBOARD SHORTCUTS
  // Delete removes selected node, Esc cancels linking mode
  // ----------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape cancels linking mode or selection
      if (e.key === 'Escape') {
        if (linkingSourceId) {
          sound.click();
          setLinkingSourceId(null);
        } else if (selectedNode) {
          setSelectedNode(null);
        }
      }

      // Delete or Backspace deletes selected node (if not inside an input)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeTag = (document.activeElement?.tagName || '').toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
          return;
        }

        if (selectedNode) {
          e.preventDefault();
          if (selectedNode.type === 'startup') {
            deleteStartup(selectedNode.id);
          } else {
            deleteWorkflow(selectedNode.id);
          }
          setSelectedNode(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [linkingSourceId, selectedNode, deleteStartup, deleteWorkflow]);

  // ----------------------------------------------------
  // NODE DRAGGING HANDLERS (MOUSE & TOUCH)
  // ----------------------------------------------------
  const handlePointerDown = (
    e: React.MouseEvent | React.TouchEvent,
    id: string,
    type: 'startup' | 'workflow',
    x: number,
    y: number
  ) => {
    e.stopPropagation();
    setSelectedNode({ id, type });

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setDraggingNode({
      id,
      type,
      startX: clientX,
      startY: clientY,
      initialX: x,
      initialY: y
    });
  };

  const handlePointerMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!draggingNode) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

      const deltaX = clientX - draggingNode.startX;
      const deltaY = clientY - draggingNode.startY;

      const newX = Math.max(20, draggingNode.initialX + deltaX);
      const newY = Math.max(20, draggingNode.initialY + deltaY);

      updateNodePosition(draggingNode.id, draggingNode.type, newX, newY);
    },
    [draggingNode, updateNodePosition]
  );

  const handlePointerUp = useCallback(() => {
    if (draggingNode) {
      setDraggingNode(null);
    }
  }, [draggingNode]);

  useEffect(() => {
    if (draggingNode) {
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchmove', handlePointerMove, { passive: false });
      window.addEventListener('touchend', handlePointerUp);
      return () => {
        window.removeEventListener('mousemove', handlePointerMove);
        window.removeEventListener('mouseup', handlePointerUp);
        window.removeEventListener('touchmove', handlePointerMove);
        window.removeEventListener('touchend', handlePointerUp);
      };
    }
  }, [draggingNode, handlePointerMove, handlePointerUp]);

  // ----------------------------------------------------
  // LINKING HANDLERS
  // ----------------------------------------------------
  const handleNodeClick = (targetId: string) => {
    if (linkingSourceId) {
      if (linkingSourceId === targetId) {
        setLinkingSourceId(null);
        return;
      }
      const success = addEdge(linkingSourceId, targetId);
      if (success) {
        sound.click();
      }
      setLinkingSourceId(null);
    }
  };

  const startLinking = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    sound.click();
    if (linkingSourceId === nodeId) {
      setLinkingSourceId(null);
    } else {
      setLinkingSourceId(nodeId);
    }
  };

  // ----------------------------------------------------
  // STATUS TRANSITION WITH PREREQUISITE RULE
  // ----------------------------------------------------
  const handleStatusChangeRequest = (workflowId: string, targetStatus: WorkflowStatus, allowOverride = false) => {
    const result = updateWorkflowStatus(workflowId, targetStatus, allowOverride);
    if (!result.success && result.warning && result.blockedBy) {
      const targetWf = workflows.find(w => w.id === workflowId);
      setPrereqWarning({
        open: true,
        workflowId,
        workflowName: targetWf?.name || 'Workflow Item',
        blockedBy: result.blockedBy
      });
    }
  };

  // Next status cycle: todo -> doing -> done -> todo
  const cycleWorkflowStatus = (e: React.MouseEvent, wf: PlaygroundWorkflow) => {
    e.stopPropagation();
    let nextStatus: WorkflowStatus = 'todo';
    if (wf.status === 'todo') nextStatus = 'doing';
    else if (wf.status === 'doing') nextStatus = 'done';
    else if (wf.status === 'done') nextStatus = 'todo';

    handleStatusChangeRequest(wf.id, nextStatus);
  };

  // ----------------------------------------------------
  // ADD STARTUP HANDLER
  // ----------------------------------------------------
  const handleAddStartupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStartupName.trim()) return;

    addStartup({
      name: newStartupName.trim(),
      stage: newStartupStage,
      color: newStartupColor
    });

    setNewStartupName('');
    setNewStartupStage('Idea');
  };

  // ----------------------------------------------------
  // ADD WORKFLOW FROM TEMPLATE OR CUSTOM
  // ----------------------------------------------------
  const handleAddWorkflowItem = (name: string) => {
    if (!name.trim()) return;

    // Place near active highlighted startup if selected
    let targetStartupId: string | undefined = undefined;
    let placeX = 380;
    let placeY = 100;

    if (highlightedStartupId) {
      const highlighted = startups.find(s => s.id === highlightedStartupId);
      if (highlighted) {
        targetStartupId = highlighted.id;
        placeX = highlighted.x + 300;
        placeY = highlighted.y + (workflows.filter(w => w.startupId === highlighted.id).length * 100);
      }
    }

    const created = addWorkflow({
      name: name.trim(),
      status: 'todo',
      startupId: targetStartupId,
      x: placeX,
      y: placeY
    });

    if (targetStartupId) {
      addEdge(targetStartupId, created.id);
    }
  };

  // ----------------------------------------------------
  // STATUS BOARD COMPUTED DATA
  // ----------------------------------------------------
  const filteredWorkflows = useMemo(() => {
    if (statusBoardFilter === 'all') return workflows;
    return workflows.filter(w => w.startupId === statusBoardFilter);
  }, [workflows, statusBoardFilter]);

  const todoWorkflows = useMemo(() => filteredWorkflows.filter(w => w.status === 'todo'), [filteredWorkflows]);
  const doingWorkflows = useMemo(() => filteredWorkflows.filter(w => w.status === 'doing'), [filteredWorkflows]);
  const doneWorkflows = useMemo(() => filteredWorkflows.filter(w => w.status === 'done'), [filteredWorkflows]);

  // Map connected upstream and downstream workflow names for cards
  const getNodeName = useCallback(
    (nodeId: string) => {
      const sup = startups.find(s => s.id === nodeId);
      if (sup) return sup.name;
      const wf = workflows.find(w => w.id === nodeId);
      if (wf) return wf.name;
      return 'Unknown';
    },
    [startups, workflows]
  );

  const getWorkflowConnections = useCallback(
    (wfId: string) => {
      const upstream = edges.filter(e => e.to === wfId).map(e => getNodeName(e.from));
      const downstream = edges.filter(e => e.from === wfId).map(e => getNodeName(e.to));
      return { upstream, downstream };
    },
    [edges, getNodeName]
  );

  // Check if a node is dimmed during startup highlight
  const isNodeDimmed = useCallback(
    (nodeId: string, nodeType: 'startup' | 'workflow') => {
      if (!highlightedStartupId) return false;
      if (nodeType === 'startup') {
        return nodeId !== highlightedStartupId;
      }
      // Workflow: check if assigned or connected to highlighted startup
      const targetWf = workflows.find(w => w.id === nodeId);
      if (targetWf?.startupId === highlightedStartupId) return false;

      const directEdge = edges.some(e => e.from === highlightedStartupId && e.to === nodeId);
      if (directEdge) return false;

      return true;
    },
    [highlightedStartupId, workflows, edges]
  );

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* ====================================================
          TOP PLAYGROUND HEADER & TOOLBAR
      ==================================================== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E5E5E7] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center shadow-xs">
              <Workflow size={17} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-black">Playground</h1>
              <p className="text-xs text-[#6E6E73] mt-0.5">
                Startup flow diagrams, dependency chains & status tracking
              </p>
            </div>
          </div>
        </div>

        {/* Global Canvas Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {highlightedStartupId && (
            <button
              onClick={() => {
                sound.click();
                setHighlightedStartupId(null);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E5E5E7] bg-[#F5F5F7] hover:bg-[#EBEBED] text-xs text-black font-medium transition-all"
            >
              <X size={13} className="text-[#6E6E73]" />
              <span>Clear Filter</span>
            </button>
          )}

          <button
            onClick={() => autoArrangeNodes()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#E5E5E7] bg-white hover:bg-[#F5F5F7] text-xs text-black font-medium shadow-2xs transition-all"
            title="Auto-arrange nodes into neat hierarchical columns"
          >
            <Sparkles size={13} className="text-amber-500" />
            <span>Auto-Arrange</span>
          </button>

          <button
            onClick={() => setConfirmResetOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-red-200 bg-red-50 hover:bg-red-100 text-xs text-red-600 font-medium transition-all"
            title="Clear all nodes and connections"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>

          <button
            onClick={() => setStatusBoardExpanded(!statusBoardExpanded)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#E5E5E7] bg-[#F5F5F7] hover:bg-[#EBEBED] text-xs text-black font-medium transition-all"
          >
            <Layers size={13} className="text-[#6E6E73]" />
            <span>{statusBoardExpanded ? 'Hide Board' : 'Show Board'}</span>
          </button>
        </div>
      </div>

      {/* Linking Mode Active Notification Pill */}
      {linkingSourceId && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-xs text-blue-900 font-medium">
            <LinkIcon size={14} className="text-blue-600 animate-pulse" />
            <span>
              <strong>Linking Mode Active:</strong> Click another startup or workflow node to draw a curved connection arrow.
            </span>
          </div>
          <button
            onClick={() => {
              sound.click();
              setLinkingSourceId(null);
            }}
            className="text-xs text-blue-700 hover:text-blue-950 font-semibold px-2 py-1 rounded-md hover:bg-blue-100"
          >
            Cancel (Esc)
          </button>
        </div>
      )}

      {/* ====================================================
          MAIN 3-AREA WORKSPACE LAYOUT
      ==================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ====================================================
            AREA 1: LEFT SIDEBAR
        ==================================================== */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6">
          {/* 1.1 "Add Startup" Form */}
          <div className="bg-white border border-[#E5E5E7] rounded-3xl p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <Plus size={16} className="text-black" />
              <h2 className="text-sm font-bold text-black tracking-tight">Add Startup</h2>
            </div>

            <form onSubmit={handleAddStartupSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider block mb-1">
                  Startup Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ziggers, Loop Pay, Atlas"
                  value={newStartupName}
                  onChange={e => setNewStartupName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl text-xs text-black placeholder:text-[#8E8E93] focus:outline-none focus:border-black focus:bg-white transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider block mb-1">
                  Stage
                </label>
                <select
                  value={newStartupStage}
                  onChange={e => setNewStartupStage(e.target.value as StartupStage)}
                  className="w-full px-3 py-2 bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all cursor-pointer"
                >
                  {STAGE_OPTIONS.map(stage => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider block mb-1.5">
                  Brand Color
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {STARTUP_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        sound.click();
                        setNewStartupColor(color);
                      }}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        newStartupColor === color ? 'scale-125 ring-2 ring-black ring-offset-2' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <Plus size={14} />
                <span>Create Startup Node</span>
              </button>
            </form>
          </div>

          {/* 1.2 Workflow Library (Templates & Custom) */}
          <div className="bg-white border border-[#E5E5E7] rounded-3xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-black tracking-tight">Workflow Library</h2>
              <span className="text-[10px] text-[#6E6E73] bg-[#F5F5F7] px-2 py-0.5 rounded-full font-mono">
                {WORKFLOW_TEMPLATES.length} Templates
              </span>
            </div>
            <p className="text-xs text-[#6E6E73] mb-3">
              Click any workflow template to drop it on the canvas.
            </p>

            {/* Custom Workflow Input */}
            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                placeholder="Custom workflow name..."
                value={customWorkflowName}
                onChange={e => setCustomWorkflowName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (customWorkflowName.trim()) {
                      handleAddWorkflowItem(customWorkflowName.trim());
                      setCustomWorkflowName('');
                    }
                  }
                }}
                className="flex-1 px-3 py-1.5 bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl text-xs text-black placeholder:text-[#8E8E93] focus:outline-none focus:border-black focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => {
                  if (customWorkflowName.trim()) {
                    handleAddWorkflowItem(customWorkflowName.trim());
                    setCustomWorkflowName('');
                  }
                }}
                className="p-2 rounded-xl bg-black text-white hover:bg-neutral-800 transition-all text-xs font-medium"
                title="Add custom workflow to canvas"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Grid of Templates */}
            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {WORKFLOW_TEMPLATES.map(tpl => (
                <button
                  key={tpl.name}
                  type="button"
                  onClick={() => handleAddWorkflowItem(tpl.name)}
                  className="flex items-center gap-2 p-2 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] hover:bg-white hover:border-black text-left text-xs font-medium transition-all group"
                >
                  <span className="text-sm group-hover:scale-110 transition-transform">{tpl.icon}</span>
                  <span className="truncate text-black">{tpl.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 1.3 "Your Startups" List with Live Progress Bars */}
          <div className="bg-white border border-[#E5E5E7] rounded-3xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-black tracking-tight">Your Startups</h2>
              <span className="text-xs text-[#6E6E73] font-mono">{startups.length} total</span>
            </div>

            {startups.length === 0 ? (
              <div className="text-center py-6 px-4 bg-[#F5F5F7] rounded-2xl border border-dashed border-[#D1D1D6]">
                <p className="text-xs text-[#6E6E73]">No startups yet.</p>
                <p className="text-[11px] text-[#8E8E93] mt-1">Use the form above to add your first startup.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {startups.map(sup => {
                  const stat = startupStats.find(s => s.startupId === sup.id) || {
                    totalWorkflows: 0,
                    doneWorkflows: 0,
                    doingWorkflows: 0,
                    todoWorkflows: 0,
                    progressPercent: 0,
                    isCompleted: false
                  };
                  const isHighlighted = highlightedStartupId === sup.id;

                  return (
                    <div
                      key={sup.id}
                      onClick={() => {
                        sound.click();
                        setHighlightedStartupId(isHighlighted ? null : sup.id);
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isHighlighted
                          ? 'border-black bg-neutral-50 shadow-xs'
                          : 'border-[#E5E5E7] bg-[#F5F5F7] hover:bg-white hover:border-[#D1D1D6]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: sup.color }}
                          />
                          <span className="text-xs font-bold text-black truncate">{sup.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {stat.isCompleted && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold border border-emerald-200">
                              Completed
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full bg-white text-[10px] font-medium text-[#6E6E73] border border-[#E5E5E7]">
                            {sup.stage}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar (done / total) */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-[#6E6E73]">
                          <span>Progress</span>
                          <span className="font-mono font-medium text-black">
                            {stat.doneWorkflows}/{stat.totalWorkflows} ({stat.progressPercent}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-[#E5E5E7] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${stat.progressPercent}%`,
                              backgroundColor: stat.isCompleted ? '#10B981' : sup.color
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ====================================================
            AREA 2: CENTER CANVAS (FLOW DIAGRAM)
        ==================================================== */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6">
          <div className="bg-white border border-[#E5E5E7] rounded-3xl p-1 shadow-xs overflow-hidden flex flex-col">
            {/* Canvas Sub-Header & Controls */}
            <div className="px-5 py-3 border-b border-[#E5E5E7] flex items-center justify-between flex-wrap gap-2 bg-[#FAFAFC]">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-black uppercase tracking-wider">Flow Canvas</span>
                <span className="text-[11px] text-[#6E6E73]">
                  {startups.length} Startups · {workflows.length} Workflows · {edges.length} Connections
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-[#6E6E73]">
                <span>Click link icon <LinkIcon size={11} className="inline text-blue-600" /> to connect</span>
                <span>•</span>
                <span>Click arrow to delete</span>
              </div>
            </div>

            {/* Dotted Grid Canvas Area */}
            <div
              ref={canvasRef}
              className="relative w-full h-[620px] overflow-auto select-none rounded-b-2xl cursor-grab active:cursor-grabbing"
              style={{
                backgroundImage: 'radial-gradient(#D1D1D6 1.2px, transparent 1.2px)',
                backgroundSize: '24px 24px',
                backgroundColor: '#FFFFFF'
              }}
              onClick={() => {
                if (linkingSourceId) setLinkingSourceId(null);
                setSelectedNode(null);
              }}
            >
              {/* Virtual Infinite Canvas Area (2400px x 1800px) */}
              <div className="relative min-w-[2400px] min-h-[1800px]">
                {/* ----------------------------------------------------
                    SVG LAYER FOR CURVED ARROWS WITH ARROWHEADS
                ---------------------------------------------------- */}
                <svg
                  className="absolute inset-0 pointer-events-none w-full h-full"
                  style={{ minWidth: '2400px', minHeight: '1800px' }}
                >
                  <defs>
                    <marker
                      id="arrowhead-default"
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#000000" />
                    </marker>
                    <marker
                      id="arrowhead-highlight"
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#2563EB" />
                    </marker>
                    <marker
                      id="arrowhead-hover"
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#EF4444" />
                    </marker>
                  </defs>

                  {edges.map(edge => {
                    // Find fromNode and toNode positions
                    const fromStartup = startups.find(s => s.id === edge.from);
                    const fromWorkflow = workflows.find(w => w.id === edge.from);
                    const toStartup = startups.find(s => s.id === edge.to);
                    const toWorkflow = workflows.find(w => w.id === edge.to);

                    const fromNode = fromStartup || fromWorkflow;
                    const toNode = toStartup || toWorkflow;

                    if (!fromNode || !toNode) return null;

                    const fromWidth = fromStartup ? 230 : 200;
                    const fromHeight = fromStartup ? 110 : 80;
                    const toWidth = toStartup ? 230 : 200;
                    const toHeight = toStartup ? 110 : 80;

                    // Coordinates: Connect from right-center of source to left-center of target
                    const x1 = fromNode.x + fromWidth;
                    const y1 = fromNode.y + fromHeight / 2;
                    const x2 = toNode.x;
                    const y2 = toNode.y + toHeight / 2;

                    // Smooth curved bezier line
                    const dx = Math.max(40, Math.abs(x2 - x1) * 0.5);
                    const pathD = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

                    const isDimmed =
                      (fromStartup && isNodeDimmed(fromStartup.id, 'startup')) ||
                      (fromWorkflow && isNodeDimmed(fromWorkflow.id, 'workflow')) ||
                      (toStartup && isNodeDimmed(toStartup.id, 'startup')) ||
                      (toWorkflow && isNodeDimmed(toWorkflow.id, 'workflow'));

                    const isHighlighted =
                      highlightedStartupId &&
                      ((fromStartup && fromStartup.id === highlightedStartupId) ||
                        (fromWorkflow && fromWorkflow.startupId === highlightedStartupId));

                    return (
                      <g key={edge.id} className="pointer-events-auto group">
                        {/* Wide transparent hover path for easy click-to-delete */}
                        <path
                          d={pathD}
                          stroke="transparent"
                          strokeWidth="20"
                          fill="none"
                          className="cursor-pointer"
                          onClick={e => {
                            e.stopPropagation();
                            deleteEdge(edge.id);
                          }}
                        />
                        {/* Visible Curved Line */}
                        <path
                          d={pathD}
                          stroke={isHighlighted ? '#2563EB' : isDimmed ? '#D1D1D6' : '#000000'}
                          strokeWidth={isHighlighted ? '2.5' : '2'}
                          strokeDasharray={isDimmed ? '4,4' : undefined}
                          fill="none"
                          markerEnd={
                            isHighlighted ? 'url(#arrowhead-highlight)' : 'url(#arrowhead-default)'
                          }
                          className="transition-all group-hover:stroke-red-500 group-hover:stroke-[3px] cursor-pointer"
                          onClick={e => {
                            e.stopPropagation();
                            deleteEdge(edge.id);
                          }}
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* ----------------------------------------------------
                    STARTUP NODES (Colored Border, Name, Stage, Count, Completed)
                ---------------------------------------------------- */}
                {startups.map(sup => {
                  const stat = startupStats.find(s => s.startupId === sup.id) || {
                    totalWorkflows: 0,
                    doneWorkflows: 0,
                    isCompleted: false
                  };
                  const isDimmed = isNodeDimmed(sup.id, 'startup');
                  const isSelected = selectedNode?.id === sup.id;
                  const isLinkingSource = linkingSourceId === sup.id;

                  return (
                    <div
                      key={sup.id}
                      style={{
                        left: `${sup.x}px`,
                        top: `${sup.y}px`,
                        borderColor: sup.color
                      }}
                      onMouseDown={e => handlePointerDown(e, sup.id, 'startup', sup.x, sup.y)}
                      onTouchStart={e => handlePointerDown(e, sup.id, 'startup', sup.x, sup.y)}
                      onClick={e => {
                        e.stopPropagation();
                        handleNodeClick(sup.id);
                      }}
                      className={`absolute w-[230px] p-4 rounded-2xl bg-white border-2 shadow-sm transition-opacity duration-200 cursor-move ${
                        isDimmed ? 'opacity-30' : 'opacity-100'
                      } ${isSelected ? 'ring-2 ring-black ring-offset-2' : ''} ${
                        isLinkingSource ? 'ring-2 ring-blue-500 animate-pulse' : ''
                      }`}
                    >
                      {/* Top Header of Startup Node */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="text-[10px] font-semibold text-[#6E6E73] uppercase tracking-wider">
                          Startup
                        </span>
                        <div className="flex items-center gap-1">
                          {/* Connect Link Button */}
                          <button
                            type="button"
                            onClick={e => startLinking(e, sup.id)}
                            className={`p-1 rounded-md text-xs transition-all ${
                              isLinkingSource
                                ? 'bg-blue-600 text-white'
                                : 'text-[#6E6E73] hover:text-black hover:bg-[#F5F5F7]'
                            }`}
                            title="Draw connection arrow from this startup"
                          >
                            <LinkIcon size={13} />
                          </button>
                          {/* Delete Node Button */}
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              deleteStartup(sup.id);
                            }}
                            className="p-1 rounded-md text-[#6E6E73] hover:text-red-600 hover:bg-red-50 text-xs transition-all"
                            title="Delete startup and remove its arrows"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Startup Name */}
                      <div className="font-bold text-sm text-black truncate mb-2">{sup.name}</div>

                      {/* Badges: Stage, Workflows Count, Completed Tag */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#F5F5F7] text-black border border-[#E5E5E7]">
                          {sup.stage}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-[#6E6E73]">
                          {stat.totalWorkflows} wfs
                        </span>
                        {stat.isCompleted && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* ----------------------------------------------------
                    WORKFLOW NODES (Name, Status Badge, Link, Delete)
                ---------------------------------------------------- */}
                {workflows.map(wf => {
                  const isDimmed = isNodeDimmed(wf.id, 'workflow');
                  const isSelected = selectedNode?.id === wf.id;
                  const isLinkingSource = linkingSourceId === wf.id;
                  const assignedStartup = startups.find(s => s.id === wf.startupId);

                  return (
                    <div
                      key={wf.id}
                      style={{
                        left: `${wf.x}px`,
                        top: `${wf.y}px`
                      }}
                      onMouseDown={e => handlePointerDown(e, wf.id, 'workflow', wf.x, wf.y)}
                      onTouchStart={e => handlePointerDown(e, wf.id, 'workflow', wf.x, wf.y)}
                      onClick={e => {
                        e.stopPropagation();
                        handleNodeClick(wf.id);
                      }}
                      className={`absolute w-[200px] p-3 rounded-2xl bg-white border border-[#E5E5E7] shadow-sm transition-opacity duration-200 cursor-move ${
                        isDimmed ? 'opacity-30' : 'opacity-100'
                      } ${isSelected ? 'ring-2 ring-black ring-offset-2' : ''} ${
                        isLinkingSource ? 'ring-2 ring-blue-500 animate-pulse' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        {assignedStartup ? (
                          <div className="flex items-center gap-1 truncate">
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: assignedStartup.color }}
                            />
                            <span className="text-[10px] font-medium text-[#6E6E73] truncate">
                              {assignedStartup.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#8E8E93]">Unassigned</span>
                        )}

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={e => startLinking(e, wf.id)}
                            className={`p-1 rounded-md text-xs transition-all ${
                              isLinkingSource
                                ? 'bg-blue-600 text-white'
                                : 'text-[#6E6E73] hover:text-black hover:bg-[#F5F5F7]'
                            }`}
                            title="Draw connection arrow from this workflow"
                          >
                            <LinkIcon size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              deleteWorkflow(wf.id);
                            }}
                            className="p-1 rounded-md text-[#6E6E73] hover:text-red-600 hover:bg-red-50 text-xs transition-all"
                            title="Delete workflow node and remove its arrows"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Workflow Name */}
                      <div className="text-xs font-semibold text-black truncate mb-2">{wf.name}</div>

                      {/* Clickable Status Badge (Click to cycle To Do -> In Progress -> Done) */}
                      <button
                        type="button"
                        onClick={e => cycleWorkflowStatus(e, wf)}
                        className={`w-full py-1 px-2 rounded-xl text-[10px] font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                          wf.status === 'done'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            : wf.status === 'doing'
                            ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                            : 'bg-[#F5F5F7] text-[#6E6E73] border-[#E5E5E7] hover:bg-[#EBEBED]'
                        }`}
                        title="Click to cycle status: To Do → In Progress → Done"
                      >
                        {wf.status === 'done' ? (
                          <>
                            <CheckCircle2 size={12} className="text-emerald-600" />
                            <span>Done</span>
                          </>
                        ) : wf.status === 'doing' ? (
                          <>
                            <Clock size={12} className="text-blue-600 animate-spin" />
                            <span>In Progress</span>
                          </>
                        ) : (
                          <>
                            <Circle size={12} className="text-[#8E8E93]" />
                            <span>To Do</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}

                {/* Empty State Banner in Center Canvas if 0 startups */}
                {startups.length === 0 && (
                  <div className="absolute left-1/4 top-1/3 max-w-md p-6 bg-white border border-[#E5E5E7] rounded-3xl shadow-md text-center pointer-events-auto">
                    <div className="w-10 h-10 rounded-2xl bg-[#F5F5F7] border border-[#E5E5E7] text-black flex items-center justify-center mx-auto mb-3">
                      <Workflow size={20} />
                    </div>
                    <h3 className="text-sm font-bold text-black mb-1">Add your first startup</h3>
                    <p className="text-xs text-[#6E6E73] leading-relaxed mb-4">
                      Use the "Add startup" form on the left sidebar to add startups. Then attach workflow
                      nodes and connect them with curved arrows.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ====================================================
              AREA 3: STATUS BOARD (THREE SEPARATE COLUMNS)
          ==================================================== */}
          {statusBoardExpanded && (
            <div className="bg-white border border-[#E5E5E7] rounded-3xl p-5 shadow-xs flex flex-col gap-4">
              {/* Status Board Top Bar: Title & Startup Filter Dropdown */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E5E5E7] pb-4">
                <div>
                  <h2 className="text-sm font-bold text-black tracking-tight">Status Board</h2>
                  <p className="text-xs text-[#6E6E73]">
                    Synchronized with canvas nodes and sidebar progress
                  </p>
                </div>

                {/* Filter by Startup Dropdown */}
                <div className="flex items-center gap-2">
                  <Filter size={13} className="text-[#6E6E73]" />
                  <span className="text-xs text-[#6E6E73] font-medium">Filter:</span>
                  <select
                    value={statusBoardFilter}
                    onChange={e => setStatusBoardFilter(e.target.value)}
                    className="px-3 py-1.5 bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="all">All Startups ({workflows.length} workflows)</option>
                    {startups.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({workflows.filter(w => w.startupId === s.id).length})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3 Columns: TO DO | IN PROGRESS | DONE */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Column 1: TO DO */}
                <div
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    const wfId = e.dataTransfer.getData('text/plain');
                    if (wfId) handleStatusChangeRequest(wfId, 'todo');
                  }}
                  className="bg-[#FAFAFC] border border-[#E5E5E7] rounded-2xl p-4 flex flex-col gap-3 min-h-[220px]"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E7]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                      <span className="text-xs font-bold text-black uppercase tracking-wider">To Do</span>
                    </div>
                    <span className="text-xs text-[#6E6E73] font-mono bg-white px-2 py-0.5 rounded-full border border-[#E5E5E7]">
                      {todoWorkflows.length}
                    </span>
                  </div>

                  <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[360px] pr-1">
                    {todoWorkflows.map(wf => {
                      const sup = startups.find(s => s.id === wf.startupId);
                      const { upstream, downstream } = getWorkflowConnections(wf.id);

                      return (
                        <div
                          key={wf.id}
                          draggable
                          onDragStart={e => e.dataTransfer.setData('text/plain', wf.id)}
                          className="p-3 bg-white border border-[#E5E5E7] hover:border-black rounded-xl shadow-2xs transition-all cursor-grab active:cursor-grabbing space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-black truncate">{wf.name}</span>
                            <button
                              onClick={() => handleStatusChangeRequest(wf.id, 'doing')}
                              className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold px-2 py-0.5 rounded-md hover:bg-blue-50 transition-all flex items-center gap-1"
                              title="Move to In Progress"
                            >
                              <span>Start</span>
                              <ArrowRight size={10} />
                            </button>
                          </div>

                          {/* Startup Dot */}
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: sup?.color || '#CBD5E1' }}
                            />
                            <span className="text-[10px] text-[#6E6E73] truncate">
                              {sup?.name || 'Unassigned'}
                            </span>
                          </div>

                          {/* Upstream / Downstream Connections */}
                          {(upstream.length > 0 || downstream.length > 0) && (
                            <div className="text-[10px] text-[#8E8E93] space-y-0.5 pt-1 border-t border-[#F5F5F7]">
                              {upstream.length > 0 && (
                                <div className="truncate">← Prereq: {upstream.join(', ')}</div>
                              )}
                              {downstream.length > 0 && (
                                <div className="truncate">→ Next: {downstream.join(', ')}</div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Column 2: IN PROGRESS */}
                <div
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    const wfId = e.dataTransfer.getData('text/plain');
                    if (wfId) handleStatusChangeRequest(wfId, 'doing');
                  }}
                  className="bg-[#FAFAFC] border border-[#E5E5E7] rounded-2xl p-4 flex flex-col gap-3 min-h-[220px]"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E7]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                      <span className="text-xs font-bold text-black uppercase tracking-wider">In Progress</span>
                    </div>
                    <span className="text-xs text-[#6E6E73] font-mono bg-white px-2 py-0.5 rounded-full border border-[#E5E5E7]">
                      {doingWorkflows.length}
                    </span>
                  </div>

                  <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[360px] pr-1">
                    {doingWorkflows.map(wf => {
                      const sup = startups.find(s => s.id === wf.startupId);
                      const { upstream, downstream } = getWorkflowConnections(wf.id);

                      return (
                        <div
                          key={wf.id}
                          draggable
                          onDragStart={e => e.dataTransfer.setData('text/plain', wf.id)}
                          className="p-3 bg-white border border-blue-200 hover:border-blue-400 rounded-xl shadow-2xs transition-all cursor-grab active:cursor-grabbing space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-black truncate">{wf.name}</span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleStatusChangeRequest(wf.id, 'todo')}
                                className="text-[10px] text-[#6E6E73] hover:text-black px-1.5 py-0.5 rounded hover:bg-neutral-100"
                                title="Move back to To Do"
                              >
                                ←
                              </button>
                              <button
                                onClick={() => handleStatusChangeRequest(wf.id, 'done')}
                                className="text-[10px] text-emerald-600 hover:text-emerald-800 font-semibold px-2 py-0.5 rounded-md hover:bg-emerald-50 transition-all flex items-center gap-1"
                                title="Mark as Done"
                              >
                                <Check size={10} />
                                <span>Done</span>
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: sup?.color || '#CBD5E1' }}
                            />
                            <span className="text-[10px] text-[#6E6E73] truncate">
                              {sup?.name || 'Unassigned'}
                            </span>
                          </div>

                          {(upstream.length > 0 || downstream.length > 0) && (
                            <div className="text-[10px] text-[#8E8E93] space-y-0.5 pt-1 border-t border-[#F5F5F7]">
                              {upstream.length > 0 && (
                                <div className="truncate">← Prereq: {upstream.join(', ')}</div>
                              )}
                              {downstream.length > 0 && (
                                <div className="truncate">→ Next: {downstream.join(', ')}</div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Column 3: DONE */}
                <div
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    const wfId = e.dataTransfer.getData('text/plain');
                    if (wfId) handleStatusChangeRequest(wfId, 'done');
                  }}
                  className="bg-[#FAFAFC] border border-[#E5E5E7] rounded-2xl p-4 flex flex-col gap-3 min-h-[220px]"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E7]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-xs font-bold text-black uppercase tracking-wider">Done</span>
                    </div>
                    <span className="text-xs text-[#6E6E73] font-mono bg-white px-2 py-0.5 rounded-full border border-[#E5E5E7]">
                      {doneWorkflows.length}
                    </span>
                  </div>

                  <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[360px] pr-1">
                    {doneWorkflows.map(wf => {
                      const sup = startups.find(s => s.id === wf.startupId);
                      const { upstream, downstream } = getWorkflowConnections(wf.id);

                      return (
                        <div
                          key={wf.id}
                          draggable
                          onDragStart={e => e.dataTransfer.setData('text/plain', wf.id)}
                          className="p-3 bg-white border border-emerald-200 hover:border-emerald-400 rounded-xl shadow-2xs transition-all cursor-grab active:cursor-grabbing space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-black truncate line-through text-[#6E6E73]">
                              {wf.name}
                            </span>
                            <button
                              onClick={() => handleStatusChangeRequest(wf.id, 'doing')}
                              className="text-[10px] text-[#6E6E73] hover:text-black px-1.5 py-0.5 rounded hover:bg-neutral-100"
                              title="Reopen to In Progress"
                            >
                              Reopen
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: sup?.color || '#CBD5E1' }}
                            />
                            <span className="text-[10px] text-[#6E6E73] truncate">
                              {sup?.name || 'Unassigned'}
                            </span>
                          </div>

                          {(upstream.length > 0 || downstream.length > 0) && (
                            <div className="text-[10px] text-[#8E8E93] space-y-0.5 pt-1 border-t border-[#F5F5F7]">
                              {upstream.length > 0 && (
                                <div className="truncate">← Prereq: {upstream.join(', ')}</div>
                              )}
                              {downstream.length > 0 && (
                                <div className="truncate">→ Next: {downstream.join(', ')}</div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ====================================================
          MODAL: PREREQUISITE RULE WARNING & OVERRIDE
      ==================================================== */}
      {prereqWarning.open && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E5E5E7] p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-black">Prerequisite Not Done</h3>
                <p className="text-xs text-[#6E6E73]">Workflow Dependency Warning</p>
              </div>
            </div>

            <p className="text-xs text-[#6E6E73] leading-relaxed mb-3">
              The workflow <strong>"{prereqWarning.workflowName}"</strong> has upstream connected workflows
              that are not yet marked as Done:
            </p>

            <div className="bg-[#F5F5F7] border border-[#E5E5E7] rounded-2xl p-3 mb-4 space-y-1.5">
              {prereqWarning.blockedBy.map(name => (
                <div key={name} className="flex items-center gap-2 text-xs text-black font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>{name}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPrereqWarning({ open: false, workflowId: '', workflowName: '', blockedBy: [] })}
                className="px-4 py-2 rounded-xl border border-[#E5E5E7] bg-white hover:bg-[#F5F5F7] text-xs font-semibold text-black transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.click();
                  handleStatusChangeRequest(prereqWarning.workflowId, 'doing', true);
                  setPrereqWarning({ open: false, workflowId: '', workflowName: '', blockedBy: [] });
                }}
                className="px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-xs font-semibold text-white transition-all shadow-sm"
              >
                Override & Move Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          MODAL: RESET / CLEAR CONFIRMATION
      ==================================================== */}
      {confirmResetOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E5E5E7] p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center flex-shrink-0">
                <RotateCcw size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-black">Reset Playground?</h3>
                <p className="text-xs text-[#6E6E73]">Clear all startups and diagrams</p>
              </div>
            </div>

            <p className="text-xs text-[#6E6E73] leading-relaxed mb-4">
              Are you sure you want to clear all startups, workflows, and connections? This action cannot
              be undone.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#E5E5E7] bg-white hover:bg-[#F5F5F7] text-xs font-semibold text-black transition-all"
              >
                Keep Everything
              </button>
              <button
                type="button"
                onClick={() => {
                  clearPlayground();
                  setConfirmResetOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-semibold text-white transition-all shadow-sm"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
