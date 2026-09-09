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

const AppContent: React.FC = () => {
  const { activeTab, workspaceConfig } = useWorkspace();

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
    <div className="min-h-screen bg-twill text-[#EDE8DB] flex flex-col selection:bg-[#E5B869] selection:text-[#0B0C0E]">
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
      <footer className="border-t border-[#1F242C] bg-[#0C0E10]/90 py-3 px-4 text-xs font-mono text-[#9E9A8E]">
        <div className="max-w-[1700px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#5EBA7D] rounded-none animate-pulse" />
            <span className="font-patch text-xs uppercase tracking-widest text-[#D8D2C2]">
              UNFOUNDED VENTURE LAB // DEFENSE GRADE AUTONOMOUS PROTOCOLS
            </span>
          </div>

          <div className="flex items-center gap-4 text-[10px]">
            <span>SHORTCUTS: <kbd className="border border-[#2C333F] px-1 bg-[#14171B] text-[#EDE8DB]">Ctrl+K</kbd> Search</span>
            <span><kbd className="border border-[#2C333F] px-1 bg-[#14171B] text-[#EDE8DB]">Ctrl+Shift+N</kbd> Brain Dump</span>
            <span className="text-[#E5B869]">SESSION ACTIVE // LOCAL AIRGAP SYNC</span>
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

