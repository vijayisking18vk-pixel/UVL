import React, { useState } from 'react';
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
  const [imgError, setImgError] = useState(false);

  const getEmblemIcon = (emblem: string, iconSize: number) => {
    switch (emblem) {
      case 'crosshair':
        return <Crosshair size={iconSize} className="text-[#A1A1AA]" />;
      case 'chip':
        return <Cpu size={iconSize} className="text-[#A1A1AA]" />;
      case 'radar':
        return <Radio size={iconSize} className="text-[#A1A1AA]" />;
      case 'bolt':
        return <Zap size={iconSize} className="text-[#A1A1AA]" />;
      case 'compass':
        return <Compass size={iconSize} className="text-[#A1A1AA]" />;
      case 'dagger':
        return <ShieldAlert size={iconSize} className="text-[#A1A1AA]" />;
      default:
        return <Sparkles size={iconSize} className="text-[#A1A1AA]" />;
    }
  };

  const dimensions = {
    sm: { box: 'w-7 h-7', icon: 13, text: 'text-[9px]' },
    md: { box: 'w-9 h-9', icon: 16, text: 'text-[10px]' },
    lg: { box: 'w-12 h-12', icon: 20, text: 'text-xs' },
    xl: { box: 'w-16 h-16', icon: 26, text: 'text-sm' }
  }[size];

  const statusColors = {
    active: 'bg-emerald-500 border-white',
    focus: 'bg-black border-white',
    reviewing: 'bg-amber-500 border-white',
    away: 'bg-neutral-400 border-white',
    leave: 'bg-neutral-300 border-white'
  };

  return (
    <div 
      onClick={onClick}
      className={`inline-flex items-center gap-2 select-none ${onClick ? 'cursor-pointer hover:opacity-85' : ''} ${className}`}
    >
      <div className="relative">
        <div
          className={`${dimensions.box} rounded-full border border-[#E5E5E7] bg-[#F5F5F7] flex items-center justify-center relative overflow-hidden transition-all shadow-sm`}
          title={`${user.name} (${user.callsign})`}
        >
          {user.avatarUrl && !imgError ? (
            <img 
              src={user.avatarUrl} 
              alt={user.name} 
              className="w-full h-full object-cover avatar-img"
              style={{ filter: 'none' }}
              onError={() => setImgError(true)}
            />
          ) : (
            getEmblemIcon(user.avatarEmblem, dimensions.icon)
          )}
        </div>

        {/* Circular Status Indicator */}
        {showStatus && (
          <span 
            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 ${statusColors[user.status]}`}
            title={`Status: ${user.status}`}
          />
        )}
      </div>

      {showCallsign && (
        <div className="flex flex-col text-left">
          <span className="text-xs font-semibold text-black leading-tight">
            {user.name}
          </span>
          <span className="meta-number text-[10px] text-[#6E6E73]">
            /{user.callsign}
          </span>
        </div>
      )}
    </div>
  );
};
