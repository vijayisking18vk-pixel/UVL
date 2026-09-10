import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { PatchAvatar } from '../common/PatchAvatar';
import { sound } from '../../utils/sound';
import {
  Sparkles,
  Check,
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
    reorderWidgets
  } = useWorkspace();

  // Local customization draft
  const [name, setName] = useState(currentUser.name);
  const [handle, setHandle] = useState(currentUser.handle);
  const [callsign, setCallsign] = useState(currentUser.callsign);
  const [avatarEmblem, setAvatarEmblem] = useState(currentUser.avatarEmblem);
  const [avatarBg, setAvatarBg] = useState(currentUser.avatarBg || '#000000');
  const [avatarStitch, setAvatarStitch] = useState(currentUser.avatarStitch || '#A1A1AA');
  const [isSaved, setIsSaved] = useState(false);

  // Widget management
  const availableWidgets = [
    { id: 'tasks', label: 'Active Tasks' },
    { id: 'calendar', label: 'Upcoming Sessions' },
    { id: 'pulse', label: 'Team Pulse & Status' },
    { id: 'notes', label: 'Knowledge Notes' },
    { id: 'mentions', label: 'Activity & Pings' }
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
    { label: 'Refined Silver', hex: '#A1A1AA' },
    { label: 'Pure White', hex: '#FFFFFF' },
    { label: 'Silver Mono', hex: '#CCCCCC' },
    { label: 'Signal Cyan', hex: '#00D4FF' },
    { label: 'Alert Crimson', hex: '#FF3333' },
    { label: 'Deep Black', hex: '#000000' }
  ];

  const fabricColors = [
    { label: 'Pure Black', hex: '#000000' },
    { label: 'Carbon Weave', hex: '#111111' },
    { label: 'Night Void', hex: '#0A0A0A' },
    { label: 'Pure White', hex: '#FFFFFF' }
  ];

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    sound.taskComplete();
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#A1A1AA', '#FFFFFF', '#000000']
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
    <div className="space-y-12 pb-16">
      {/* Top Editorial Header */}
      <section className="border-b border-white/20 pb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="text-[11px] font-mono tracking-widest uppercase text-white/50 mb-3 flex items-center gap-2">
              <span>operator</span>
              <span>/</span>
              <span className="text-[#A1A1AA]">identity badge & preferences</span>
              <span>/</span>
              <span>customization</span>
            </div>
            <h1 className="headline-section text-white font-bold tracking-tight">
              Patch identity & profile.
            </h1>
            <p className="text-white/60 text-sm mt-2 max-w-xl">
              Design your embroidered velcro callsign patch, personalize operator credentials, and reorder dashboard widgets.
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: LIVE EMBROIDERED PATCH PREVIEW */}
        <div className="lg:col-span-5 border border-white/20 bg-black p-6 space-y-6">
          <div className="pb-3 border-b border-white/20 flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Tactical badge preview
            </h3>
            <span className="font-mono text-[10px] text-[#A1A1AA] border border-[#A1A1AA] px-2 py-0.5 font-bold uppercase">
              {callsign || 'UVL-OP'}
            </span>
          </div>

          {/* PHYSICAL EMBROIDERED BADGE DISPLAY */}
          <div className="p-10 border border-white/20 bg-black flex flex-col items-center justify-center relative overflow-hidden">
            <div
              className="relative w-64 h-36 border-2 flex flex-col items-center justify-center p-4 transition-all"
              style={{
                backgroundColor: avatarBg,
                borderColor: avatarStitch,
                boxShadow: `0 0 0 1px ${avatarStitch}`
              }}
            >
              {/* Overlock Stitched Inner Border */}
              <div
                className="absolute inset-[4px] pointer-events-none border border-dashed"
                style={{ borderColor: `${avatarStitch}90` }}
              />

              {/* Emblem Icon */}
              <div className="relative z-10 mb-2">
                <PatchAvatar user={draftUser} size="lg" />
              </div>

              {/* Callsign Monospace Plate */}
              <div className="relative z-10 text-center leading-tight">
                <span className={`text-xl font-bold uppercase tracking-widest block font-brand-logo ${avatarBg === '#FFFFFF' ? 'text-black' : 'text-white'}`}>
                  {callsign || 'OPERATOR'}
                </span>
                <span className={`text-[11px] font-mono uppercase tracking-wider block ${avatarBg === '#FFFFFF' ? 'text-black/60' : 'text-white/60'}`}>
                  {name || 'UNFOUNDED LAB'}
                </span>
              </div>
            </div>

            <p className="text-[11px] font-mono text-white/50 mt-4 text-center">
              Monochrome high-contrast identity badge with sharp edges.
            </p>
          </div>

          {/* Active Operator Credentials */}
          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            <div className="p-3 border border-white/20 bg-black">
              <span className="text-[10px] text-white/50 uppercase block mb-1">Handle</span>
              <span className="text-white font-bold">{handle}</span>
            </div>
            <div className="p-3 border border-white/20 bg-black">
              <span className="text-[10px] text-white/50 uppercase block mb-1">Callsign</span>
              <span className="text-[#A1A1AA] font-bold">{currentUser.callsign}</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CONTROLS & WIDGET CONFIG */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* PROFILE & PATCH EDITOR FORM */}
          <div className="border border-white/20 bg-black p-6 space-y-6">
            <div className="pb-3 border-b border-white/20 flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                Credentials & emblem settings
              </h3>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5 font-mono text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-white/50 mb-1 uppercase text-[10px]">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black border border-white/20 px-3 py-2 text-white focus:outline-none focus:border-[#A1A1AA]"
                  />
                </div>

                <div>
                  <label className="block text-white/50 mb-1 uppercase text-[10px]">Chat @Handle</label>
                  <input
                    type="text"
                    required
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    className="w-full bg-black border border-white/20 px-3 py-2 text-white focus:outline-none focus:border-[#A1A1AA]"
                  />
                </div>

                <div>
                  <label className="block text-white/50 mb-1 uppercase text-[10px]">Callsign</label>
                  <input
                    type="text"
                    required
                    value={callsign}
                    onChange={(e) => setCallsign(e.target.value.toUpperCase())}
                    placeholder="e.g. VANCE-01"
                    className="w-full bg-black border border-white/20 px-3 py-2 text-white font-bold focus:outline-none focus:border-[#A1A1AA]"
                  />
                </div>
              </div>

              {/* Emblem Selection */}
              <div>
                <label className="block text-white/50 mb-2 uppercase text-[10px]">
                  Select center emblem
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
                        className={`p-3 border flex flex-col items-center justify-center gap-1.5 transition-all ${
                          isSelected
                            ? 'border-[#A1A1AA] bg-white text-black font-bold'
                            : 'border-white/20 bg-black text-white/60 hover:text-white hover:border-white'
                        }`}
                      >
                        <Icon size={18} />
                        <span className="text-[9px] leading-tight">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stitch Color Picker */}
              <div>
                <label className="block text-white/50 mb-2 uppercase text-[10px]">
                  Border overlock thread color
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {stitchColors.map(c => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setAvatarStitch(c.hex)}
                      className={`px-3 py-1.5 border flex items-center gap-2 transition-all ${
                        avatarStitch === c.hex
                          ? 'border-[#A1A1AA] bg-white text-black font-bold'
                          : 'border-white/20 bg-black text-white/70 hover:border-white'
                      }`}
                    >
                      <span className="w-3 h-3 border border-black/20" style={{ backgroundColor: c.hex }} />
                      <span className="text-[10px]">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fabric Base */}
              <div>
                <label className="block text-white/50 mb-2 uppercase text-[10px]">
                  Patch base fabric
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {fabricColors.map(f => (
                    <button
                      key={f.hex}
                      type="button"
                      onClick={() => setAvatarBg(f.hex)}
                      className={`px-3 py-1.5 border flex items-center gap-2 transition-all ${
                        avatarBg === f.hex
                          ? 'border-[#A1A1AA] bg-white text-black font-bold'
                          : 'border-white/20 bg-black text-white/70 hover:border-white'
                      }`}
                    >
                      <span className="w-3 h-3 border border-white/40" style={{ backgroundColor: f.hex }} />
                      <span className="text-[10px]">{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-white/20 flex items-center justify-between">
                <span className="text-[#A1A1AA] font-bold">
                  {isSaved && '✓ Identity badge saved successfully!'}
                </span>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#A1A1AA] hover:bg-[#D4D4D8] text-black font-semibold text-xs font-medium uppercase tracking-wider flex items-center gap-2 transition-all"
                >
                  <Check size={14} />
                  <span>Save changes</span>
                </button>
              </div>
            </form>
          </div>

          {/* DASHBOARD WIDGET REARRANGEMENT */}
          <div className="border border-white/20 bg-black p-6 space-y-4">
            <div className="pb-3 border-b border-white/20 flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                Dashboard widget priority
              </h3>
              <span className="text-[11px] font-mono text-white/50">
                Reorder cards on command center home
              </span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              {widgetOrder.map((widgetId, idx) => {
                const widgetMeta = availableWidgets.find(w => w.id === widgetId);
                return (
                  <div
                    key={widgetId}
                    className="p-3 border border-white/20 bg-black flex items-center justify-between gap-3 hover:border-white transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 border border-white/20 flex items-center justify-center text-[10px] text-[#A1A1AA] font-bold">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-white">
                        {widgetMeta?.label || widgetId}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveWidget(idx, 'up')}
                        className="p-1 border border-white/20 hover:border-white disabled:opacity-30 text-white"
                        title="Move Up"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === widgetOrder.length - 1}
                        onClick={() => moveWidget(idx, 'down')}
                        className="p-1 border border-white/20 hover:border-white disabled:opacity-30 text-white"
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
