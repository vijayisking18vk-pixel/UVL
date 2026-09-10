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
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-[#E5E5E7] shadow-2xl rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto font-sans text-black">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E7]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F5F5F7] border border-[#E5E5E7] flex items-center justify-center text-black">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-xl font-serif font-medium tracking-tight text-black">
                Private Enclave & Access Control.
              </h3>
              <p className="text-xs text-[#6E6E73] mt-0.5">
                Internal operator enclave • Zero public registration
              </p>
            </div>
          </div>
          <button
            onClick={() => setAccessModalOpen(false)}
            className="text-[#6E6E73] hover:text-black p-1.5 rounded-full hover:bg-[#F5F5F7] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6">
          {/* PRIVATE ENVIRONMENT BANNER */}
          <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-[#E5E5E7] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-black font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Lock size={13} className="text-[#6E6E73]" /> Enclave Security Protocol
              </span>
              <span className="text-[10px] text-black px-2.5 py-0.5 bg-white border border-[#E5E5E7] rounded-full uppercase font-semibold">
                Hard-locked
              </span>
            </div>
            <p className="text-[#6E6E73] text-xs leading-relaxed">
              This instance is hard-locked to the Unfounded Venture Lab core partnership and accredited technical operators. Public registration is disabled.
            </p>
          </div>

          {/* INVITE CODE & SECRET KEY */}
          <div className="space-y-4">
            <div>
              <label className="block text-[#6E6E73] text-[11px] font-medium uppercase tracking-wider mb-1.5">
                Workspace Invite Token (For Onboarding New Operators)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`https://unfoundedlab.internal/join?code=${workspaceConfig.inviteCode}`}
                  className="flex-1 bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2.5 text-xs text-black font-medium"
                />
                <button
                  onClick={handleCopyInvite}
                  className="px-4 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-full text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs"
                >
                  {copiedInvite ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedInvite ? 'Copied' : 'Copy Link'}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[#6E6E73] text-[11px] font-medium uppercase tracking-wider mb-1.5">
                Workspace Root Secret Key (Airgap Recovery)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  readOnly
                  value={workspaceConfig.secretKey}
                  className="flex-1 bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2.5 text-xs text-black tracking-widest"
                />
                <button
                  onClick={handleCopyKey}
                  className="px-4 py-2.5 border border-[#E5E5E7] hover:bg-[#F5F5F7] text-black rounded-full text-xs font-medium flex items-center gap-1.5 transition-all"
                >
                  {copiedKey ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* OPERATOR ENROLLMENT CLEARANCE (ALL OPERATORS) */}
          <div className="border border-[#E5E5E7] rounded-3xl p-5 bg-[#F5F5F7] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-black flex items-center gap-1.5">
                  <UserPlus size={14} className="text-[#6E6E73]" /> Member Enrollment Clearance
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full uppercase font-medium border border-emerald-200 bg-emerald-50 text-emerald-800">
                  Authorized: All Operators
                </span>
              </div>

              <button
                onClick={() => {
                  sound.click();
                  setShowAddMember(!showAddMember);
                  setMemberMessage(null);
                }}
                className="px-3.5 py-1.5 bg-black hover:bg-neutral-800 text-white text-[11px] font-medium rounded-full flex items-center gap-1.5 transition-all shadow-xs"
              >
                <UserPlus size={12} />
                <span>{showAddMember ? 'Cancel' : '+ Add Operator'}</span>
              </button>
            </div>

            <p className="text-[#6E6E73] text-xs">
              All team operators have full authorization to provision new workspace operators. All added members are saved directly to the live Supabase database.
            </p>

            {memberMessage && (
              <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                memberMessage.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-red-200 bg-red-50 text-red-800'
              }`}>
                {memberMessage.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                <span>{memberMessage.text}</span>
              </div>
            )}

            {/* Add Member Form (Visible when toggled) */}
            {showAddMember && (
              <form onSubmit={handleAddMemberSubmit} className="pt-4 border-t border-[#E5E5E7] space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#6E6E73] text-[10px] font-medium uppercase tracking-wider mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kiran Kumar"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      className="w-full bg-white border border-[#E5E5E7] rounded-xl px-3 py-2 text-xs text-black placeholder-[#6E6E73] focus:border-black focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#6E6E73] text-[10px] font-medium uppercase tracking-wider mb-1">
                      Callsign / Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. KIRAN-06"
                      value={newCallsign}
                      onChange={e => setNewCallsign(e.target.value)}
                      className="w-full bg-white border border-[#E5E5E7] rounded-xl px-3 py-2 text-xs text-black placeholder-[#6E6E73] focus:border-black focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#6E6E73] text-[10px] font-medium uppercase tracking-wider mb-1">
                      Chat Handle
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. @kiran"
                      value={newHandle}
                      onChange={e => setNewHandle(e.target.value)}
                      className="w-full bg-white border border-[#E5E5E7] rounded-xl px-3 py-2 text-xs text-black placeholder-[#6E6E73] focus:border-black focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#6E6E73] text-[10px] font-medium uppercase tracking-wider mb-1">
                      Security PIN (4 Digits) *
                    </label>
                    <input
                      type="password"
                      required
                      maxLength={6}
                      placeholder="e.g. 1006"
                      value={newPin}
                      onChange={e => setNewPin(e.target.value)}
                      className="w-full bg-white border border-[#E5E5E7] rounded-xl px-3 py-2 text-xs text-black placeholder-[#6E6E73] focus:border-black focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#6E6E73] text-[10px] font-medium uppercase tracking-wider mb-1">
                    Patch Emblem
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {(['crosshair', 'radar', 'chip', 'bolt', 'compass', 'dagger', 'skull'] as const).map(emblem => (
                      <button
                        key={emblem}
                        type="button"
                        onClick={() => setNewEmblem(emblem)}
                        className={`px-3 py-1 rounded-full text-[10px] uppercase font-semibold border transition-all ${
                          newEmblem === emblem
                            ? 'border-black bg-black text-white'
                            : 'border-[#E5E5E7] bg-white text-[#6E6E73] hover:border-black hover:text-black'
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
                    className="px-4 py-2 text-xs font-medium text-[#6E6E73] hover:text-black rounded-full hover:bg-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingMember}
                    className="px-5 py-2 bg-black hover:bg-neutral-800 disabled:opacity-40 text-white text-xs font-medium rounded-full flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <UserPlus size={13} />
                    <span>{isSubmittingMember ? 'Saving to Database...' : 'Save & Onboard Member'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* TEAM ROSTER TABLE */}
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E7] mb-3 text-[11px] font-medium text-[#6E6E73] uppercase tracking-wider">
              <span>Team Roster ({users.length} Members)</span>
              <span>Status</span>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {users.map(u => (
                <div
                  key={u.id}
                  className="p-3.5 rounded-2xl border border-[#E5E5E7] bg-white flex items-center justify-between gap-3 shadow-xs hover:border-black/20 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <PatchAvatar user={u} size="sm" />
                    <div>
                      <span className="font-medium text-sm text-black block leading-snug">{u.name}</span>
                      <span className="text-xs text-[#6E6E73]">{u.callsign}</span>
                    </div>
                  </div>

                  <span className="text-[10px] px-2.5 py-0.5 rounded-full border border-[#E5E5E7] bg-[#F5F5F7] text-black font-semibold uppercase tracking-wider">
                    {u.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* BACKUP EXPORT & RESTORE */}
          <div className="pt-4 border-t border-[#E5E5E7] space-y-3">
            <span className="block text-[11px] text-[#6E6E73] font-medium uppercase tracking-wider">
              Full Workspace Backup & Airgap Snapshot
            </span>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={exportWorkspaceData}
                className="px-4 py-2 border border-[#E5E5E7] hover:bg-[#F5F5F7] text-black rounded-full flex items-center gap-2 text-xs font-medium transition-all"
              >
                <Download size={13} />
                <span>Export JSON Snapshot</span>
              </button>

              <label className="px-4 py-2 border border-[#E5E5E7] hover:bg-[#F5F5F7] text-black rounded-full flex items-center gap-2 text-xs font-medium transition-all cursor-pointer">
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
                className="px-4 py-2 border border-red-200 hover:bg-red-50 text-red-600 rounded-full flex items-center gap-2 text-xs font-medium transition-all"
              >
                <RefreshCw size={13} />
                <span>Reset to Seed</span>
              </button>
            </div>

            {importStatus && (
              <p className="text-xs mt-1 text-[#6E6E73]">{importStatus}</p>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-[#E5E5E7] flex justify-end">
          <button
            onClick={() => setAccessModalOpen(false)}
            className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-full text-xs font-medium transition-all shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
