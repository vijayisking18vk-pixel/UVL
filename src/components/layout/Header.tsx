import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { BrandPatchBadge } from '../common/BrandPatchBadge';
import { PatchAvatar } from '../common/PatchAvatar';
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  Users,
  FileText,
  FolderArchive,
  MessageSquare,
  Activity,
  Sparkles,
  Search,
  Volume2,
  VolumeX,
  ShieldCheck,
  ChevronDown,
  Plus,
  LogOut,
  UserPlus
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    currentUser,
    users,
    isVijayrajkumar,
    switchUserById,
    logout,
    workspaceConfig,
    toggleSound,
    setQuickCaptureOpen,
    setCommandPaletteOpen,
    setAccessModalOpen
  } = useWorkspace();

  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'meetings', label: 'Meetings', icon: Users },
    { id: 'notes', label: 'Notes & Wiki', icon: FileText },
    { id: 'files', label: 'Files', icon: FolderArchive },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'pulse', label: 'Pulse & Check-in', icon: Activity },
    { id: 'personalization', label: 'Patch Lab', icon: Sparkles },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#000000] border-b border-white/20">
      {/* Top utility bar */}
      <div className="max-w-[1700px] mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Left Brand Badge */}
        <div className="flex items-center gap-4">
          <BrandPatchBadge size="md" />
          <div className="hidden lg:flex items-center gap-2 border-l border-white/20 pl-4 py-1 text-xs">
            <span className="w-1.5 h-1.5 bg-[#A1A1AA]" />
            <span className="text-white font-medium">Unfounded Venture Lab</span>
            <span className="text-white/40">/</span>
            <span className="meta-number text-[11px] text-white/60">INDEX·001</span>
          </div>
        </div>

        {/* Global Search & Quick Actions */}
        <div className="flex items-center gap-3">
          {/* Quick Search Ctrl+K */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 border border-white/30 hover:border-white text-white/70 hover:text-white text-xs transition-colors"
            title="Search workspace (Ctrl + K)"
          >
            <Search size={13} className="text-[#A1A1AA]" />
            <span className="hidden sm:inline">Search /</span>
            <span className="meta-number text-[10px] text-white/50">Ctrl+K</span>
          </button>

          {/* Quick Capture Sticky Note */}
          <button
            onClick={() => setQuickCaptureOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#A1A1AA] hover:bg-[#D4D4D8] text-black text-xs font-semibold transition-colors"
            title="Quick Capture / Brain Dump (Ctrl+Shift+N)"
          >
            <Plus size={13} strokeWidth={2.5} />
            <span className="hidden sm:inline">Capture</span>
          </button>

          {/* Sound FX Toggle */}
          <button
            onClick={toggleSound}
            className={`p-1.5 border text-xs transition-colors ${
              workspaceConfig.soundEnabled
                ? 'border-white/50 text-white hover:text-[#A1A1AA]'
                : 'border-white/20 text-white/30'
            }`}
            title={workspaceConfig.soundEnabled ? 'Mute Audio FX' : 'Enable Audio FX'}
          >
            {workspaceConfig.soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>

          {/* Access / Invite-Only Security Status */}
          <button
            onClick={() => setAccessModalOpen(true)}
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 border border-white/30 hover:border-white text-white/80 hover:text-white text-xs transition-colors"
            title="Private Workspace Settings & Invites"
          >
            <ShieldCheck size={13} className="text-[#A1A1AA]" />
            <span className="micro-label">Private</span>
          </button>

          {/* Vijayrajkumar Exclusive Add Member Shortcut */}
          {isVijayrajkumar && (
            <button
              onClick={() => setAccessModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 border border-[#A1A1AA] bg-white/5 hover:bg-[#A1A1AA] hover:text-black text-white text-xs font-semibold transition-colors"
              title="Vijayrajkumar Authorization: Add New Member to Database"
            >
              <UserPlus size={13} />
              <span>+ Add Member</span>
            </button>
          )}

          {/* User Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1 pl-2 pr-2 border border-white/30 hover:border-white transition-colors"
            >
              <PatchAvatar user={currentUser} size="sm" showStatus />
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-white leading-tight">
                  {currentUser.name}
                </span>
                <span className="meta-number text-[9px] text-[#A1A1AA]">
                  /{currentUser.callsign}
                </span>
              </div>
              <ChevronDown size={13} className="text-white/60 ml-1" />
            </button>

            {/* User Dropdown Menu */}
            {userMenuOpen && (
              <div
                className="absolute right-0 mt-1 w-64 bg-[#000000] border border-white/50 p-3 z-50 shadow-2xl"
                onMouseLeave={() => setUserMenuOpen(false)}
              >
                <div className="pb-2 border-b border-white/20 mb-2">
                  <span className="micro-label text-white/60 block">
                    Switch Active Member
                  </span>
                </div>

                <div className="space-y-1">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        switchUserById(u.id);
                        setUserMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 text-left text-xs transition-colors border ${
                        u.id === currentUser.id
                          ? 'border-[#A1A1AA] bg-white/5 text-white'
                          : 'border-transparent hover:border-white/20 text-white/70 hover:text-white'
                      }`}
                    >
                      <PatchAvatar user={u} size="sm" showStatus showCallsign />
                    </button>
                  ))}
                </div>

                <div className="mt-2 pt-2 border-t border-white/20 flex flex-col gap-1 text-xs">
                  {isVijayrajkumar && (
                    <button
                      onClick={() => {
                        setAccessModalOpen(true);
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left p-1.5 text-white hover:bg-white/10 flex items-center gap-2 font-semibold"
                    >
                      <UserPlus size={12} className="text-[#A1A1AA]" />
                      <span>+ Onboard New Member /</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setActiveTab('personalization');
                      setUserMenuOpen(false);
                    }}
                    className="w-full text-left p-1.5 text-[#A1A1AA] hover:bg-white/5 flex items-center gap-2"
                  >
                    <Sparkles size={12} />
                    <span>Customize Profile /</span>
                  </button>
                  <button
                    onClick={() => {
                      setAccessModalOpen(true);
                      setUserMenuOpen(false);
                    }}
                    className="w-full text-left p-1.5 text-white/80 hover:text-white hover:bg-white/5 flex items-center gap-2"
                  >
                    <ShieldCheck size={12} />
                    <span>Workspace Settings /</span>
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setUserMenuOpen(false);
                    }}
                    className="w-full text-left p-1.5 text-white/60 hover:text-white hover:bg-white/10 flex items-center gap-2 border-t border-white/20 mt-1 pt-2"
                  >
                    <LogOut size={12} />
                    <span>Sign Out / Switch</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Sign Out Button */}
          <button
            onClick={logout}
            className="flex items-center gap-1 px-2.5 py-1.5 border border-white/20 hover:border-white text-white/70 hover:text-white text-xs transition-colors"
            title="Sign Out"
          >
            <LogOut size={12} />
            <span className="hidden xl:inline">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Slash-separated Editorial Navigation */}
      <div className="bg-[#000000] border-t border-white/20 overflow-x-auto no-scrollbar">
        <div className="max-w-[1700px] mx-auto px-4 flex items-center gap-3 py-2 text-xs">
          {navItems.map((item, idx) => {
            const isActive = activeTab === item.id;
            return (
              <React.Fragment key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`micro-label transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'text-white font-semibold underline underline-offset-4 decoration-[#A1A1AA] decoration-2'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <span>{item.label}</span>
                </button>
                {idx < navItems.length - 1 && (
                  <span className="text-white/20 select-none">/</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </header>
  );
};
