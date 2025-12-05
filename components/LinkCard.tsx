import React from 'react';
import * as Icons from 'lucide-react';
import { LinkItem } from '../types';

interface LinkCardProps {
  link: LinkItem;
}

const LinkCard: React.FC<LinkCardProps> = ({ link }) => {
  // Dynamic icon rendering with fallback
  const IconComponent = (Icons as any)[link.icon || 'Globe'] || Icons.Globe;

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block p-5 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl border border-white/50 dark:border-white/5 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
    >
      {/* Glow Effect on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5 transition-all duration-500"></div>
      
      <div className="flex items-start space-x-4 relative z-10">
        <div className="flex-shrink-0 p-3 bg-white dark:bg-slate-700/50 rounded-xl shadow-sm text-indigo-600 dark:text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 ring-1 ring-slate-100 dark:ring-white/10">
          <IconComponent size={24} strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {link.title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
            {link.description}
          </p>
        </div>
      </div>
    </a>
  );
};

export default LinkCard;