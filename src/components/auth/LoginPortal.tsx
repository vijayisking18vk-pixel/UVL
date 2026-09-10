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
  ArrowRight,
  Info,
  Lock,
  ChevronRight,
  User as UserIcon
} from 'lucide-react';

export const LoginPortal: React.FC = () => {
  const { users, login, loginError, clearLoginError } = useWorkspace();
  const [selectedUser, setSelectedUser] = useState<User | null>(users[0] || null);
  const [pin, setPin] = useState('');
  const [customIdentifier, setCustomIdentifier] = useState('');
  const [showCredentialsReference, setShowCredentialsReference] = useState(true);
  const [loginMode, setLoginMode] = useState<'roster' | 'manual'>('roster');

  const handleSelectUser = (user: User) => {
    sound.click();
    clearLoginError();
    setSelectedUser(user);
    setPin('');
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginMode === 'roster') {
      if (!selectedUser) return;
      login(selectedUser.id, pin);
    } else {
      if (!customIdentifier.trim()) return;
      login(customIdentifier.trim(), pin);
    }
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
          <span>Roster • 5 Verified Operators</span>
        </div>
      </div>

      {/* Main Auth Section */}
      <div className="max-w-[1200px] w-full mx-auto py-10 lg:py-16 flex-1 flex flex-col justify-center">
        <div className="mb-8 lg:mb-10">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-xs font-medium text-[#6E6E73] uppercase tracking-wider">
              Authentication Session • Private Access
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-normal text-black tracking-tight">
            Team Command Center.
          </h1>
          <p className="text-[#6E6E73] text-sm sm:text-base max-w-xl mt-2.5 leading-relaxed">
            Sign in with your dedicated security PIN to initialize your personalized workspace session.
          </p>

          {/* Login Mode Switcher */}
          <div className="inline-flex p-1 bg-[#F5F5F7] border border-[#E5E5E7] rounded-full mt-6 text-xs font-medium">
            <button
              onClick={() => { sound.click(); setLoginMode('roster'); clearLoginError(); }}
              className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                loginMode === 'roster'
                  ? 'bg-white text-black shadow-xs font-semibold'
                  : 'text-[#6E6E73] hover:text-black'
              }`}
            >
              Select Member Card
            </button>
            <button
              onClick={() => { sound.click(); setLoginMode('manual'); clearLoginError(); }}
              className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                loginMode === 'manual'
                  ? 'bg-white text-black shadow-xs font-semibold'
                  : 'text-[#6E6E73] hover:text-black'
              }`}
            >
              Enter Handle / Callsign
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Member Selection OR Manual Form */}
          {loginMode === 'roster' ? (
            <div className="lg:col-span-7 border border-[#E5E5E7] bg-white rounded-3xl overflow-hidden shadow-xs">
              <div className="flex items-center justify-between p-4 border-b border-[#E5E5E7] bg-[#F5F5F7] text-xs text-[#6E6E73] font-medium">
                <span className="font-semibold text-black uppercase tracking-wider">
                  Verified Team Members ({users.length})
                </span>
                <span>Click to Select & Enter PIN</span>
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
                            {user.handle} · PIN Required
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          isSelected ? 'bg-black text-white' : 'bg-[#F5F5F7] text-[#6E6E73]'
                        }`}>
                          <ChevronRight size={16} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="lg:col-span-7 border border-[#E5E5E7] bg-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div>
                <h3 className="font-serif text-2xl font-normal text-black">
                  Direct Credential Sign In.
                </h3>
                <p className="text-xs text-[#6E6E73] mt-1">
                  Type your handle (e.g. <span className="font-mono text-black">@vijayrajkumar</span>) or callsign (<span className="font-mono text-black">VIJAY-01</span>) and security PIN.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6E6E73] uppercase tracking-wider mb-2">
                  Handle, Callsign, or Email
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={customIdentifier}
                    onChange={(e) => {
                      clearLoginError();
                      setCustomIdentifier(e.target.value);
                    }}
                    placeholder="e.g. @vijayrajkumar or VIJAY-01"
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] focus:border-black rounded-2xl text-black px-4 py-3 pl-10 text-sm focus:outline-none focus:bg-white transition-all shadow-2xs"
                  />
                  <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73]" />
                </div>
              </div>
            </div>
          )}

          {/* Right Column: Security PIN Entry & Authorization Panel */}
          <div className="lg:col-span-5 border border-[#E5E5E7] p-6 sm:p-8 bg-[#F5F5F7] text-black rounded-3xl space-y-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E7]">
              <div>
                <span className="text-xs font-semibold text-[#6E6E73] uppercase tracking-wider block">
                  {loginMode === 'roster' ? 'Signing in as' : 'Security Verification'}
                </span>
                <h2 className="font-serif text-2xl text-black font-normal mt-1">
                  {loginMode === 'roster' ? (selectedUser?.name || 'Select Member') : (customIdentifier || 'Operator')}
                </h2>
                {loginMode === 'roster' && selectedUser && (
                  <span className="text-xs text-[#6E6E73] font-mono">
                    {selectedUser.handle} · /{selectedUser.callsign}
                  </span>
                )}
              </div>

              {loginMode === 'roster' && selectedUser && (
                <div className="w-14 h-14 shrink-0 rounded-full border border-[#E5E5E7] overflow-hidden bg-white shadow-xs">
                  {selectedUser.avatarUrl ? (
                    <img 
                      src={selectedUser.avatarUrl} 
                      alt={selectedUser.name}
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold font-mono text-black">
                      {selectedUser.callsign.slice(0, 2)}
                    </div>
                  )}
                </div>
              )}
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
                    Enter Security PIN
                  </label>
                  {loginMode === 'roster' && selectedUser?.pin && (
                    <span className="text-[11px] text-[#6E6E73] font-mono bg-white px-2 py-0.5 rounded-full border border-[#E5E5E7]">
                      PIN: {selectedUser.pin}
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
                    placeholder="••••"
                    className="w-full bg-white border border-[#E5E5E7] focus:border-black rounded-2xl text-black px-4 py-3 text-center text-xl tracking-[0.5em] focus:outline-none transition-all font-mono shadow-xs"
                    autoFocus
                  />
                  <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73]" />
                </div>
              </div>

              {/* Minimal Keypad */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadPress(digit)}
                    className="py-3 bg-white hover:bg-[#EBEBED] active:scale-95 border border-[#E5E5E7] rounded-xl text-sm font-semibold font-mono text-black transition-all cursor-pointer shadow-2xs"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPin('')}
                  className="py-3 bg-white hover:bg-[#EBEBED] active:scale-95 border border-[#E5E5E7] rounded-xl text-xs font-semibold text-[#6E6E73] transition-all cursor-pointer shadow-2xs"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="py-3 bg-white hover:bg-[#EBEBED] active:scale-95 border border-[#E5E5E7] rounded-xl text-sm font-semibold font-mono text-black transition-all cursor-pointer shadow-2xs"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleKeypadBackspace}
                  className="py-3 bg-white hover:bg-[#EBEBED] active:scale-95 border border-[#E5E5E7] rounded-xl text-xs font-semibold text-[#6E6E73] transition-all cursor-pointer shadow-2xs"
                >
                  ⌫
                </button>
              </div>

              <button
                type="submit"
                disabled={!pin || (loginMode === 'manual' && !customIdentifier.trim())}
                className="w-full py-3.5 bg-black hover:bg-black/90 disabled:opacity-30 text-white rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <span>Authorize & Initialize Session</span>
                <ArrowRight size={14} />
              </button>
            </form>
          </div>
        </div>

        {/* Dedicated Credentials Reference Drawer / Card */}
        <div className="mt-12 border border-[#E5E5E7] bg-[#F5F5F7] rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E7]">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-black" />
              <h3 className="text-xs font-semibold text-black uppercase tracking-wider">
                Dedicated Operator Credentials Reference
              </h3>
            </div>
            <button
              onClick={() => setShowCredentialsReference(!showCredentialsReference)}
              className="text-xs text-[#6E6E73] hover:text-black font-medium cursor-pointer"
            >
              {showCredentialsReference ? 'Hide Table' : 'Show Table'}
            </button>
          </div>

          {showCredentialsReference && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[#E5E5E7] text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider">
                    <th className="py-2 pr-4">Operator</th>
                    <th className="py-2 px-4">Handle</th>
                    <th className="py-2 px-4">Callsign</th>
                    <th className="py-2 px-4">Email</th>
                    <th className="py-2 pl-4 text-right">Dedicated PIN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E7]">
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      onClick={() => {
                        handleSelectUser(u);
                        setLoginMode('roster');
                      }}
                      className="hover:bg-white/60 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 pr-4 font-semibold text-black flex items-center gap-2">
                        <PatchAvatar user={u} size="sm" />
                        <span>{u.name}</span>
                      </td>
                      <td className="py-2.5 px-4 text-[#6E6E73] font-mono">{u.handle}</td>
                      <td className="py-2.5 px-4 text-[#6E6E73] font-mono">/{u.callsign}</td>
                      <td className="py-2.5 px-4 text-[#6E6E73]">{u.name.toLowerCase()}@unfounded.ventures</td>
                      <td className="py-2.5 pl-4 text-right font-mono font-bold text-black">
                        <span className="bg-white border border-[#E5E5E7] px-2.5 py-1 rounded-full shadow-2xs">
                          {u.pin || '1001'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-[1200px] w-full mx-auto pt-6 border-t border-[#E5E5E7] flex flex-col sm:flex-row items-center justify-between text-xs text-[#6E6E73] gap-2">
        <span>© 2026 Unfounded Venture Lab. All rights reserved.</span>
        <span>Secure Local Authentication • Apple Minimalist System</span>
      </div>
    </div>
  );
};
