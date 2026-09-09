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
  LogOut
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    currentUser,
    users,
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
    { id: 'checkins', label: 'Pulse & Check-in', icon: Activity },
    { id: 'personalization', label: 'Patch Lab', icon: Sparkles },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0D0D0D]/95 backdrop-blur border-b border-[#333333] shadow-md">
      {/* Top utility bar */}
      <div className="max-w-[1700px] mx-auto px-4 py-2 flex items-center justify-between gap-4">
        {/* Left Brand Badge */}
        <div className="flex items-center gap-4">
          <BrandPatchBadge size="md" />
          <div className="hidden lg:flex flex-col border-l border-[#333333] pl-3 py-0.5">
            <h1 className="headline text-[15px] text-[#FFFFFF] tracking-wide leading-none flex items-center gap-1.5 font-normal">
              <span className="w-2 h-2 rounded-none bg-[#5EBA7D] animate-pulse" />
              Command Center <em className="accent-italic text-[#B3B3B3]">// Alpha Node</em>
            </h1>
            <span className="text-[11px] text-[#B3B3B3] tracking-wider mt-0.5">
              AUTHENTICATED TEAM WORKSPACE
            </span>
          </div>
        </div>

        {/* Global Search & Quick Actions */}
        <div className="flex items-center gap-2.5">
          {/* Quick Search Ctrl+K */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#222222] hover:bg-[#2B2B2B] border border-[#333333] text-[#B3B3B3] hover:text-[#FFFFFF] text-xs transition-colors patch-chamfer-sm"
            title="Search workspace (Ctrl + K)"
          >
            <Search size={14} className="text-[#E5B869]" />
            <span className="hidden sm:inline">Search Lab...</span>
            <kbd className="hidden md:inline text-[10px] px-1 py-0.5 bg-[#0D0D0D] border border-[#333333] text-[#FFFFFF] font-mono-tech">
              Ctrl+K
            </kbd>
          </button>

          {/* Quick Capture Sticky Note */}
          <button
            onClick={() => setQuickCaptureOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E5B869] hover:bg-[#F0C57A] text-[#0D0D0D] text-xs font-bold transition-transform active:scale-95 patch-chamfer-sm shadow-sm"
            title="Quick Capture / Brain Dump (Ctrl+Shift+N)"
          >
            <Plus size={14} strokeWidth={3} />
            <span className="hidden sm:inline">Brain Dump</span>
          </button>

          {/* Sound FX Toggle */}
          <button
            onClick={toggleSound}
            className={`p-2 border text-xs transition-colors patch-chamfer-sm ${
              workspaceConfig.soundEnabled
                ? 'bg-[#222222] border-[#333333] text-[#E5B869] hover:text-white'
                : 'bg-[#222222]/50 border-[#333333] text-[#6B7280]'
            }`}
            title={workspaceConfig.soundEnabled ? 'Mute Audio FX' : 'Enable Audio FX'}
          >
            {workspaceConfig.soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>

          {/* Access / Invite-Only Security Status */}
          <button
            onClick={() => setAccessModalOpen(true)}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-[#222222] hover:bg-[#2B2B2B] border border-[#333333] text-[#5EBA7D] text-xs transition-colors patch-chamfer-sm"
            title="Private Workspace Settings & Invites"
          >
            <ShieldCheck size={14} />
            <span className="text-[11px] font-semibold">INVITE-ONLY</span>
          </button>

          {/* User Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1 pl-2 pr-2.5 bg-[#222222] hover:bg-[#2B2B2B] border border-[#333333] text-left transition-colors patch-chamfer-sm"
            >
              <PatchAvatar user={currentUser} size="sm" showStatus />
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-semibold text-[#FFFFFF] leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-[9px] text-[#E5B869] tracking-wider uppercase font-semibold">
                  {currentUser.role}
                </span>
              </div>
              <ChevronDown size={14} className="text-[#B3B3B3]" />
            </button>

            {/* User Dropdown Menu */}
            {userMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-64 bg-[#1A1A1A] border-2 border-[#333333] shadow-2xl p-2 z-50 patch-chamfer-md"
                onMouseLeave={() => setUserMenuOpen(false)}
              >
                <div className="px-2 py-1.5 border-b border-[#333333] mb-2">
                  <span className="text-[10px] uppercase text-[#B3B3B3] tracking-wider block font-semibold">
                    Switch Active Member View
                  </span>
                  <span className="text-xs text-[#FFFFFF]">
                    Test different permissions & views
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
                      className={`w-full flex items-center justify-between p-2 text-left text-xs transition-colors patch-chamfer-sm ${
                        u.id === currentUser.id
                          ? 'bg-[#E5B869]/15 border border-[#E5B869]/40 text-[#FFFFFF]'
                          : 'hover:bg-[#222222] text-[#B3B3B3] hover:text-[#FFFFFF]'
                      }`}
                    >
                      <PatchAvatar user={u} size="sm" showStatus showCallsign />
                      <span className="text-[10px] px-1 py-0.5 border border-[#333333] uppercase text-[#B3B3B3]">
                        {u.role}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mt-2 pt-2 border-t border-[#333333] flex flex-col gap-1">
                  <button
                    onClick={() => {
                      setActiveTab('personalization');
                      setUserMenuOpen(false);
                    }}
                    className="w-full text-left px-2 py-1.5 text-xs text-[#E5B869] hover:bg-[#222222] flex items-center gap-2 font-semibold"
                  >
                    <Sparkles size={13} />
                    Customize Callsign & Patch
                  </button>
                  <button
                    onClick={() => {
                      setAccessModalOpen(true);
                      setUserMenuOpen(false);
                    }}
                    className="w-full text-left px-2 py-1.5 text-xs text-[#B3B3B3] hover:bg-[#222222] hover:text-[#FFFFFF] flex items-center gap-2"
                  >
                    <ShieldCheck size={13} />
                    Workspace Permissions
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setUserMenuOpen(false);
                    }}
                    className="w-full text-left px-2 py-1.5 text-xs text-[#E05A47] hover:bg-[#2A1717] flex items-center gap-2 font-semibold border-t border-[#333333] mt-1 pt-2"
                  >
                    <LogOut size={13} />
                    Sign Out / Switch Operator
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Sign Out Button */}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#222222] hover:bg-[#2A1717] border border-[#333333] hover:border-[#E05A47] text-[#B3B3B3] hover:text-[#E05A47] text-xs transition-colors patch-chamfer-sm"
            title="Sign Out / Lock Session"
          >
            <LogOut size={13} />
            <span className="hidden xl:inline">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="bg-[#0D0D0D] border-t border-[#333333] overflow-x-auto no-scrollbar">
        <div className="max-w-[1700px] mx-auto px-2 flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs tracking-wide whitespace-nowrap transition-all border-b-2 ${
                  isActive
                    ? 'border-[#E5B869] text-[#FFFFFF] bg-[#222222] font-semibold'
                    : 'border-transparent text-[#B3B3B3] hover:text-[#FFFFFF] hover:bg-[#1A1A1A]'
                }`}
              >
                <Icon
                  size={14}
                  className={isActive ? 'text-[#E5B869]' : 'text-[#808080]'}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
