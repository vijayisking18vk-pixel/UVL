import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import {
  PlaygroundStartup,
  PlaygroundWorkflow,
  PlaygroundEdge,
  StartupStage,
  WorkflowStatus
} from '../types';
import { sound } from '../utils/sound';

const STORAGE_KEY_STARTUPS = 'UVL_PLAYGROUND_STARTUPS_V1';
const STORAGE_KEY_WORKFLOWS = 'UVL_PLAYGROUND_WORKFLOWS_V1';
const STORAGE_KEY_EDGES = 'UVL_PLAYGROUND_EDGES_V1';

export function usePlaygroundModule(currentUserId: string = 'u-1') {
  // 1. Core State with resilient LocalStorage Hydration
  const [startups, setStartups] = useState<PlaygroundStartup[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STARTUPS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [workflows, setWorkflows] = useState<PlaygroundWorkflow[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WORKFLOWS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [edges, setEdges] = useState<PlaygroundEdge[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EDGES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 2. Persist to LocalStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STARTUPS, JSON.stringify(startups));
    } catch {}
  }, [startups]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_WORKFLOWS, JSON.stringify(workflows));
    } catch {}
  }, [workflows]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_EDGES, JSON.stringify(edges));
    } catch {}
  }, [edges]);

  // 3. Multi-Tab Synchronization via 'storage' window events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.newValue) return;
      try {
        if (e.key === STORAGE_KEY_STARTUPS) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setStartups(parsed);
        } else if (e.key === STORAGE_KEY_WORKFLOWS) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setWorkflows(parsed);
        } else if (e.key === STORAGE_KEY_EDGES) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setEdges(parsed);
        }
      } catch {}
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 4. Initial Supabase Cloud Sync & Remote Hydration
  useEffect(() => {
    let mounted = true;

    async function syncRemotePlayground() {
      try {
        const { data: cloudNotes } = await supabase
          .from('notes')
          .select('*')
          .eq('type', 'uvl_playground_state')
          .maybeSingle();

        if (mounted && cloudNotes?.content) {
          try {
            const parsed = JSON.parse(cloudNotes.content);
            if (parsed) {
              if (Array.isArray(parsed.startups) && parsed.startups.length > 0 && startups.length === 0) {
                setStartups(parsed.startups);
              }
              if (Array.isArray(parsed.workflows) && parsed.workflows.length > 0 && workflows.length === 0) {
                setWorkflows(parsed.workflows);
              }
              if (Array.isArray(parsed.edges) && parsed.edges.length > 0 && edges.length === 0) {
                setEdges(parsed.edges);
              }
            }
          } catch {}
        }
      } catch (err) {
        console.warn('Playground cloud sync note:', err);
      }
    }

    syncRemotePlayground();
    return () => {
      mounted = false;
    };
  }, []);

  // Helper to persist snapshot to cloud notes
  const saveCloudSnapshot = useCallback(
    async (
      currentStartups: PlaygroundStartup[],
      currentWorkflows: PlaygroundWorkflow[],
      currentEdges: PlaygroundEdge[]
    ) => {
      try {
        await supabase.from('notes').upsert({
          id: 'note_uvl_playground_state',
          title: 'uvl_playground_state',
          content: JSON.stringify({
            startups: currentStartups,
            workflows: currentWorkflows,
            edges: currentEdges,
            updatedAt: new Date().toISOString()
          }),
          author_id: currentUserId || 'u-1',
          type: 'uvl_playground_state',
          tags: ['uvl_playground_state'],
          is_pinned: false,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Cloud playground persistence fallback:', err);
      }
    },
    [currentUserId]
  );

  // ----------------------------------------------------
  // STARTUP ACTIONS
  // ----------------------------------------------------
  const addStartup = useCallback(
    (data: { name: string; stage?: StartupStage; color?: string; x?: number; y?: number }): PlaygroundStartup => {
      sound.patchStamp();
      const newStartup: PlaygroundStartup = {
        id: 'sup_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: data.name.trim() || 'New Startup',
        stage: data.stage || 'Idea',
        color: data.color || '#2563EB',
        x: data.x !== undefined ? data.x : 80,
        y: data.y !== undefined ? data.y : 80 + startups.length * 180,
        createdAt: new Date().toISOString()
      };

      setStartups(prev => {
        const next = [...prev, newStartup];
        saveCloudSnapshot(next, workflows, edges);
        return next;
      });

      return newStartup;
    },
    [startups, workflows, edges, saveCloudSnapshot]
  );

  const updateStartup = useCallback(
    (id: string, updates: Partial<PlaygroundStartup>) => {
      sound.click();
      setStartups(prev => {
        const next = prev.map(s => (s.id === id ? { ...s, ...updates } : s));
        saveCloudSnapshot(next, workflows, edges);
        return next;
      });
    },
    [workflows, edges, saveCloudSnapshot]
  );

  const deleteStartup = useCallback(
    (id: string) => {
      sound.alert();
      // Remove startup, its edges, and unassign workflows
      setStartups(prev => {
        const nextStartups = prev.filter(s => s.id !== id);
        setEdges(prevEdges => {
          const nextEdges = prevEdges.filter(e => e.from !== id && e.to !== id);
          setWorkflows(prevWfs => {
            const nextWfs = prevWfs.map(w => (w.startupId === id ? { ...w, startupId: undefined } : w));
            saveCloudSnapshot(nextStartups, nextWfs, nextEdges);
            return nextWfs;
          });
          return nextEdges;
        });
        return nextStartups;
      });
    },
    [saveCloudSnapshot]
  );

  // ----------------------------------------------------
  // WORKFLOW ACTIONS
  // ----------------------------------------------------
  const addWorkflow = useCallback(
    (data: {
      name: string;
      status?: WorkflowStatus;
      x?: number;
      y?: number;
      startupId?: string;
      notes?: string;
    }): PlaygroundWorkflow => {
      sound.click();
      const newWorkflow: PlaygroundWorkflow = {
        id: 'wf_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: data.name.trim() || 'Workflow Item',
        status: data.status || 'todo', // New workflows start as To Do
        x: data.x !== undefined ? data.x : 380 + (workflows.length % 3) * 60,
        y: data.y !== undefined ? data.y : 100 + workflows.length * 110,
        startupId: data.startupId,
        notes: data.notes
      };

      setWorkflows(prev => {
        const next = [...prev, newWorkflow];
        saveCloudSnapshot(startups, next, edges);
        return next;
      });

      return newWorkflow;
    },
    [startups, workflows, edges, saveCloudSnapshot]
  );

  const updateWorkflow = useCallback(
    (id: string, updates: Partial<PlaygroundWorkflow>) => {
      setWorkflows(prev => {
        const next = prev.map(w => (w.id === id ? { ...w, ...updates } : w));
        saveCloudSnapshot(startups, next, edges);
        return next;
      });
    },
    [startups, edges, saveCloudSnapshot]
  );

  /**
   * Status Rule:
   * A workflow may only move to In Progress if the workflows connected before it are Done.
   * Otherwise returns a warning with blockedBy list, but allows override if explicitly requested.
   */
  const updateWorkflowStatus = useCallback(
    (
      id: string,
      newStatus: WorkflowStatus,
      allowOverride: boolean = false
    ): { success: boolean; warning?: string; blockedBy?: string[] } => {
      const targetWorkflow = workflows.find(w => w.id === id);
      if (!targetWorkflow) return { success: false };

      if (newStatus === 'doing' && !allowOverride) {
        // Find upstream connections: edges where edge.to === id
        const upstreamEdges = edges.filter(e => e.to === id);
        const upstreamIds = upstreamEdges.map(e => e.from);

        // Find upstream workflows that are not done
        const incompleteUpstreams = workflows.filter(
          w => upstreamIds.includes(w.id) && w.status !== 'done'
        );

        if (incompleteUpstreams.length > 0) {
          return {
            success: false,
            warning: `Cannot move to In Progress yet: prerequisite workflow "${incompleteUpstreams[0].name}" is not Done.`,
            blockedBy: incompleteUpstreams.map(w => w.name)
          };
        }
      }

      sound.click();
      setWorkflows(prev => {
        const next = prev.map(w => (w.id === id ? { ...w, status: newStatus } : w));
        saveCloudSnapshot(startups, next, edges);
        return next;
      });

      return { success: true };
    },
    [workflows, edges, startups, saveCloudSnapshot]
  );

  const deleteWorkflow = useCallback(
    (id: string) => {
      sound.alert();
      setWorkflows(prevWfs => {
        const nextWfs = prevWfs.filter(w => w.id !== id);
        setEdges(prevEdges => {
          const nextEdges = prevEdges.filter(e => e.from !== id && e.to !== id);
          saveCloudSnapshot(startups, nextWfs, nextEdges);
          return nextEdges;
        });
        return nextWfs;
      });
    },
    [startups, saveCloudSnapshot]
  );

  // ----------------------------------------------------
  // EDGE / CONNECTION ACTIONS
  // ----------------------------------------------------
  const addEdge = useCallback(
    (from: string, to: string): boolean => {
      if (!from || !to || from === to) return false;

      // Prevent duplicate edges
      const exists = edges.some(e => (e.from === from && e.to === to) || (e.from === to && e.to === from));
      if (exists) return false;

      sound.click();
      const newEdge: PlaygroundEdge = {
        id: 'edg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        from,
        to
      };

      const nextEdges = [...edges, newEdge];
      setEdges(nextEdges);

      // Auto-assign workflow to startup if connecting Startup -> Workflow
      const fromStartup = startups.find(s => s.id === from);
      const toWorkflow = workflows.find(w => w.id === to);
      const fromWorkflow = workflows.find(w => w.id === from);

      if (fromStartup && toWorkflow) {
        setWorkflows(prev => {
          const nextWfs = prev.map(w => (w.id === to ? { ...w, startupId: fromStartup.id } : w));
          saveCloudSnapshot(startups, nextWfs, nextEdges);
          return nextWfs;
        });
      } else if (fromWorkflow && toWorkflow) {
        // Chained workflow: if from has a startup and to doesn't, inherit startup
        if (fromWorkflow.startupId && !toWorkflow.startupId) {
          setWorkflows(prev => {
            const nextWfs = prev.map(w => (w.id === to ? { ...w, startupId: fromWorkflow.startupId } : w));
            saveCloudSnapshot(startups, nextWfs, nextEdges);
            return nextWfs;
          });
        } else {
          saveCloudSnapshot(startups, workflows, nextEdges);
        }
      } else {
        saveCloudSnapshot(startups, workflows, nextEdges);
      }

      return true;
    },
    [edges, startups, workflows, saveCloudSnapshot]
  );

  const deleteEdge = useCallback(
    (id: string) => {
      sound.alert();
      setEdges(prev => {
        const next = prev.filter(e => e.id !== id);
        saveCloudSnapshot(startups, workflows, next);
        return next;
      });
    },
    [startups, workflows, saveCloudSnapshot]
  );

  // ----------------------------------------------------
  // DRAG / REPOSITION NODE
  // ----------------------------------------------------
  const updateNodePosition = useCallback(
    (id: string, type: 'startup' | 'workflow', x: number, y: number) => {
      const clampedX = Math.max(20, Math.round(x));
      const clampedY = Math.max(20, Math.round(y));

      if (type === 'startup') {
        setStartups(prev => prev.map(s => (s.id === id ? { ...s, x: clampedX, y: clampedY } : s)));
      } else {
        setWorkflows(prev => prev.map(w => (w.id === id ? { ...w, x: clampedX, y: clampedY } : w)));
      }
    },
    []
  );

  // ----------------------------------------------------
  // AUTO-ARRANGE NODES INTO TIDY COLUMNS
  // ----------------------------------------------------
  const autoArrangeNodes = useCallback(() => {
    sound.patchStamp();

    // 1. Arrange Startups vertically in Column 1 (x: 80)
    const newStartups = startups.map((s, idx) => ({
      ...s,
      x: 80,
      y: 80 + idx * 220
    }));

    // 2. Map workflows into progressive columns based on hierarchy and edges
    // Level 1: directly connected to startup
    // Level 2+: chained from level 1
    const arrangedWorkflowIds = new Set<string>();
    const newWorkflows = [...workflows];

    startups.forEach((s, sIdx) => {
      const startupYBase = 80 + sIdx * 220;

      // Find workflows assigned to this startup or connected from it
      const l1Edges = edges.filter(e => e.from === s.id);
      const l1Ids = Array.from(new Set([
        ...l1Edges.map(e => e.to),
        ...workflows.filter(w => w.startupId === s.id).map(w => w.id)
      ]));

      l1Ids.forEach((wfId, wfIdx) => {
        arrangedWorkflowIds.add(wfId);
        const wIdx = newWorkflows.findIndex(w => w.id === wfId);
        if (wIdx >= 0) {
          newWorkflows[wIdx] = {
            ...newWorkflows[wIdx],
            x: 440,
            y: startupYBase + wfIdx * 120
          };

          // Find downstream chained workflows (Level 2)
          const l2Edges = edges.filter(e => e.from === wfId);
          l2Edges.forEach((e2, e2Idx) => {
            arrangedWorkflowIds.add(e2.to);
            const w2Idx = newWorkflows.findIndex(w => w.id === e2.to);
            if (w2Idx >= 0) {
              newWorkflows[w2Idx] = {
                ...newWorkflows[w2Idx],
                x: 780,
                y: startupYBase + wfIdx * 120 + e2Idx * 100
              };

              // Downstream chained (Level 3)
              const l3Edges = edges.filter(e => e.from === e2.to);
              l3Edges.forEach((e3, e3Idx) => {
                arrangedWorkflowIds.add(e3.to);
                const w3Idx = newWorkflows.findIndex(w => w.id === e3.to);
                if (w3Idx >= 0) {
                  newWorkflows[w3Idx] = {
                    ...newWorkflows[w3Idx],
                    x: 1120,
                    y: startupYBase + wfIdx * 120 + e3Idx * 100
                  };
                }
              });
            }
          });
        }
      });
    });

    // Any remaining unassigned workflows
    let unassignedY = 80;
    newWorkflows.forEach((w, idx) => {
      if (!arrangedWorkflowIds.has(w.id)) {
        newWorkflows[idx] = {
          ...w,
          x: 440,
          y: Math.max(unassignedY, (startups.length * 220) + 60)
        };
        unassignedY += 120;
      }
    });

    setStartups(newStartups);
    setWorkflows(newWorkflows);
    saveCloudSnapshot(newStartups, newWorkflows, edges);
  }, [startups, workflows, edges, saveCloudSnapshot]);

  // ----------------------------------------------------
  // CLEAR PLAYGROUND
  // ----------------------------------------------------
  const clearPlayground = useCallback(() => {
    sound.alert();
    setStartups([]);
    setWorkflows([]);
    setEdges([]);
    saveCloudSnapshot([], [], []);
  }, [saveCloudSnapshot]);

  // ----------------------------------------------------
  // COMPUTED STATS & METRICS
  // ----------------------------------------------------
  const startupStats = useMemo(() => {
    return startups.map(startup => {
      // Find all workflows assigned to this startup or connected to it
      const connectedEdgeWfIds = new Set(
        edges.filter(e => e.from === startup.id).map(e => e.to)
      );

      const assignedWfs = workflows.filter(
        w => w.startupId === startup.id || connectedEdgeWfIds.has(w.id)
      );

      const total = assignedWfs.length;
      const done = assignedWfs.filter(w => w.status === 'done').length;
      const doing = assignedWfs.filter(w => w.status === 'doing').length;
      const todo = assignedWfs.filter(w => w.status === 'todo').length;
      const progressPercent = total > 0 ? Math.round((done / total) * 100) : 0;
      const isCompleted = total > 0 && done === total;

      return {
        startupId: startup.id,
        totalWorkflows: total,
        doneWorkflows: done,
        doingWorkflows: doing,
        todoWorkflows: todo,
        progressPercent,
        isCompleted
      };
    });
  }, [startups, workflows, edges]);

  return {
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
  };
}
