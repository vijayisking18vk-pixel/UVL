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
  UserPlus,
  Grid,
  X,
  IndianRupee,
  Briefcase,
  Bot
} from 'lucide-react';
import { sound } from '../../utils/sound';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'meetings', label: 'Meetings', icon: Users },
    { id: 'notes', label: 'Notes & Wiki', icon: FileText },
    { id: 'files', label: 'Files', icon: FolderArchive },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'expenses', label: 'Money Tracker', icon: IndianRupee },
    { id: 'investors', label: 'Investors', icon: Briefcase },
    { id: 'agent', label: 'Unfoundy AI', icon: Bot },
    { id: 'pulse', label: 'Pulse & Check-in', icon: Activity },
    { id: 'personalization', label: 'Patch Lab', icon: Sparkles },
  ];

  const mobilePrimaryItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'expenses', label: 'Money', icon: IndianRupee },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'agent', label: 'Unfoundy', icon: Bot },
  ];

  const isPrimaryActive = mobilePrimaryItems.some(i => i.id === activeTab);

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#000000] border-b border-white/20">
        {/* Top utility bar */}
        <div className="max-w-[1700px] mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left Brand Badge */}
          <div className="flex items-center gap-3 sm:gap-4">
            <BrandPatchBadge size="sm" />
            <div className="hidden lg:flex items-center gap-2 border-l border-white/20 pl-4 py-1 text-xs">
              <span className="w-1.5 h-1.5 bg-[#A1A1AA]" />
              <span className="text-white font-medium">Unfounded Venture Lab</span>
              <span className="text-white/40">/</span>
              <span className="meta-number text-[11px] text-white/60">INDEX·001</span>
            </div>
          </div>

          {/* Global Search & Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Search Ctrl+K */}
            <button
              onClick={() => {
                sound.click();
                setCommandPaletteOpen(true);
              }}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 border border-white/30 hover:border-white text-white/80 hover:text-white text-xs transition-colors"
              title="Search workspace (Ctrl + K)"
            >
              <Search size={13} className="text-[#A1A1AA]" />
              <span className="hidden sm:inline">Search</span>
              <span className="hidden md:inline text-white/40">/</span>
              <span className="hidden md:inline meta-number text-[10px] text-white/50">Ctrl+K</span>
            </button>

            {/* Quick Capture Sticky Note */}
            <button
              onClick={() => {
                sound.click();
                setQuickCaptureOpen(true);
              }}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#A1A1AA] hover:bg-[#D4D4D8] text-black text-xs font-semibold transition-colors"
              title="Quick Capture / Brain Dump (Ctrl+Shift+N)"
            >
              <Plus size={13} strokeWidth={2.5} />
              <span className="hidden sm:inline">Capture</span>
            </button>

            {/* Sound FX Toggle (Desktop/Tablet) */}
            <button
              onClick={toggleSound}
              className={`hidden sm:flex p-1.5 border text-xs transition-colors ${
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
              onClick={() => {
                sound.click();
                setAccessModalOpen(true);
              }}
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 border border-white/30 hover:border-white text-white/80 hover:text-white text-xs transition-colors"
              title="Private Workspace Settings & Invites"
            >
              <ShieldCheck size={13} className="text-[#A1A1AA]" />
              <span className="micro-label">Private</span>
            </button>

            {/* Vijayrajkumar Exclusive Add Member Shortcut */}
            {isVijayrajkumar && (
              <button
                onClick={() => {
                  sound.click();
                  setAccessModalOpen(true);
                }}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 border border-[#A1A1AA] bg-white/5 hover:bg-[#A1A1AA] hover:text-black text-white text-xs font-semibold transition-colors"
                title="Vijayrajkumar Authorization: Add New Member to Database"
              >
                <UserPlus size={13} />
                <span>+ Member</span>
              </button>
            )}

            {/* User Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  sound.click();
                  setUserMenuOpen(!userMenuOpen);
                }}
                className="flex items-center gap-1.5 sm:gap-2 p-1 pl-1.5 pr-2 border border-white/30 hover:border-white transition-colors"
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
                <ChevronDown size={12} className="text-white/60 ml-0.5" />
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
                        <span>+ Onboard New Member</span>
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
                      <span>Customize Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        setAccessModalOpen(true);
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left p-1.5 text-white/80 hover:text-white hover:bg-white/5 flex items-center gap-2"
                    >
                      <ShieldCheck size={12} />
                      <span>Workspace Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left p-1.5 text-white/60 hover:text-white hover:bg-white/10 flex items-center gap-2 border-t border-white/20 mt-1 pt-2"
                    >
                      <LogOut size={12} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button (Hamburger / Drawer) */}
            <button
              onClick={() => {
                sound.click();
                setMobileMenuOpen(true);
              }}
              className="md:hidden p-1.5 border border-white/30 hover:border-white text-white transition-colors"
              title="Open Navigation Menu"
            >
              <Grid size={16} />
            </button>
          </div>
        </div>

        {/* Desktop / Tablet Slash-separated Editorial Navigation */}
        <div className="hidden md:block bg-[#000000] border-t border-white/20 overflow-x-auto no-scrollbar">
          <div className="max-w-[1700px] mx-auto px-4 flex items-center gap-3 py-2 text-xs">
            {navItems.map((item, idx) => {
              const isActive = activeTab === item.id;
              return (
                <React.Fragment key={item.id}>
                  <button
                    onClick={() => {
                      sound.click();
                      setActiveTab(item.id);
                    }}
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

      {/* MOBILE BOTTOM NAVIGATION BAR (Fixed, thumb-friendly, high frequency) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#000000]/95 backdrop-blur-md border-t border-white/20 px-1 py-1.5 flex items-center justify-around pb-safe">
        {mobilePrimaryItems.map(item => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                sound.click();
                setActiveTab(item.id);
              }}
              className={`flex flex-col items-center justify-center p-1.5 min-w-[58px] transition-colors ${
                isActive ? 'text-white' : 'text-white/50 hover:text-white'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-[#A1A1AA]' : ''} />
              <span className={`text-[10px] mt-0.5 tracking-tight font-medium ${isActive ? 'text-white font-bold' : 'text-white/50'}`}>
                {item.label}
              </span>
            </button>
          );
        })}

        {/* More Modules Drawer Trigger */}
        <button
          onClick={() => {
            sound.click();
            setMobileMenuOpen(true);
          }}
          className={`flex flex-col items-center justify-center p-1.5 min-w-[58px] transition-colors ${
            !isPrimaryActive ? 'text-white' : 'text-white/50 hover:text-white'
          }`}
        >
          <Grid size={18} className={!isPrimaryActive ? 'text-[#A1A1AA]' : ''} />
          <span className={`text-[10px] mt-0.5 tracking-tight font-medium ${!isPrimaryActive ? 'text-white font-bold' : 'text-white/50'}`}>
            More
          </span>
        </button>
      </nav>

      {/* MOBILE FULL-SCREEN MODULES DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col p-4 md:hidden overflow-y-auto">
          {/* Drawer Top Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/20">
            <BrandPatchBadge size="sm" />
            <button
              onClick={() => {
                sound.click();
                setMobileMenuOpen(false);
              }}
              className="p-1.5 border border-white/30 text-white hover:border-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Active User Card */}
          <div className="my-4 p-3 border border-white/20 bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <PatchAvatar user={currentUser} size="sm" showStatus />
              <div>
                <span className="text-xs font-bold text-white block">{currentUser.name}</span>
                <span className="meta-number text-[10px] text-[#A1A1AA]">/{currentUser.callsign}</span>
              </div>
            </div>
            <button
              onClick={() => {
                setUserMenuOpen(true);
                setMobileMenuOpen(false);
              }}
              className="px-2.5 py-1 border border-white/30 text-[10px] text-white uppercase font-bold"
            >
              Switch
            </button>
          </div>

          {/* Modules Grid */}
          <div className="space-y-2 flex-1">
            <span className="text-[10px] text-white/50 uppercase tracking-wider block mb-2">
              Workspace Modules
            </span>
            <div className="grid grid-cols-2 gap-2">
              {navItems.map(item => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      sound.click();
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2.5 p-3 text-left border transition-all ${
                      isActive
                        ? 'border-[#A1A1AA] bg-white text-black font-bold'
                        : 'border-white/20 bg-black text-white hover:border-white/40'
                    }`}
                  >
                    <Icon size={16} className={isActive ? 'text-black' : 'text-[#A1A1AA]'} />
                    <span className="text-xs">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile Footer Shortcuts */}
          <div className="pt-4 mt-6 border-t border-white/20 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  toggleSound();
                }}
                className="flex-1 flex items-center justify-center gap-1.5 p-2 border border-white/20 text-xs text-white"
              >
                {workspaceConfig.soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
                <span>Sound: {workspaceConfig.soundEnabled ? 'ON' : 'OFF'}</span>
              </button>

              <button
                onClick={() => {
                  setAccessModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 p-2 border border-white/20 text-xs text-white"
              >
                <ShieldCheck size={13} />
                <span>Clearance</span>
              </button>
            </div>

            {isVijayrajkumar && (
              <button
                onClick={() => {
                  setAccessModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-1.5 p-2 bg-[#A1A1AA] text-black font-bold text-xs uppercase"
              >
                <UserPlus size={13} />
                <span>+ Add Team Member</span>
              </button>
            )}

            <button
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-1.5 p-2 border border-white/20 text-xs text-white/60 hover:text-white"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
