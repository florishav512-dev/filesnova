import React from 'react';
import { Icon } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  icon: Icon;
  color?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, icon: IconComp, color = '#4338ca' }) => {
  return (
    <div className="flex items-center mb-4">
      <IconComp className="w-5 h-5 mr-2" style={{ color }} />
      <h2 className="text-xl font-semibold" style={{ color }}>{title}</h2>
    </div>
  );
};

export default SectionHeader;
