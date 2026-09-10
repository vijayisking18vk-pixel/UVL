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

  const textStyles = {
    sm: {
      title: 'text-[13px] tracking-[-0.035em]',
      subtitle: 'text-[11px] tracking-[-0.035em]',
      gap: 'gap-0.5'
    },
    md: {
      title: 'text-[16px] sm:text-[18px] tracking-[-0.04em]',
      subtitle: 'text-[13px] sm:text-[15px] tracking-[-0.04em]',
      gap: 'gap-0.5'
    },
    lg: {
      title: 'text-[24px] sm:text-[28px] tracking-[-0.04em]',
      subtitle: 'text-[20px] sm:text-[24px] tracking-[-0.04em]',
      gap: 'gap-1'
    }
  }[size];

  return (
    <div
      onClick={handleClick}
      className={`relative inline-flex items-center select-none ${
        interactive ? 'cursor-pointer hover:opacity-90 active:scale-[0.99]' : ''
      } transition-all duration-150 group`}
      title="Unfounded Venture Lab"
    >
      <div className={`flex flex-col text-left leading-[0.98] ${textStyles.gap}`}>
        <span className={`font-serif font-semibold text-black ${textStyles.title}`}>
          Unfounded
        </span>
        <span className={`font-medium text-[#6E6E73] ${textStyles.subtitle}`}>
          Venture Lab.
        </span>
      </div>
    </div>
  );
};
