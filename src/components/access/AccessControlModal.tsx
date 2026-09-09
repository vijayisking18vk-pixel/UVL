import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { PatchAvatar } from '../common/PatchAvatar';
import { sound } from '../../utils/sound';
import {
  ShieldCheck,
  Lock,
  Key,
  Copy,
  Check,
  Users,
  Download,
  Upload,
  RefreshCw,
  X,
  AlertOctagon
} from 'lucide-react';

export const AccessControlModal: React.FC = () => {
  const {
    accessModalOpen,
    setAccessModalOpen,
    workspaceConfig,
    updateWorkspaceConfig,
    users,
    updateUser,
    currentUser,
    exportWorkspaceData,
    importWorkspaceData,
    resetWorkspaceData
  } = useWorkspace();

  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

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

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#14171B] border-2 border-[#323A48] max-w-2xl w-full p-6 patch-chamfer-md shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="absolute inset-[3px] border border-dashed border-[#EDE8DB]/20 pointer-events-none patch-chamfer-md" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#242930] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#1B231D] border border-[#5EBA7D]/40 text-[#5EBA7D] patch-chamfer-sm">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="font-patch text-xl font-bold uppercase tracking-wider text-[#EDE8DB]">
                Private Workspace & Access Control
              </h3>
              <span className="font-mono text-[10px] text-[#5EBA7D]">
                [INTERNAL TEAM DEPLOYMENT ONLY — ZERO PUBLIC ACCESS]
              </span>
            </div>
          </div>
          <button
            onClick={() => setAccessModalOpen(false)}
            className="p-1 hover:bg-[#20252C] text-[#9E9A8E] hover:text-[#EDE8DB]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 font-mono text-xs text-[#EDE8DB]">
          
          {/* PRIVATE ENVIRONMENT BANNER */}
          <div className="p-3 bg-[#0C0E11] border border-[#2D333F] patch-chamfer-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[#E5B869] font-bold text-xs uppercase flex items-center gap-1.5">
                <Lock size={13} /> Enclave Security Protocol
              </span>
              <span className="text-[10px] text-[#5EBA7D] px-1.5 py-0.2 border border-[#5EBA7D]/40">
                ACTIVE
              </span>
            </div>
            <p className="text-[#9E9A8E] text-[11px] leading-relaxed">
              This instance is hard-locked to the Unfounded Venture Lab core partnership and accredited technical operators. Public registration is disabled.
            </p>
          </div>

          {/* INVITE CODE & SECRET KEY */}
          <div className="space-y-3">
            <div>
              <label className="block text-[#9E9A8E] text-[10px] uppercase mb-1">
                Workspace Invite Token (For Onboarding New Operators)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`https://unfoundedlab.internal/join?code=${workspaceConfig.inviteCode}`}
                  className="flex-1 bg-[#0C0E11] border border-[#2D3440] px-3 py-1.5 text-xs text-[#5EBA7D] patch-chamfer-sm font-bold"
                />
                <button
                  onClick={handleCopyInvite}
                  className="px-3 py-1.5 bg-[#1F242C] hover:bg-[#2A313C] border border-[#323945] text-[#EDE8DB] patch-chamfer-sm flex items-center gap-1"
                >
                  {copiedInvite ? <Check size={13} className="text-[#5EBA7D]" /> : <Copy size={13} />}
                  <span>{copiedInvite ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[#9E9A8E] text-[10px] uppercase mb-1">
                Workspace Root Secret Key (Airgap Recovery)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  readOnly
                  value={workspaceConfig.secretKey}
                  className="flex-1 bg-[#0C0E11] border border-[#2D3440] px-3 py-1.5 text-xs text-[#E5B869] patch-chamfer-sm font-mono tracking-widest"
                />
                <button
                  onClick={handleCopyKey}
                  className="px-3 py-1.5 bg-[#1F242C] hover:bg-[#2A313C] border border-[#323945] text-[#EDE8DB] patch-chamfer-sm flex items-center gap-1"
                >
                  {copiedKey ? <Check size={13} className="text-[#5EBA7D]" /> : <Copy size={13} />}
                  <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* TEAM ROSTER TABLE */}
          <div>
            <div className="flex items-center justify-between pb-1.5 border-b border-[#242930] mb-2 text-[10px] font-mono text-[#9E9A8E] uppercase">
              <span>Team Roster ({users.length} Members)</span>
              <span>Status</span>
            </div>

            <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
              {users.map(u => (
                <div
                  key={u.id}
                  className="p-2 bg-[#181B20] border border-[#252B35] patch-chamfer-sm flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <PatchAvatar user={u} size="sm" />
                    <div>
                      <span className="font-bold text-[#EDE8DB] block leading-none">{u.name}</span>
                      <span className="text-[10px] text-[#9E9A8E]">{u.callsign}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[#5EBA7D] px-2 py-0.5 bg-[#5EBA7D]/10 border border-[#5EBA7D]/30 patch-chamfer-sm uppercase font-semibold">
                      {u.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BACKUP EXPORT & RESTORE */}
          <div className="pt-3 border-t border-[#242930] space-y-2">
            <span className="block text-[10px] text-[#9E9A8E] uppercase font-bold">
              Full Workspace Backup & Airgap Snapshot
            </span>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={exportWorkspaceData}
                className="px-3.5 py-1.5 bg-[#1F242C] hover:bg-[#2A313C] border border-[#323945] text-[#EDE8DB] text-xs font-mono patch-chamfer-sm flex items-center gap-1.5"
              >
                <Download size={13} /> Export JSON Snapshot
              </button>

              <label className="px-3.5 py-1.5 bg-[#1F242C] hover:bg-[#2A313C] border border-[#323945] text-[#EDE8DB] text-xs font-mono patch-chamfer-sm flex items-center gap-1.5 cursor-pointer">
                <Upload size={13} /> Restore Snapshot
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>

              <button
                onClick={resetWorkspaceData}
                className="px-3.5 py-1.5 bg-[#261717] hover:bg-[#381B1B] border border-[#E05A47]/40 text-[#E05A47] text-xs font-mono patch-chamfer-sm flex items-center gap-1.5"
              >
                <RefreshCw size={13} /> Reset to Initial Seed
              </button>
            </div>

            {importStatus && (
              <p className="text-[11px] font-mono mt-1 text-[#5EBA7D]">{importStatus}</p>
            )}
          </div>
        </div>

        <div className="mt-6 pt-3 border-t border-[#242930] flex justify-end">
          <button
            onClick={() => setAccessModalOpen(false)}
            className="px-4 py-1.5 bg-[#E5B869] hover:bg-[#F0C57A] text-[#0B0C0E] font-mono text-xs font-bold patch-chamfer-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

