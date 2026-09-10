import React from 'react';
import { sound } from '../../utils/sound';

interface BrandPatchBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

export const BrandPatchBadge: React.FC<BrandPatchBadgeProps> = ({
  size = 'md',
  interactive = true
}) => {
  const handleClick = () => {
    if (interactive) {
      sound.patchStamp();
    }
  };

  const heights = {
    sm: 'h-8 px-3 text-[11px]',
    md: 'h-11 px-4 text-[13px]',
    lg: 'h-14 px-6 text-[16px]'
  }[size];

  return (
    <div
      onClick={handleClick}
      className={`relative inline-flex items-center justify-center select-none ${interactive ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''} transition-all duration-150 group brand-logo-intact`}
      title="Unfounded Venture Lab — Identity Patch"
    >
      {/* Embroidered Chamfered Container */}
      <div 
        className={`relative ${heights} patch-pill bg-[#0C0E10] flex items-center justify-center shadow-lg border border-[#EDE8DB]/30`}
        style={{
          boxShadow: '0 3px 8px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.08)'
        }}
      >
        {/* Overlock Stitched Border Simulation */}
        <div 
          className="absolute inset-[3px] patch-pill pointer-events-none border border-dashed border-[#EDE8DB]/40 group-hover:border-[#A1A1AA] transition-colors"
        />

        {/* Woven Twill Texture Overlay */}
        <div 
          className="absolute inset-0 patch-pill pointer-events-none opacity-25"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, #222 0, #222 1px, transparent 0, transparent 3px)'
          }}
        />

        {/* Pixel Monospace Lettering - Kept Intact */}
        <div className="relative flex flex-col items-center justify-center leading-[1.05] tracking-widest text-[#EDE8DB] group-hover:text-white transition-colors">
          <span className="font-brand-logo text-[15px] sm:text-[17px] font-bold uppercase tracking-[0.18em] drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">
            unfounded
          </span>
          <span className="font-brand-logo text-[13px] sm:text-[14px] font-medium uppercase tracking-[0.22em] text-[#D8D2C2] drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">
            venture lab
          </span>
        </div>
      </div>
    </div>
  );
};
