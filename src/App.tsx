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

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#000000] flex flex-col selection:bg-[#E5E5E7] selection:text-[#000000]">
      {/* Top Apple Minimalist Header */}
      <Header />

      {/* Quiet Status Pill Strip */}
      <div className="bg-[#F5F5F7] border-b border-[#E5E5E7] py-2 px-4 select-none">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between text-[11px] text-[#6E6E73]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            <span className="font-medium text-black">Unfounded Venture Lab</span>
            <span className="text-[#D1D1D6]">•</span>
            <span>Direct Autonomy Engine</span>
          </div>
          <div className="hidden md:flex items-center gap-6 font-medium">
            <span>5 Verified Operators</span>
            <span className="text-[#D1D1D6]">•</span>
            <span>Roster: Vijayrajkumar / Saai / Harish / Subanesh / Vinayak</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[#6E6E73]">
            <span>Active</span>
          </div>
        </div>
      </div>

      {/* Main Apple Content Viewport (max-w ~1200px, centered, generous negative space) */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 pb-28 md:pb-12 editorial-reveal">
        {renderActiveModule()}
      </main>

      {/* Global Command Center Modals */}
      <QuickCaptureModal />
      <CommandPalette />
      <AccessControlModal />

      {/* Apple Minimalist Footer */}
      <footer className="border-t border-[#E5E5E7] bg-[#FFFFFF] py-6 px-4 text-xs text-[#6E6E73]">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-black inline-block" />
            <span className="font-medium text-black">
              Unfounded Venture Lab
            </span>
            <span className="text-[#D1D1D6]">•</span>
            <span className="meta-number text-[11px] text-[#6E6E73]">Autonomous Team Command Center</span>
          </div>

          <div className="flex items-center gap-4 text-[#6E6E73]">
            <span>Shortcuts: <kbd className="border border-[#E5E5E7] rounded-md px-1.5 py-0.5 bg-[#F5F5F7] text-black meta-number text-[10px]">⌘K / Ctrl+K</kbd> Search</span>
            <span><kbd className="border border-[#E5E5E7] rounded-md px-1.5 py-0.5 bg-[#F5F5F7] text-black meta-number text-[10px]">⌘⇧N</kbd> Capture</span>
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
