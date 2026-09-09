import React from 'react';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { CalendarView } from './components/calendar/CalendarView';
import { TasksView } from './components/tasks/TasksView';
import { MeetingsView } from './components/meetings/MeetingsView';
import { NotesView } from './components/notes/NotesView';
import { FilesView } from './components/files/FilesView';
import { ChatView } from './components/chat/ChatView';
import { CheckinsView } from './components/checkins/CheckinsView';
import { PatchAvatarLab } from './components/personalization/PatchAvatarLab';
import { QuickCaptureModal } from './components/common/QuickCaptureModal';
import { CommandPalette } from './components/common/CommandPalette';
import { AccessControlModal } from './components/access/AccessControlModal';
import { LoginPortal } from './components/auth/LoginPortal';

const AppContent: React.FC = () => {
  const { activeTab, workspaceConfig, isAuthenticated } = useWorkspace();

  if (!isAuthenticated) {
    return <LoginPortal />;
  }

  const renderActiveModule = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'calendar':
        return <CalendarView />;
      case 'tasks':
        return <TasksView />;
      case 'meetings':
        return <MeetingsView />;
      case 'notes':
        return <NotesView />;
      case 'files':
        return <FilesView />;
      case 'chat':
        return <ChatView />;
      case 'checkins':
        return <CheckinsView />;
      case 'personalization':
        return <PatchAvatarLab />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-twill text-[#FFFFFF] flex flex-col selection:bg-[#E5B869] selection:text-[#0D0D0D]">
      {/* Top Tactical Command Header */}
      <Header />

      {/* Main Workspace Viewport */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto px-3 sm:px-6 py-6">
        {renderActiveModule()}
      </main>

      {/* Global Command Center Modals */}
      <QuickCaptureModal />
      <CommandPalette />
      <AccessControlModal />

      {/* Retro Status Footer */}
      <footer className="border-t border-[#333333] bg-[#0D0D0D]/95 py-3 px-4 text-xs text-[#B3B3B3]">
        <div className="max-w-[1700px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#5EBA7D] rounded-none animate-pulse" />
            <span className="headline text-xs tracking-wider text-[#FFFFFF] font-normal">
              Unfounded Venture Lab <em className="accent-italic text-[#B3B3B3]">// Autonomous Protocols</em>
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>SHORTCUTS: <kbd className="border border-[#333333] px-1.5 py-0.5 bg-[#222222] text-[#FFFFFF] font-mono-tech text-[10px]">Ctrl+K</kbd> Search</span>
            <span><kbd className="border border-[#333333] px-1.5 py-0.5 bg-[#222222] text-[#FFFFFF] font-mono-tech text-[10px]">Ctrl+Shift+N</kbd> Brain Dump</span>
            <span className="text-[#E5B869] font-normal">SESSION ACTIVE <em className="accent-italic">// LOCAL AIRGAP SYNC</em></span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <WorkspaceProvider>
      <AppContent />
    </WorkspaceProvider>
  );
}

export default App;

