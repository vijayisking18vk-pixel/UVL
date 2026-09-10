import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { PatchAvatar } from '../common/PatchAvatar';
import { sound } from '../../utils/sound';
import {
  ShieldCheck,
  Lock,
  Copy,
  Check,
  Download,
  Upload,
  RefreshCw,
  X,
  UserPlus,
  AlertCircle,
  KeyRound,
  CheckCircle2
} from 'lucide-react';

export const AccessControlModal: React.FC = () => {
  const {
    accessModalOpen,
    setAccessModalOpen,
    workspaceConfig,
    users,
    currentUser,
    isVijayrajkumar,
    addMember,
    exportWorkspaceData,
    importWorkspaceData,
    resetWorkspaceData
  } = useWorkspace();

  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // New Member Provisioning State (Vijayrajkumar exclusive)
  const [showAddMember, setShowAddMember] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCallsign, setNewCallsign] = useState('');
  const [newHandle, setNewHandle] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newEmblem, setNewEmblem] = useState<'crosshair' | 'radar' | 'chip' | 'bolt' | 'compass' | 'dagger' | 'skull'>('crosshair');
  const [isSubmittingMember, setIsSubmittingMember] = useState(false);
  const [memberMessage, setMemberMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!accessModalOpen) return null;

  const handleCopyKey = () => {
    sound.click();
    navigator.clipboard.writeText(workspaceConfig.secretKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyInvite = () => {
    sound.click();
    navigator.clipboard.writeText(`https://unfoundedlab.internal/join?code=${workspaceConfig.inviteCode}`);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importWorkspaceData(content);
      if (success) {
        setImportStatus('✓ Workspace state restored successfully!');
      } else {
        setImportStatus('✗ Failed to parse backup file.');
      }
      setTimeout(() => setImportStatus(null), 3500);
    };
    reader.readAsText(file);
  };

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVijayrajkumar) {
      setMemberMessage({ type: 'error', text: 'Unauthorized: Only Vijayrajkumar has authority to add members.' });
      return;
    }
    if (!newName.trim()) {
      setMemberMessage({ type: 'error', text: 'Please enter operator name.' });
      return;
    }
    if (!newPin.trim() || newPin.trim().length < 4) {
      setMemberMessage({ type: 'error', text: 'PIN code must be at least 4 digits.' });
      return;
    }

    setIsSubmittingMember(true);
    setMemberMessage(null);

    try {
      const generatedCallsign = newCallsign.trim() || `OP-${newName.trim().slice(0, 4).toUpperCase()}`;
      const generatedHandle = newHandle.trim() || `@${newName.trim().toLowerCase().replace(/\s+/g, '')}`;

      await addMember({
        name: newName.trim(),
        handle: generatedHandle.startsWith('@') ? generatedHandle : `@${generatedHandle}`,
        callsign: generatedCallsign,
        pin: newPin.trim(),
        role: 'member',
        avatarEmblem: newEmblem,
        avatarBg: '#000000',
        avatarStitch: '#A1A1AA',
        avatarUrl: `/avatars/${newName.trim().toLowerCase()}.png`,
        status: 'active',
        statusMessage: '',
        lastActive: 'Just now'
      });

      setMemberMessage({
        type: 'success',
        text: `✓ ${newName.trim()} successfully provisioned and saved to live Supabase database! Login PIN: ${newPin.trim()}`
      });
      setNewName('');
      setNewCallsign('');
      setNewHandle('');
      setNewPin('');
      setShowAddMember(false);
    } catch (err: any) {
      setMemberMessage({
        type: 'error',
        text: err?.message || 'Failed to add operator to database.'
      });
    } finally {
      setIsSubmittingMember(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="bg-black border border-white/40 max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto font-mono text-xs text-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/20">
          <div className="flex items-center gap-3">
            <div className="p-2 border border-[#A1A1AA] text-[#A1A1AA]">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold uppercase tracking-wider text-white">
                Private workspace & access control
              </h3>
              <span className="text-[10px] text-white/50">
                INTERNAL OPERATOR ENCLAVE / ZERO PUBLIC REGISTRATION
              </span>
            </div>
          </div>
          <button
            onClick={() => setAccessModalOpen(false)}
            className="text-white/50 hover:text-white p-1"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6">
          {/* PRIVATE ENVIRONMENT BANNER */}
          <div className="p-4 border border-white/20 bg-black space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-white font-bold text-xs uppercase flex items-center gap-1.5">
                <Lock size={13} className="text-[#A1A1AA]" /> Enclave Security Protocol
              </span>
              <span className="text-[10px] text-[#A1A1AA] px-2 py-0.5 border border-[#A1A1AA] uppercase font-bold">
                Hard-locked
              </span>
            </div>
            <p className="text-white/60 text-[11px] leading-relaxed">
              This instance is hard-locked to the Unfounded Venture Lab core partnership and accredited technical operators. Public registration is disabled.
            </p>
          </div>

          {/* INVITE CODE & SECRET KEY */}
          <div className="space-y-4">
            <div>
              <label className="block text-white/50 text-[10px] uppercase mb-1">
                Workspace Invite Token (For Onboarding New Operators)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`https://unfoundedlab.internal/join?code=${workspaceConfig.inviteCode}`}
                  className="flex-1 bg-black border border-white/20 px-3 py-2 text-white font-bold"
                />
                <button
                  onClick={handleCopyInvite}
                  className="px-4 py-2 border border-white/20 hover:border-white text-white flex items-center gap-1.5 uppercase transition-colors"
                >
                  {copiedInvite ? <Check size={13} className="text-[#A1A1AA]" /> : <Copy size={13} />}
                  <span>{copiedInvite ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-white/50 text-[10px] uppercase mb-1">
                Workspace Root Secret Key (Airgap Recovery)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  readOnly
                  value={workspaceConfig.secretKey}
                  className="flex-1 bg-black border border-white/20 px-3 py-2 text-[#A1A1AA] tracking-widest"
                />
                <button
                  onClick={handleCopyKey}
                  className="px-4 py-2 border border-white/20 hover:border-white text-white flex items-center gap-1.5 uppercase transition-colors"
                >
                  {copiedKey ? <Check size={13} className="text-[#A1A1AA]" /> : <Copy size={13} />}
                  <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* OPERATOR ENROLLMENT CLEARANCE (VIJAYRAJKUMAR EXCLUSIVE) */}
          <div className="border border-white/20 p-4 bg-black space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-white flex items-center gap-1.5">
                  <UserPlus size={14} className="text-[#A1A1AA]" /> Member Enrollment Clearance
                </span>
                <span className={`text-[9px] px-1.5 py-0.5 border uppercase font-bold ${
                  isVijayrajkumar
                    ? 'border-[#A1A1AA] text-[#A1A1AA] bg-white/5'
                    : 'border-white/30 text-white/50'
                }`}>
                  {isVijayrajkumar ? 'Authorized: Vijayrajkumar' : 'Locked: Read-Only'}
                </span>
              </div>

              {isVijayrajkumar && (
                <button
                  onClick={() => {
                    sound.click();
                    setShowAddMember(!showAddMember);
                    setMemberMessage(null);
                  }}
                  className="px-3 py-1 bg-[#A1A1AA] hover:bg-[#D4D4D8] text-black text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                >
                  <UserPlus size={11} />
                  <span>{showAddMember ? 'Cancel' : '+ Add Operator'}</span>
                </button>
              )}
            </div>

            {!isVijayrajkumar ? (
              <p className="text-white/50 text-[11px] flex items-center gap-1.5">
                <Lock size={12} className="text-white/40 shrink-0" />
                <span>Roster provisioning is restricted. Only <strong>Vijayrajkumar</strong> possesses authorization to add new members to this enclave.</span>
              </p>
            ) : (
              <p className="text-white/60 text-[11px]">
                As <strong>Vijayrajkumar</strong>, you have exclusive authorization to add and provision new team operators. All added members are saved directly to the live Supabase database.
              </p>
            )}

            {memberMessage && (
              <div className={`p-2.5 border text-xs flex items-center gap-2 ${
                memberMessage.type === 'success'
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                  : 'border-red-500/50 bg-red-500/10 text-red-300'
              }`}>
                {memberMessage.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                <span>{memberMessage.text}</span>
              </div>
            )}

            {/* Add Member Form (Visible only to Vijayrajkumar when toggled) */}
            {isVijayrajkumar && showAddMember && (
              <form onSubmit={handleAddMemberSubmit} className="pt-3 border-t border-white/20 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white/50 text-[10px] uppercase mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kiran Kumar"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      className="w-full bg-black border border-white/30 px-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#A1A1AA]"
                    />
                  </div>

                  <div>
                    <label className="block text-white/50 text-[10px] uppercase mb-1">
                      Callsign / Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. KIRAN-06"
                      value={newCallsign}
                      onChange={e => setNewCallsign(e.target.value)}
                      className="w-full bg-black border border-white/30 px-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#A1A1AA]"
                    />
                  </div>

                  <div>
                    <label className="block text-white/50 text-[10px] uppercase mb-1">
                      Chat Handle
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. @kiran"
                      value={newHandle}
                      onChange={e => setNewHandle(e.target.value)}
                      className="w-full bg-black border border-white/30 px-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#A1A1AA]"
                    />
                  </div>

                  <div>
                    <label className="block text-white/50 text-[10px] uppercase mb-1">
                      Security PIN (4 Digits) *
                    </label>
                    <input
                      type="password"
                      required
                      maxLength={6}
                      placeholder="e.g. 1006"
                      value={newPin}
                      onChange={e => setNewPin(e.target.value)}
                      className="w-full bg-black border border-white/30 px-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#A1A1AA]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/50 text-[10px] uppercase mb-1">
                    Patch Emblem
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {(['crosshair', 'radar', 'chip', 'bolt', 'compass', 'dagger', 'skull'] as const).map(emblem => (
                      <button
                        key={emblem}
                        type="button"
                        onClick={() => setNewEmblem(emblem)}
                        className={`px-2.5 py-1 text-[10px] uppercase font-bold border transition-colors ${
                          newEmblem === emblem
                            ? 'border-[#A1A1AA] bg-white/10 text-white'
                            : 'border-white/20 text-white/50 hover:border-white/40'
                        }`}
                      >
                        {emblem}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddMember(false)}
                    className="px-3 py-1.5 border border-white/20 hover:border-white text-white text-[11px] uppercase transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingMember}
                    className="px-4 py-1.5 bg-[#A1A1AA] hover:bg-[#D4D4D8] disabled:opacity-40 text-black text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                  >
                    <UserPlus size={12} />
                    <span>{isSubmittingMember ? 'Saving to Database...' : 'Save & Onboard Member'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* TEAM ROSTER TABLE */}
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-white/20 mb-3 text-[10px] text-white/50 uppercase">
              <span>Team Roster ({users.length} Members)</span>
              <span>Status</span>
            </div>

            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
              {users.map(u => (
                <div
                  key={u.id}
                  className="p-3 border border-white/20 bg-black flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <PatchAvatar user={u} size="sm" />
                    <div>
                      <span className="font-bold text-white block leading-none">{u.name}</span>
                      <span className="text-[10px] text-white/50">{u.callsign}</span>
                    </div>
                  </div>

                  <span className="text-[10px] px-2 py-0.5 border border-white/30 text-white uppercase font-bold">
                    {u.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* BACKUP EXPORT & RESTORE */}
          <div className="pt-4 border-t border-white/20 space-y-3">
            <span className="block text-[10px] text-white/50 uppercase font-bold">
              Full Workspace Backup & Airgap Snapshot
            </span>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={exportWorkspaceData}
                className="px-4 py-2 border border-white/20 hover:border-white text-white flex items-center gap-2 uppercase transition-colors"
              >
                <Download size={13} />
                <span>Export JSON Snapshot</span>
              </button>

              <label className="px-4 py-2 border border-white/20 hover:border-white text-white flex items-center gap-2 uppercase transition-colors cursor-pointer">
                <Upload size={13} />
                <span>Restore Snapshot</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>

              <button
                onClick={resetWorkspaceData}
                className="px-4 py-2 border border-red-500/40 hover:border-red-500 text-red-400 flex items-center gap-2 uppercase transition-colors"
              >
                <RefreshCw size={13} />
                <span>Reset to Seed</span>
              </button>
            </div>

            {importStatus && (
              <p className="text-[11px] mt-1 text-[#A1A1AA]">{importStatus}</p>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-white/20 flex justify-end">
          <button
            onClick={() => setAccessModalOpen(false)}
            className="px-6 py-2.5 bg-[#A1A1AA] hover:bg-[#D4D4D8] text-black font-semibold font-medium uppercase tracking-wider transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
