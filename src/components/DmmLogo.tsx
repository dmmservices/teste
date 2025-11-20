
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface DmmLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  textColor?: string;
}

const DmmLogo: React.FC<DmmLogoProps> = ({ 
  size = 'md', 
  showText = true, 
  textColor
}) => {
  const { isDark } = useTheme();
  
  const logoSize = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const textSize = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  // Use white color in dark mode, otherwise use provided textColor or default
  const finalTextColor = textColor || (isDark ? 'white' : 'black');

  return (
    <div className="flex items-center gap-3">
      <div className={`${logoSize[size]} rounded-lg overflow-hidden flex items-center justify-center`}>
        <img 
          src="/lovable-uploads/logo-dmm-new.png" 
          alt="DMM Services" 
          className="w-full h-full object-contain p-1"
        />
      </div>
      {showText && (
        <div>
          <h1 
            className={`${textSize[size]} font-bold leading-tight`}
            style={{ color: finalTextColor }}
          >
            DMM SERVICES
          </h1>
        </div>
      )}
    </div>
  );
};

export default DmmLogo;
