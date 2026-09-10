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
  const [newTagsStr, setNewTagsStr] = useState('operations, core');
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

  const columns: { id: TaskStatus; label: string }[] = [
    { id: 'todo', label: 'To Do' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'blocked', label: 'Blocked' },
    { id: 'done', label: 'Done' }
  ];

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
    <div className="space-y-8">
      {/* Editorial Header Section (Pure Black) */}
      <div className="border-b border-white/20 pb-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 micro-label text-white/60">
              <span className="w-1.5 h-1.5 bg-[#A1A1AA]" />
              <span>Index</span>
              <span>/</span>
              <span>Operations</span>
              <span>/</span>
              <span className="meta-number text-white">Tasks Catalog</span>
            </div>
            <h1 className="headline-section font-bold tracking-tight">
              Task Operations & Board.
            </h1>
            <p className="body-text text-xs text-white/70 max-w-xl">
              Strict task assignment, sprint velocity tracking, dependencies, and real-time database synchronization.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 bg-[#A1A1AA] hover:bg-[#D4D4D8] text-black font-semibold text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Deploy Task /</span>
            </button>
          </div>
        </div>

        {/* Persistent Hairline Horizontal Filter Bar (No Pill Buttons) */}
        <div className="mt-6 pt-3 border-t border-white/20 flex flex-wrap items-center justify-between gap-4 text-xs">
          {/* Scope Filters */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setScopeFilter('all')}
              className={`micro-label transition-colors cursor-pointer ${
                scopeFilter === 'all'
                  ? 'text-white font-bold underline underline-offset-4 decoration-[#A1A1AA] decoration-2'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              All Operations ({tasks.length})
            </button>
            <span className="text-white/20">/</span>
            <button
              onClick={() => setScopeFilter('my')}
              className={`micro-label transition-colors cursor-pointer ${
                scopeFilter === 'my'
                  ? 'text-white font-bold underline underline-offset-4 decoration-[#A1A1AA] decoration-2'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              My Assignments ({tasks.filter(t => t.assigneeId === currentUser.id).length})
            </button>
          </div>

          {/* View Toggle & Search */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('kanban')}
                className={`micro-label flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'kanban'
                    ? 'text-white font-bold underline underline-offset-4 decoration-[#A1A1AA] decoration-2'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Kanban size={13} />
                <span>Kanban /</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`micro-label flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'list'
                    ? 'text-white font-bold underline underline-offset-4 decoration-[#A1A1AA] decoration-2'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <List size={13} />
                <span>Catalog List /</span>
              </button>
            </div>

            <div className="h-4 w-[1px] bg-white/20" />

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="bg-black border border-white/30 text-white text-xs px-3 py-1 focus:outline-none focus:border-[#A1A1AA] w-40 sm:w-52"
            />

            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="bg-black border border-white/30 text-white text-xs px-2 py-1 focus:outline-none focus:border-[#A1A1AA]"
            >
              <option value="all">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.code}: {p.name}</option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-black border border-white/30 text-white text-xs px-2 py-1 focus:outline-none focus:border-[#A1A1AA]"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* KANBAN VIEW */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
          {columns.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.id);
            return (
              <div
                key={col.id}
                className="bg-[#000000] border border-white/20 p-4 min-h-[550px] flex flex-col justify-between"
              >
                <div>
                  {/* Column Header */}
                  <div className="pb-3 mb-4 border-b border-white/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold tracking-tight text-white uppercase">
                        {col.label}
                      </span>
                      <span className="meta-number text-[10px] px-1.5 py-0.5 border border-white/20 text-white/60">
                        {String(colTasks.length).padStart(2, '0')}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setNewStatus(col.id);
                        setIsCreateOpen(true);
                      }}
                      className="text-white/60 hover:text-[#A1A1AA] transition-colors p-1 cursor-pointer"
                      title={`Add task to ${col.label}`}
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Task Cards */}
                  <div className="space-y-3">
                    {colTasks.length === 0 ? (
                      <div className="py-12 text-center border border-dashed border-white/10">
                        <span className="micro-label text-white/40">Queue Empty</span>
                      </div>
                    ) : (
                      colTasks.map(task => {
                        const assignee = users.find(u => u.id === task.assigneeId);
                        const project = projects.find(p => p.id === task.projectId);
                        const subtaskCompleted = task.subtasks.filter(s => s.completed).length;
                        const hasDependencies = task.dependencies.length > 0;

                        return (
                          <div
                            key={task.id}
                            onClick={() => setSelectedTask(task)}
                            className="bg-[#000000] border border-white/20 hover:border-[#A1A1AA] p-4 transition-colors cursor-pointer group"
                          >
                            {/* Project Code & Priority */}
                            <div className="flex items-center justify-between gap-2 mb-2">
                              {project ? (
                                <span className="meta-number text-[10px] text-[#A1A1AA] font-bold">
                                  /{project.code}
                                </span>
                              ) : (
                                <span className="meta-number text-[10px] text-white/40">/GENERAL</span>
                              )}
                              <span className={`meta-number text-[9px] uppercase font-bold ${
                                task.priority === 'urgent' ? 'text-[#A1A1AA]' : 'text-white/60'
                              }`}>
                                {task.priority}
                              </span>
                            </div>

                            {/* Title */}
                            <h4 className="text-xs font-bold text-white group-hover:text-[#A1A1AA] transition-colors leading-snug">
                              {task.title}
                            </h4>

                            {/* Dependencies Warning */}
                            {hasDependencies && (
                              <div className="mt-2 flex items-center gap-1 meta-number text-[10px] text-white/80 border border-white/20 p-1">
                                <AlertOctagon size={11} className="text-[#A1A1AA]" />
                                <span>Blocked: {task.dependencies.join(', ')}</span>
                              </div>
                            )}

                            {/* Subtasks Progress */}
                            {task.subtasks.length > 0 && (
                              <div className="mt-2.5 space-y-1">
                                <div className="flex items-center justify-between text-[10px] meta-number text-white/60">
                                  <span>Checklist</span>
                                  <span>{subtaskCompleted}/{task.subtasks.length}</span>
                                </div>
                                <div className="w-full bg-white/10 h-1 overflow-hidden">
                                  <div
                                    className="h-full bg-[#A1A1AA]"
                                    style={{ width: `${(subtaskCompleted / task.subtasks.length) * 100}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Bottom Meta */}
                            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between gap-2">
                              <span className="meta-number text-[10px] text-white/50 flex items-center gap-1">
                                <Clock size={10} />
                                {task.dueDate}
                              </span>

                              {assignee && (
                                <div className="flex items-center gap-1.5">
                                  <PatchAvatar user={assignee} size="sm" />
                                  <span className="micro-label text-white/70 text-[11px]">{assignee.name}</span>
                                </div>
                              )}
                            </div>

                            {/* Quick Status Shift Bar */}
                            <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between gap-1">
                              {columns.map(c => (
                                <button
                                  key={c.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateTaskStatus(task.id, c.id);
                                  }}
                                  disabled={task.status === c.id}
                                  className={`flex-1 meta-number text-[9px] py-0.5 border transition-colors cursor-pointer ${
                                    task.status === c.id
                                      ? 'bg-[#A1A1AA] border-[#A1A1AA] text-white font-bold'
                                      : 'border-white/20 text-white/50 hover:text-white hover:border-white/40'
                                  }`}
                                >
                                  {c.id === 'todo' ? 'TODO' : c.id === 'in_progress' ? 'PROG' : c.id === 'blocked' ? 'BLCK' : 'DONE'}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="pt-3 mt-4 border-t border-white/20">
                  <button
                    onClick={() => {
                      setNewStatus(col.id);
                      setIsCreateOpen(true);
                    }}
                    className="w-full py-1.5 border border-white/20 hover:border-white text-xs text-white/70 hover:text-white flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus size={12} /> Add to {col.label}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LIST CATALOG VIEW */}
      {viewMode === 'list' && (
        <div className="bg-[#FFFFFF] text-[#000000] p-6 border border-black space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-black">
            <span className="micro-label text-black/60">Catalog Index / Tabular Dispatch</span>
            <span className="meta-number text-[11px] text-black">
              Total {filteredTasks.length} Operations
            </span>
          </div>

          <div className="divide-y divide-black">
            <div className="grid grid-cols-12 gap-2 pb-2 meta-number text-[10px] text-black uppercase tracking-wider font-bold">
              <span className="col-span-1">Status</span>
              <span className="col-span-4">Operation Title</span>
              <span className="col-span-2">Project</span>
              <span className="col-span-1">Priority</span>
              <span className="col-span-2">Assignee</span>
              <span className="col-span-2 text-right">Due Date</span>
            </div>

            {filteredTasks.map(task => {
              const assignee = users.find(u => u.id === task.assigneeId);
              const project = projects.find(p => p.id === task.projectId);
              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="grid grid-cols-12 gap-2 items-center py-3 hover:bg-[#000000] hover:text-[#FFFFFF] cursor-pointer transition-colors px-2"
                >
                  <div className="col-span-1 flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateTaskStatus(task.id, task.status === 'done' ? 'todo' : 'done');
                      }}
                      className={`w-4 h-4 border border-current flex items-center justify-center cursor-pointer ${
                        task.status === 'done' ? 'bg-[#A1A1AA] text-white border-[#A1A1AA]' : ''
                      }`}
                    >
                      {task.status === 'done' && <CheckCircle2 size={12} />}
                    </button>
                  </div>

                  <div className="col-span-4 font-bold truncate">
                    {task.title}
                  </div>

                  <div className="col-span-2 meta-number text-[11px]">
                    {project ? `/${project.code}` : '-'}
                  </div>

                  <div className="col-span-1 meta-number text-[10px] uppercase font-bold text-[#A1A1AA]">
                    /{task.priority}
                  </div>

                  <div className="col-span-2 flex items-center gap-2">
                    {assignee && (
                      <>
                        <PatchAvatar user={assignee} size="sm" />
                        <span className="text-xs truncate">{assignee.name}</span>
                      </>
                    )}
                  </div>

                  <div className="col-span-2 text-right meta-number text-[11px]">
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
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="bg-[#000000] text-white border border-white/40 max-w-xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-white/20 mb-4">
              <div>
                <span className="meta-number text-[10px] uppercase text-[#A1A1AA]">
                  /{selectedTask.priority} PRIORITY
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  {selectedTask.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-white/60 hover:text-white cursor-pointer p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Description */}
              <div className="p-3 border border-white/20 text-white/80 whitespace-pre-wrap">
                {selectedTask.description || 'No additional description provided.'}
              </div>

              {/* Status & Assignee Selector */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block micro-label text-white/60 mb-1">Status</label>
                  <select
                    value={selectedTask.status}
                    onChange={(e) => {
                      updateTaskStatus(selectedTask.id, e.target.value as TaskStatus);
                      setSelectedTask({ ...selectedTask, status: e.target.value as TaskStatus });
                    }}
                    className="w-full bg-black border border-white/30 px-3 py-1.5 text-xs text-white"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block micro-label text-white/60 mb-1">Assignee</label>
                  <select
                    value={selectedTask.assigneeId}
                    onChange={(e) => {
                      const updated = { ...selectedTask, assigneeId: e.target.value };
                      updateTask(updated);
                      setSelectedTask(updated);
                    }}
                    className="w-full bg-black border border-white/30 px-3 py-1.5 text-xs text-white"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.callsign})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subtasks Checklist */}
              <div>
                <label className="block micro-label text-white/60 mb-1">
                  Checklist ({selectedTask.subtasks.filter(s => s.completed).length}/{selectedTask.subtasks.length})
                </label>
                <div className="space-y-1.5 border border-white/20 p-3">
                  {selectedTask.subtasks.length === 0 ? (
                    <p className="micro-label text-white/40 italic">No subtasks defined.</p>
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
                        className="flex items-center gap-2.5 p-1.5 hover:bg-white/5 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={st.completed}
                          readOnly
                          className="accent-[#A1A1AA]"
                        />
                        <span className={`text-xs ${st.completed ? 'line-through text-white/40' : 'text-white'}`}>
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
                  <label className="block micro-label text-white/60 mb-1">Tags</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {selectedTask.tags.map(t => (
                      <span key={t} className="meta-number text-[10px] px-2 py-0.5 border border-white/30 text-white">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-3 border-t border-white/20 flex items-center justify-between">
              <button
                onClick={() => {
                  deleteTask(selectedTask.id);
                  setSelectedTask(null);
                }}
                className="text-xs text-white/60 hover:text-[#A1A1AA] flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={13} /> Delete Task /
              </button>
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-1.5 bg-white text-black hover:bg-[#A1A1AA] hover:text-black text-xs font-semibold cursor-pointer"
              >
                Close /
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateSubmit}
            className="bg-[#000000] text-white border border-white/40 max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/20 mb-4">
              <h3 className="text-base font-bold text-white uppercase">
                Deploy New Operation
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-white/60 hover:text-white cursor-pointer p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block micro-label text-white/60 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Implement hardware PUF key generator"
                  className="w-full bg-black border border-white/30 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#A1A1AA]"
                />
              </div>

              <div>
                <label className="block micro-label text-white/60 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Specific requirements, acceptance criteria..."
                  className="w-full bg-black border border-white/30 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#A1A1AA] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block micro-label text-white/60 mb-1">Assignee *</label>
                  <select
                    value={newAssigneeId}
                    onChange={(e) => setNewAssigneeId(e.target.value)}
                    className="w-full bg-black border border-white/30 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#A1A1AA]"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.callsign})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block micro-label text-white/60 mb-1">Linked Project</label>
                  <select
                    value={newProjectId}
                    onChange={(e) => setNewProjectId(e.target.value)}
                    className="w-full bg-black border border-white/30 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#A1A1AA]"
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
                  <label className="block micro-label text-white/60 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                    className="w-full bg-black border border-white/30 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#A1A1AA]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block micro-label text-white/60 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-black border border-white/30 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#A1A1AA]"
                  />
                </div>
              </div>

              {/* Subtasks Builder */}
              <div>
                <label className="block micro-label text-white/60 mb-1">Sub-tasks / Checklist</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={subtaskInput}
                    onChange={(e) => setSubtaskInput(e.target.value)}
                    placeholder="Add subtask item..."
                    className="flex-1 bg-black border border-white/30 px-3 py-1 text-xs text-white focus:outline-none focus:border-[#A1A1AA]"
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
                    className="px-3 py-1 border border-white/30 hover:border-white text-white text-xs cursor-pointer"
                  >
                    + Add /
                  </button>
                </div>

                {newSubtasks.length > 0 && (
                  <div className="space-y-1 border border-white/20 p-2">
                    {newSubtasks.map((st, i) => (
                      <div key={st.id} className="flex items-center justify-between text-xs text-white/80 px-1">
                        <span>{i + 1}. {st.title}</span>
                        <button
                          type="button"
                          onClick={() => setNewSubtasks(prev => prev.filter(item => item.id !== st.id))}
                          className="text-white/40 hover:text-[#A1A1AA] text-[10px] cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block micro-label text-white/60 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={newTagsStr}
                  onChange={(e) => setNewTagsStr(e.target.value)}
                  placeholder="e.g. crypto, hardware, tokyo"
                  className="w-full bg-black border border-white/30 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#A1A1AA]"
                />
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-white/20 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-3 py-1.5 border border-white/20 hover:border-white text-white/70 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#A1A1AA] hover:bg-[#D4D4D8] text-black font-semibold text-xs font-semibold cursor-pointer"
              >
                Deploy Task /
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
