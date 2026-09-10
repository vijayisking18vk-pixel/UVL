import React, { useState, useRef, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  AgentReport,
  AgentActivityLog,
  AgentChatMessage
} from '../../types';
import { sound } from '../../utils/sound';
import { PatchAvatar } from '../common/PatchAvatar';
import {
  Bot,
  Sparkles,
  Mic,
  MicOff,
  RotateCcw,
  Download,
  Calendar,
  CheckSquare,
  FileText,
  MessageSquare,
  IndianRupee,
  Briefcase,
  Layers,
  Settings,
  Clock,
  Copy,
  Check,
  Trash2,
  ArrowUp,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

// Lightweight Editorial Markdown Formatter
const formatInline = (text: string): React.ReactNode => {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white font-bold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="px-1.5 py-0.5 bg-white/10 text-white font-mono text-xs border border-white/20">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
};

const MarkdownMessage: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');

  return (
    <div className="space-y-2 text-sm leading-relaxed text-white/90">
      {lines.map((line, idx) => {
        if (line.startsWith('### ')) {
          return (
            <h4 key={idx} className="font-bold text-white text-base mt-4 mb-1 uppercase tracking-tight">
              {formatInline(line.slice(4))}
            </h4>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h3 key={idx} className="font-bold text-white text-lg mt-4 mb-2 tracking-tight">
              {formatInline(line.slice(3))}
            </h3>
          );
        }
        if (line.startsWith('# ')) {
          return (
            <h2 key={idx} className="font-bold text-white text-xl mt-5 mb-2 tracking-tight">
              {formatInline(line.slice(2))}
            </h2>
          );
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-1.5">
              <span className="text-[#A1A1AA] mt-1.5 text-xs">▪</span>
              <span className="flex-1">{formatInline(line.slice(2))}</span>
            </div>
          );
        }
        if (/^\d+\.\s/.test(line)) {
          const match = line.match(/^(\d+)\.\s(.*)/);
          return (
            <div key={idx} className="flex items-start gap-2 pl-1.5">
              <span className="text-[#A1A1AA] font-mono text-xs mt-0.5">{match ? match[1] : '1'}.</span>
              <span className="flex-1">{formatInline(match ? match[2] : line)}</span>
            </div>
          );
        }
        if (line.trim() === '') {
          return <div key={idx} className="h-1.5" />;
        }
        return <p key={idx}>{formatInline(line)}</p>;
      })}
    </div>
  );
};

