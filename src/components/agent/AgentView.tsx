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
const formatInline = (text: string, isUser?: boolean): React.ReactNode => {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className={`font-semibold ${isUser ? 'text-white font-bold' : 'text-black font-semibold'}`}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className={`px-1.5 py-0.5 font-mono text-xs rounded ${
            isUser ? 'bg-white/20 text-white border border-white/30' : 'bg-black/5 text-black border border-[#E5E5E7]'
          }`}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
};

const MarkdownMessage: React.FC<{ content: string; isUser?: boolean }> = ({ content, isUser }) => {
  const lines = content.split('\n');

  return (
    <div className={`space-y-2 text-sm leading-relaxed ${isUser ? 'text-white/95' : 'text-[#000000]'}`}>
      {lines.map((line, idx) => {
        if (line.startsWith('### ')) {
          return (
            <h4 key={idx} className={`font-semibold text-sm mt-3 mb-1 tracking-tight ${isUser ? 'text-white' : 'text-black'}`}>
              {formatInline(line.slice(4), isUser)}
            </h4>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h3 key={idx} className={`font-serif text-base mt-3.5 mb-1.5 tracking-tight ${isUser ? 'text-white' : 'text-black'}`}>
              {formatInline(line.slice(3), isUser)}
            </h3>
          );
        }
        if (line.startsWith('# ')) {
          return (
            <h2 key={idx} className={`font-serif text-lg mt-4 mb-2 tracking-tight ${isUser ? 'text-white' : 'text-black'}`}>
              {formatInline(line.slice(2), isUser)}
            </h2>
          );
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-1.5">
              <span className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${isUser ? 'bg-white/60' : 'bg-[#6E6E73]'}`} />
              <span className="flex-1">{formatInline(line.slice(2), isUser)}</span>
            </div>
          );
        }
        if (/^\d+\.\s/.test(line)) {
          const match = line.match(/^(\d+)\.\s(.*)/);
          return (
            <div key={idx} className="flex items-start gap-2 pl-1.5">
              <span className={`font-mono text-xs mt-0.5 ${isUser ? 'text-white/60' : 'text-[#6E6E73]'}`}>{match ? match[1] : '1'}.</span>
              <span className="flex-1">{formatInline(match ? match[2] : line, isUser)}</span>
            </div>
          );
        }
        if (line.trim() === '') {
          return <div key={idx} className="h-1.5" />;
        }
        return <p key={idx}>{formatInline(line, isUser)}</p>;
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
      case 'tasks': return <CheckSquare size={13} className="text-black" />;
      case 'calendar': return <Calendar size={13} className="text-black" />;
      case 'notes': return <FileText size={13} className="text-black" />;
      case 'chat': return <MessageSquare size={13} className="text-black" />;
      case 'expenses': return <IndianRupee size={13} className="text-[#6E6E73]" />;
      case 'investors': return <Briefcase size={13} className="text-[#6E6E73]" />;
      default: return <Layers size={13} className="text-[#6E6E73]" />;
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <section className="border-b border-[#E5E5E7] pb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="text-xs font-medium text-[#6E6E73] mb-2.5 flex items-center gap-2">
              <span>Autonomous Intelligence</span>
              <span>•</span>
              <span className="text-black font-semibold">Unfoundy Core</span>
              <span>•</span>
              <span>Direct Execution</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-black font-normal tracking-tight">
              Unfoundy AI engine.
            </h1>
            <p className="text-[#6E6E73] text-sm sm:text-base mt-2 max-w-2xl leading-relaxed font-sans">
              Autonomous execution engine for Unfounded Venture Lab. Directives across tasks, calendar, treasury, and notes are executed immediately with zero approval required.
            </p>
          </div>

          {/* Engine Status & Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3.5 py-1.5 rounded-full border border-[#E5E5E7] bg-[#F5F5F7] flex items-center gap-2 text-xs font-medium text-black">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Unfoundy</span>
              <span className="text-[#6E6E73]">/UNFOUNDY-AI</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-xs font-medium text-emerald-800">
              Direct Execution Mode
            </div>
            <div className="px-3.5 py-1.5 rounded-full border border-[#E5E5E7] bg-[#F5F5F7] text-xs font-mono text-[#6E6E73]">
              gemini-2.5-flash
            </div>
          </div>
        </div>

        {/* Sub-Tab Navigation Bar (Apple Segmented Pill) */}
        <div className="mt-8">
          <div className="inline-flex p-1 bg-[#F5F5F7] border border-[#E5E5E7] rounded-full overflow-x-auto max-w-full text-xs font-medium">
            <button
              onClick={() => { sound.click(); setActiveSubTab('chat'); }}
              className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 ${
                activeSubTab === 'chat'
                  ? 'bg-white text-black shadow-xs font-semibold'
                  : 'text-[#6E6E73] hover:text-black'
              }`}
            >
              <Bot size={14} />
              <span>Unfoundy Chat</span>
            </button>

            <button
              onClick={() => { sound.click(); setActiveSubTab('reports'); }}
              className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 ${
                activeSubTab === 'reports'
                  ? 'bg-white text-black shadow-xs font-semibold'
                  : 'text-[#6E6E73] hover:text-black'
              }`}
            >
              <FileText size={14} />
              <span>Executive Reports ({agentReports.length})</span>
            </button>

            <button
              onClick={() => { sound.click(); setActiveSubTab('logs'); }}
              className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 ${
                activeSubTab === 'logs'
                  ? 'bg-white text-black shadow-xs font-semibold'
                  : 'text-[#6E6E73] hover:text-black'
              }`}
            >
              <Clock size={14} />
              <span>Audit Ledger ({agentLogs.length})</span>
            </button>

            <button
              onClick={() => { sound.click(); setActiveSubTab('config'); }}
              className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 ${
                activeSubTab === 'config'
                  ? 'bg-white text-black shadow-xs font-semibold'
                  : 'text-[#6E6E73] hover:text-black'
              }`}
            >
              <Settings size={14} />
              <span>Configuration</span>
            </button>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 1. CHAT TAB: DIRECT UNFOUNDY CONVERSATIONAL UI           */}
      {/* ======================================================== */}
      {activeSubTab === 'chat' && (
        <section className="space-y-6">
          {/* Conversation Stream Container */}
          <div className="border border-[#E5E5E7] bg-white rounded-3xl min-h-[520px] max-h-[680px] flex flex-col justify-between overflow-hidden shadow-xs">
            {/* Scrollable Messages Area */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 bg-white">
              {/* If only welcome message, show prompt starter cards */}
              {agentChatMessages.length <= 1 && (
                <div className="mb-6 p-6 bg-[#F5F5F7] border border-[#E5E5E7] rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase text-[#6E6E73] tracking-wider">
                    <Sparkles size={14} className="text-black" />
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
                        className="p-3.5 bg-white hover:bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl transition-all text-left space-y-1.5 group shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-black group-hover:text-black transition-colors">
                            {qp.title}
                          </span>
                          <ChevronRight size={13} className="text-[#6E6E73] group-hover:text-black transition-colors" />
                        </div>
                        <p className="text-[12px] text-[#6E6E73] line-clamp-2 leading-relaxed">
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
                    <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold shrink-0 shadow-xs mt-0.5">
                      <Bot size={16} />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`max-w-2xl lg:max-w-3xl p-4 sm:p-5 space-y-3 transition-all ${
                      msg.sender === 'user'
                        ? 'bg-black text-white rounded-2xl rounded-tr-xs shadow-xs'
                        : 'bg-[#F5F5F7] border border-[#E5E5E7] text-black rounded-2xl rounded-tl-xs'
                    }`}
                  >
                    {/* Header: Name + Timestamp */}
                    <div className={`flex items-center justify-between gap-4 pb-2 border-b text-xs font-sans ${
                      msg.sender === 'user' ? 'border-white/20 text-white/70' : 'border-[#E5E5E7] text-[#6E6E73]'
                    }`}>
                      <span className="font-semibold tracking-wide">
                        {msg.sender === 'user' ? currentUser.name : 'Unfoundy Core'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span>{msg.timestamp}</span>
                        {msg.sender === 'assistant' && (
                          <button
                            onClick={() => handleCopyMessage(msg.id, msg.text)}
                            className="text-[#6E6E73] hover:text-black transition-colors p-0.5"
                            title="Copy response"
                          >
                            {copiedMessageId === msg.id ? (
                              <Check size={12} className="text-emerald-600" />
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
                        <p className="text-sm text-white/95 whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                      )}
                    </div>

                    {/* Executed Action Pills (Direct Execution Confirmations) */}
                    {msg.executedActions && msg.executedActions.length > 0 && (
                      <div className={`pt-2.5 border-t space-y-2 ${
                        msg.sender === 'user' ? 'border-white/20' : 'border-[#E5E5E7]'
                      }`}>
                        <span className="text-xs font-semibold tracking-wide text-emerald-600 flex items-center gap-1.5">
                          <span>⚡ Autonomously Executed ({msg.executedActions.length})</span>
                        </span>
                        <div className="space-y-1.5">
                          {msg.executedActions.map((action, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between p-2.5 rounded-xl border border-[#E5E5E7] bg-white text-xs shadow-xs"
                            >
                              <div className="flex items-center gap-2">
                                {getModuleIcon(action.module)}
                                <span className="text-black font-medium text-xs">
                                  {action.summary}
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  sound.click();
                                  setActiveTab(action.module);
                                }}
                                className="text-xs font-medium text-black hover:underline flex items-center gap-1 shrink-0 ml-2"
                              >
                                <span>Open {action.module}</span>
                                <ExternalLink size={11} />
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
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                    <Bot size={16} />
                  </div>
                  <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-[#E5E5E7] text-black text-xs font-medium flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-black animate-ping" />
                    <span>Unfoundy is processing & executing actions autonomously...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Sticky Prompt Input Bar (Unfoundy Execution Interface) */}
            <div className="p-4 sm:p-5 border-t border-[#E5E5E7] bg-white space-y-3">
              <div className="relative flex items-end gap-2 bg-[#F5F5F7] border border-[#E5E5E7] focus-within:border-black focus-within:bg-white transition-all rounded-2xl p-2.5 sm:p-3">
                <textarea
                  ref={textareaRef}
                  rows={2}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message Unfoundy... (e.g. 'Create task for motor telemetry' or 'Record earning of ₹2,50,000')"
                  className="w-full bg-transparent text-black text-sm focus:outline-none resize-none placeholder-[#6E6E73] leading-relaxed max-h-36 font-sans px-1"
                />

                {/* Voice Dictation Button */}
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`p-2.5 rounded-full border transition-all shrink-0 ${
                    isListening
                      ? 'border-red-500 bg-red-50 text-red-600 animate-pulse'
                      : 'border-[#E5E5E7] bg-white text-[#6E6E73] hover:text-black hover:border-black'
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
                  className={`w-9 h-9 rounded-full font-bold shrink-0 flex items-center justify-center transition-all ${
                    inputText.trim() && !isSending
                      ? 'bg-black text-white hover:opacity-90 shadow-xs'
                      : 'bg-[#E5E5E7] text-[#6E6E73] cursor-not-allowed'
                  }`}
                  title="Send message (Enter)"
                >
                  <ArrowUp size={16} />
                </button>
              </div>

              {/* Bottom Metadata & Controls */}
              <div className="flex items-center justify-between text-xs text-[#6E6E73] px-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-medium text-black">Direct Unfoundy Mode</span>
                  <span>•</span>
                  <span>Zero Admin Approval</span>
                  <span>•</span>
                  <span>Shift+Enter for new line</span>
                </div>

                <button
                  onClick={clearAgentChat}
                  className="hover:text-black transition-colors flex items-center gap-1 font-medium"
                  title="Reset conversation"
                >
                  <Trash2 size={12} />
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
          <div className="p-6 border border-[#E5E5E7] bg-[#F5F5F7] rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
            <div>
              <h3 className="font-serif text-lg font-normal text-black">
                Executive Synthesis Engine
              </h3>
              <p className="text-[#6E6E73] text-xs sm:text-sm mt-1">
                Compile autonomous intelligence syntheses across engineering tasks, financial burn in ₹ INR, and institutional investor pipelines.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <button
                onClick={() => handleTriggerReport('daily')}
                disabled={isGeneratingReport}
                className="px-4 py-2 rounded-full border border-[#E5E5E7] bg-white hover:bg-[#F5F5F7] text-black font-medium text-xs transition-all shadow-xs"
              >
                + Daily Brief
              </button>
              <button
                onClick={() => handleTriggerReport('weekly')}
                disabled={isGeneratingReport}
                className="px-4 py-2 rounded-full border border-[#E5E5E7] bg-white hover:bg-[#F5F5F7] text-black font-medium text-xs transition-all shadow-xs"
              >
                + Weekly Synthesis
              </button>
              <button
                onClick={() => handleTriggerReport('monthly')}
                disabled={isGeneratingReport}
                className="px-4 py-2 rounded-full bg-black hover:opacity-90 text-white font-medium text-xs transition-all shadow-xs"
              >
                + Monthly Review
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Report Viewer */}
            <div className="lg:col-span-8 border border-[#E5E5E7] bg-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
              {selectedReport ? (
                <>
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E5E5E7]">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs uppercase font-medium px-2.5 py-0.5 rounded-full bg-[#F5F5F7] text-black border border-[#E5E5E7]">
                          {selectedReport.type}
                        </span>
                        <span className="text-xs text-[#6E6E73]">
                          Period: {selectedReport.period}
                        </span>
                      </div>
                      <h2 className="font-serif text-xl sm:text-2xl font-normal text-black">
                        {selectedReport.title}
                      </h2>
                    </div>

                    <button
                      onClick={() => downloadReportMarkdown(selectedReport)}
                      className="px-3.5 py-1.5 rounded-full border border-[#E5E5E7] hover:bg-[#F5F5F7] text-black text-xs font-medium flex items-center gap-1.5 transition-all shrink-0"
                    >
                      <Download size={13} />
                      <span>Download MD</span>
                    </button>
                  </div>

                  {/* Highlight Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 rounded-2xl border border-[#E5E5E7] bg-[#F5F5F7] text-center">
                      <span className="text-xs text-[#6E6E73] font-medium block">Tasks Closed</span>
                      <span className="text-xl font-medium text-black mt-1 block">
                        {selectedReport.metrics.tasksCompleted}
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl border border-[#E5E5E7] bg-[#F5F5F7] text-center">
                      <span className="text-xs text-[#6E6E73] font-medium block">Total Spend</span>
                      <span className="text-xl font-medium text-black mt-1 block">
                        ₹{selectedReport.metrics.totalSpend.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl border border-[#E5E5E7] bg-[#F5F5F7] text-center">
                      <span className="text-xs text-[#6E6E73] font-medium block">Investor Leads</span>
                      <span className="text-xl font-medium text-black mt-1 block">
                        {selectedReport.metrics.activeLeads}
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl border border-[#E5E5E7] bg-[#F5F5F7] text-center">
                      <span className="text-xs text-[#6E6E73] font-medium block">Sentiment</span>
                      <span className="text-sm font-semibold text-emerald-700 truncate block mt-1">
                        {selectedReport.metrics.sentimentScore}
                      </span>
                    </div>
                  </div>

                  {/* Report Markdown Content */}
                  <div className="p-6 rounded-2xl border border-[#E5E5E7] bg-[#F5F5F7]/40 text-xs sm:text-sm text-black leading-relaxed font-mono whitespace-pre-wrap">
                    {selectedReport.content}
                  </div>
                </>
              ) : (
                <div className="py-20 text-center text-[#6E6E73] text-sm">
                  No report selected. Generate a report above to view executive intelligence.
                </div>
              )}
            </div>

            {/* Past Reports List */}
            <div className="lg:col-span-4 border border-[#E5E5E7] bg-white rounded-3xl p-6 space-y-4 shadow-xs">
              <span className="text-xs font-semibold text-black uppercase tracking-wider block">
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
                    className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-1.5 ${
                      selectedReport?.id === rep.id
                        ? 'border-black bg-[#F5F5F7]'
                        : 'border-[#E5E5E7] bg-white hover:bg-[#F5F5F7]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="uppercase text-black font-semibold">{rep.type}</span>
                      <span className="text-[#6E6E73]">{rep.period}</span>
                    </div>
                    <h4 className="font-semibold text-xs sm:text-sm text-black line-clamp-1">{rep.title}</h4>
                    <p className="text-xs text-[#6E6E73] line-clamp-2 leading-relaxed">{rep.summary}</p>
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
          <div className="border border-[#E5E5E7] bg-white rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E7]">
              <div>
                <h3 className="font-serif text-lg font-normal text-black">
                  Autonomous Activity Ledger
                </h3>
                <p className="text-[#6E6E73] text-xs sm:text-sm mt-0.5">
                  Transparent, tamper-evident log of all direct actions, tasks, and calendar events executed by Unfoundy.
                </p>
              </div>
              <span className="text-xs text-[#6E6E73] font-mono">
                {agentLogs.length} verified log entries
              </span>
            </div>

            <div className="space-y-3">
              {agentLogs.map(log => (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl border border-[#E5E5E7] bg-[#F5F5F7] flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs hover:bg-[#EBEBED] transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[#6E6E73]">{log.timestamp}</span>
                      <span className="text-black font-semibold uppercase">{log.actionType}</span>
                      <span className="px-2 py-0.5 rounded-full border border-[#E5E5E7] bg-white text-black font-mono text-[10px]">
                        {log.targetEntity}
                      </span>
                    </div>
                    <p className="text-black text-xs leading-relaxed">{log.reasoning}</p>
                  </div>

                  {log.rollbackAvailable && log.status !== 'rolled_back' && (
                    <button
                      onClick={() => rollbackAgentAction(log.id)}
                      className="px-3.5 py-1.5 rounded-full border border-[#E5E5E7] bg-white hover:bg-[#F5F5F7] text-black text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs shrink-0"
                    >
                      <RotateCcw size={12} />
                      <span>Rollback</span>
                    </button>
                  )}

                  {log.status === 'rolled_back' && (
                    <span className="text-[11px] uppercase text-red-600 font-semibold px-2.5 py-1 rounded-full border border-red-200 bg-red-50 shrink-0">
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
          <div className="border border-[#E5E5E7] bg-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="pb-4 border-b border-[#E5E5E7]">
              <h3 className="font-serif text-lg font-normal text-black">
                Unfoundy AI Configuration
              </h3>
              <p className="text-[#6E6E73] text-xs sm:text-sm mt-0.5">
                Configure generative model, autonomy authority, and announcements enclaves.
              </p>
            </div>

            <div className="space-y-5 text-xs">
              <div>
                <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-2">
                  Active Generative Model
                </label>
                <select
                  value={agentConfig.activeModel}
                  onChange={(e) => updateAgentConfig({ activeModel: e.target.value })}
                  className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl text-black p-3 focus:outline-none focus:border-black focus:bg-white font-sans text-xs transition-all"
                >
                  <option value="gemini-2.5-flash">gemini-2.5-flash (Fast, Low Latency, Recommended)</option>
                  <option value="gemini-2.5-pro">gemini-2.5-pro (High Reasoning, Deep Analysis)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-2">
                  Agent Call Name & Callsign
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={agentConfig.name}
                    onChange={(e) => updateAgentConfig({ name: e.target.value })}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl text-black p-3 focus:outline-none focus:border-black focus:bg-white font-sans text-xs transition-all"
                  />
                  <input
                    type="text"
                    value={agentConfig.callsign}
                    onChange={(e) => updateAgentConfig({ callsign: e.target.value })}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl text-black p-3 focus:outline-none focus:border-black focus:bg-white font-sans text-xs transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5E5E7] space-y-3">
                <div className="flex items-center justify-between p-4 rounded-2xl border border-[#E5E5E7] bg-[#F5F5F7]">
                  <div>
                    <span className="font-semibold text-black block text-xs sm:text-sm">Direct Autonomous Execution</span>
                    <span className="text-[#6E6E73] text-xs">
                      Execute workspace tasks, notes, calendar events directly without admin approval gates.
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-semibold">
                    Enabled
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl border border-[#E5E5E7] bg-[#F5F5F7]">
                  <div>
                    <span className="font-semibold text-black block text-xs sm:text-sm">Announcements Channel</span>
                    <span className="text-[#6E6E73] text-xs">
                      Public room for automated action notifications and periodic reports.
                    </span>
                  </div>
                  <span className="text-black font-mono text-xs px-2.5 py-1 rounded-full bg-white border border-[#E5E5E7]">#agent-reports</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
