import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from 'lucide-react';

interface ToolCardProps {
  title: string;
  description: string;
  icon: Icon;
  link: string;
  /**
   * Optional color classes for the icon wrapper and icon itself.
   * Should be a tuple [wrapperClass, iconClass] e.g. ['bg-blue-50', 'text-blue-600'].
   */
  color?: [string, string];
}

const ToolCard: React.FC<ToolCardProps> = ({ title, description, icon: IconComp, link, color }) => {
  return (
    <Link
      to={link}
      className="flex flex-col p-5 rounded-xl shadow-sm hover:shadow-md transition bg-white border border-gray-200 hover:border-primary/50"
    >
      <div className="flex items-center mb-3">
        <div
          className={`rounded-full p-2 mr-3 flex items-center justify-center ${color ? color[0] : 'bg-primary/10'} ${color ? '' : ''}`}
        >
          <IconComp className={`w-5 h-5 ${color ? color[1] : 'text-primary'}`} />
        </div>
        <h4 className="text-lg font-semibold text-gray-800">{title}</h4>
      </div>
      <p className="text-sm text-gray-600 flex-1 leading-relaxed">{description}</p>
    </Link>
  );
};

export default ToolCard;
