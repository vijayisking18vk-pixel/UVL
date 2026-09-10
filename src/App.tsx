import React, { useEffect } from 'react';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';
import { LoginPortal } from './components/auth/LoginPortal';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { TasksView } from './components/tasks/TasksView';
import { CalendarView } from './components/calendar/CalendarView';
import { MeetingsView } from './components/meetings/MeetingsView';
import { NotesView } from './components/notes/NotesView';
import { FilesView } from './components/files/FilesView';
import { ChatView } from './components/chat/ChatView';
import { CheckinsView } from './components/checkins/CheckinsView';
import { PatchAvatarLab } from './components/personalization/PatchAvatarLab';
import { ExpenseView } from './components/expenses/ExpenseView';
import { InvestorView } from './components/investors/InvestorView';
import { AgentView } from './components/agent/AgentView';
import { QuickCaptureModal } from './components/common/QuickCaptureModal';
import { CommandPalette } from './components/common/CommandPalette';
import { AccessControlModal } from './components/access/AccessControlModal';

const AppContent: React.FC = () => {
  const {
    isAuthenticated,
    activeTab,
    setQuickCaptureOpen,
    setCommandPaletteOpen
  } = useWorkspace();

  // Keyboard shortcut listener for fast operations
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K => Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      // Cmd/Ctrl + Shift + N => Quick Capture Brain Dump
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setQuickCaptureOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCommandPaletteOpen, setQuickCaptureOpen]);

  if (!isAuthenticated) {
    return <LoginPortal />;
  }

  const renderActiveModule = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'tasks':
        return <TasksView />;
      case 'calendar':
        return <CalendarView />;
      case 'meetings':
        return <MeetingsView />;
      case 'notes':
        return <NotesView />;
      case 'files':
        return <FilesView />;
      case 'chat':
        return <ChatView />;
      case 'pulse':
        return <CheckinsView />;
      case 'expenses':
        return <ExpenseView />;
      case 'investors':
        return <InvestorView />;
      case 'agent':
        return <AgentView />;
      case 'personalization':
        return <PatchAvatarLab />;
      default:
        return <DashboardView />;
    }
  };

  const { supabaseConnected } = useWorkspace();

  return (
    <div className="min-h-screen bg-[#000000] text-[#FFFFFF] flex flex-col selection:bg-[#A1A1AA] selection:text-[#000000]">
      {/* Top Editorial Header */}
      <Header />

      {/* Editorial Marquee Ticker Strip: hairline borders, text-only, single-speed */}
      <div className="bg-[#000000] border-b border-white/20 py-1.5 px-4 overflow-hidden select-none">
        <div className="max-w-[1700px] mx-auto flex items-center justify-between text-[11px] text-white/70">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#A1A1AA] inline-block" />
            <span className="micro-label">Database sync:</span>
            <span className={`meta-number ${supabaseConnected ? 'text-[#A1A1AA]' : 'text-white'}`}>
              {supabaseConnected ? 'Active / Supabase Live' : 'Ready / Local & Cloud Cache'}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <span>Protocol: Autonomous Command Center</span>
            <span className="text-white/30">/</span>
            <span>Roster: Vijayrajkumar / Saai / Harish / Subanesh / Vinayak</span>
            <span className="text-white/30">/</span>
            <span className="text-[#A1A1AA]">Zero Mock Fallback</span>
          </div>
          <div className="flex items-center gap-2 meta-number text-[10px] text-white/50">
            <span>UVL·CORE·2026</span>
          </div>
        </div>
      </div>

      {/* Main Workspace Viewport */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto px-3 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8 editorial-reveal">
        {renderActiveModule()}
      </main>

      {/* Global Command Center Modals */}
      <QuickCaptureModal />
      <CommandPalette />
      <AccessControlModal />

      {/* Monochrome Editorial Status Footer */}
      <footer className="border-t border-white/20 bg-[#000000] py-4 px-4 text-xs text-white/60">
        <div className="max-w-[1700px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 bg-[#A1A1AA]" />
            <span className="micro-label text-white">
              Unfounded Venture Lab / Private Operator Roster
            </span>
            <span className="text-white/30">/</span>
            <span className="meta-number text-[11px] text-white/50">BUILD 2026.09</span>
          </div>

          <div className="flex items-center gap-4 micro-label text-white/70">
            <span>Shortcuts / <kbd className="border border-white/30 px-1 py-0.5 bg-white/5 text-white meta-number text-[10px]">Ctrl+K</kbd> Search</span>
            <span><kbd className="border border-white/30 px-1 py-0.5 bg-white/5 text-white meta-number text-[10px]">Ctrl+Shift+N</kbd> Quick Capture</span>
            <span className="text-[#A1A1AA] font-medium">Session Authenticated / Secure Vault</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <WorkspaceProvider>
      <AppContent />
    </WorkspaceProvider>
  );
}
