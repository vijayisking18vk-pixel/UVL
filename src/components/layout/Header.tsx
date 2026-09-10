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
      <header className="sticky top-0 z-40 bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#E5E5E7] transition-all">
        {/* Top Apple Utility Bar */}
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
          {/* Left Brand Badge */}
          <div className="flex items-center gap-3 sm:gap-4">
            <BrandPatchBadge size="sm" />
            <div className="hidden lg:flex items-center gap-2 border-l border-[#E5E5E7] pl-3 py-0.5 text-xs text-[#6E6E73]">
              <span className="font-medium text-black">Private Operations</span>
              <span className="text-[#D1D1D6]">•</span>
              <span className="meta-number text-[11px] text-[#6E6E73]">Index 001</span>
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
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E5E5E7] bg-[#F5F5F7] hover:bg-[#EBEBED] text-black text-xs font-medium transition-all"
              title="Search workspace (⌘K / Ctrl+K)"
            >
              <Search size={13} className="text-[#6E6E73]" />
              <span className="hidden sm:inline">Search</span>
              <span className="hidden md:inline meta-number text-[10px] text-[#6E6E73] bg-[#E5E5E7] px-1.5 py-0.5 rounded-full">⌘K</span>
            </button>

            {/* Quick Capture Sticky Note */}
            <button
              onClick={() => {
                sound.click();
                setQuickCaptureOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-medium transition-all shadow-sm"
              title="Quick Capture (⌘⇧N)"
            >
              <Plus size={13} strokeWidth={2.5} />
              <span className="hidden sm:inline">Capture</span>
            </button>

            {/* Sound FX Toggle (Desktop/Tablet) */}
            <button
              onClick={toggleSound}
              className={`hidden sm:flex p-2 rounded-full border text-xs transition-all ${
                workspaceConfig.soundEnabled
                  ? 'border-[#E5E5E7] bg-[#F5F5F7] text-black hover:bg-[#EBEBED]'
                  : 'border-[#E5E5E7] text-[#6E6E73] hover:text-black'
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
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E5E5E7] bg-[#F5F5F7] hover:bg-[#EBEBED] text-black text-xs font-medium transition-all"
              title="Private Workspace Settings & Invites"
            >
              <ShieldCheck size={13} className="text-[#6E6E73]" />
              <span className="micro-label text-black">Private</span>
            </button>

            {/* Vijayrajkumar Exclusive Add Member Shortcut */}
            {isVijayrajkumar && (
              <button
                onClick={() => {
                  sound.click();
                  setAccessModalOpen(true);
                }}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-black bg-black text-white hover:bg-neutral-800 text-xs font-medium transition-all"
                title="Vijayrajkumar Authorization: Add New Member"
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
                className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full border border-[#E5E5E7] bg-[#F5F5F7] hover:bg-[#EBEBED] transition-all"
              >
                <PatchAvatar user={currentUser} size="sm" showStatus />
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-black leading-tight">
                    {currentUser.name}
                  </span>
                  <span className="meta-number text-[9px] text-[#6E6E73]">
                    /{currentUser.callsign}
                  </span>
                </div>
                <ChevronDown size={12} className="text-[#6E6E73] ml-0.5" />
              </button>

              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-white border border-[#E5E5E7] rounded-2xl p-3 z-50 shadow-xl"
                  onMouseLeave={() => setUserMenuOpen(false)}
                >
                  <div className="pb-2 border-b border-[#E5E5E7] mb-2 px-1">
                    <span className="micro-label text-[#6E6E73] block">
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
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-all ${
                          u.id === currentUser.id
                            ? 'bg-[#F5F5F7] text-black font-semibold'
                            : 'hover:bg-[#F5F5F7] text-[#6E6E73] hover:text-black'
                        }`}
                      >
                        <PatchAvatar user={u} size="sm" showStatus showCallsign />
                      </button>
                    ))}
                  </div>

                  <div className="mt-2 pt-2 border-t border-[#E5E5E7] flex flex-col gap-1 text-xs">
                    {isVijayrajkumar && (
                      <button
                        onClick={() => {
                          setAccessModalOpen(true);
                          setUserMenuOpen(false);
                        }}
                        className="w-full text-left p-2 rounded-xl text-black hover:bg-[#F5F5F7] flex items-center gap-2 font-medium"
                      >
                        <UserPlus size={13} className="text-black" />
                        <span>+ Onboard New Member</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setActiveTab('personalization');
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left p-2 rounded-xl text-[#6E6E73] hover:text-black hover:bg-[#F5F5F7] flex items-center gap-2"
                    >
                      <Sparkles size={13} />
                      <span>Customize Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        setAccessModalOpen(true);
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left p-2 rounded-xl text-[#6E6E73] hover:text-black hover:bg-[#F5F5F7] flex items-center gap-2"
                    >
                      <ShieldCheck size={13} />
                      <span>Workspace Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left p-2 rounded-xl text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-[#E5E5E7] mt-1 pt-2 font-medium"
                    >
                      <LogOut size={13} />
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
              className="md:hidden p-2 rounded-full border border-[#E5E5E7] bg-[#F5F5F7] hover:bg-[#EBEBED] text-black transition-all"
              title="Open Navigation Menu"
            >
              <Grid size={16} />
            </button>
          </div>
        </div>

        {/* Desktop Apple Pill Navigation */}
        <div className="hidden md:block bg-[#FFFFFF]/95 border-t border-[#E5E5E7] overflow-x-auto no-scrollbar py-2 px-4">
          <div className="max-w-[1200px] mx-auto flex items-center gap-1.5 text-xs">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    sound.click();
                    setActiveTab(item.id);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all ${
                    isActive
                      ? 'bg-black text-white font-semibold shadow-sm'
                      : 'text-[#6E6E73] hover:text-black hover:bg-[#F5F5F7] font-medium'
                  }`}
                >
                  <Icon size={13} className={isActive ? 'text-white' : 'text-[#6E6E73]'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* MOBILE APPLE BOTTOM NAVIGATION BAR (Fixed, thumb-friendly 44px+ tap targets) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-md border-t border-[#E5E5E7] px-2 py-1 flex items-center justify-around pb-safe">
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
              className={`flex flex-col items-center justify-center p-2 min-w-[56px] min-h-[44px] transition-all rounded-xl ${
                isActive ? 'text-black font-semibold' : 'text-[#6E6E73] hover:text-black'
              }`}
            >
              <Icon size={19} className={isActive ? 'text-black' : 'text-[#6E6E73]'} />
              <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? 'text-black font-semibold' : 'text-[#6E6E73]'}`}>
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
          className={`flex flex-col items-center justify-center p-2 min-w-[56px] min-h-[44px] transition-all rounded-xl ${
            !isPrimaryActive ? 'text-black font-semibold' : 'text-[#6E6E73] hover:text-black'
          }`}
        >
          <Grid size={19} className={!isPrimaryActive ? 'text-black' : 'text-[#6E6E73]'} />
          <span className={`text-[10px] mt-0.5 tracking-tight ${!isPrimaryActive ? 'text-black font-semibold' : 'text-[#6E6E73]'}`}>
            More
          </span>
        </button>
      </nav>

      {/* MOBILE APPLE FULL-SCREEN MODULES DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-[#FFFFFF]/95 backdrop-blur-lg flex flex-col p-6 md:hidden overflow-y-auto">
          {/* Drawer Top Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E7]">
            <BrandPatchBadge size="sm" />
            <button
              onClick={() => {
                sound.click();
                setMobileMenuOpen(false);
              }}
              className="p-2 rounded-full border border-[#E5E5E7] bg-[#F5F5F7] text-black hover:bg-[#EBEBED]"
            >
              <X size={18} />
            </button>
          </div>

          {/* Active User Card */}
          <div className="my-5 p-4 rounded-2xl border border-[#E5E5E7] bg-[#F5F5F7] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PatchAvatar user={currentUser} size="sm" showStatus />
              <div>
                <span className="text-sm font-semibold text-black block">{currentUser.name}</span>
                <span className="meta-number text-[11px] text-[#6E6E73]">/{currentUser.callsign}</span>
              </div>
            </div>
            <button
              onClick={() => {
                setUserMenuOpen(true);
                setMobileMenuOpen(false);
              }}
              className="px-3 py-1.5 rounded-full border border-[#E5E5E7] bg-white text-xs text-black font-medium"
            >
              Switch
            </button>
          </div>

          {/* Modules Grid */}
          <div className="space-y-3 flex-1">
            <span className="text-xs font-medium text-[#6E6E73] block">
              Workspace Modules
            </span>
            <div className="grid grid-cols-2 gap-2.5">
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
                    className={`flex items-center gap-2.5 p-3.5 rounded-2xl text-left border transition-all ${
                      isActive
                        ? 'border-black bg-black text-white font-semibold shadow-sm'
                        : 'border-[#E5E5E7] bg-[#F5F5F7] text-black hover:bg-[#EBEBED]'
                    }`}
                  >
                    <Icon size={17} className={isActive ? 'text-white' : 'text-[#6E6E73]'} />
                    <span className="text-xs font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile Footer Shortcuts */}
          <div className="pt-6 mt-6 border-t border-[#E5E5E7] space-y-2.5">
            <div className="flex items-center justify-between gap-2.5">
              <button
                onClick={() => {
                  toggleSound();
                }}
                className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] text-xs text-black font-medium"
              >
                {workspaceConfig.soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                <span>Sound: {workspaceConfig.soundEnabled ? 'ON' : 'OFF'}</span>
              </button>

              <button
                onClick={() => {
                  setAccessModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] text-xs text-black font-medium"
              >
                <ShieldCheck size={14} />
                <span>Security</span>
              </button>
            </div>

            {isVijayrajkumar && (
              <button
                onClick={() => {
                  setAccessModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-black text-white font-medium text-xs"
              >
                <UserPlus size={14} />
                <span>+ Add Team Member</span>
              </button>
            )}

            <button
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-[#E5E5E7] text-xs text-red-600 font-medium"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
