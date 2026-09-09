import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { User } from '../../types';
import { BrandPatchBadge } from '../common/BrandPatchBadge';
import { PatchAvatar } from '../common/PatchAvatar';
import { ShieldCheck, Lock, ArrowRight, AlertTriangle, KeyRound, CheckCircle2, UserCheck } from 'lucide-react';
import { sound } from '../../utils/sound';

export const LoginPortal: React.FC = () => {
  const { users, login, loginError, clearLoginError } = useWorkspace();
  const [selectedUser, setSelectedUser] = useState<User>(users[0] || null);
  const [pin, setPin] = useState('');
  const [showPinHint, setShowPinHint] = useState(true);

  const handleSelectUser = (user: User) => {
    sound.click();
    clearLoginError();
    setSelectedUser(user);
    setPin('');
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    login(selectedUser.id, pin || undefined);
  };

  const handleQuickLogin = (user: User) => {
    sound.patchStamp();
    clearLoginError();
    login(user.id);
  };

  const handleKeypadPress = (digit: string) => {
    sound.click();
    if (pin.length < 6) {
      setPin(prev => prev + digit);
    }
  };

  const handleKeypadBackspace = () => {
    sound.click();
    setPin(prev => prev.slice(0, -1));
  };

  return (
    <div className="min-h-screen bg-twill flex flex-col justify-between p-4 sm:p-6 lg:p-10 selection:bg-[#E5B869] selection:text-[#0D0D0D]">
      {/* Top Bar with Brand Badge */}
      <div className="max-w-[1400px] w-full mx-auto flex items-center justify-between pb-6 border-b border-[#333333]">
        <div className="flex items-center gap-4">
          <BrandPatchBadge size="md" />
          <div className="hidden sm:flex flex-col border-l border-[#333333] pl-3 py-0.5">
            <span className="text-xs text-[#FFFFFF] tracking-wide font-normal">
              DEFENSE SYSTEMS <em className="accent-italic text-[#B3B3B3]">// NODE AUTHENTICATION</em>
            </span>
            <span className="text-[10px] text-[#B3B3B3] tracking-widest mt-0.5">
              PRIVATE TEAM COMMAND CENTER
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#222222] border border-[#333333] patch-chamfer-sm text-xs">
          <span className="w-2 h-2 rounded-none bg-[#5EBA7D] animate-pulse" />
          <span className="text-[#B3B3B3] font-normal">ROSTER: <strong className="text-[#FFFFFF]">5 VERIFIED OPERATORS</strong></span>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="max-w-[1200px] w-full mx-auto py-8 lg:py-12">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#222222] border border-[#333333] text-[#E5B869] text-xs patch-chamfer-sm mb-2">
            <Lock size={13} />
            <span>ENCRYPTED ACCESS POINT</span>
          </div>
          <h1 className="headline text-3xl sm:text-4xl text-[#FFFFFF] font-normal tracking-wide">
            Operator <em className="accent-italic">Login Gateway</em>
          </h1>
          <p className="text-sm text-[#B3B3B3] leading-relaxed">
            Select your member profile from the roster below to authenticate your private session and access your personalized command center.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: 5 Member Identity Cards */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#333333] text-xs text-[#B3B3B3] uppercase tracking-wider">
              <span>Verified Operator Roster ({users.length})</span>
              <span>Click to Select</span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {users.map((user, idx) => {
                const isSelected = selectedUser?.id === user.id;
                return (
                  <div
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className={`p-4 border transition-all cursor-pointer patch-chamfer-md relative group ${
                      isSelected
                        ? 'bg-[#242424] border-[#E5B869] shadow-xl ring-1 ring-[#E5B869]/50'
                        : 'bg-[#1A1A1A] border-[#333333] hover:border-[#E5B869]/60 hover:bg-[#202020]'
                    }`}
                  >
                    {/* Stitched seam effect */}
                    <div className="absolute inset-[3px] border border-dashed border-white/10 pointer-events-none patch-chamfer-md" />

                    <div className="flex items-center justify-between gap-4 relative z-10">
                      <div className="flex items-center gap-3.5">
                        <div className="relative">
                          <PatchAvatar user={user} size="lg" showStatus />
                          <div className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-[#0D0D0D] border border-[#333333] text-[10px] text-[#E5B869] font-bold flex items-center justify-center patch-chamfer-sm">
                            0{idx + 1}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-semibold text-[#FFFFFF] group-hover:text-[#E5B869] transition-colors">
                              {user.name}
                            </h3>
                            <span className="text-[10px] px-1.5 py-0.2 bg-[#E5B869]/15 border border-[#E5B869]/40 text-[#E5B869] font-bold patch-chamfer-sm font-mono-tech">
                              {user.callsign}
                            </span>
                          </div>
                          {user.statusMessage ? (
                            <p className="text-xs text-[#B3B3B3] mt-1 line-clamp-1">
                              {user.statusMessage}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickLogin(user);
                          }}
                          className="px-3 py-1.5 bg-[#222222] hover:bg-[#E5B869] text-[#FFFFFF] hover:text-[#0D0D0D] border border-[#333333] hover:border-[#E5B869] text-xs font-semibold patch-chamfer-sm transition-all flex items-center gap-1 shadow-sm"
                          title="Instant 1-Click Login"
                        >
                          <UserCheck size={13} />
                          <span className="hidden sm:inline">Sign In</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Secure Authorization Panel for Selected Member */}
          <div className="lg:col-span-5 bg-[#1A1A1A] border-2 border-[#333333] p-6 patch-chamfer-md shadow-2xl relative space-y-5">
            <div className="absolute inset-[3px] border border-dashed border-white/10 pointer-events-none patch-chamfer-md" />

            {selectedUser ? (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-[#333333]">
                  <div>
                    <span className="text-[10px] text-[#B3B3B3] uppercase tracking-wider block font-semibold">
                      Selected Identity Profile
                    </span>
                    <h2 className="headline text-xl text-[#FFFFFF] font-normal mt-0.5">
                      {selectedUser.name} <em className="accent-italic text-[#E5B869]">({selectedUser.callsign})</em>
                    </h2>
                  </div>

                  <div className="w-12 h-12 shrink-0">
                    <PatchAvatar user={selectedUser} size="lg" showStatus />
                  </div>
                </div>

                {loginError && (
                  <div className="p-3 bg-[#2A1717] border border-[#E05A47]/60 text-[#E05A47] text-xs patch-chamfer-sm flex items-center gap-2">
                    <AlertTriangle size={15} className="shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handlePinSubmit} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs text-[#B3B3B3] uppercase font-semibold">
                        Enter Security PIN Code
                      </label>
                      {showPinHint && selectedUser.pin && (
                        <span className="text-[11px] text-[#E5B869] font-mono-tech">
                          Default PIN: {selectedUser.pin}
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <input
                        type="password"
                        maxLength={6}
                        value={pin}
                        onChange={(e) => {
                          clearLoginError();
                          setPin(e.target.value);
                        }}
                        placeholder={`e.g. ${selectedUser.pin || '1234'}`}
                        className="w-full bg-[#0D0D0D] border-2 border-[#333333] focus:border-[#E5B869] text-[#FFFFFF] px-3.5 py-2.5 text-center text-lg tracking-[0.3em] patch-chamfer-sm focus:outline-none transition-colors font-mono-tech"
                      />
                      <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B3B3B3]" />
                    </div>
                  </div>

                  {/* Virtual PIN Keypad */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
                      <button
                        key={digit}
                        type="button"
                        onClick={() => handleKeypadPress(digit)}
                        className="py-2.5 bg-[#222222] hover:bg-[#2C2C2C] active:bg-[#333333] border border-[#333333] text-[#FFFFFF] text-base font-semibold patch-chamfer-sm transition-colors font-mono-tech"
                      >
                        {digit}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPin('')}
                      className="py-2.5 bg-[#222222] hover:bg-[#2C2C2C] border border-[#333333] text-[#B3B3B3] text-xs uppercase patch-chamfer-sm transition-colors"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => handleKeypadPress('0')}
                      className="py-2.5 bg-[#222222] hover:bg-[#2C2C2C] active:bg-[#333333] border border-[#333333] text-[#FFFFFF] text-base font-semibold patch-chamfer-sm transition-colors font-mono-tech"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={handleKeypadBackspace}
                      className="py-2.5 bg-[#222222] hover:bg-[#2C2C2C] border border-[#333333] text-[#B3B3B3] text-xs uppercase patch-chamfer-sm transition-colors"
                    >
                      ⌫ Del
                    </button>
                  </div>

                  <div className="space-y-2 pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 bg-[#E5B869] hover:bg-[#F0C57A] active:scale-[0.99] text-[#0D0D0D] text-sm font-bold patch-chamfer-sm shadow-lg transition-transform flex items-center justify-center gap-2 uppercase tracking-wider"
                    >
                      <span>Authenticate Session</span>
                      <ArrowRight size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickLogin(selectedUser)}
                      className="w-full py-2 bg-[#222222] hover:bg-[#2C2C2C] border border-[#333333] text-[#FFFFFF] text-xs font-semibold patch-chamfer-sm transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 size={13} className="text-[#5EBA7D]" />
                      <span>One-Click Quick Login as {selectedUser.name}</span>
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="p-8 text-center text-xs text-[#B3B3B3]">
                Select an operator from the roster on the left to proceed.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Security Status Footer */}
      <div className="max-w-[1400px] w-full mx-auto pt-6 border-t border-[#333333] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#B3B3B3]">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-[#5EBA7D]" />
          <span>AIRGAPPED SESSION ENCRYPTION // UNFOUNDED VENTURE LAB</span>
        </div>
        <div>
          <span>Team Command Center • Localhost Private Instance</span>
        </div>
      </div>
    </div>
  );
};