export const AgentView: React.FC = () => {
  const {
    agentLogs,
    agentReports,
    agentConfig,
    agentChatMessages,
    sendAgentChatMessage,
    clearAgentChat,
    generateAgentReport,
    rollbackAgentAction,
    updateAgentConfig,
    currentUser,
    setActiveTab
  } = useWorkspace();

  // Chat State
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'reports' | 'logs' | 'config'>('chat');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Reports State
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [selectedReport, setSelectedReport] = useState<AgentReport | null>(agentReports[0] || null);

  // Voice Dictation
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeSubTab === 'chat') {
      scrollToBottom();
    }
  }, [agentChatMessages, activeSubTab]);

  // Quick Action / Prompt Suggestions (Direct Execution into Workspace)
  const quickPrompts = [
    {
      title: 'Record Company Earning',
      prompt: 'Record company earning of ₹2,50,000 from Client Retainer for Autonomous Drone Navigation Pilot.'
    },
    {
      title: 'Record Operational Expense',
      prompt: 'Record an expense of ₹38,500 for Cloud GPU Compute Clusters under Software category.'
    },
    {
      title: 'Create Urgent Task',
      prompt: 'Create a high-priority task for Vijayrajkumar titled "Audit Operator Security PINs & Biometric Enclaves" due tomorrow.'
    },
    {
      title: 'Schedule Investor Sync',
      prompt: 'Schedule an investor pitch sync with Peak XV Partners for tomorrow at 4:00 PM.'
    },
    {
      title: 'Draft Strategic Memo',
      prompt: 'Draft an executive team briefing note in our wiki regarding our Supabase multimedia architecture.'
    },
    {
      title: 'Workspace Health & Runway',
      prompt: 'Analyze our net cash position, company earnings vs burn in ₹ INR, and team velocity.'
    }
  ];

  // Speech Recognition (Voice Intake)
  const toggleSpeechRecognition = () => {
    sound.click();
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice dictation is not supported by your current browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  // Send Message (Direct Unfoundy Style, Zero Approval Required)
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isSending) return;

    setInputText('');
    setIsSending(true);

    try {
      await sendAgentChatMessage(text);
    } catch (err) {
      console.error('Failed to send message to Unfoundy:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Key Down Handler (Enter to send, Shift+Enter for newline)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Copy Message Text
  const handleCopyMessage = (id: string, text: string) => {
    sound.click();
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Trigger Periodic Report
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
    <div className="space-y-8 pb-16">
      {/* Top Editorial Header */}
      <section className="border-b border-white/20 pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="text-[11px] font-mono tracking-widest uppercase text-white/50 mb-3 flex items-center gap-2">
              <span>autonomous intelligence</span>
              <span>/</span>
              <span className="text-emerald-400">unfoundy core</span>
              <span>/</span>
              <span>direct execution engine</span>
            </div>
            <h1 className="headline-section text-white font-bold tracking-tight">
              Unfoundy AI engine.
            </h1>
            <p className="text-white/60 text-sm mt-2 max-w-2xl">
              Autonomous execution engine for Unfounded Venture Lab. Directives across tasks, calendar, treasury, and notes are executed immediately with zero approval required.
            </p>
          </div>

          {/* Engine Status & Badges */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="px-3 py-2 border border-white/20 bg-black flex items-center gap-2 text-xs">
              <span className="w-2 h-2 bg-emerald-400 animate-pulse" />
              <span className="font-bold text-white">Unfoundy</span>
              <span className="meta-number text-[#A1A1AA]">/UNFOUNDY-AI</span>
            </div>
            <div className="px-3 py-2 border border-emerald-500/40 bg-emerald-950/20 text-xs font-mono text-emerald-400 font-bold uppercase">
              Direct Execution Mode
            </div>
            <div className="px-3 py-2 border border-white/20 bg-black text-xs font-mono text-white/70">
              gemini-2.5-flash
            </div>
          </div>
        </div>

        {/* Sub-Tab Navigation Bar */}
        <div className="flex items-center gap-0 border-b border-white/20 mt-8 text-xs font-bold tracking-wider">
          <button
            onClick={() => { sound.click(); setActiveSubTab('chat'); }}
            className={`px-4 py-2.5 uppercase transition-colors flex items-center gap-2 ${
              activeSubTab === 'chat'
                ? 'bg-white text-black font-bold'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Bot size={14} />
            <span>Unfoundy Chat</span>
          </button>

          <button
            onClick={() => { sound.click(); setActiveSubTab('reports'); }}
            className={`px-4 py-2.5 uppercase transition-colors border-l border-white/20 flex items-center gap-2 ${
              activeSubTab === 'reports'
                ? 'bg-white text-black font-bold'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText size={14} />
            <span>Executive Reports ({agentReports.length})</span>
          </button>

          <button
            onClick={() => { sound.click(); setActiveSubTab('logs'); }}
            className={`px-4 py-2.5 uppercase transition-colors border-l border-white/20 flex items-center gap-2 ${
              activeSubTab === 'logs'
                ? 'bg-white text-black font-bold'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Clock size={14} />
            <span>Audit Ledger ({agentLogs.length})</span>
          </button>

          <button
            onClick={() => { sound.click(); setActiveSubTab('config'); }}
            className={`px-4 py-2.5 uppercase transition-colors border-l border-white/20 flex items-center gap-2 ${
              activeSubTab === 'config'
                ? 'bg-white text-black font-bold'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings size={14} />
            <span>Configuration</span>
          </button>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 1. CHAT TAB: DIRECT UNFOUNDY CONVERSATIONAL UI           */}
      {/* ======================================================== */}
      {activeSubTab === 'chat' && (
        <section className="space-y-6">
          {/* Conversation Stream Container */}
          <div className="border border-white/20 bg-black min-h-[500px] max-h-[640px] flex flex-col justify-between overflow-hidden">
            {/* Scrollable Messages Area */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* If only welcome message, show prompt starter cards */}
              {agentChatMessages.length <= 1 && (
                <div className="mb-8 p-6 border border-white/10 bg-white/[0.02] space-y-4">
                  <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#A1A1AA] tracking-wider">
                    <Sparkles size={14} />
                    <span>Direct Action Prompts • Click to Execute Immediately</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {quickPrompts.map((qp, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          sound.click();
                          handleSendMessage(qp.prompt);
                        }}
                        className="p-3 border border-white/20 bg-black hover:border-white hover:bg-white/5 transition-all text-left space-y-1.5 group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white group-hover:text-[#A1A1AA] transition-colors">
                            {qp.title}
                          </span>
                          <ChevronRight size={12} className="text-white/40 group-hover:text-white transition-colors" />
                        </div>
                        <p className="text-[11px] text-white/50 line-clamp-2">
                          {qp.prompt}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message History List */}
              {agentChatMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex gap-3.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Unfoundy AI Avatar */}
                  {msg.sender === 'assistant' && (
                    <div className="w-8 h-8 rounded-none bg-white text-black flex items-center justify-center font-bold shrink-0 border border-white shadow-sm mt-0.5">
                      <Bot size={16} />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`max-w-2xl lg:max-w-3xl border p-4 space-y-3 transition-all ${
                      msg.sender === 'user'
                        ? 'border-white/30 bg-white/10 text-white'
                        : 'border-white/20 bg-black text-white'
                    }`}
                  >
                    {/* Header: Name + Timestamp */}
                    <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-2 text-[10px] font-mono">
                      <span className="text-white/60 font-bold uppercase tracking-wider">
                        {msg.sender === 'user' ? currentUser.name : 'Unfoundy / UNFOUNDY-AI'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-white/40">{msg.timestamp}</span>
                        {msg.sender === 'assistant' && (
                          <button
                            onClick={() => handleCopyMessage(msg.id, msg.text)}
                            className="text-white/40 hover:text-white transition-colors p-0.5"
                            title="Copy response"
                          >
                            {copiedMessageId === msg.id ? (
                              <Check size={12} className="text-emerald-400" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Text Body: Formatted with Markdown */}
                    <div className="break-words">
                      {msg.sender === 'assistant' ? (
                        <MarkdownMessage content={msg.text} />
                      ) : (
                        <p className="text-sm text-white/90 whitespace-pre-wrap">{msg.text}</p>
                      )}
                    </div>

                    {/* Executed Action Pills (Direct Execution Confirmations) */}
                    {msg.executedActions && msg.executedActions.length > 0 && (
                      <div className="pt-2 border-t border-white/10 space-y-1.5">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 block font-bold">
                          ⚡ Autonomously Executed ({msg.executedActions.length}):
                        </span>
                        <div className="space-y-1">
                          {msg.executedActions.map((action, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between p-2 border border-emerald-500/30 bg-emerald-950/20 text-xs"
                            >
                              <div className="flex items-center gap-2">
                                {getModuleIcon(action.module)}
                                <span className="text-white/90 font-mono text-[11px]">
                                  {action.summary}
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  sound.click();
                                  setActiveTab(action.module);
                                }}
                                className="text-[10px] uppercase underline text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1"
                              >
                                <span>Open {action.module}</span>
                                <ExternalLink size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* User Avatar */}
                  {msg.sender === 'user' && (
                    <div className="shrink-0 mt-0.5">
                      <PatchAvatar user={currentUser} size="sm" />
                    </div>
                  )}
                </div>
              ))}

              {/* Streaming / Thinking Indicator */}
              {isSending && (
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-none bg-white text-black flex items-center justify-center font-bold shrink-0 border border-white">
                    <Bot size={16} />
                  </div>
                  <div className="p-4 border border-white/20 bg-black text-white text-xs font-mono flex items-center gap-3">
                    <span className="w-2 h-2 bg-white animate-ping" />
                    <span>Unfoundy is processing & executing actions autonomously...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Sticky Prompt Input Bar (Unfoundy Execution Interface) */}
            <div className="p-4 border-t border-white/20 bg-black space-y-2.5">
              <div className="relative flex items-end gap-2 bg-black border border-white/30 focus-within:border-white transition-colors p-2">
                <textarea
                  ref={textareaRef}
                  rows={2}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message Unfoundy... (e.g. 'Create task for motor telemetry' or 'Record earning of ₹2,50,000')"
                  className="w-full bg-transparent text-white text-sm focus:outline-none resize-none placeholder-white/40 leading-relaxed max-h-36 font-sans px-1"
                />

                {/* Voice Dictation Button */}
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`p-2 border transition-colors shrink-0 ${
                    isListening
                      ? 'border-red-500 bg-red-500/20 text-red-400 animate-pulse'
                      : 'border-white/20 text-white/60 hover:text-white hover:border-white/50'
                  }`}
                  title={isListening ? 'Listening... click to stop' : 'Dictate with voice'}
                >
                  {isListening ? <MicOff size={15} /> : <Mic size={15} />}
                </button>

                {/* Send Button */}
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim() || isSending}
                  className={`p-2 font-bold shrink-0 transition-all ${
                    inputText.trim() && !isSending
                      ? 'bg-white text-black hover:bg-[#A1A1AA]'
                      : 'bg-white/10 text-white/30 cursor-not-allowed'
                  }`}
                  title="Send message (Enter)"
                >
                  <ArrowUp size={16} />
                </button>
              </div>

              {/* Bottom Metadata & Controls */}
              <div className="flex items-center justify-between text-[10px] font-mono text-white/40 px-1">
                <div className="flex items-center gap-3">
                  <span>Direct Unfoundy Execution Mode</span>
                  <span>•</span>
                  <span>Zero Admin Approval Required</span>
                  <span>•</span>
                  <span className="text-[#A1A1AA]">Shift+Enter for new line</span>
                </div>

                <button
                  onClick={clearAgentChat}
                  className="hover:text-white transition-colors flex items-center gap-1 uppercase"
                  title="Reset conversation"
                >
                  <Trash2 size={11} />
                  <span>Clear Chat</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* 2. REPORTS TAB: PERIODIC EXECUTIVE INTELLIGENCE           */}
      {/* ======================================================== */}
      {activeSubTab === 'reports' && (
        <section className="space-y-6">
          {/* Action Trigger Banner */}
          <div className="p-5 border border-white/20 bg-black flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                Executive Synthesis Engine
              </h3>
              <p className="text-white/60 text-xs mt-0.5">
                Compile autonomous intelligence syntheses across engineering tasks, financial burn in ₹ INR, and institutional investor pipelines.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleTriggerReport('daily')}
                disabled={isGeneratingReport}
                className="px-3 py-2 border border-white/30 hover:border-white text-white font-bold text-xs uppercase transition-colors"
              >
                + Daily Brief
              </button>
              <button
                onClick={() => handleTriggerReport('weekly')}
                disabled={isGeneratingReport}
                className="px-3 py-2 border border-white/30 hover:border-white text-white font-bold text-xs uppercase transition-colors"
              >
                + Weekly Synthesis
              </button>
              <button
                onClick={() => handleTriggerReport('monthly')}
                disabled={isGeneratingReport}
                className="px-3 py-2 bg-white text-black hover:bg-[#A1A1AA] font-bold text-xs uppercase transition-colors"
              >
                + Monthly Review
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Report Viewer */}
            <div className="lg:col-span-8 border border-white/20 bg-black p-6 space-y-6">
              {selectedReport ? (
                <>
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/20">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 border border-white/30 text-[#A1A1AA]">
                          {selectedReport.type}
                        </span>
                        <span className="text-xs text-white/50 font-mono">
                          Period: {selectedReport.period}
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-white">
                        {selectedReport.title}
                      </h2>
                    </div>

                    <button
                      onClick={() => downloadReportMarkdown(selectedReport)}
                      className="px-3 py-1.5 border border-white/30 hover:border-white text-white text-xs uppercase font-mono flex items-center gap-1.5 transition-colors shrink-0"
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
                        : 'border-white/10 bg-black hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="uppercase text-white font-bold">{rep.type}</span>
                      <span className="text-white/40">{rep.period}</span>
                    </div>
                    <h4 className="font-bold text-xs text-white line-clamp-1">{rep.title}</h4>
                    <p className="text-[11px] text-white/50 line-clamp-2">{rep.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* 3. LOGS TAB: AUDIT LEDGER & ROLLBACK                     */}
      {/* ======================================================== */}
      {activeSubTab === 'logs' && (
        <section className="space-y-6">
          <div className="border border-white/20 bg-black p-6 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                  Autonomous Activity Ledger
                </h3>
                <p className="text-white/60 text-xs mt-0.5">
                  Transparent, tamper-evident log of all direct actions, tasks, and calendar events executed by Unfoundy.
                </p>
              </div>
              <span className="meta-number text-xs text-[#A1A1AA]">
                {agentLogs.length} verified log entries
              </span>
            </div>

            <div className="space-y-3">
              {agentLogs.map(log => (
                <div
                  key={log.id}
                  className="p-4 border border-white/10 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-mono"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-white/40 text-[11px]">{log.timestamp}</span>
                      <span className="text-white font-bold uppercase">{log.actionType}</span>
                      <span className="text-[10px] px-1.5 py-0.2 border border-white/20 text-[#A1A1AA]">
                        {log.targetEntity}
                      </span>
                    </div>
                    <p className="text-white/80 font-sans text-xs">{log.reasoning}</p>
                  </div>

                  {log.rollbackAvailable && log.status !== 'rolled_back' && (
                    <button
                      onClick={() => rollbackAgentAction(log.id)}
                      className="px-2.5 py-1 border border-white/30 hover:border-white text-white text-[10px] uppercase font-bold flex items-center gap-1 transition-colors shrink-0"
                    >
                      <RotateCcw size={11} />
                      <span>Rollback</span>
                    </button>
                  )}

                  {log.status === 'rolled_back' && (
                    <span className="text-[10px] uppercase text-red-400 font-bold px-2 py-0.5 border border-red-500/30 shrink-0">
                      Rolled Back
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* 4. CONFIGURATION TAB: AI MODEL & SETTINGS                */}
      {/* ======================================================== */}
      {activeSubTab === 'config' && (
        <section className="space-y-6 max-w-3xl">
          <div className="border border-white/20 bg-black p-6 space-y-6">
            <div className="pb-4 border-b border-white/10">
              <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                Unfoundy AI Configuration
              </h3>
              <p className="text-white/60 text-xs mt-0.5">
                Configure generative model, autonomy authority, and announcements enclaves.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="micro-label text-white/70 block mb-1.5">
                  Active Generative Model
                </label>
                <select
                  value={agentConfig.activeModel}
                  onChange={(e) => updateAgentConfig({ activeModel: e.target.value })}
                  className="w-full bg-black border border-white/30 text-white p-2.5 focus:outline-none focus:border-white font-mono"
                >
                  <option value="gemini-2.5-flash">gemini-2.5-flash (Fast, Low Latency, Recommended)</option>
                  <option value="gemini-2.5-pro">gemini-2.5-pro (High Reasoning, Deep Analysis)</option>
                </select>
              </div>

              <div>
                <label className="micro-label text-white/70 block mb-1.5">
                  Agent Call Name & Callsign
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={agentConfig.name}
                    onChange={(e) => updateAgentConfig({ name: e.target.value })}
                    className="w-full bg-black border border-white/30 text-white p-2 font-mono"
                  />
                  <input
                    type="text"
                    value={agentConfig.callsign}
                    onChange={(e) => updateAgentConfig({ callsign: e.target.value })}
                    className="w-full bg-black border border-white/30 text-white p-2 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between p-3 border border-white/10 bg-white/5">
                  <div>
                    <span className="font-bold text-white block">Direct Autonomous Execution</span>
                    <span className="text-white/50 text-[11px]">
                      Execute workspace tasks, notes, calendar events directly without admin approval gates.
                    </span>
                  </div>
                  <span className="px-2 py-0.5 border border-emerald-500/40 text-emerald-400 font-mono text-[10px] uppercase font-bold">
                    Enabled
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 border border-white/10 bg-white/5">
                  <div>
                    <span className="font-bold text-white block">Announcements Channel</span>
                    <span className="text-white/50 text-[11px]">
                      Public room for automated action notifications and periodic reports.
                    </span>
                  </div>
                  <span className="text-white font-mono text-[11px]">#agent-reports</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
