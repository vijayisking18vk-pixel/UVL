import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { BrandPatchBadge } from '../common/BrandPatchBadge';
import { PatchAvatar } from '../common/PatchAvatar';
import { User } from '../../types';
import { sound } from '../../utils/sound';
import {
  KeyRound,
  ShieldCheck,
  AlertTriangle,
  UserCheck,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export const LoginPortal: React.FC = () => {
  const { users, login, loginError, clearLoginError } = useWorkspace();
  const [selectedUser, setSelectedUser] = useState<User | null>(users[0] || null);
  const [pin, setPin] = useState('');
  const [showPinHint] = useState(true);

  const handleSelectUser = (user: User) => {
    sound.click();
    clearLoginError();
    setSelectedUser(user);
    setPin('');
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    login(selectedUser.id, pin);
  };

  const handleQuickLogin = (user: User) => {
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
    <div className="min-h-screen bg-[#000000] text-[#FFFFFF] flex flex-col justify-between p-6 sm:p-10 lg:p-14 selection:bg-[#A1A1AA] selection:text-black editorial-reveal">
      {/* Top Bar */}
      <div className="max-w-[1500px] w-full mx-auto flex items-center justify-between pb-6 border-b border-white/20">
        <div className="flex items-center gap-4">
          <BrandPatchBadge size="lg" />
          <div className="hidden sm:flex flex-col border-l border-white/20 pl-4 py-1">
            <span className="micro-label text-white/50">Unfounded Venture Lab /</span>
            <span className="text-xs font-semibold text-white tracking-wide">
              Operator Gateway
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 border border-white/20 px-3 py-1.5 text-xs">
          <span className="w-2 h-2 bg-[#A1A1AA]" />
          <span className="meta-number text-white/80">ROSTER / 05 MEMBERS</span>
        </div>
      </div>

      {/* Main Editorial Hero & Auth Section */}
      <div className="max-w-[1500px] w-full mx-auto py-10 lg:py-16 flex-1 flex flex-col justify-center">
        <div className="mb-10 lg:mb-14">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-[#A1A1AA]" />
            <span className="micro-label text-white/60">Authentication Session / Private Access</span>
          </div>
          <h1 className="headline-display text-white font-extrabold tracking-tight">
            Team Command Center.
          </h1>
          <p className="body-text text-white/70 max-w-xl mt-3">
            Select your operator identity profile below to verify access credentials and initialize your personal workspace session.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: 5 Member Identity Cards (Asymmetric / Hairline List) */}
          <div className="lg:col-span-7 border border-white/20">
            <div className="flex items-center justify-between p-3 border-b border-white/20 bg-white/5 text-xs text-white/60">
              <span className="micro-label">Verified Operators ({users.length})</span>
              <span className="meta-number">EST. — 2026</span>
            </div>

            <div className="divide-y divide-white/20">
              {users.map((user, idx) => {
                const isSelected = selectedUser?.id === user.id;
                return (
                  <div
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className={`p-4 transition-colors cursor-pointer flex items-center justify-between gap-4 ${
                      isSelected
                        ? 'bg-white text-black'
                        : 'bg-black text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative shrink-0">
                        <PatchAvatar user={user} size="lg" />
                        <div className={`absolute -top-1 -left-1 text-[10px] font-bold px-1 ${
                          isSelected ? 'bg-black text-white' : 'bg-[#A1A1AA] text-black'
                        }`}>
                          0{idx + 1}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold tracking-tight">
                            {user.name}
                          </h3>
                          <span className={`meta-number text-xs px-1 border ${
                            isSelected ? 'border-black/40 text-black' : 'border-white/30 text-white/70'
                          }`}>
                            /{user.callsign}
                          </span>
                        </div>
                        <span className={`text-xs block mt-0.5 ${
                          isSelected ? 'text-black/60' : 'text-white/40'
                        }`}>
                          Operator Identity · Online
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickLogin(user);
                        }}
                        className={`px-3 py-1.5 border text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-black text-white border-black hover:bg-[#A1A1AA] hover:border-[#A1A1AA] hover:text-black'
                            : 'border-white/30 text-white hover:border-white hover:bg-white hover:text-black'
                        }`}
                        title="Instant Sign In"
                      >
                        <UserCheck size={13} />
                        <span>Sign In</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Secure Authorization Panel for Selected Member */}
          <div className="lg:col-span-5 border border-white/20 p-6 sm:p-8 bg-[#000000] text-white space-y-6">
            {selectedUser ? (
              <>
                <div className="flex items-center justify-between pb-4 border-b border-white/20">
                  <div>
                    <span className="micro-label text-white/50 block">
                      Active Selection /
                    </span>
                    <h2 className="headline text-2xl text-white font-bold mt-1">
                      {selectedUser.name}
                    </h2>
                    <span className="meta-number text-xs text-[#A1A1AA]">
                      /{selectedUser.callsign}
                    </span>
                  </div>

                  <div className="w-14 h-14 shrink-0 border border-white/40 overflow-hidden bg-[#111111]">
                    {selectedUser.avatarUrl ? (
                      <img 
                        src={selectedUser.avatarUrl} 
                        alt={selectedUser.name}
                        className="w-full h-full object-cover" 
                        style={{ filter: 'none' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold font-mono">
                        {selectedUser.callsign.slice(0, 2)}
                      </div>
                    )}
                  </div>
                </div>

                {loginError && (
                  <div className="p-3 border border-red-500 bg-red-950/40 text-red-400 text-xs flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handlePinSubmit} className="space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="micro-label text-white/70">
                        Enter Security PIN Code
                      </label>
                      {showPinHint && selectedUser.pin && (
                        <span className="meta-number text-xs text-[#A1A1AA]">
                          Default: {selectedUser.pin}
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
                        className="w-full bg-[#000000] border border-white/40 focus:border-[#A1A1AA] text-white px-4 py-3 text-center text-xl tracking-[0.4em] focus:outline-none transition-colors meta-number"
                      />
                      <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                    </div>
                  </div>

                  {/* Virtual PIN Keypad */}
                  <div className="grid grid-cols-3 gap-1 pt-1">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
                      <button
                        key={digit}
                        type="button"
                        onClick={() => handleKeypadPress(digit)}
                        className="py-3 border border-white/20 hover:border-white text-white text-base font-semibold transition-colors meta-number"
                      >
                        {digit}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPin('')}
                      className="py-3 border border-white/20 hover:border-white text-white/50 hover:text-white text-xs transition-colors"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => handleKeypadPress('0')}
                      className="py-3 border border-white/20 hover:border-white text-white text-base font-semibold transition-colors meta-number"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={handleKeypadBackspace}
                      className="py-3 border border-white/20 hover:border-white text-white/50 hover:text-white text-xs transition-colors"
                    >
                      ⌫ Del
                    </button>
                  </div>

                  <div className="space-y-2 pt-2">
                    <button
                      type="submit"
                      className="w-full py-3.5 bg-[#A1A1AA] hover:bg-[#D4D4D8] text-black text-xs font-bold transition-colors flex items-center justify-center gap-2 uppercase tracking-wider"
                    >
                      <span>Authenticate Session</span>
                      <ArrowRight size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickLogin(selectedUser)}
                      className="w-full py-2.5 border border-white/30 hover:border-white text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 size={13} className="text-[#A1A1AA]" />
                      <span>Direct 1-Click Login as {selectedUser.name}</span>
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="p-12 text-center text-xs text-white/40">
                Select an operator from the roster on the left to proceed.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editorial Footer & Scroll Cue */}
      <div className="max-w-[1500px] w-full mx-auto pt-6 border-t border-white/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-[#A1A1AA]" />
          <span className="micro-label">AIRGAPPED LAB ENCLAVE / UNFOUNDED VENTURE LAB</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="meta-number">INDEX·001</span>
          <span>/</span>
          <span>Scroll ↓</span>
        </div>
      </div>
    </div>
  );
};
