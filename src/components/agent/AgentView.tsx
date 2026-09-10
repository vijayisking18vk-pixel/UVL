import React, { useState, useRef } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  AgentTask,
  AgentActionStep,
  AgentReport,
  AgentActivityLog
} from '../../types';
import { sound } from '../../utils/sound';
import {
  Bot,
  Sparkles,
  Send,
  Mic,
  MicOff,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Download,
  Calendar,
  CheckSquare,
  FileText,
  MessageSquare,
  IndianRupee,
  Briefcase,
  Layers,
  ShieldCheck,
  ChevronRight,
  Clock,
  Settings,
  Cpu,
  RefreshCw,
  ExternalLink,
  Eye,
  FileCode,
  TrendingUp
} from 'lucide-react';

export const AgentView: React.FC = () => {
  const {
    agentTasks,
    agentLogs,
    agentReports,
    agentConfig,
    createAgentTask,
    approveAndExecutePlan,
    generateAgentReport,
    rollbackAgentAction,
    updateAgentConfig,
    currentUser,
    tasks,
    expenses,
    investors
  } = useWorkspace();

  const [promptInput, setPromptInput] = useState('');
  const [isPlanning, setIsPlanning] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [selectedTask, setSelectedTask] = useState<AgentTask | null>(agentTasks[0] || null);
  const [selectedReport, setSelectedReport] = useState<AgentReport | null>(agentReports[0] || null);
  const [activeSubTab, setActiveSubTab] = useState<'executor' | 'reports' | 'logs' | 'config'>('executor');

  // Voice Input Speech Recognition state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Pre-configured Quick Executive Prompts
  const quickPrompts = [
    'Analyze all pending investor leads and schedule high-priority follow-up tasks',
    'Review current month software expenses and flag unapproved items',
    'Compile this week\'s task progress, milestones, and blockers into team wiki',
    'Identify overdue task deliverables and draft notification to assignees',
    'Audit Delaware legal compliance and seed round documents in central repository'
  ];

  // Speech Recognition Handler
  const toggleSpeechRecognition = () => {
    sound.click();
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported by this browser. Please type your task below.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setPromptInput(prev => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  // Submit Prompt to Gemini Planner
  const handleIntakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim() || isPlanning) return;

    setIsPlanning(true);
    try {
      const task = await createAgentTask(promptInput.trim());
      setSelectedTask(task);
      setPromptInput('');
    } catch (err) {
      console.error('Failed to create agent task:', err);
      alert('Agent planning encountered an error. Check Gemini API configuration.');
    } finally {
      setIsPlanning(false);
    }
  };

  const handleSelectQuickPrompt = (qp: string) => {
    sound.click();
    setPromptInput(qp);
  };

  // Execute Plan
  const handleApprovePlan = async (taskId: string) => {
    setIsExecuting(true);
    try {
      await approveAndExecutePlan(taskId);
      const updated = agentTasks.find(t => t.id === taskId);
      if (updated) setSelectedTask(updated);
    } catch (err) {
      console.error('Plan execution failed:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  // Generate Report
  const handleTriggerReport = async (type: 'daily' | 'weekly' | 'monthly') => {
    setIsGeneratingReport(true);
    try {
      const rep = await generateAgentReport(type);
      setSelectedReport(rep);
      setActiveSubTab('reports');
    } catch (err) {
      console.error('Report generation failed:', err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Download Report Markdown
  const downloadReportMarkdown = (report: AgentReport) => {
    sound.click();
    const blob = new Blob([report.content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getModuleIcon = (mod: string) => {
    switch (mod) {
      case 'tasks': return <CheckSquare size={13} className="text-white" />;
      case 'calendar': return <Calendar size={13} className="text-white" />;
      case 'notes': return <FileText size={13} className="text-white" />;
      case 'chat': return <MessageSquare size={13} className="text-white" />;
      case 'expenses': return <IndianRupee size={13} className="text-[#A1A1AA]" />;
      case 'investors': return <Briefcase size={13} className="text-[#A1A1AA]" />;
      default: return <Layers size={13} className="text-white/60" />;
    }
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Top Editorial Header */}
      <section className="border-b border-white/20 pb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="text-[11px] font-mono tracking-widest uppercase text-white/50 mb-3 flex items-center gap-2">
              <span>autonomous intelligence</span>
              <span>/</span>
              <span className="text-[#A1A1AA]">agentic task executor</span>
              <span>/</span>
              <span>gemini 3.6 flash</span>
            </div>
            <h1 className="headline-section text-white font-bold tracking-tight">
              Autonomous task executor & engine.
            </h1>
            <p className="text-white/60 text-sm mt-2 max-w-xl">
              Receive natural language mandates, autonomously formulate structured cross-module execution plans, and synthesize periodic executive intelligence reports.
            </p>
          </div>

          {/* Engine Status Badge */}
          <div className="flex items-center gap-3">
            <div className="px-3 py-2 border border-white/20 bg-black flex items-center gap-2 text-xs">
              <span className="w-2 h-2 bg-emerald-400 animate-pulse" />
              <span className="font-bold text-white">{agentConfig.name}</span>
              <span className="meta-number text-[#A1A1AA]">/{agentConfig.callsign}</span>
            </div>
            <div className="px-3 py-2 border border-white/20 bg-black text-xs font-mono text-white/70">
              ENGINE: <span className="text-white font-bold">{agentConfig.activeModel}</span>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Navigation Strip */}
        <div className="flex items-center gap-2 mt-8 pt-4 border-t border-white/10 text-xs font-mono">
          <button
            onClick={() => setActiveSubTab('executor')}
            className={`px-4 py-2 uppercase transition-colors ${
              activeSubTab === 'executor' ? 'bg-white text-black font-bold' : 'text-white/60 hover:text-white'
            }`}
          >
            Mandate Intake & Plan
          </button>
          <button
            onClick={() => setActiveSubTab('reports')}
            className={`px-4 py-2 uppercase transition-colors border-l border-white/20 ${
              activeSubTab === 'reports' ? 'bg-white text-black font-bold' : 'text-white/60 hover:text-white'
            }`}
          >
            Periodic Reports ({agentReports.length})
          </button>
          <button
            onClick={() => setActiveSubTab('logs')}
            className={`px-4 py-2 uppercase transition-colors border-l border-white/20 ${
              activeSubTab === 'logs' ? 'bg-white text-black font-bold' : 'text-white/60 hover:text-white'
            }`}
          >
            Trust & Audit Log ({agentLogs.length})
          </button>
          <button
            onClick={() => setActiveSubTab('config')}
            className={`px-4 py-2 uppercase transition-colors border-l border-white/20 ${
              activeSubTab === 'config' ? 'bg-white text-black font-bold' : 'text-white/60 hover:text-white'
            }`}
          >
            Policy & Clearance
          </button>
        </div>
      </section>

      {/* =========================================================================
          SUB-TAB 1: MANDATE INTAKE & ACTION PLANNER
          ========================================================================= */}
      {activeSubTab === 'executor' && (
        <div className="space-y-8">
          {/* Intake Prompt Box */}
          <div className="border border-white/20 bg-black p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-white tracking-wider flex items-center gap-2">
                <Sparkles size={14} className="text-[#A1A1AA]" />
                <span>Command Mandate Intake</span>
              </span>
              <span className="text-[11px] text-white/40 font-mono">Natural Language or Voice Dictation</span>
            </div>

            <form onSubmit={handleIntakeSubmit} className="space-y-3">
              <div className="relative">
                <textarea
                  rows={3}
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="State your operational objective (e.g. 'Audit all pending seed investor leads and auto-generate follow-up tasks for this week')..."
                  className="w-full bg-black border border-white/30 text-white text-sm p-4 pr-24 focus:outline-none focus:border-[#A1A1AA] transition-colors leading-relaxed"
                />

                <div className="absolute right-3 bottom-3.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleSpeechRecognition}
                    className={`p-2 border transition-all ${
                      isListening
                        ? 'border-red-500 bg-red-950/60 text-red-400 animate-pulse'
                        : 'border-white/30 text-white/70 hover:text-white hover:border-white'
                    }`}
                    title={isListening ? 'Stop listening' : 'Speak task via microphone'}
                  >
                    {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                  </button>

                  <button
                    type="submit"
                    disabled={isPlanning || !promptInput.trim()}
                    className="px-4 py-2 bg-[#A1A1AA] hover:bg-[#D4D4D8] text-black font-bold text-xs uppercase transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isPlanning ? (
                      <>
                        <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent" />
                        <span>Formulating...</span>
                      </>
                    ) : (
                      <>
                        <span>Plan</span>
                        <Send size={12} />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Quick Template Prompts */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] text-white/40 uppercase font-mono block">
                  Quick Executive Directives:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {quickPrompts.map((qp, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectQuickPrompt(qp)}
                      className="px-2.5 py-1 border border-white/15 hover:border-white/40 bg-white/5 text-[11px] text-white/70 hover:text-white text-left truncate max-w-sm transition-colors"
                    >
                      {qp}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </div>

          {/* Active Mandate Plan Display */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Action Plan Details */}
            <div className="lg:col-span-8 border border-white/20 bg-black p-6 space-y-6">
              {selectedTask ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/20">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-mono text-white/50 mb-1">
                        <span>MANDATE ID: {selectedTask.id}</span>
                        <span>·</span>
                        <span>{selectedTask.createdAt}</span>
                      </div>
                      <h3 className="text-base font-bold text-white leading-snug">
                        "{selectedTask.prompt}"
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {selectedTask.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 border border-emerald-500/40 text-emerald-400 text-xs font-bold uppercase">
                          <CheckCircle2 size={13} /> Executed
                        </span>
                      ) : (
                        <button
                          onClick={() => handleApprovePlan(selectedTask.id)}
                          disabled={isExecuting}
                          className="px-5 py-2.5 bg-white text-black hover:bg-[#E4E4E7] font-bold text-xs uppercase flex items-center gap-2 transition-all"
                        >
                          {isExecuting ? (
                            <>
                              <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent" />
                              <span>Executing Sub-Steps...</span>
                            </>
                          ) : (
                            <>
                              <Play size={13} fill="currentColor" />
                              <span>Authorize & Execute Plan</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Plan Summary */}
                  {selectedTask.resultSummary && (
                    <div className="p-3.5 border border-white/10 bg-white/5 text-xs text-white/80 leading-relaxed font-mono">
                      <span className="text-[#A1A1AA] font-bold block mb-1">SYNTHESIS RATIONALE:</span>
                      {selectedTask.resultSummary}
                    </div>
                  )}

                  {/* Step-by-Step Breakdown */}
                  <div className="space-y-3">
                    <span className="text-xs uppercase font-bold text-white tracking-wider block">
                      Proposed Cross-Module Sub-Steps ({selectedTask.plan.length})
                    </span>

                    <div className="space-y-3">
                      {selectedTask.plan.map(step => (
                        <div
                          key={step.id}
                          className={`p-4 border transition-all ${
                            step.status === 'executed'
                              ? 'border-emerald-500/40 bg-emerald-950/20'
                              : 'border-white/20 bg-black'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 border border-white/30 flex items-center justify-center text-xs font-bold meta-number shrink-0 mt-0.5">
                                {step.stepNumber}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-xs font-bold text-white">
                                    {step.title}
                                  </h4>
                                  <span className="flex items-center gap-1 px-1.5 py-0.2 border border-white/30 text-[10px] uppercase font-mono text-white/70">
                                    {getModuleIcon(step.targetModule)}
                                    <span>{step.targetModule}</span>
                                  </span>
                                  {step.requiresHumanApproval && (
                                    <span className="text-[9px] px-1 py-0.2 border border-yellow-500/40 text-yellow-400 uppercase font-mono">
                                      Sign-off Required
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-white/60 mt-1 leading-snug">
                                  {step.reasoning}
                                </p>
                              </div>
                            </div>

                            <span className="text-[10px] uppercase font-mono font-bold shrink-0">
                              {step.status === 'executed' ? (
                                <span className="text-emerald-400 flex items-center gap-1">
                                  <CheckCircle2 size={12} /> Done
                                </span>
                              ) : (
                                <span className="text-white/40">Pending</span>
                              )}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-20 text-center text-white/40 font-mono text-xs">
                  No mandate plan active. Enter a directive above to generate an execution plan.
                </div>
              )}
            </div>

            {/* Right: Past Mandates Queue */}
            <div className="lg:col-span-4 border border-white/20 bg-black p-5 space-y-4">
              <span className="text-xs uppercase font-bold text-white tracking-wider block">
                Mandate Queue ({agentTasks.length})
              </span>

              <div className="space-y-2.5 max-h-[500px] overflow-y-auto">
                {agentTasks.length === 0 ? (
                  <p className="text-xs text-white/40 font-mono italic">No past tasks recorded.</p>
                ) : (
                  agentTasks.map(t => (
                    <div
                      key={t.id}
                      onClick={() => {
                        sound.click();
                        setSelectedTask(t);
                      }}
                      className={`p-3 border cursor-pointer transition-all space-y-1.5 ${
                        selectedTask?.id === t.id
                          ? 'border-white bg-white/10'
                          : 'border-white/20 bg-black hover:border-white/50'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-white/50 font-mono">
                        <span>{t.createdAt.split(' ')[0]}</span>
                        <span className={`uppercase font-bold ${
                          t.status === 'completed' ? 'text-emerald-400' : 'text-yellow-400'
                        }`}>
                          {t.status}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-white truncate">
                        {t.prompt}
                      </p>
                      <span className="text-[10px] text-white/40 block font-mono">
                        {t.plan.length} action steps planned
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 2: PERIODIC INTELLIGENCE REPORTS
          ========================================================================= */}
      {activeSubTab === 'reports' && (
        <div className="space-y-8">
          {/* Report Generation Trigger Bar */}
          <div className="border border-white/20 bg-black p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                Synthesize New Periodic Report
              </h3>
              <p className="text-xs text-white/60 mt-0.5">
                Evaluates tasks, operational burn, investor stage velocity, and team sentiment.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => handleTriggerReport('daily')}
                disabled={isGeneratingReport}
                className="px-3.5 py-2 border border-white/30 hover:border-white text-white text-xs uppercase font-semibold transition-colors disabled:opacity-50"
              >
                + Daily Brief
              </button>
              <button
                onClick={() => handleTriggerReport('weekly')}
                disabled={isGeneratingReport}
                className="px-4 py-2 bg-[#A1A1AA] hover:bg-[#D4D4D8] text-black text-xs uppercase font-bold transition-colors disabled:opacity-50"
              >
                + Weekly Executive
              </button>
              <button
                onClick={() => handleTriggerReport('monthly')}
                disabled={isGeneratingReport}
                className="px-3.5 py-2 border border-white/30 hover:border-white text-white text-xs uppercase font-semibold transition-colors disabled:opacity-50"
              >
                + Monthly Review
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Report Viewer */}
            <div className="lg:col-span-8 border border-white/20 bg-black p-6 space-y-6">
              {selectedReport ? (
                <>
                  <div className="flex items-center justify-between pb-4 border-b border-white/20">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-mono text-white/50 mb-1">
                        <span className="uppercase font-bold text-white px-1.5 py-0.2 border border-white/30">
                          {selectedReport.type}
                        </span>
                        <span>·</span>
                        <span>{selectedReport.generatedAt}</span>
                      </div>
                      <h2 className="text-xl font-bold text-white">
                        {selectedReport.title}
                      </h2>
                    </div>

                    <button
                      onClick={() => downloadReportMarkdown(selectedReport)}
                      className="px-3 py-1.5 border border-[#A1A1AA] hover:bg-[#A1A1AA] hover:text-black text-white text-xs uppercase flex items-center gap-1.5 transition-colors"
                    >
                      <Download size={13} />
                      <span>Download MD</span>
                    </button>
                  </div>

                  {/* Highlight Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 border border-white/10 bg-white/5 text-center">
                      <span className="text-[10px] text-white/50 uppercase block">Tasks Closed</span>
                      <span className="text-lg font-bold text-white meta-number">
                        {selectedReport.metrics.tasksCompleted}
                      </span>
                    </div>
                    <div className="p-3 border border-white/10 bg-white/5 text-center">
                      <span className="text-[10px] text-white/50 uppercase block">Total Spend</span>
                      <span className="text-lg font-bold text-white meta-number">
                        ₹{selectedReport.metrics.totalSpend.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="p-3 border border-white/10 bg-white/5 text-center">
                      <span className="text-[10px] text-white/50 uppercase block">Investor Leads</span>
                      <span className="text-lg font-bold text-white meta-number">
                        {selectedReport.metrics.activeLeads}
                      </span>
                    </div>
                    <div className="p-3 border border-white/10 bg-white/5 text-center">
                      <span className="text-[10px] text-white/50 uppercase block">Sentiment</span>
                      <span className="text-xs font-bold text-emerald-400 truncate block mt-1">
                        {selectedReport.metrics.sentimentScore}
                      </span>
                    </div>
                  </div>

                  {/* Report Markdown Content */}
                  <div className="p-6 border border-white/15 bg-white/[0.02] text-xs text-white/80 leading-relaxed font-mono whitespace-pre-wrap">
                    {selectedReport.content}
                  </div>
                </>
              ) : (
                <div className="py-20 text-center text-white/40 font-mono text-xs">
                  No report selected. Generate a report above to view executive intelligence.
                </div>
              )}
            </div>

            {/* Past Reports List */}
            <div className="lg:col-span-4 border border-white/20 bg-black p-5 space-y-4">
              <span className="text-xs uppercase font-bold text-white tracking-wider block">
                Report Archive ({agentReports.length})
              </span>

              <div className="space-y-2.5 max-h-[500px] overflow-y-auto">
                {agentReports.map(rep => (
                  <div
                    key={rep.id}
                    onClick={() => {
                      sound.click();
                      setSelectedReport(rep);
                    }}
                    className={`p-3 border cursor-pointer transition-all space-y-1 ${
                      selectedReport?.id === rep.id
                        ? 'border-white bg-white/10'
                        : 'border-white/20 bg-black hover:border-white/50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-white/50 font-mono">
                      <span className="uppercase text-white font-bold">{rep.type}</span>
                      <span className="meta-number">{rep.period}</span>
                    </div>
                    <h4 className="text-xs font-bold text-white truncate">
                      {rep.title}
                    </h4>
                    <p className="text-[11px] text-white/60 line-clamp-2">
                      {rep.summary}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 3: TRUST & TRANSPARENT AUDIT LOG
          ========================================================================= */}
      {activeSubTab === 'logs' && (
        <div className="border border-white/20 bg-black p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/20">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                Transparent Execution Ledger & Audit Trail
              </h3>
              <p className="text-xs text-white/50 mt-0.5">
                Every autonomous action taken by {agentConfig.name} is logged with timestamp, reasoning, and rollback capability.
              </p>
            </div>
            <span className="meta-number text-xs text-[#A1A1AA]">{agentLogs.length} ENTRIES RECORDED</span>
          </div>

          <div className="divide-y divide-white/10">
            {agentLogs.length === 0 ? (
              <p className="py-8 text-center text-xs text-white/40 font-mono">Audit trail is currently clear.</p>
            ) : (
              agentLogs.map(log => (
                <div key={log.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-mono">
                      <span className="text-white/40 meta-number">{log.timestamp}</span>
                      <span>·</span>
                      <span className="px-1.5 py-0.2 border border-white/20 text-white font-bold uppercase">
                        {log.actionType}
                      </span>
                      <span>·</span>
                      <span className="text-[#A1A1AA]">{log.targetEntity}</span>
                    </div>
                    <p className="text-white/80 font-mono leading-snug">
                      {log.reasoning}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 border ${
                      log.status === 'success'
                        ? 'border-emerald-500/40 text-emerald-400'
                        : log.status === 'rolled_back'
                        ? 'border-white/30 text-white/50 line-through'
                        : 'border-yellow-500/40 text-yellow-400'
                    }`}>
                      {log.status}
                    </span>

                    {log.rollbackAvailable && log.status !== 'rolled_back' && (
                      <button
                        onClick={() => rollbackAgentAction(log.id)}
                        className="px-2 py-1 border border-white/30 hover:border-red-400 hover:text-red-400 text-white/70 text-[10px] uppercase transition-colors flex items-center gap-1"
                        title="Rollback action"
                      >
                        <RotateCcw size={10} />
                        <span>Rollback</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 4: CONFIGURATION & PERMISSION TIERS
          ========================================================================= */}
      {activeSubTab === 'config' && (
        <div className="border border-white/20 bg-black p-6 space-y-6 max-w-2xl">
          <div className="pb-3 border-b border-white/20">
            <h3 className="text-sm font-bold text-white uppercase tracking-tight">
              Agent Policy & Permission Tiers
            </h3>
            <p className="text-xs text-white/50 mt-0.5">
              Control the boundary of autonomous execution vs mandatory human verification.
            </p>
          </div>

          <div className="space-y-4 text-xs font-mono">
            <div className="p-4 border border-white/10 bg-white/5 flex items-center justify-between">
              <div>
                <span className="text-white font-bold block">Autonomous Mode</span>
                <span className="text-white/50 text-[11px] block mt-0.5">
                  Allow agent to independently create tasks, calendar events, and documentation notes.
                </span>
              </div>
              <button
                onClick={() => updateAgentConfig({ autonomousMode: !agentConfig.autonomousMode })}
                className={`px-3 py-1.5 border text-xs uppercase font-bold ${
                  agentConfig.autonomousMode ? 'bg-white text-black' : 'border-white/30 text-white/50'
                }`}
              >
                {agentConfig.autonomousMode ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div className="p-4 border border-white/10 bg-white/5 flex items-center justify-between">
              <div>
                <span className="text-white font-bold block">Human Sign-Off on Sensitive Writes</span>
                <span className="text-white/50 text-[11px] block mt-0.5">
                  Require 1-click confirmation before modifying deal terms, deleting data, or rejecting expenses.
                </span>
              </div>
              <button
                onClick={() => updateAgentConfig({ requireApprovalForSensitive: !agentConfig.requireApprovalForSensitive })}
                className={`px-3 py-1.5 border text-xs uppercase font-bold ${
                  agentConfig.requireApprovalForSensitive ? 'bg-white text-black' : 'border-white/30 text-white/50'
                }`}
              >
                {agentConfig.requireApprovalForSensitive ? 'Enforced' : 'Off'}
              </button>
            </div>

            <div className="p-4 border border-white/10 bg-white/5 flex items-center justify-between">
              <div>
                <span className="text-white font-bold block">Active Model Engine</span>
                <span className="text-white/50 text-[11px] block mt-0.5">
                  Verified Google Generative Language API endpoint.
                </span>
              </div>
              <span className="px-2 py-1 border border-[#A1A1AA] text-[#A1A1AA] font-bold">
                {agentConfig.activeModel}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
