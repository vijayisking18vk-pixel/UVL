import React from 'react';
import { User } from '../../types';
import { 
  Crosshair, Cpu, Radio, Zap, Compass, ShieldAlert, Sparkles
} from 'lucide-react';

interface PatchAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
  showCallsign?: boolean;
  onClick?: () => void;
  className?: string;
}

export const PatchAvatar: React.FC<PatchAvatarProps> = ({
  user,
  size = 'md',
  showStatus = false,
  showCallsign = false,
  onClick,
  className = ''
}) => {
  const getEmblemIcon = (emblem: string, iconSize: number) => {
    switch (emblem) {
      case 'crosshair':
        return <Crosshair size={iconSize} className="text-[#EDE8DB]" />;
      case 'chip':
        return <Cpu size={iconSize} className="text-[#EDE8DB]" />;
      case 'radar':
        return <Radio size={iconSize} className="text-[#EDE8DB]" />;
      case 'bolt':
        return <Zap size={iconSize} className="text-[#EDE8DB]" />;
      case 'compass':
        return <Compass size={iconSize} className="text-[#EDE8DB]" />;
      case 'dagger':
        return <ShieldAlert size={iconSize} className="text-[#EDE8DB]" />;
      default:
        return <Sparkles size={iconSize} className="text-[#EDE8DB]" />;
    }
  };

  const dimensions = {
    sm: { box: 'w-7 h-7', icon: 13, text: 'text-[9px]', chamfer: 'patch-chamfer-sm' },
    md: { box: 'w-9 h-9', icon: 16, text: 'text-[10px]', chamfer: 'patch-chamfer-sm' },
    lg: { box: 'w-12 h-12', icon: 20, text: 'text-xs', chamfer: 'patch-chamfer-md' },
    xl: { box: 'w-16 h-16', icon: 26, text: 'text-sm', chamfer: 'patch-pill' }
  }[size];

  const statusColors = {
    active: 'bg-[#5EBA7D] border-[#0B0C0E]',
    focus: 'bg-[#4EC5D4] border-[#0B0C0E]',
    reviewing: 'bg-[#E5B869] border-[#0B0C0E]',
    away: 'bg-[#9E9A8E] border-[#0B0C0E]',
    leave: 'bg-[#E05A47] border-[#0B0C0E]'
  };

  return (
    <div 
      onClick={onClick}
      className={`inline-flex items-center gap-2 select-none ${onClick ? 'cursor-pointer hover:opacity-90' : ''} ${className}`}
    >
      <div className="relative">
        <div
          className={`${dimensions.box} ${dimensions.chamfer} flex items-center justify-center relative shadow-md transition-transform overflow-hidden`}
          style={{
            backgroundColor: user.avatarBg || '#16191D',
            boxShadow: `inset 0 0 0 1.5px ${user.avatarStitch || '#EDE8DB'}`
          }}
          title={`${user.name} (${user.callsign})`}
        >
          {user.avatarUrl ? (
            <img 
              src={user.avatarUrl} 
              alt={user.name} 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            getEmblemIcon(user.avatarEmblem, dimensions.icon)
          )}
          {/* Subtle stitch dash pattern */}
          <div className="absolute inset-[2px] border border-dashed border-white/30 pointer-events-none" />
        </div>

        {/* Status dot */}
        {showStatus && (
          <span 
            className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-none border ${statusColors[user.status]} shadow-sm`}
            title={`Status: ${user.status}`}
          />
        )}
      </div>

      {showCallsign && (
        <div className="flex flex-col text-left">
          <span className="font-mono text-xs font-semibold text-[#EDE8DB] leading-tight">
            {user.name}
          </span>
          <span className="font-mono text-[10px] text-[#9E9A8E] tracking-wider">
            [{user.callsign}]
          </span>
        </div>
      )}
    </div>
  );
};
