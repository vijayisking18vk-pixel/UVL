import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Task, TaskPriority, TaskStatus } from '../../types';
import { PatchAvatar } from '../common/PatchAvatar';
import {
  CheckSquare,
  Plus,
  Kanban,
  List,
  Clock,
  AlertOctagon,
  CheckCircle2,
  Trash2,
  X
} from 'lucide-react';

export const TasksView: React.FC = () => {
  const {
    tasks,
    addTask,
    updateTask,
    updateTaskStatus,
    toggleSubtask,
    deleteTask,
    users,
    projects,
    currentUser
  } = useWorkspace();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'my'>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // New Task Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newStatus, setNewStatus] = useState<TaskStatus>('todo');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newAssigneeId, setNewAssigneeId] = useState(currentUser.id);
  const [newProjectId, setNewProjectId] = useState(projects[0]?.id || '');
  const [newDueDate, setNewDueDate] = useState('2026-09-18');
  const [newTagsStr, setNewTagsStr] = useState('crypto, lab');
  const [newSubtasks, setNewSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);
  const [subtaskInput, setSubtaskInput] = useState('');

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    if (scopeFilter === 'my' && t.assigneeId !== currentUser.id) return false;
    if (projectFilter !== 'all' && t.projectId !== projectFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.tags.some(tag => tag.toLowerCase().includes(q));
    }
    return true;
  });

  const columns: { id: TaskStatus; label: string; border: string; color: string }[] = [
    { id: 'todo', label: 'To Do', border: 'border-[#9E9A8E]/40', color: '#EDE8DB' },
    { id: 'in_progress', label: 'In Progress', border: 'border-[#4EC5D4]/50', color: '#4EC5D4' },
    { id: 'blocked', label: 'Blocked', border: 'border-[#E05A47]/60', color: '#E05A47' },
    { id: 'done', label: 'Done', border: 'border-[#5EBA7D]/50', color: '#5EBA7D' }
  ];

  const priorityStyles: Record<TaskPriority, { label: string; class: string }> = {
    urgent: { label: 'URGENT', class: 'bg-[#E05A47]/20 text-[#E05A47] border-[#E05A47]/50' },
    high: { label: 'HIGH', class: 'bg-[#E5B869]/20 text-[#E5B869] border-[#E5B869]/50' },
    medium: { label: 'MED', class: 'bg-[#4EC5D4]/20 text-[#4EC5D4] border-[#4EC5D4]/50' },
    low: { label: 'LOW', class: 'bg-[#9E9A8E]/20 text-[#9E9A8E] border-[#9E9A8E]/50' }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const tags = newTagsStr
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    addTask({
      title: newTitle,
      description: newDescription,
      status: newStatus,
      priority: newPriority,
      assigneeId: newAssigneeId,
      projectId: newProjectId,
      dueDate: newDueDate,
      subtasks: newSubtasks,
      dependencies: [],
      tags
    });

    setNewTitle('');
    setNewDescription('');
    setNewSubtasks([]);
    setIsCreateOpen(false);
  };

  const addSubtaskToDraft = () => {
    if (!subtaskInput.trim()) return;
    setNewSubtasks(prev => [...prev, { id: `st-${Date.now()}`, title: subtaskInput.trim(), completed: false }]);
    setSubtaskInput('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Filters */}
      <div className="bg-[#14171B] border border-[#2A303A] p-4 patch-chamfer-md shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1F242C] border border-[#3A4250] flex items-center justify-center patch-chamfer-sm text-[#E5B869]">
              <CheckSquare size={20} />
            </div>
            <div>
              <h2 className="font-patch text-2xl font-bold tracking-wider text-[#EDE8DB] uppercase">
                Tactical Task Board
              </h2>
              <p className="font-mono text-xs text-[#9E9A8E]">
                Kanban workflow, sub-tasks, checklists, dependencies & assignment dispatch.
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* My Tasks vs Team Tasks Toggle */}
            <div className="flex bg-[#0C0E11] border border-[#2D333F] p-0.5 patch-chamfer-sm">
              <button
                onClick={() => setScopeFilter('all')}
                className={`px-3 py-1 font-mono text-xs transition-colors ${
                  scopeFilter === 'all'
                    ? 'bg-[#E5B869] text-[#0B0C0E] font-bold'
                    : 'text-[#9E9A8E] hover:text-[#EDE8DB]'
                }`}
              >
                Team Board ({tasks.length})
              </button>
              <button
                onClick={() => setScopeFilter('my')}
                className={`px-3 py-1 font-mono text-xs transition-colors ${
                  scopeFilter === 'my'
                    ? 'bg-[#E5B869] text-[#0B0C0E] font-bold'
                    : 'text-[#9E9A8E] hover:text-[#EDE8DB]'
                }`}
              >
                My Tasks ({tasks.filter(t => t.assigneeId === currentUser.id).length})
              </button>
            </div>

            {/* Kanban vs List Mode */}
            <div className="flex bg-[#0C0E11] border border-[#2D333F] p-0.5 patch-chamfer-sm">
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 font-mono text-xs transition-colors ${
                  viewMode === 'kanban' ? 'bg-[#242930] text-[#EDE8DB]' : 'text-[#9E9A8E]'
                }`}
                title="Kanban View"
              >
                <Kanban size={14} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 font-mono text-xs transition-colors ${
                  viewMode === 'list' ? 'bg-[#242930] text-[#EDE8DB]' : 'text-[#9E9A8E]'
                }`}
                title="List View"
              >
                <List size={14} />
              </button>
            </div>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#E5B869] hover:bg-[#F0C57A] text-[#0B0C0E] font-mono text-xs font-bold transition-transform active:scale-95 patch-chamfer-sm shadow-sm"
            >
              <Plus size={14} strokeWidth={3} />
              New Task
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mt-4 pt-3 border-t border-[#242930] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter tasks or tags..."
              className="bg-[#0C0E11] border border-[#2D333F] text-[#EDE8DB] text-xs font-mono px-3 py-1 patch-chamfer-sm focus:outline-none focus:border-[#E5B869] w-48"
            />

            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="bg-[#0C0E11] border border-[#2D333F] text-[#EDE8DB] text-xs font-mono px-2 py-1 patch-chamfer-sm focus:outline-none focus:border-[#E5B869]"
            >
              <option value="all">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.code}: {p.name}</option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-[#0C0E11] border border-[#2D333F] text-[#EDE8DB] text-xs font-mono px-2 py-1 patch-chamfer-sm focus:outline-none focus:border-[#E5B869]"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="font-mono text-[11px] text-[#9E9A8E]">
            Displaying <span className="text-[#EDE8DB] font-bold">{filteredTasks.length}</span> active operations
          </div>
        </div>
      </div>

      {/* KANBAN VIEW */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {columns.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.id);
            return (
              <div
                key={col.id}
                className="bg-[#14171B] border border-[#2A303A] p-3 patch-chamfer-md shadow-md min-h-[500px] flex flex-col justify-between"
              >
                <div>
                  {/* Column Header */}
                  <div className={`pb-2.5 mb-3 border-b-2 ${col.border} flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <span className="font-patch text-lg uppercase font-bold tracking-wider" style={{ color: col.color }}>
                        {col.label}
                      </span>
                      <span className="font-mono text-xs px-1.5 py-0.2 bg-[#0C0E11] border border-[#2B313B] text-[#9E9A8E]">
                        {colTasks.length}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setNewStatus(col.id);
                        setIsCreateOpen(true);
                      }}
                      className="p-1 hover:bg-[#20252C] text-[#9E9A8E] hover:text-[#EDE8DB] transition-colors"
                      title={`Add task to ${col.label}`}
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Task Cards */}
                  <div className="space-y-3">
                    {colTasks.map(task => {
                      const assignee = users.find(u => u.id === task.assigneeId);
                      const project = projects.find(p => p.id === task.projectId);
                      const subtaskCompleted = task.subtasks.filter(s => s.completed).length;
                      const hasDependencies = task.dependencies.length > 0;

                      return (
                        <div
                          key={task.id}
                          onClick={() => setSelectedTask(task)}
                          className="bg-[#191D23] border border-[#2D333F] hover:border-[#E5B869] p-3.5 patch-chamfer-sm transition-all duration-150 cursor-pointer shadow-sm group hover:-translate-y-0.5"
                        >
                          {/* Project Code & Priority */}
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            {project && (
                              <span
                                className="font-mono text-[10px] px-1.5 py-0.2 border uppercase font-bold"
                                style={{
                                  borderColor: `${project.color}60`,
                                  color: project.color,
                                  backgroundColor: `${project.color}15`
                                }}
                              >
                                {project.code}
                              </span>
                            )}
                            <span className={`font-mono text-[9px] px-1.5 py-0.2 border uppercase ${priorityStyles[task.priority].class}`}>
                              {priorityStyles[task.priority].label}
                            </span>
                          </div>

                          {/* Title */}
                          <h4 className="font-mono text-xs font-semibold text-[#EDE8DB] leading-snug group-hover:text-[#E5B869] transition-colors">
                            {task.title}
                          </h4>

                          {/* Dependencies Warning */}
                          {hasDependencies && (
                            <div className="mt-2 flex items-center gap-1 font-mono text-[10px] text-[#E05A47] bg-[#221515] px-1.5 py-0.5 border border-[#E05A47]/30">
                              <AlertOctagon size={11} />
                              <span>Blocked by {task.dependencies.join(', ')}</span>
                            </div>
                          )}

                          {/* Subtasks Progress Bar */}
                          {task.subtasks.length > 0 && (
                            <div className="mt-2.5 space-y-1">
                              <div className="flex items-center justify-between text-[9px] font-mono text-[#9E9A8E]">
                                <span>Checklist</span>
                                <span>{subtaskCompleted}/{task.subtasks.length}</span>
                              </div>
                              <div className="w-full bg-[#0C0E11] h-1.5 border border-[#2A313C] overflow-hidden">
                                <div
                                  className="h-full bg-[#5EBA7D] transition-all duration-300"
                                  style={{ width: `${(subtaskCompleted / task.subtasks.length) * 100}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Bottom meta */}
                          <div className="mt-3 pt-2 border-t border-[#232832] flex items-center justify-between gap-2">
                            <span className="font-mono text-[10px] text-[#9E9A8E] flex items-center gap-1">
                              <Clock size={10} />
                              {task.dueDate}
                            </span>

                            {assignee && (
                              <PatchAvatar
                                user={assignee}
                                size="sm"
                                showStatus
                              />
                            )}
                          </div>

                          {/* Quick Status Shift Bar */}
                          <div className="mt-2 pt-2 border-t border-[#20252D] flex items-center justify-between gap-1">
                            {columns.map(c => (
                              <button
                                key={c.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateTaskStatus(task.id, c.id);
                                }}
                                disabled={task.status === c.id}
                                className={`flex-1 text-[9px] font-mono py-0.5 border transition-colors ${
                                  task.status === c.id
                                    ? 'bg-[#E5B869]/20 border-[#E5B869] text-[#E5B869] font-bold'
                                    : 'bg-[#0E1013] border-[#252B34] text-[#7A808C] hover:text-[#EDE8DB]'
                                }`}
                              >
                                {c.id === 'todo' ? 'TODO' : c.id === 'in_progress' ? 'PROG' : c.id === 'blocked' ? 'BLCK' : 'DONE'}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-[#242930]">
                  <button
                    onClick={() => {
                      setNewStatus(col.id);
                      setIsCreateOpen(true);
                    }}
                    className="w-full py-1.5 bg-[#171A1E] hover:bg-[#20252C] border border-[#2B313B] font-mono text-xs text-[#9E9A8E] hover:text-[#EDE8DB] flex items-center justify-center gap-1 patch-chamfer-sm"
                  >
                    <Plus size={12} /> Add to {col.label}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="bg-[#14171B] border border-[#2A303A] p-4 patch-chamfer-md shadow-md space-y-2">
          <div className="grid grid-cols-12 gap-2 pb-2.5 border-b border-[#242930] font-mono text-[10px] text-[#9E9A8E] uppercase tracking-wider px-2">
            <span className="col-span-1">Status</span>
            <span className="col-span-4">Operation Title</span>
            <span className="col-span-2">Project</span>
            <span className="col-span-1">Priority</span>
            <span className="col-span-2">Assignee</span>
            <span className="col-span-2 text-right">Due Date</span>
          </div>

          <div className="space-y-1.5">
            {filteredTasks.map(task => {
              const assignee = users.find(u => u.id === task.assigneeId);
              const project = projects.find(p => p.id === task.projectId);
              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="grid grid-cols-12 gap-2 items-center p-2.5 bg-[#181B20] border border-[#262C36] hover:border-[#E5B869] cursor-pointer patch-chamfer-sm transition-colors text-xs font-mono"
                >
                  <div className="col-span-1 flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateTaskStatus(task.id, task.status === 'done' ? 'todo' : 'done');
                      }}
                      className={`w-4 h-4 border flex items-center justify-center ${
                        task.status === 'done' ? 'bg-[#5EBA7D] border-[#5EBA7D] text-[#0B0C0E]' : 'border-[#9E9A8E]'
                      }`}
                    >
                      {task.status === 'done' && <CheckCircle2 size={12} />}
                    </button>
                  </div>

                  <div className="col-span-4 font-semibold text-[#EDE8DB] truncate">
                    {task.title}
                  </div>

                  <div className="col-span-2">
                    {project ? (
                      <span className="text-[10px] px-1.5 py-0.2 border" style={{ borderColor: `${project.color}60`, color: project.color }}>
                        {project.code}
                      </span>
                    ) : (
                      <span className="text-[#9E9A8E]">-</span>
                    )}
                  </div>

                  <div className="col-span-1">
                    <span className={`text-[9px] px-1.5 py-0.2 border uppercase ${priorityStyles[task.priority].class}`}>
                      {priorityStyles[task.priority].label}
                    </span>
                  </div>

                  <div className="col-span-2 flex items-center gap-2">
                    {assignee && (
                      <>
                        <PatchAvatar user={assignee} size="sm" />
                        <span className="text-xs text-[#EDE8DB] truncate">{assignee.name}</span>
                      </>
                    )}
                  </div>

                  <div className="col-span-2 text-right text-[#9E9A8E]">
                    {task.dueDate}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TASK DETAILS MODAL */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#14171B] border-2 border-[#323A48] max-w-xl w-full p-5 patch-chamfer-md shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="absolute inset-[3px] border border-dashed border-[#EDE8DB]/20 pointer-events-none patch-chamfer-md" />

            <div className="flex items-start justify-between pb-3 border-b border-[#242930] mb-4">
              <div>
                <span className={`text-[10px] font-mono px-2 py-0.5 border uppercase ${priorityStyles[selectedTask.priority].class}`}>
                  {selectedTask.priority} PRIORITY
                </span>
                <h3 className="font-mono text-base font-bold text-[#EDE8DB] mt-1.5">
                  {selectedTask.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1 hover:bg-[#20252C] text-[#9E9A8E] hover:text-[#EDE8DB]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs text-[#EDE8DB]">
              {/* Description */}
              <div className="p-3 bg-[#0C0E11] border border-[#252B36] patch-chamfer-sm text-[#D8D2C2] whitespace-pre-wrap">
                {selectedTask.description || 'No additional description provided.'}
              </div>

              {/* Status Selector */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#9E9A8E] mb-1 uppercase text-[10px]">Status</label>
                  <select
                    value={selectedTask.status}
                    onChange={(e) => {
                      updateTaskStatus(selectedTask.id, e.target.value as TaskStatus);
                      setSelectedTask({ ...selectedTask, status: e.target.value as TaskStatus });
                    }}
                    className="w-full bg-[#0C0E11] border border-[#2D3440] px-3 py-1.5 text-xs text-[#EDE8DB] patch-chamfer-sm"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#9E9A8E] mb-1 uppercase text-[10px]">Assignee (Reassign)</label>
                  <select
                    value={selectedTask.assigneeId}
                    onChange={(e) => {
                      const updated = { ...selectedTask, assigneeId: e.target.value };
                      updateTask(updated);
                      setSelectedTask(updated);
                    }}
                    className="w-full bg-[#0C0E11] border border-[#2D3440] px-3 py-1.5 text-xs text-[#EDE8DB] patch-chamfer-sm"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.callsign})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subtasks / Checklist */}
              <div>
                <label className="block text-[#9E9A8E] mb-1 uppercase text-[10px]">
                  Checklist ({selectedTask.subtasks.filter(s => s.completed).length}/{selectedTask.subtasks.length})
                </label>
                <div className="space-y-1.5 bg-[#0C0E11] p-3 border border-[#242930] patch-chamfer-sm">
                  {selectedTask.subtasks.length === 0 ? (
                    <p className="text-[11px] text-[#666B75] italic">No subtasks defined.</p>
                  ) : (
                    selectedTask.subtasks.map(st => (
                      <div
                        key={st.id}
                        onClick={() => {
                          toggleSubtask(selectedTask.id, st.id);
                          setSelectedTask({
                            ...selectedTask,
                            subtasks: selectedTask.subtasks.map(s => s.id === st.id ? { ...s, completed: !s.completed } : s)
                          });
                        }}
                        className="flex items-center gap-2.5 p-1.5 hover:bg-[#16191D] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={st.completed}
                          readOnly
                          className="accent-[#5EBA7D]"
                        />
                        <span className={`text-xs ${st.completed ? 'line-through text-[#666B75]' : 'text-[#EDE8DB]'}`}>
                          {st.title}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Tags */}
              {selectedTask.tags.length > 0 && (
                <div>
                  <label className="block text-[#9E9A8E] mb-1 uppercase text-[10px]">Tags</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {selectedTask.tags.map(t => (
                      <span key={t} className="text-[10px] px-2 py-0.5 bg-[#1F242C] border border-[#323945] text-[#EDE8DB]">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-[#242930] flex items-center justify-between">
              <button
                onClick={() => {
                  deleteTask(selectedTask.id);
                  setSelectedTask(null);
                }}
                className="font-mono text-xs text-[#E05A47] hover:underline flex items-center gap-1"
              >
                <Trash2 size={13} /> Delete Task
              </button>
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-1.5 bg-[#252B34] hover:bg-[#323945] text-[#EDE8DB] font-mono text-xs patch-chamfer-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateSubmit}
            className="bg-[#14171B] border-2 border-[#323A48] max-w-lg w-full p-5 patch-chamfer-md shadow-2xl relative max-h-[90vh] overflow-y-auto"
          >
            <div className="absolute inset-[3px] border border-dashed border-[#EDE8DB]/20 pointer-events-none patch-chamfer-md" />

            <div className="flex items-center justify-between pb-3 border-b border-[#242930] mb-4">
              <h3 className="font-patch text-xl font-bold uppercase tracking-wider text-[#EDE8DB]">
                Deploy New Tactical Task
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1 hover:bg-[#20252C] text-[#9E9A8E] hover:text-[#EDE8DB]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[#9E9A8E] mb-1 uppercase text-[10px]">Task Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Implement hardware PUF key generator"
                  className="w-full bg-[#0C0E11] border border-[#2D3440] px-3 py-1.5 text-xs text-[#EDE8DB] focus:outline-none focus:border-[#E5B869] patch-chamfer-sm"
                />
              </div>

              <div>
                <label className="block text-[#9E9A8E] mb-1 uppercase text-[10px]">Description</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Specific requirements, acceptance criteria..."
                  className="w-full bg-[#0C0E11] border border-[#2D3440] px-3 py-1.5 text-xs text-[#EDE8DB] focus:outline-none focus:border-[#E5B869] patch-chamfer-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#9E9A8E] mb-1 uppercase text-[10px]">Assignee *</label>
                  <select
                    value={newAssigneeId}
                    onChange={(e) => setNewAssigneeId(e.target.value)}
                    className="w-full bg-[#0C0E11] border border-[#2D3440] px-3 py-1.5 text-xs text-[#EDE8DB] focus:outline-none focus:border-[#E5B869] patch-chamfer-sm"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.callsign})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#9E9A8E] mb-1 uppercase text-[10px]">Linked Project</label>
                  <select
                    value={newProjectId}
                    onChange={(e) => setNewProjectId(e.target.value)}
                    className="w-full bg-[#0C0E11] border border-[#2D3440] px-3 py-1.5 text-xs text-[#EDE8DB] focus:outline-none focus:border-[#E5B869] patch-chamfer-sm"
                  >
                    <option value="">No Project / Unassigned</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.code}: {p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#9E9A8E] mb-1 uppercase text-[10px]">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                    className="w-full bg-[#0C0E11] border border-[#2D3440] px-3 py-1.5 text-xs text-[#EDE8DB] focus:outline-none focus:border-[#E5B869] patch-chamfer-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#9E9A8E] mb-1 uppercase text-[10px]">Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-[#0C0E11] border border-[#2D3440] px-3 py-1.5 text-xs text-[#EDE8DB] focus:outline-none focus:border-[#E5B869] patch-chamfer-sm"
                  />
                </div>
              </div>

              {/* Subtasks Builder */}
              <div>
                <label className="block text-[#9E9A8E] mb-1 uppercase text-[10px]">Sub-tasks / Checklist</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={subtaskInput}
                    onChange={(e) => setSubtaskInput(e.target.value)}
                    placeholder="Add subtask item..."
                    className="flex-1 bg-[#0C0E11] border border-[#2D3440] px-3 py-1 text-xs text-[#EDE8DB] focus:outline-none focus:border-[#E5B869] patch-chamfer-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSubtaskToDraft();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addSubtaskToDraft}
                    className="px-3 py-1 bg-[#1F242C] hover:bg-[#2A313C] text-[#EDE8DB] font-mono text-xs patch-chamfer-sm border border-[#323945]"
                  >
                    + Add
                  </button>
                </div>

                {newSubtasks.length > 0 && (
                  <div className="space-y-1 bg-[#0C0E11] p-2 border border-[#242930] patch-chamfer-sm">
                    {newSubtasks.map((st, i) => (
                      <div key={st.id} className="flex items-center justify-between text-xs text-[#D8D2C2] px-1">
                        <span>{i + 1}. {st.title}</span>
                        <button
                          type="button"
                          onClick={() => setNewSubtasks(prev => prev.filter(item => item.id !== st.id))}
                          className="text-[#E05A47] text-[10px] hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[#9E9A8E] mb-1 uppercase text-[10px]">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={newTagsStr}
                  onChange={(e) => setNewTagsStr(e.target.value)}
                  placeholder="e.g. crypto, hardware, tokyo"
                  className="w-full bg-[#0C0E11] border border-[#2D3440] px-3 py-1.5 text-xs text-[#EDE8DB] focus:outline-none focus:border-[#E5B869] patch-chamfer-sm"
                />
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#242930] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-3 py-1.5 bg-[#1F242C] hover:bg-[#282F3B] text-[#9E9A8E] hover:text-[#EDE8DB] font-mono text-xs patch-chamfer-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#E5B869] hover:bg-[#F0C57A] text-[#0B0C0E] font-mono text-xs font-bold patch-chamfer-sm"
              >
                Deploy Task
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
