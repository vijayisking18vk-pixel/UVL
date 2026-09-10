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
    <div className="min-h-screen bg-white text-black flex flex-col justify-between p-6 sm:p-10 lg:p-14 selection:bg-[#E5E5E7] selection:text-black">
      {/* Top Bar */}
      <div className="max-w-[1200px] w-full mx-auto flex items-center justify-between pb-6 border-b border-[#E5E5E7]">
        <div className="flex items-center gap-4">
          <BrandPatchBadge size="lg" />
          <div className="hidden sm:flex flex-col border-l border-[#E5E5E7] pl-4 py-1">
            <span className="text-xs font-medium text-[#6E6E73]">Unfounded Venture Lab</span>
            <span className="text-xs font-semibold text-black tracking-tight">
              Operator Gateway
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 border border-[#E5E5E7] bg-[#F5F5F7] px-3.5 py-1.5 rounded-full text-xs font-medium text-black">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Roster • 05 Members</span>
        </div>
      </div>

      {/* Main Hero & Auth Section */}
      <div className="max-w-[1200px] w-full mx-auto py-10 lg:py-16 flex-1 flex flex-col justify-center">
        <div className="mb-10 lg:mb-12">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-medium text-[#6E6E73] uppercase tracking-wider">Authentication Session • Private Access</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-normal text-black tracking-tight">
            Team Command Center.
          </h1>
          <p className="text-[#6E6E73] text-sm sm:text-base max-w-xl mt-3 leading-relaxed">
            Select your operator identity profile below to verify access credentials and initialize your personal workspace session.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: 5 Member Identity Cards */}
          <div className="lg:col-span-7 border border-[#E5E5E7] bg-white rounded-3xl overflow-hidden shadow-xs">
            <div className="flex items-center justify-between p-4 border-b border-[#E5E5E7] bg-[#F5F5F7] text-xs text-[#6E6E73] font-medium">
              <span className="font-semibold text-black uppercase tracking-wider">Verified Operators ({users.length})</span>
              <span>EST. — 2026</span>
            </div>

            <div className="divide-y divide-[#E5E5E7]">
              {users.map((user, idx) => {
                const isSelected = selectedUser?.id === user.id;
                return (
                  <div
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className={`p-4 sm:p-5 transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      isSelected
                        ? 'bg-[#F5F5F7]'
                        : 'bg-white hover:bg-[#F5F5F7]/60'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative shrink-0">
                        <PatchAvatar user={user} size="lg" />
                        <div className={`absolute -top-1 -left-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${
                          isSelected ? 'bg-black text-white border-black' : 'bg-[#F5F5F7] text-[#6E6E73] border-[#E5E5E7]'
                        }`}>
                          0{idx + 1}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm sm:text-base font-semibold text-black">
                            {user.name}
                          </h3>
                          <span className="text-[11px] px-2 py-0.5 rounded-full border border-[#E5E5E7] bg-white text-[#6E6E73] font-mono">
                            /{user.callsign}
                          </span>
                        </div>
                        <span className="text-xs text-[#6E6E73] block mt-0.5">
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
                        className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 shadow-xs ${
                          isSelected
                            ? 'bg-black text-white hover:opacity-90'
                            : 'border border-[#E5E5E7] bg-white text-black hover:border-black'
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
          <div className="lg:col-span-5 border border-[#E5E5E7] p-6 sm:p-8 bg-[#F5F5F7] text-black rounded-3xl space-y-6 shadow-xs">
            {selectedUser ? (
              <>
                <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E7]">
                  <div>
                    <span className="text-xs font-semibold text-[#6E6E73] uppercase tracking-wider block">
                      Active Selection
                    </span>
                    <h2 className="font-serif text-2xl text-black font-normal mt-1">
                      {selectedUser.name}
                    </h2>
                    <span className="text-xs text-[#6E6E73] font-mono">
                      /{selectedUser.callsign}
                    </span>
                  </div>

                  <div className="w-14 h-14 shrink-0 rounded-full border border-[#E5E5E7] overflow-hidden bg-white shadow-xs">
                    {selectedUser.avatarUrl ? (
                      <img 
                        src={selectedUser.avatarUrl} 
                        alt={selectedUser.name}
                        className="w-full h-full object-cover" 
                        style={{ filter: 'none' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold font-mono text-black">
                        {selectedUser.callsign.slice(0, 2)}
                      </div>
                    )}
                  </div>
                </div>

                {loginError && (
                  <div className="p-3.5 border border-red-200 bg-red-50 rounded-2xl text-red-700 text-xs flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handlePinSubmit} className="space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-[#6E6E73] uppercase tracking-wider">
                        Enter Security PIN Code
                      </label>
                      {showPinHint && selectedUser.pin && (
                        <span className="text-xs text-[#6E6E73] font-mono">
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
                        className="w-full bg-white border border-[#E5E5E7] focus:border-black rounded-2xl text-black px-4 py-3 text-center text-xl tracking-[0.4em] focus:outline-none transition-all font-mono shadow-xs"
                      />
                      <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73]" />
                    </div>
                  </div>

                  {/* Virtual PIN Keypad */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
                      <button
                        key={digit}
                        type="button"
                        onClick={() => handleKeypadPress(digit)}
                        className="py-3.5 rounded-2xl bg-white border border-[#E5E5E7] hover:border-black text-black text-base font-medium transition-all shadow-xs"
                      >
                        {digit}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPin('')}
                      className="py-3.5 rounded-2xl text-[#6E6E73] hover:text-black text-xs font-medium transition-colors"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => handleKeypadPress('0')}
                      className="py-3.5 rounded-2xl bg-white border border-[#E5E5E7] hover:border-black text-black text-base font-medium transition-all shadow-xs"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={handleKeypadBackspace}
                      className="py-3.5 rounded-2xl text-[#6E6E73] hover:text-black text-xs font-medium transition-colors"
                    >
                      ⌫ Del
                    </button>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 rounded-full bg-black hover:opacity-90 text-white text-xs font-medium transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      <span>Authenticate Session</span>
                      <ArrowRight size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickLogin(selectedUser)}
                      className="w-full py-2.5 rounded-full border border-[#E5E5E7] bg-white hover:bg-[#F5F5F7] text-black text-xs font-medium transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <CheckCircle2 size={13} className="text-emerald-600" />
                      <span>Direct 1-Click Login as {selectedUser.name}</span>
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="p-12 text-center text-xs text-[#6E6E73]">
                Select an operator from the roster on the left to proceed.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-[1200px] w-full mx-auto pt-6 border-t border-[#E5E5E7] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6E6E73]">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-black" />
          <span>Airgapped Lab Enclave • Unfounded Venture Lab</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono">INDEX·001</span>
          <span>•</span>
          <span>Scroll ↓</span>
        </div>
      </div>
    </div>
  );
};
