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
  X,
  Bot
} from 'lucide-react';

export const TasksView: React.FC = () => {
  const {
    tasks,
    addTask,
    updateTask,
    updateTaskStatus,
    toggleSubtask,
    deleteTask,
    delegateTaskToAgent,
    users,
    projects,
    currentUser
  } = useWorkspace();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [mobileColumn, setMobileColumn] = useState<TaskStatus | 'all'>('all');
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
    <div className="space-y-8 pb-16">
      {/* Editorial Header Section */}
      <section className="border-b border-[#E5E5E7] pb-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-[#6E6E73] uppercase tracking-wider">
              <span>Operations</span>
              <span>•</span>
              <span className="text-black font-semibold">Tasks Catalog</span>
              <span>•</span>
              <span>Sprint Velocity</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-black font-normal tracking-tight">
              Task Operations & Board.
            </h1>
            <p className="text-[#6E6E73] text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Task assignment, sprint velocity tracking, dependencies, and autonomous execution pipelines.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-5 py-2.5 rounded-full bg-black hover:opacity-90 text-white font-medium text-xs flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <Plus size={15} />
              <span>Deploy Task</span>
            </button>
          </div>
        </div>

        {/* Persistent Filter Bar */}
        <div className="mt-8 pt-4 border-t border-[#E5E5E7] flex flex-wrap items-center justify-between gap-4 text-xs">
          {/* Scope Filters (Apple Segmented Pill) */}
          <div className="inline-flex p-1 bg-[#F5F5F7] border border-[#E5E5E7] rounded-full text-xs font-medium">
            <button
              onClick={() => setScopeFilter('all')}
              className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                scopeFilter === 'all'
                  ? 'bg-white text-black shadow-xs font-semibold'
                  : 'text-[#6E6E73] hover:text-black'
              }`}
            >
              All Operations ({tasks.length})
            </button>
            <button
              onClick={() => setScopeFilter('my')}
              className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                scopeFilter === 'my'
                  ? 'bg-white text-black shadow-xs font-semibold'
                  : 'text-[#6E6E73] hover:text-black'
              }`}
            >
              My Assignments ({tasks.filter(t => t.assigneeId === currentUser.id).length})
            </button>
          </div>

          {/* View Toggle & Search */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex p-1 bg-[#F5F5F7] border border-[#E5E5E7] rounded-full text-xs font-medium">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'kanban'
                    ? 'bg-white text-black shadow-xs font-semibold'
                    : 'text-[#6E6E73] hover:text-black'
                }`}
              >
                <Kanban size={13} />
                <span>Kanban</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-black shadow-xs font-semibold'
                    : 'text-[#6E6E73] hover:text-black'
                }`}
              >
                <List size={13} />
                <span>Catalog List</span>
              </button>
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="bg-[#F5F5F7] border border-[#E5E5E7] text-black text-xs rounded-full px-3.5 py-1.5 focus:outline-none focus:border-black focus:bg-white transition-all w-36 sm:w-48"
            />

            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="bg-[#F5F5F7] border border-[#E5E5E7] text-black text-xs rounded-full px-3 py-1.5 focus:outline-none focus:border-black focus:bg-white transition-all"
            >
              <option value="all">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.code}: {p.name}</option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-[#F5F5F7] border border-[#E5E5E7] text-black text-xs rounded-full px-3 py-1.5 focus:outline-none focus:border-black focus:bg-white transition-all"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </section>

      {/* KANBAN VIEW */}
      {viewMode === 'kanban' && (
        <>
          {/* Mobile Column Quick Switcher */}
          <div className="md:hidden flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
            <button
              onClick={() => setMobileColumn('all')}
              className={`px-3.5 py-1.5 text-xs rounded-full border transition-all shrink-0 font-medium ${
                mobileColumn === 'all'
                  ? 'border-black bg-black text-white'
                  : 'border-[#E5E5E7] bg-[#F5F5F7] text-[#6E6E73] hover:text-black'
              }`}
            >
              All ({filteredTasks.length})
            </button>
            {columns.map(col => {
              const count = filteredTasks.filter(t => t.status === col.id).length;
              const isColActive = mobileColumn === col.id;
              return (
                <button
                  key={col.id}
                  onClick={() => setMobileColumn(col.id)}
                  className={`px-3.5 py-1.5 text-xs rounded-full border transition-all shrink-0 font-medium ${
                    isColActive
                      ? 'border-black bg-black text-white'
                      : 'border-[#E5E5E7] bg-[#F5F5F7] text-[#6E6E73] hover:text-black'
                  }`}
                >
                  {col.label} ({count})
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
            {columns.map(col => {
              const colTasks = filteredTasks.filter(t => t.status === col.id);
              return (
                <div
                  key={col.id}
                  className={`bg-[#F5F5F7] border border-[#E5E5E7] rounded-3xl p-5 min-h-[420px] md:min-h-[550px] flex flex-col justify-between shadow-xs ${
                    mobileColumn !== 'all' && mobileColumn !== col.id ? 'hidden md:flex' : 'flex'
                  }`}
                >
                  <div>
                    {/* Column Header */}
                    <div className="pb-3 mb-4 border-b border-[#E5E5E7] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold tracking-wide text-black uppercase">
                          {col.label}
                        </span>
                        <span className="text-xs font-medium text-[#6E6E73] px-2 py-0.5 rounded-full bg-white border border-[#E5E5E7]">
                          {String(colTasks.length).padStart(2, '0')}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setNewStatus(col.id);
                          setIsCreateOpen(true);
                        }}
                        className="text-[#6E6E73] hover:text-black transition-colors p-1 rounded-full hover:bg-white cursor-pointer"
                        title={`Add task to ${col.label}`}
                      >
                        <Plus size={15} />
                      </button>
                    </div>

                    {/* Task Cards */}
                    <div className="space-y-3">
                      {colTasks.length === 0 ? (
                        <div className="py-14 text-center border border-dashed border-[#E5E5E7] rounded-2xl bg-white/50">
                          <span className="text-xs text-[#6E6E73]">Queue Empty</span>
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
                              className="bg-white border border-[#E5E5E7] hover:border-black/30 rounded-2xl p-4.5 transition-all cursor-pointer group shadow-xs hover:shadow-sm"
                            >
                              {/* Project Code & Priority */}
                              <div className="flex items-center justify-between gap-2 mb-2">
                                {project ? (
                                  <span className="text-[11px] text-black font-semibold">
                                    /{project.code}
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-[#6E6E73]">/GENERAL</span>
                                )}
                                <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border ${
                                  task.priority === 'urgent'
                                    ? 'border-red-200 bg-red-50 text-red-700'
                                    : task.priority === 'high'
                                    ? 'border-amber-200 bg-amber-50 text-amber-800'
                                    : 'border-[#E5E5E7] bg-[#F5F5F7] text-[#6E6E73]'
                                }`}>
                                  {task.priority}
                                </span>
                              </div>

                              {/* Title */}
                              <h4 className="text-xs sm:text-sm font-semibold text-black group-hover:text-black transition-colors leading-snug">
                                {task.title}
                              </h4>

                              {/* Dependencies Warning */}
                              {hasDependencies && (
                                <div className="mt-2.5 flex items-center gap-1 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2">
                                  <AlertOctagon size={12} className="text-amber-600 shrink-0" />
                                  <span className="truncate">Blocked: {task.dependencies.join(', ')}</span>
                                </div>
                              )}

                              {/* Subtasks Progress */}
                              {task.subtasks.length > 0 && (
                                <div className="mt-3 space-y-1.5">
                                  <div className="flex items-center justify-between text-[11px] text-[#6E6E73]">
                                    <span>Checklist</span>
                                    <span>{subtaskCompleted}/{task.subtasks.length}</span>
                                  </div>
                                  <div className="w-full bg-[#F5F5F7] h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-black rounded-full transition-all"
                                      style={{ width: `${(subtaskCompleted / task.subtasks.length) * 100}%` }}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Bottom Meta */}
                              <div className="mt-3.5 pt-2.5 border-t border-[#E5E5E7] flex items-center justify-between gap-2">
                                <span className="text-xs text-[#6E6E73] flex items-center gap-1 font-mono">
                                  <Clock size={11} />
                                  {task.dueDate}
                                </span>

                                {assignee && (
                                  <div className="flex items-center gap-1.5">
                                    <PatchAvatar user={assignee} size="sm" />
                                    <span className="text-xs text-black font-medium">{assignee.name}</span>
                                  </div>
                                )}
                              </div>

                              {/* Quick Status Shift Bar */}
                              <div className="mt-3 pt-2.5 border-t border-[#E5E5E7] flex items-center justify-between gap-1">
                                {columns.map(c => (
                                  <button
                                    key={c.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateTaskStatus(task.id, c.id);
                                    }}
                                    disabled={task.status === c.id}
                                    className={`flex-1 text-[9px] py-1 rounded-md border transition-all cursor-pointer font-medium ${
                                      task.status === c.id
                                        ? 'bg-black border-black text-white shadow-xs'
                                        : 'border-[#E5E5E7] bg-white text-[#6E6E73] hover:text-black hover:border-black'
                                    }`}
                                  >
                                    {c.id === 'todo' ? 'TODO' : c.id === 'in_progress' ? 'PROG' : c.id === 'blocked' ? 'BLCK' : 'DONE'}
                                  </button>
                                ))}
                              </div>

                              {/* Delegate to Autonomous AI Agent Button */}
                              {task.status !== 'done' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    delegateTaskToAgent(task.id);
                                  }}
                                  className="mt-2.5 w-full py-1.5 rounded-xl border border-[#E5E5E7] hover:border-black bg-[#F5F5F7] hover:bg-white text-xs font-medium text-black flex items-center justify-center gap-1.5 transition-all shadow-xs"
                                  title="Delegate this task to autonomous AI agent"
                                >
                                  <Bot size={13} className="text-black" />
                                  <span>Assign to Unfoundy AI</span>
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="pt-3 mt-4 border-t border-[#E5E5E7]">
                    <button
                      onClick={() => {
                        setNewStatus(col.id);
                        setIsCreateOpen(true);
                      }}
                      className="w-full py-2 rounded-xl border border-[#E5E5E7] hover:border-black bg-white text-xs text-black font-medium flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <Plus size={13} /> Add to {col.label}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* LIST CATALOG VIEW */}
      {viewMode === 'list' && (
        <div className="bg-white text-black p-6 sm:p-8 border border-[#E5E5E7] rounded-3xl space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E7]">
            <span className="text-xs font-semibold text-black uppercase tracking-wider">Catalog Index / Tabular Dispatch</span>
            <span className="text-xs text-[#6E6E73] font-mono">
              Total {filteredTasks.length} Operations
            </span>
          </div>

          <div className="divide-y divide-[#E5E5E7]">
            <div className="grid grid-cols-12 gap-2 pb-3 text-xs text-[#6E6E73] uppercase tracking-wider font-semibold">
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
                  className="grid grid-cols-12 gap-2 items-center py-3.5 hover:bg-[#F5F5F7] rounded-xl cursor-pointer transition-colors px-2 text-xs"
                >
                  <div className="col-span-1 flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateTaskStatus(task.id, task.status === 'done' ? 'todo' : 'done');
                      }}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center cursor-pointer transition-all ${
                        task.status === 'done' ? 'bg-black text-white border-black' : 'border-[#E5E5E7] bg-white hover:border-black'
                      }`}
                    >
                      {task.status === 'done' && <CheckCircle2 size={13} />}
                    </button>
                  </div>

                  <div className="col-span-4 font-semibold text-black truncate">
                    {task.title}
                  </div>

                  <div className="col-span-2 text-xs font-mono text-[#6E6E73]">
                    {project ? `/${project.code}` : '-'}
                  </div>

                  <div className="col-span-1">
                    <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border ${
                      task.priority === 'urgent'
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : task.priority === 'high'
                        ? 'border-amber-200 bg-amber-50 text-amber-800'
                        : 'border-[#E5E5E7] bg-[#F5F5F7] text-[#6E6E73]'
                    }`}>
                      {task.priority}
                    </span>
                  </div>

                  <div className="col-span-2 flex items-center gap-2">
                    {assignee && (
                      <>
                        <PatchAvatar user={assignee} size="sm" />
                        <span className="text-xs truncate text-black font-medium">{assignee.name}</span>
                      </>
                    )}
                  </div>

                  <div className="col-span-2 text-right font-mono text-xs text-[#6E6E73]">
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-black border border-[#E5E5E7] rounded-3xl max-w-xl w-full p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto shadow-2xl space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-[#E5E5E7]">
              <div>
                <span className="text-xs font-semibold text-[#6E6E73] uppercase tracking-wider">
                  /{selectedTask.priority} Priority
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-normal text-black mt-1">
                  {selectedTask.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-[#6E6E73] hover:text-black transition-colors p-1.5 rounded-full hover:bg-[#F5F5F7] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Description */}
              <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-[#E5E5E7] text-black leading-relaxed whitespace-pre-wrap">
                {selectedTask.description || 'No additional description provided.'}
              </div>

              {/* Status & Assignee Selector */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#6E6E73] mb-1.5 uppercase tracking-wider">Status</label>
                  <select
                    value={selectedTask.status}
                    onChange={(e) => {
                      updateTaskStatus(selectedTask.id, e.target.value as TaskStatus);
                      setSelectedTask({ ...selectedTask, status: e.target.value as TaskStatus });
                    }}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#6E6E73] mb-1.5 uppercase tracking-wider">Assignee</label>
                  <select
                    value={selectedTask.assigneeId}
                    onChange={(e) => {
                      const updated = { ...selectedTask, assigneeId: e.target.value };
                      updateTask(updated);
                      setSelectedTask(updated);
                    }}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.callsign})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subtasks Checklist */}
              <div>
                <label className="block text-xs font-medium text-[#6E6E73] mb-1.5 uppercase tracking-wider">
                  Checklist ({selectedTask.subtasks.filter(s => s.completed).length}/{selectedTask.subtasks.length})
                </label>
                <div className="space-y-1.5 border border-[#E5E5E7] rounded-2xl p-3.5 bg-[#F5F5F7]">
                  {selectedTask.subtasks.length === 0 ? (
                    <p className="text-xs text-[#6E6E73] italic">No subtasks defined.</p>
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
                        className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={st.completed}
                          readOnly
                          className="accent-black w-4 h-4 rounded"
                        />
                        <span className={`text-xs ${st.completed ? 'line-through text-[#6E6E73]' : 'text-black font-medium'}`}>
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
                  <label className="block text-xs font-medium text-[#6E6E73] mb-1.5 uppercase tracking-wider">Tags</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {selectedTask.tags.map(t => (
                      <span key={t} className="text-xs px-3 py-1 rounded-full border border-[#E5E5E7] bg-[#F5F5F7] text-black">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[#E5E5E7] flex items-center justify-between">
              <button
                onClick={() => {
                  deleteTask(selectedTask.id);
                  setSelectedTask(null);
                }}
                className="text-xs text-[#6E6E73] hover:text-red-600 flex items-center gap-1.5 cursor-pointer font-medium transition-colors"
              >
                <Trash2 size={13} />
                <span>Delete Task</span>
              </button>
              <button
                onClick={() => setSelectedTask(null)}
                className="px-5 py-2 rounded-full bg-black text-white hover:opacity-90 text-xs font-medium cursor-pointer shadow-xs transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateSubmit}
            className="bg-white text-black border border-[#E5E5E7] rounded-3xl max-w-lg w-full p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E7]">
              <div>
                <span className="text-xs font-semibold text-[#6E6E73] uppercase tracking-wider">New Operation</span>
                <h3 className="font-serif text-xl sm:text-2xl font-normal text-black">
                  Deploy New Operation
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-[#6E6E73] hover:text-black transition-colors p-1.5 rounded-full hover:bg-[#F5F5F7] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Task Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Implement hardware PUF key generator"
                  className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Specific requirements, acceptance criteria..."
                  className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Assignee *</label>
                  <select
                    value={newAssigneeId}
                    onChange={(e) => setNewAssigneeId(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.callsign})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Linked Project</label>
                  <select
                    value={newProjectId}
                    onChange={(e) => setNewProjectId(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
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
                  <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Subtasks Builder */}
              <div>
                <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Sub-tasks / Checklist</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={subtaskInput}
                    onChange={(e) => setSubtaskInput(e.target.value)}
                    placeholder="Add subtask item..."
                    className="flex-1 bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
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
                    className="px-4 py-2 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] hover:bg-white text-black text-xs font-medium transition-all cursor-pointer"
                  >
                    + Add
                  </button>
                </div>

                {newSubtasks.length > 0 && (
                  <div className="space-y-1.5 border border-[#E5E5E7] rounded-2xl p-3 bg-[#F5F5F7]">
                    {newSubtasks.map((st, i) => (
                      <div key={st.id} className="flex items-center justify-between text-xs text-black px-2 py-1 bg-white rounded-xl">
                        <span>{i + 1}. {st.title}</span>
                        <button
                          type="button"
                          onClick={() => setNewSubtasks(prev => prev.filter(item => item.id !== st.id))}
                          className="text-[#6E6E73] hover:text-red-600 text-xs cursor-pointer font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={newTagsStr}
                  onChange={(e) => setNewTagsStr(e.target.value)}
                  placeholder="e.g. crypto, hardware, tokyo"
                  className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E5E7] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 rounded-full border border-[#E5E5E7] hover:bg-[#F5F5F7] text-black text-xs font-medium cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-black hover:opacity-90 text-white font-medium text-xs cursor-pointer shadow-xs transition-all"
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
