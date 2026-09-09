import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { PatchAvatar } from '../common/PatchAvatar';
import { sound } from '../../utils/sound';
import {
  Sparkles,
  Shield,
  Palette,
  Layout,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  Type,
  Crosshair,
  Cpu,
  Radio,
  Zap,
  Compass,
  ShieldAlert,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const PatchAvatarLab: React.FC = () => {
  const {
    currentUser,
    updateUser,
    workspaceConfig,
    toggleSound,
    togglePixelFont,
    reorderWidgets
  } = useWorkspace();

  // Local customization draft
  const [name, setName] = useState(currentUser.name);
  const [handle, setHandle] = useState(currentUser.handle);
  const [callsign, setCallsign] = useState(currentUser.callsign);
  const [avatarEmblem, setAvatarEmblem] = useState(currentUser.avatarEmblem);
  const [avatarBg, setAvatarBg] = useState(currentUser.avatarBg || '#14171C');
  const [avatarStitch, setAvatarStitch] = useState(currentUser.avatarStitch || '#E5B869');
  const [isSaved, setIsSaved] = useState(false);

  // Widget management
  const availableWidgets = [
    { id: 'tasks', label: 'My Active Tasks' },
    { id: 'calendar', label: 'Upcoming Engagements' },
    { id: 'pulse', label: 'Team Pulse & Status' },
    { id: 'notes', label: 'Operator Scratchpad' },
    { id: 'mentions', label: 'Tactical Pings & Mentions' }
  ];

  const [widgetOrder, setWidgetOrder] = useState<string[]>(
    workspaceConfig.dashboardWidgets || ['tasks', 'calendar', 'pulse', 'notes', 'mentions']
  );

  const emblemOptions = [
    { id: 'crosshair', label: 'Crosshair', icon: Crosshair },
    { id: 'chip', label: 'Silicon CPU', icon: Cpu },
    { id: 'radar', label: 'Radar Sweep', icon: Radio },
    { id: 'bolt', label: 'High Voltage', icon: Zap },
    { id: 'compass', label: 'Tactical Compass', icon: Compass },
    { id: 'dagger', label: 'Defense Enclave', icon: ShieldAlert }
  ] as const;

  const stitchColors = [
    { label: 'Gold Amber', hex: '#E5B869' },
    { label: 'Bone Cream', hex: '#EDE8DB' },
    { label: 'Cyan Laser', hex: '#4EC5D4' },
    { label: 'Terminal Green', hex: '#5EBA7D' },
    { label: 'Crimson Alert', hex: '#E05A47' },
    { label: 'Venture Violet', hex: '#9D7BFF' }
  ];

  const fabricColors = [
    { label: 'Stealth Twill', hex: '#14171C' },
    { label: 'Carbon Weave', hex: '#1B1F26' },
    { label: 'Deep Tactical', hex: '#0E1013' },
    { label: 'Spec-Ops Olive', hex: '#19221C' },
    { label: 'Vault Crimson', hex: '#261717' }
  ];

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    sound.taskComplete();
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#E5B869', '#EDE8DB', '#4EC5D4']
    });

    updateUser({
      ...currentUser,
      name: name.trim(),
      handle: handle.trim(),
      callsign: callsign.trim().toUpperCase(),
      avatarEmblem,
      avatarBg,
      avatarStitch
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const moveWidget = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= widgetOrder.length) return;

    const updated = [...widgetOrder];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    setWidgetOrder(updated);
    reorderWidgets(updated);
  };

  // Draft dummy user for live patch rendering
  const draftUser = {
    ...currentUser,
    name,
    handle,
    callsign,
    avatarEmblem,
    avatarBg,
    avatarStitch
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#14171B] border border-[#2A303A] p-4 patch-chamfer-md shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1F242C] border border-[#3A4250] flex items-center justify-center patch-chamfer-sm text-[#E5B869]">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="font-patch text-2xl font-bold tracking-wider text-[#EDE8DB] uppercase">
                Patch Identity & Command Personalization
              </h2>
              <p className="font-mono text-xs text-[#9E9A8E]">
                Design your embroidered velcro callsign patch, customize theme typography, and organize dashboard widgets.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: LIVE EMBROIDERED PATCH PREVIEW */}
        <div className="lg:col-span-5 bg-[#14171B] border border-[#2A303A] p-5 patch-chamfer-md shadow-md space-y-5">
          <div className="pb-3 border-b border-[#242930] flex items-center justify-between">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#9E9A8E]">
              Tactical Morale Patch Studio
            </h3>
            <span className="font-mono text-[10px] text-[#E5B869] border border-[#E5B869]/40 px-1.5 py-0.2">
              CALLSIGN: {callsign || 'UVL-OP'}
            </span>
          </div>

          {/* LARGE PHYSICAL PATCH DISPLAY */}
          <div className="p-8 bg-[#0C0E11] border border-[#252B36] patch-chamfer-md flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
            {/* Background fabric weave */}
            <div 
              className="absolute inset-0 opacity-40 pointer-events-none"
              style={{
                backgroundImage: 'repeating-linear-gradient(45deg, #1f242d 0, #1f242d 2px, transparent 0, transparent 6px)'
              }}
            />

            {/* The Embroidered Badge */}
            <div
              className="relative w-64 h-36 patch-pill flex flex-col items-center justify-center shadow-2xl p-4 transition-all duration-200"
              style={{
                backgroundColor: avatarBg,
                boxShadow: `0 8px 24px rgba(0,0,0,0.8), inset 0 0 0 2px ${avatarStitch}`
              }}
            >
              {/* Overlock Stitched Border */}
              <div
                className="absolute inset-[4px] patch-pill pointer-events-none border-2 border-dashed"
                style={{ borderColor: `${avatarStitch}90` }}
              />

              {/* Twill texture */}
              <div 
                className="absolute inset-0 patch-pill pointer-events-none opacity-20"
                style={{
                  backgroundImage: 'repeating-linear-gradient(-45deg, #fff 0, #fff 1px, transparent 0, transparent 4px)'
                }}
              />

              {/* Emblem Icon in Center */}
              <div className="relative z-10 mb-2">
                <PatchAvatar user={draftUser} size="lg" />
              </div>

              {/* Callsign Monospace Plate */}
              <div className="relative z-10 text-center leading-tight">
                <span className="font-patch text-xl font-bold uppercase tracking-widest text-[#EDE8DB] block drop-shadow">
                  {callsign || 'OPERATOR'}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#D8D2C2] block">
                  {name || 'UNFOUNDED LAB'}
                </span>
              </div>
            </div>

            <p className="font-mono text-[11px] text-[#9E9A8E] mt-4 z-10 text-center">
              Embroidered 45° chamfered patch with tactile thread overlock edge.
            </p>
          </div>

          {/* Quick Stats on Active Operator */}
          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            <div className="p-3 bg-[#0C0E11] border border-[#262C36] patch-chamfer-sm">
              <span className="text-[10px] text-[#9E9A8E] uppercase block">Assigned Handle</span>
              <span className="text-[#E5B869] font-bold">{handle}</span>
            </div>
            <div className="p-3 bg-[#0C0E11] border border-[#262C36] patch-chamfer-sm">
              <span className="text-[10px] text-[#9E9A8E] uppercase block">Callsign</span>
              <span className="text-[#5EBA7D] font-bold">{currentUser.callsign}</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CUSTOMIZATION CONTROLS & WIDGET CONFIG */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* PROFILE & PATCH EDITOR FORM */}
          <div className="bg-[#14171B] border border-[#2A303A] p-5 patch-chamfer-md shadow-md space-y-4">
            <div className="pb-3 border-b border-[#242930] flex items-center justify-between">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#EDE8DB]">
                Operator Credentials & Emblem Config
              </h3>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#9E9A8E] mb-1 uppercase text-[10px]">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#0C0E11] border border-[#2D3440] px-3 py-1.5 text-xs text-[#EDE8DB] patch-chamfer-sm"
                  />
                </div>

                <div>
                  <label className="block text-[#9E9A8E] mb-1 uppercase text-[10px]">Chat @Handle</label>
                  <input
                    type="text"
                    required
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    className="w-full bg-[#0C0E11] border border-[#2D3440] px-3 py-1.5 text-xs text-[#EDE8DB] patch-chamfer-sm"
                  />
                </div>

                <div>
                  <label className="block text-[#9E9A8E] mb-1 uppercase text-[10px]">Patch Callsign</label>
                  <input
                    type="text"
                    required
                    value={callsign}
                    onChange={(e) => setCallsign(e.target.value.toUpperCase())}
                    placeholder="e.g. VANCE-01"
                    className="w-full bg-[#0C0E11] border border-[#2D3440] px-3 py-1.5 text-xs text-[#EDE8DB] patch-chamfer-sm font-bold"
                  />
                </div>
              </div>

              {/* Emblem Selection */}
              <div>
                <label className="block text-[#9E9A8E] mb-1.5 uppercase text-[10px]">
                  Select Patch Center Emblem
                </label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {emblemOptions.map(opt => {
                    const Icon = opt.icon;
                    const isSelected = avatarEmblem === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setAvatarEmblem(opt.id as any)}
                        className={`p-2.5 border patch-chamfer-sm flex flex-col items-center justify-center gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-[#E5B869]/20 border-[#E5B869] text-[#E5B869]'
                            : 'bg-[#0C0E11] border-[#292F3B] text-[#9E9A8E] hover:text-[#EDE8DB]'
                        }`}
                      >
                        <Icon size={18} />
                        <span className="text-[9px] font-mono leading-tight">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stitch Color Picker */}
              <div>
                <label className="block text-[#9E9A8E] mb-1.5 uppercase text-[10px]">
                  Embroidered Overlock Thread Color
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {stitchColors.map(c => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setAvatarStitch(c.hex)}
                      className={`px-3 py-1.5 border patch-chamfer-sm flex items-center gap-2 transition-all ${
                        avatarStitch === c.hex
                          ? 'border-white bg-[#1F242C] text-white shadow-sm'
                          : 'border-[#292F3B] bg-[#0C0E11] text-[#9E9A8E]'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-none" style={{ backgroundColor: c.hex }} />
                      <span className="text-[10px]">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fabric Twill Base */}
              <div>
                <label className="block text-[#9E9A8E] mb-1.5 uppercase text-[10px]">
                  Patch Base Cloth Fabric
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {fabricColors.map(f => (
                    <button
                      key={f.hex}
                      type="button"
                      onClick={() => setAvatarBg(f.hex)}
                      className={`px-3 py-1.5 border patch-chamfer-sm flex items-center gap-2 transition-all ${
                        avatarBg === f.hex
                          ? 'border-[#E5B869] bg-[#1F242C] text-[#EDE8DB]'
                          : 'border-[#292F3B] bg-[#0C0E11] text-[#9E9A8E]'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-none border border-white/30" style={{ backgroundColor: f.hex }} />
                      <span className="text-[10px]">{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#242930] flex items-center justify-between">
                <span className="text-[#5EBA7D] font-bold">
                  {isSaved && '✓ Identity patch committed to lab registry!'}
                </span>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#E5B869] hover:bg-[#F0C57A] text-[#0B0C0E] font-mono text-xs font-bold patch-chamfer-sm transition-transform active:scale-95 shadow-md flex items-center gap-1.5"
                >
                  <Check size={14} strokeWidth={3} />
                  Save Changes
                </button>
              </div>
            </form>
          </div>

          {/* DASHBOARD WIDGET REARRANGEMENT */}
          <div className="bg-[#14171B] border border-[#2A303A] p-5 patch-chamfer-md shadow-md space-y-4">
            <div className="pb-3 border-b border-[#242930] flex items-center justify-between">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#EDE8DB]">
                Rearrange Personal Dashboard Widgets
              </h3>
              <span className="font-mono text-[10px] text-[#9E9A8E]">
                Reorder priority cards on your home screen
              </span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              {widgetOrder.map((widgetId, idx) => {
                const widgetMeta = availableWidgets.find(w => w.id === widgetId);
                return (
                  <div
                    key={widgetId}
                    className="p-3 bg-[#181B20] border border-[#252B35] patch-chamfer-sm flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 bg-[#0C0E11] border border-[#2C333F] flex items-center justify-center text-[10px] text-[#E5B869] font-bold">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-[#EDE8DB]">
                        {widgetMeta?.label || widgetId}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveWidget(idx, 'up')}
                        className="p-1 bg-[#0C0E11] hover:bg-[#20252D] disabled:opacity-30 border border-[#2C333F] text-[#EDE8DB] patch-chamfer-sm"
                        title="Move Up"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === widgetOrder.length - 1}
                        onClick={() => moveWidget(idx, 'down')}
                        className="p-1 bg-[#0C0E11] hover:bg-[#20252D] disabled:opacity-30 border border-[#2C333F] text-[#EDE8DB] patch-chamfer-sm"
                        title="Move Down"
                      >
                        <ArrowDown size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

